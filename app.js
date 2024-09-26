var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { create } = require('express-handlebars');
var session=require('express-session');
const adminHelpers = require('./Helpers/admin-helpers');


const db = require('./mongodb/connection'); // Import the db connection
const fileUpload = require('express-fileupload');
var session=require('express-session')


var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Create an instance of express-handlebars
const hbs = create({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout',
  partialsDir: __dirname + '/views/partials/'
});

// Register the handlebars engine
app.engine('hbs', hbs.engine);
app.use(express.static('public'));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({ secret: "key", resave: false, saveUninitialized: true, cookie: { maxAge: 60000 } }));





app.use('/', adminRouter);
app.use('/users', usersRouter);


// Connect to MongoDB when the app starts
db.connect()
  .then(() => {
    console.log('Database connection established.');
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
