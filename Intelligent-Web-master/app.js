var createError = require('http-errors');
var express = require('express');
var path = require('path');
const mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyparser = require('body-parser');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var storiesRouter = require('./routes/stories');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyparser.json({limit: '50mb', extended: false}));
app.use(bodyparser.urlencoded({limit: '50mb', extended: false, parameterLimit: 5000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/private/images', express.static(path.join(__dirname, 'private/images')));
app.use('/private', express.static(path.join(__dirname, 'private')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/stories', storiesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
