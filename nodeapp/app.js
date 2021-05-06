const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const uuid = require('uuid/v4');
const Voter = require('./models/Voter');
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
app.use('/createTestDatabase', (req, res) => {
  // Create testVoters
  let testVoters = [];
  let i, newVoter;
  for (i = 0; i < 10; i++) {
    newVoter = new Voter({uuid: uuid()});
    testVoters.push(newVoter);
    newVoter.save();
  }

  // Create candidates
  let testCandidates = [
    {
      name: 'Ryan Harrison',
      email: 'ryan.harrison@gmail.com',
      positions: ['Development Officer', 'Events Officer'],
      manifesto: 'Hello my name is Ryan and I am an amazing human being so help me and vote Ryan!!'
    },
    {
      name: 'John Doe',
      email: 'john.d@gmail.com',
      positions: ['Chair', 'General Secretary'],
      manifesto: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      name: 'Jane Doe',
      email: 'jane.d@gmail.com',
      positions: ['Chair', 'General Secretary', 'Events Officer'],
      manifesto: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
    },
    {
      name: 'Christy Bloor',
      email: 'christy.bloor@yahoo.co.uk',
      positions: ['Chair', 'General Secretary'],
      manifesto: "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"
    },
    {
      name: 'Jackie Chrissy',
      email: 'jackie.chrissy@manchester.ac.uk',
      positions: ['Chair', 'Events Officer'],
      manifesto: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
    }
  ];
  let newCandidate;
  testCandidates.forEach(candidate => {
    newCandidate = new Candidate(candidate, err => {
      if (err)
        throw err;
    });
    newCandidate.save();
  });

  res.status(404);
  res.end();
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
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
