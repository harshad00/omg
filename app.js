// Importing required modules and packages
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const hbs = require("hbs");
const expressSession = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/models/users');

// Setting up paths for templates
const templetes_path = path.join(__dirname, "templetes/views");
const partials_path = path.join(__dirname, "templetes/partials");

// Creating an Express application
var app = express();
app.use(express.json());

// Configuring view engine and template paths
app.set("view engine", "hbs");
app.set("views", templetes_path);
hbs.registerPartials(partials_path);

// Configuring session and passport for authentication
app.use(flash());
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "mog mog mog"
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser(app));
passport.deserializeUser(usersRouter.deserializeUser());

// Configuring middleware and static file serving
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(templetes_path));
app.use(express.static(path.join(__dirname, 'public')));

// Routing configuration
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Handling 404 errors
app.use(function(req, res, next) {
    next(createError(404));
});

// Error handling middleware
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// Exporting the configured Express app
module.exports = app;
