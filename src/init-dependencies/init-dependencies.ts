import {Config} from '../configuration';
import {Dependencies} from '../dependencies';
import {createRateLimiter} from './rate-limit-sending-of-emails';
import {sendEmail} from './send-email';
import createLogger, {LoggerOptions} from 'pino';
import nodemailer from 'nodemailer';
import smtp from 'nodemailer-smtp-transport';
import {commitEvent} from './event-store/commit-event';
import {getAllEvents} from './event-store/get-all-events';
import {getResourceEvents} from './event-store/get-resource-events';
import {Client} from '@libsql/client/.';

export const initDependencies = (
  dbClient: Client,
  conf: Config
): Dependencies => {
  let loggerOptions: LoggerOptions;
  loggerOptions = {
    formatters: {
      level: label => {
        return {severity: label};
      },
    },
    level: 'debug',
  };

  if (conf.PUBLIC_URL.includes('localhost')) {
    loggerOptions = {
      ...loggerOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
          singleLine: true,
          levelKey: 'severity',
        },
      },
    };
  }

  const logger = createLogger(loggerOptions);

  const emailTransporter = nodemailer.createTransport(
    smtp({
      host: conf.SMTP_HOST,
      port: conf.SMTP_PORT,
      auth: {
        user: conf.SMTP_USER,
        pass: conf.SMTP_PASSWORD,
      },
    })
  );

  return {
    commitEvent: commitEvent(dbClient),
    getAllEvents: getAllEvents(dbClient),
    getResourceEvents: getResourceEvents(dbClient),
    rateLimitSendingOfEmails: createRateLimiter(5, 24 * 3600),
    sendEmail: sendEmail(emailTransporter),
    logger,
  };
};
