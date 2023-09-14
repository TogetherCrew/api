import express, { Application } from "express";
import helmet from "helmet";
import compression from "compression";
import passport from "passport";
import { jwtStrategy } from "./config/passport";
import cors from "cors";
import httpStatus from "http-status";
import { error, sentry } from "./middlewares";
import { ApiError } from "./utils";
import routes from "./routes/v1";
import morgan from "./config/morgan";
import config from "./config";

const app: Application = express();

if (config.env !== 'test') {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}
sentry.InitSentry(app)

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

sentry.InitSentryErrorHandler(app)

app.use(error.errorConverter);
app.use(error.errorHandler);

export default app;

