import * as Sentry from "@sentry/node";
import { Application, RequestHandler, ErrorRequestHandler } from "express";
import config from "src/config";

export function InitSentry(app: Application){
    // Initial Sentry
    Sentry.init({ 
        dsn: config.sentry.dsn, 
        environment: config.sentry.env,
        tracesSampleRate: 1.0, 
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Sentry.Integrations.Express({ app }),
            // Automatically instrument Node.js libraries and frameworks
            ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
        ] 
    });

    // Sentry Logger - The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler() as RequestHandler);

    // Sentry Tracer - TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler() as RequestHandler);
    
}


export function InitSentryErrorHandler(app: Application){
    // Sentry Logger - The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler() as ErrorRequestHandler);
}