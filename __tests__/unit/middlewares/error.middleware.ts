import mongoose from 'mongoose';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import { error } from '../../../src/middlewares';
import { ApiError } from '../../../src/utils';
import config from '../../../src/config';

describe('Error middlewares', () => {
  describe('Error converter', () => {
    test('should return the same ApiError object it was called with', () => {
      const err = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const next = jest.fn();

      error.errorConverter(err, httpMocks.createRequest(), httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(err);
    });

    test('should convert an Error to ApiError and preserve its status and message', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = new Error('Any error');
      err.statusCode = httpStatus.BAD_REQUEST;
      const next = jest.fn();

      error.errorConverter(err, httpMocks.createRequest(), httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: err.statusCode,
          message: err.message,
          isOperational: false,
        }),
      );
    });

    test('should convert an Error without status to ApiError with status 500', () => {
      const err = new Error('Any error');
      const next = jest.fn();

      error.errorConverter(err, httpMocks.createRequest(), httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: err.message,
          isOperational: false,
        }),
      );
    });

    test('should convert an Error without message to ApiError with default message of that http status', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = new Error();
      err.statusCode = httpStatus.BAD_REQUEST;
      const next = jest.fn();

      error.errorConverter(err, httpMocks.createRequest(), httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: err.statusCode,
          message: httpStatus[err.statusCode],
          isOperational: false,
        }),
      );
    });

    test('should convert a Mongoose error to ApiError with status 400 and preserve its message', () => {
      const err = new mongoose.Error('Any mongoose error');
      const next = jest.fn();

      error.errorConverter(err, httpMocks.createRequest(), httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.BAD_REQUEST,
          message: err.message,
          isOperational: false,
        }),
      );
    });

    test('should convert any other object to ApiError with status 500 and its message', () => {
      const err = {};
      const next = jest.fn();

      error.errorConverter(err, httpMocks.createRequest(), httpMocks.createResponse(), next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
          isOperational: false,
        }),
      );
    });
  });

  describe('Error handler', () => {
    beforeEach(() => {
      // jest.spyOn(logger, 'error').mockImplementation(() => { });
    });

    test('should send proper error response and put the error message in res.locals', () => {
      const err = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const res = httpMocks.createResponse();
      const sendSpy = jest.spyOn(res, 'send');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error.errorHandler(err, httpMocks.createRequest(), res, () => {});

      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ code: err.statusCode, message: err.message }));
      expect(res.locals.errorMessage).toBe(err.message);
    });

    test('should put the error stack in the response if in development mode', () => {
      config.env = 'development';
      const err = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const res = httpMocks.createResponse();
      const sendSpy = jest.spyOn(res, 'send');
      const next = jest.fn();

      error.errorHandler(err, httpMocks.createRequest(), res, next);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ code: err.statusCode, message: err.message, stack: err.stack }),
      );
      config.env = process.env.NODE_ENV;
    });

    test('should send internal server error status and message if in production mode and error is not operational', () => {
      config.env = 'production';
      const err = new ApiError(httpStatus.BAD_REQUEST, 'Any error', false);
      const res = httpMocks.createResponse();
      const sendSpy = jest.spyOn(res, 'send');
      const next = jest.fn();

      error.errorHandler(err, httpMocks.createRequest(), res, next);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: httpStatus.INTERNAL_SERVER_ERROR,
          message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
        }),
      );
      expect(res.locals.errorMessage).toBe(err.message);
      config.env = process.env.NODE_ENV;
    });

    test('should preserve original error status and message if in production mode and error is operational', () => {
      config.env = 'production';
      const err = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const res = httpMocks.createResponse();
      const sendSpy = jest.spyOn(res, 'send');
      const next = jest.fn();

      error.errorHandler(err, httpMocks.createRequest(), res, next);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: err.statusCode,
          message: err.message,
        }),
      );
      config.env = process.env.NODE_ENV;
    });
  });
});
