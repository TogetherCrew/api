import express, { Application } from "express";
import helmet from "helmet";
import compression from "compression";
import passport from "passport";
import * as Sentry from "@sentry/node";
import config from './config';
import { jwtStrategy } from "./config/passport";
import cors from "cors";
import httpStatus from "http-status";
import { error } from "./middlewares";
import { ApiError } from "./utils";
import routes from "./routes/v1";

const app: Application = express();

// Initial Sentry
Sentry.init({ dsn: config.sentry.dsn, tracesSampleRate: 1.0 });

// Sentry Logger - The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

// set security HTTP headers
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// gzip compression
app.use(compression());

// enable cors
app.use(cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// v1 api routes
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Sentry Logger - The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

app.use(error.errorConverter);
app.use(error.errorHandler);

export default app;

