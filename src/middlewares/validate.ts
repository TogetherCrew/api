import Joi, { ObjectSchema } from 'joi';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';
import { pick, ApiError } from '../utils';

type SchemaFunction = (req: Request) => object;
type ValidationSchema = {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
};

const validate = (schema: ValidationSchema | SchemaFunction) => (req: Request, res: Response, next: NextFunction) => {
  const validationSchema = typeof schema === 'function' ? schema(req) : schema;
  const validSchema = pick(validationSchema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  if (
    req.allowInput === false &&
    (Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0 || Object.keys(req.body).length > 0)
  ) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Bad Request!!'));
  }
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
