import { Service } from '../base/service'
import { Member } from '../models/member'
import config from 'config'
import { readFileSync } from 'fs'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import handlebars from 'handlebars'
import i18next from '../utils/i18n'

export class MailService implements Service {
  private mailTransporter = nodemailer.createTransport({
    host: config.get('smtp.host'),
    port: config.get('smtp.port'),
    secure: config.get('smtp.secure'),
    auth: {
      user: config.get('smtp.auth.user'),
      pass: config.get('smtp.auth.pass'),
    },
  })

  /**
   * Sends an invitation/registration email to the given member.
   *
   * @param member the member information populated with the association
   * @param token the token used to confirm the registration
   */
  sendRegistrationEmail(
    member: Member,
    token: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    return this.mailTransporter.sendMail({
      from: config.get('smtp.from'),
      to: member.email,
      subject: i18next.getResource('hu', 'mail', 'registration.subject'),
      html: this.load('registration', {
        registrationUrl: this.assembleRegistrationUrl(member, token),
        association: member.association,
        member,
      }),
    })
  }

  /**
   * Sends a password restoration email to the given member.
   *
   * @param member the member information populated with the association
   * @param token the token used to confirm the restoration
   */
  sendRestorationEmail(
    member: Member,
    token: string,
  ): Promise<SMTPTransport.SentMessageInfo> {
    return this.mailTransporter.sendMail({
      from: config.get('smtp.from'),
      to: member.email,
      subject: i18next.getResource('hu', 'mail', 'pass-restoration.subject'),
      html: this.load('password-restoration', {
        restorationUrl: this.assembleRestorationUrl(member, token),
        member,
      }),
    })
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

  private load(templateName: string, context: object): string {
    const rawTemplate = readFileSync(`./resources/email-templates/${templateName}.hbs`)
    const template = handlebars.compile(rawTemplate.toString())

    return template(context, {
      allowProtoPropertiesByDefault: true,
    })
  }
}
