import path from 'path'
import config from 'config'
import winston from 'winston'
import 'winston-daily-rotate-file'

const { DailyRotateFile } = winston.transports

export default () =>
  new DailyRotateFile({
    filename: path.join(
      config.get('logging.dir'),
      'uncaught-exceptions-%DATE%.log',
    ),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
  })
