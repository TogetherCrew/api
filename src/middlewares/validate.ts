import Joi from 'joi';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { pick, ApiError } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }
  Object.assign(req, value);
  return next();
};

export default validate;
