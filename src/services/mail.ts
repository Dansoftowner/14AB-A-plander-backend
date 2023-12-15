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
        registrationUrl: this.assembleRegistrationUrl(member, token),
      },
    }

    return mailTransporter.sendMail(mailOptions as Mail.Options)
  }

  sendRestorationEmail(
    member: Member,
    token: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    const mailOptions = {
      from: config.get('smtp.from'),
      to: member.email,
      subject: 'Reset password', // TODO: i18n
      template: 'password-restoration',
      context: {
        restorationUrl: this.assembleRestorationUrl(member, token),
      },
    }

    return mailTransporter.sendMail(mailOptions as Mail.Options)
  }

  private assembleRestorationUrl(member: Member, token: string): string {
    return this.assembleUrl('forgotten-password', member, token)
  }

  private assembleRegistrationUrl(member: Member, token: string): string {
    return this.assembleUrl('register', member, token)
  }

  private assembleUrl(urlPrefix: string, { _id }, token: string): string {
    return `${config.get('frontend.host')}/${urlPrefix}/${_id.toHexString()}/${token}`
  }
}
