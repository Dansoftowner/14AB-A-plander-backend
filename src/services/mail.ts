import { Service } from '../base/service'
import { Member } from '../models/member'
import config from 'config'
import { mailTransporter } from '../utils/email'
import Mail from 'nodemailer/lib/mailer'

export class MailService implements Service {
  async sendRegistrationEmail(member: Member, token: string) {
    const mailOptions = {
      from: config.get('smtp.from'),
      to: member.email,
      subject: 'Registration Confirmation', // TODO: i18n
      template: 'registration',
      context: {
        registrationLink: this.assembleRegistrationUrl(member, token),
      },
    }

    await mailTransporter.sendMail(mailOptions as Mail.Options)
  }

  private assembleRegistrationUrl({ _id }, token) {
    return `${config.get('frontend.host')}/register/${_id.toHexString()}/${token}`
  }
}
