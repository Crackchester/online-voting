const express = require('express');
const router = express.Router();
const validator = require('validator');
const crypto = require('crypto');
const {v4: uuid} = require('uuid');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const Voter = require('../models/Voter');
const positions = require('../models/positions');
const {ensureUUIDValid, forwardAuthenticated} = require('../config/auth');
const {smtpAuth} = require('../config/keys');
const nodemailer = require('nodemailer');

router.get('/', forwardAuthenticated, (req, res) => {
    res.redirect('/register');
});


/* Get list of positions to vote for */
router.get('/vote/:UUID', ensureUUIDValid, (req, res) => {
    let alreadyVotedOn = [];
    // Get the already voted
    Vote.find({voter: req.session.voter}, (err, votes) => {
        if (votes)
            votes.forEach(vote => {
                alreadyVotedOn.push(vote.position);
            });
        res.render('vote', {alreadyVotedOn, voter: req.session.voter});
    });
});


/* Get list of candidates for a position */
router.get('/vote/:UUID/:position', ensureUUIDValid, (req, res, next) => {
    // Does position exist
    if (!positions.includes(req.params.position)) {
        next({
            message: "Could not find the resource you were looking for",
            status: 404
          });
        return
    }
    let alreadyVotedOn = '';
    // Get whoever has already been selected
    Vote.findOne({voter: req.session.voter, position: req.params.position}, (err, vote) => {
        if (vote)
            alreadyVotedOn = vote.candidate._id;
        // Get candidates for this position
        Candidate.find({positions: req.params.position}, (err, candidates) => {
            if (candidates.length > 0)
                res.render('votePosition', {position: req.params.position, candidates, alreadyVotedOn});
            else
                res.render('noCandidates', {position: req.params.position});
        });
    });
});


/* Submit votes for a candidate */
router.get('/vote/:UUID/:position/:candidate', ensureUUIDValid, (req, res, next) => {
    Candidate.findOne({_id: req.params.candidate, positions: req.params.position}, (err, candidate) => {
        // Ensure candidate exists
        if (candidate) {
            // Find existing vote and update
            Vote.updateOne({voter: req.session.voter, position: req.params.position}, {candidate}, (err, results) => {
                if (err) {
                    console.error(`Error at GET /vote/${req.params.UUID}/${req.params.position}/${req.params.candidate}:`);
                    console.error(err);
                    next({
                        message: "Something went wrong... see logs",
                        status: 500
                    });
                } else if (results.n === 0) {
                    // Create new vote and save
                    let newVote = new Vote({
                        voter: req.session.voter,
                        candidate: candidate,
                        position: req.params.position
                    });
                    newVote.save(err => {
                        if (err) {
                            next({
                                message: "Something went wrong... see logs",
                                status: 500
                            });
                        } else
                            res.render('voted', {candidate, position: req.params.position});
                    });
                } else
                    res.render('voted', {candidate, position: req.params.position});
            });
        } else {
            next({
                message: "Could not find the resource you were looking for",
                status: 404
              });
        }
    });
});


/* Submission confirmation */
router.get('/submit/:UUID', ensureUUIDValid, (req, res, next) => {
    Vote.find({voter: req.session.voter}, (err, votes) => {
        // Make sure the voter has submitted a choice for every position
        if (err || !votes) {
            console.error(`Error at GET /submit/${req.params.UUID}:`);
            console.error(err);
            next({
                message: "Something went wrong... see logs",
                status: 500
            });
        } else if (votes.length < positions.length) {
            let alreadyVotedOn = [];
            for (let i = 0; i < votes.length; i++) {
                alreadyVotedOn.push(votes[i].position);
            }
            res.render('vote', {err: "Please submit a vote for every position.", alreadyVotedOn});
        } else {
            // If they have submitted all votes then mark as submitted
            Voter.updateOne({uuid: req.params.UUID}, {votesConfirmed: true}, err => {
                if (err) {
                    next({
                        message: "Something went wrong... see logs",
                        status: 500
                    });
                } else
                    res.render('submitSuccessful');
            });
        }
    });
});


/* Register to vote */
router.get('/register', forwardAuthenticated, (req, res) => {
    res.render('register');
});


