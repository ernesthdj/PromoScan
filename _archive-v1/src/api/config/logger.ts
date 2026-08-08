/**
 * Logger — Configuration pino.
 *
 * Dev : pino-pretty (lisible dans la console).
 * Prod : JSON structure (compatible ELK, Datadog, etc.).
 * Test : silent.
 */

import pino from 'pino';
import { env } from './env';

function buildLogger(): pino.Logger {
  if (env.NODE_ENV === 'test') {
    return pino({ level: 'silent' });
  }

  if (env.NODE_ENV === 'development') {
    return pino({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  // Production : JSON structure
  return pino({
    level: 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export const logger = buildLogger();
