var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const authRouter = require('./routes/auth');
const horseRouter = require('./routes/horse');
const adminRouter = require('./routes/admin');
const jockeyRouter = require('./routes/jockey');
const horseOwnerRouter = require('./routes/horseowner');
const refereeRouter = require('./routes/referee');
const spectatorRouter = require('./routes/spectator');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig');
const raceRound = require('./routes/raceround');
dotenv.config();
var app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .concat(['http://localhost:8081', 'http://localhost:19006']);
app.use(cors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
}));
(
  async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');
    } catch (error) {

      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }
)();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger UI
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    docExpansion: 'list',
  },
}));

app.use('/api/auth', authRouter);
app.use('/api/horse', horseRouter);
app.use('/api/admin', adminRouter);
app.use('/api/jockey', jockeyRouter);
app.use('/api/horseowner', horseOwnerRouter);
app.use('/api/tournament', require('./routes/tournament'));
app.use('/api/referee', refereeRouter);
app.use('/api/spectator', spectatorRouter);
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/raceround', raceRound);
app.use('/api/eligibility-rules', require('./routes/raceEligibilityRule'));
app.use('/api/notifications', require('./routes/notification'));
// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: err.message,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      code: 400,
      message: `${err.path} is invalid`,
    });
  }

  return res.status(500).json({
    code: 500,
    message: 'Internal Server Error',
  });
});
module.exports = app;
