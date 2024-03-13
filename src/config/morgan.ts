import morgan from 'morgan';
import logger from './logger';
import config from './index';
import { Request, Response } from 'express';

morgan.token('message', (req: Request, res: Response) => res.locals.errorMessage || '');
morgan.token('RequestBody', function (req: Request, res: Response) {
  return JSON.stringify(req.body);
});

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms :referrer :user-agent :RequestBody`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms :referrer :user-agent :RequestBody - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req: Request, res: Response) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req: Request, res: Response) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

export default {
  successHandler,
  errorHandler,
};
