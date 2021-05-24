const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const Candidate = require('./models/Candidate');
const positions = require('./models/positions');
const dotenv = require('dotenv');
dotenv.config();

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Connect to db
const db = process.env.mongoURI || require('./config/keys').mongoURI;
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(`Could not connect to MongoDB: ${err}`));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
);

app.use((req, res, next) => {
  res.locals.positions = positions;
  next();
});

app.use('/', indexRouter);

// Check if Reopen Nominations and Abstain have been added to the database
// Add them if not
Candidate.findOne({name: "RON"}, (err, candidate) => {
  if (!candidate) {
    new Candidate({
      name: "RON",
      email: "crackchestermcr@gmail.com",
      positions: positions,
      manifesto: "Reopen Nominations - vote to reopen the nominations rather than submitting a vote for any individual or abstaining"
    }).save();
  }
});
Candidate.findOne({name: "Abstain"}, (err, candidate) => {
  if (!candidate) {
    new Candidate({
      name: "Abstain",
      email: "crackchestermcr@gmail.com",
      positions: positions,
      manifesto: "Abstain from voting for this position - do not vote for anyone and do not vote to reopen nominations"
    }).save();
  }
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next({
    message: "Could not find the resource you were looking for",
    status: 404
  })
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
