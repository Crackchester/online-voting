const Voter = require('../models/Voter');

module.exports = {
	// UUID must be valid
	ensureUUIDValid: (req, res, next) => {
		/* The UUID should exist in database and votes should not have been confirmed */
		const uuid = req.params.UUID;
		if (req.session.voter && req.session.voter.votesConfirmed) {
			res.render('alreadyVoted');
		} else if (req.session.voter && req.session.voter.uuid === uuid) {
			res.locals.voter = req.session.voter;
			next();
		} else if (req.session.voter && req.session.voter.uuid !== uuid) {
			req.params.UUID = req.session.voter.uuid;
			res.locals.voter = req.session.voter;
			next();
		} else {
			Voter.findOne({uuid}, (err, voter) => {
				if (err || !voter) {
					res.redirect('/register');
				} else if (voter.votesConfirmed)
					res.render('alreadyVoted');
				else if (!voter.emailConfirmed)
					res.render('emailNotConfirmed');
				else {
					res.locals.voter = voter;
					req.session.voter = voter;
					next();
				}
			});
		}
	},
	// Forward the user to the voting page if they are already voting
	forwardAuthenticated: (req, res, next) => {
		if (req.session.voter) {
			res.redirect(`/vote/${req.session.voter.uuid}`);
		} else {
			next();
		}
	}
};