import { Service } from '../base/service'
import { Member } from '../models/member'
import config from 'config'
import { mailTransporter } from '../utils/email'
import Mail from 'nodemailer/lib/mailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

export class MailService implements Service {
  sendRegistrationEmail(
    member: Member,
    token: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    const mailOptions = {
      from: config.get('smtp.from'),
      to: member.email,
      subject: 'Registration Confirmation', // TODO: i18n
      template: 'registration',
      context: {
        registrationLink: this.assembleRegistrationUrl(member, token),
      },
    }

    return mailTransporter.sendMail(mailOptions as Mail.Options)
  }

  private assembleRegistrationUrl({ _id }, token) {
    return `${config.get('frontend.host')}/register/${_id.toHexString()}/${token}`
  }
}
