var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// declare database connection using knex
const options = require('./knexfile');
const knex = require('knex')(options);

// declare POST and security middleware
const helmet = require('helmet');
const cors = require('cors');

// import routers
const swaggerDocs = require('./routes/swaggerDocs');
const registerRouter = require('./routes/authentication/register');
const loginRouter = require('./routes/authentication/login');
const searchRouter = require('./routes/search/search');
const offencesRouter = require('./routes/helpers/offences');
const areasRouter = require('./routes/helpers/areas');
const agesRouter = require('./routes/helpers/ages');
const gendersRouter = require('./routes/helpers/genders');
const yearsRouter = require('./routes/helpers/years');

var app = express();

// use morgan logger middleware
logger.token('req', (req, res) => JSON.stringify(req.headers));
logger.token('res', (req, res) => {
  const headers = {};
  res.getHeaderNames().map(h => headers[h] = res.getHeader(h));
  return JSON.stringify(headers);
});
app.use(logger('dev'));

// use POST and security middleware
app.use(helmet());
// only allow javascript and css to load from this server 
// and also allow whatever the swagger middleware needs
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", `'unsafe-inline'`],
    imgSrc: ["'self'", `data:`]
  }
}));
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// use database connection
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// TEST DATABASE CONNECTION
// TEMPORARY ONLY!!!
app.get('/knex', function(req, res, next) {
  req.db.raw('SELECT VERSION()').then(
    (version) => console.log((version[0][0]))
  ).catch((err) => { console.log(err); throw err })
  res.send('connection successful');
});

// use routers
app.use('/', swaggerDocs);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/search', searchRouter);
app.use('/offences', offencesRouter);
app.use('/areas', areasRouter);
app.use('/ages', agesRouter);
app.use('/genders', gendersRouter);
app.use('/years', yearsRouter);

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
