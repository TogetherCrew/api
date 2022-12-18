import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/ban-types
const catchAsync = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

export default catchAsync;