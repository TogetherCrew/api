import { NextFunction, Request, Response } from 'express';

export default function setRouteTimeout(timeout: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(timeout, () => {
      res.status(503).send('Service unavailable: request timed out');
    });
    next();
  };
}
