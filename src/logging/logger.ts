import winston from 'winston'
import config from 'config'
import logLevels from './log-levels'
import errorFileTransport from './error-file-transport'
import combinedFileTransport from './combined-file-transport'
import uncaughtExceptionFileTransport from './uncaught-exception-file-transport'
import unhandledRejectionFileTransport from './unhandled-rejection-file-transport'

const { combine, json, timestamp, splat, cli } = winston.format
const { Console } = winston.transports

const getTransports = () => {
  const transports: any[] = [
    new Console({
      format: cli(),
    }),
  ]

  if (config.get('logging.isFileEnabled'))
    transports.push(errorFileTransport(), combinedFileTransport())

  return transports
}

const getExceptionHandlerTransports = () => {
  const transports: any[] = [new Console()]

  if (config.get('logging.isFileEnabled'))
    transports.push(uncaughtExceptionFileTransport())

  return transports
}

const getRejectionHandlerTransports = () => {
  const transports: any[] = [new Console()]

  if (config.get('logging.isFileEnabled'))
    transports.push(unhandledRejectionFileTransport())

  return transports
}

export default winston.createLogger({
  levels: logLevels,
  format: combine(timestamp(), json(), splat()),
  transports: getTransports(),
  exceptionHandlers: getExceptionHandlerTransports(),
  rejectionHandlers: getRejectionHandlerTransports(),
})