/* Register to vote */
router.post('/register', forwardAuthenticated, (req, res, next) => {
    /* Check that the email has been filled in */
    let {email} = req.body;
    if (!email) {
        res.render('/register', {err: 'Email is required'});
        return;
    }

    /* Check that the hash of the email isn't already stored in the database */
    let hash = crypto.createHash('sha256');
    hash.update(email);
    let hashDigest = hash.digest('hex');
    Voter.findOne({hashDigest}, (err, voter) => {
        if (voter && voter.votesConfirmed) {
            res.render('alreadyVoted');
        } else if (voter && voter.emailConfirmed) {
            res.render('register',
                {err: 'You have already registered to vote and confirmed your email, click on the link in your inbox'});
        } else if (voter && !voter.emailConfirmed) {
            res.render('register', {err: `You have already registered to vote`, resendEmail: email});
        } else {
            /* Ensure email is a (student|postgrad).manchester.ac.uk email */
            if (!validator.isEmail(email)) {
                res.render('/register', {err: 'Enter a valid UoM student email address'});
            } else if (
                !RegExp('^[a-zA-Z]+\.[a-zA-Z]+@student\.manchester\.ac\.uk$').test(email) &&
                !RegExp('^[a-zA-Z]+\.[a-zA-Z]+@student\.manchester\.ac\.uk$').test(email)
            ) {
                res.render('register', {err: 'Enter a valid UoM student email address'});
            } else {
                /* Create new voter */
                let voter = new Voter();
                let newHash = crypto.createHash('sha256');
                newHash.update(email);
                voter.hashDigest = newHash.digest('hex');
                voter.uuid = uuid();
                voter.save().then(newVoter => {
                    /* Send confirmation email and redirect */
                    sendEmail(email, voter, req.hostname);
                    res.render('confirmEmail', {email});
                });
            }
        }
    })
});


router.post('/resendEmail', forwardAuthenticated, (req, res) => {
    const { email } = req.body;
    if (!email) {
        // Register if the email doesn't exist
        res.redirect('/register')
    } else {
        // Search for hash in the DB and resend email if it exists
        let newHash = crypto.createHash('sha256');
        newHash.update(email);
        const hashDigest = newHash.digest('hex');
        Voter.findOne({hashDigest}, (err, voter) => {
            if (err || !voter) {
                res.redirect('/register');
            } else if (voter.votesConfirmed) {
                res.render('alreadyVoted');
            } else if (voter.emailConfirmed) {
                res.render('register', {err: 'You have already registered to vote and confirmed your email, click on the link in your inbox'})
            } else {
                // Update voter and save in the database
                voter.uuid = uuid();
                voter.save().then(newVoter => {
                    sendEmail(email, voter, req.hostname);
                    res.render('confirmEmail', {email});
                });
            }
        });
    }
});


router.get('/confirmEmail/:UUID', forwardAuthenticated, (req, res) => {
    // Check uuid exists in DB
    const uuid = req.params.UUID;
    Voter.findOne({uuid}, (err, voter) => {
        if (err || !voter) {
            // If no voter, render register page
            res.render('register', {err: 'No voter with that UUID, enter email to register or resend confirmation'});
        } else if (voter && voter.votesConfirmed) {
            res.render('alreadyVoted');
        } else {
            // Confirm email
            voter.emailConfirmed = true;
            // Save voter
            voter.save().then(savedVoter => {
                // Save voter session
                req.session.voter = voter;
                // Redirect to vote
                res.redirect(`/vote/${voter.uuid}`);
            });
        }
    })
});


let sendEmail = (email, voter, hostname) => {
    const smtpTransport = nodemailer.createTransport({
        host: "email-smtp.eu-west-2.amazonaws.com",
	auth: smtpAuth
    });

    smtpTransport.verify(function(error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email server is ready to take our messages");
        }
      });
    const emailOptions = {
        from: "noreply.voting@crackchester.cc",
        to: email,
        subject: "Confirm your email to vote in the Crackchester AGM",
        generateTextFromHTML: true,
        html: `<p>Click <a href="https://${hostname}/confirmEmail/${voter.uuid}">here</a> to confirm your email and vote.</p>` +
            `<p>If the above link doesn't work, try copy and pasting the following link into your browser:</p>` +
            `<a href="https://${hostname}/confirmEmail/${voter.uuid}">https://${hostname}/confirmEmail/${voter.uuid}</a>` +
            `<p>If you didn't request this, you can safely ignore this email. If you have any concerns please email crackchestermcr@gmail.com</p>`
    };

    smtpTransport.sendMail(emailOptions, (err, res) => {
        err ? console.log(err) : console.log(res);
        smtpTransport.close();
    })
};

module.exports = router;
