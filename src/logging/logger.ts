import winston from 'winston'
import * as Transport from 'winston-transport'
import config from 'config'
import logLevels from './log-levels'
import errorFileTransport from './error-file-transport'
import combinedFileTransport from './combined-file-transport'
import uncaughtExceptionFileTransport from './uncaught-exception-file-transport'
import unhandledRejectionFileTransport from './unhandled-rejection-file-transport'

const { combine, json, timestamp, splat, cli } = winston.format
const { Console } = winston.transports

export default winston.createLogger(buildWinstonConfig())

function buildWinstonConfig(): winston.LoggerOptions {
  const winstonConfig: winston.LoggerOptions = {
    levels: logLevels,
    format: combine(timestamp(), json(), splat()),
  }

  // Add a default silent transport (otherwise winston complains if there are no transports)
  winstonConfig.transports = [
    new Console({
      silent: true,
    }),
  ]

  if (config.get('logging.isEnabled')) {
    winstonConfig.level = config.get('logging.level')
    winstonConfig.transports = getTransports()
    winstonConfig.exceptionHandlers = getExceptionHandlerTransports()
    winstonConfig.rejectionHandlers = getRejectionHandlerTransports()
  }

  return winstonConfig
}

function getTransports(): Transport[] {
  const transports: Transport[] = [
    new Console({
      format: cli(),
    }),
  ]

  if (config.get('logging.isFileEnabled'))
    transports.push(errorFileTransport(), combinedFileTransport())

  return transports
}

function getExceptionHandlerTransports(): Transport[] {
  const transports: Transport[] = [new Console()]

  if (config.get('logging.isFileEnabled'))
    transports.push(uncaughtExceptionFileTransport())

  return transports
}

function getRejectionHandlerTransports(): Transport[] {
  const transports: Transport[] = [new Console()]

  if (config.get('logging.isFileEnabled'))
    transports.push(unhandledRejectionFileTransport())

  return transports
}
