import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import httpStatus from 'http-status';
import passport from 'passport';

import { bullBoardServerAdapter } from './bullmq';
import config from './config';
import morgan from './config/morgan';
import { jwtStrategy } from './config/passport';
import { error, sentry } from './middlewares';
import routes from './routes/v1';
import { ApiError } from './utils';

const app: Application = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
sentry.InitSentry(app);

// set security HTTP headers
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// gzip compression
app.use(compression());

// enable cors
app.use(cors());

app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
  }),
);

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// v1 api routes
app.use('/api/v1', routes);

// BullBoard
app.use('/admin/queues', bullBoardServerAdapter.getRouter());

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

sentry.InitSentryErrorHandler(app);

app.use(error.errorConverter);
app.use(error.errorHandler);

export default app;
