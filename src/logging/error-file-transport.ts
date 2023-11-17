import path from 'path'
import config from 'config'
import winston from 'winston'
import 'winston-daily-rotate-file'

const { DailyRotateFile } = winston.transports

export default () =>
  new DailyRotateFile({
    level: 'error',
    filename: path.join(config.get('logging.dir'), 'errors-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
  })
