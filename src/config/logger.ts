import pino, { Bindings } from 'pino';
import config from './index';

export default pino({
  level: config.logger.level,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
  bindings: (bindings: Bindings) => {
    return {
      pid: bindings.pid,
      host: bindings.hostname,
    };
  },
});
