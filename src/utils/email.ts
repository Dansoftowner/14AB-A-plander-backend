import config from 'config'
import nodemailer from 'nodemailer'
import { resolve } from 'path'
import hbs, { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars'

export const mailTransporter = nodemailer.createTransport({
  host: config.get('smtp.host'),
  port: config.get('smtp.port'),
  secure: config.get('smtp.secure'),
  auth: {
    user: config.get('smtp.auth.user'),
    pass: config.get('smtp.auth.pass'),
  },
})

const handlebarsOptions: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    partialsDir: resolve('./resources', 'email-templates'),
    defaultLayout: false,
  },
  viewPath: resolve('./resources', 'email-templates'),
}

mailTransporter.use('compile', hbs(handlebarsOptions))
