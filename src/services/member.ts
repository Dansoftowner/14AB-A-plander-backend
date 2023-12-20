import _ from 'lodash'
import config from 'config'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member-items'
import { MemberQueryOptions, MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'
import { CommonQueryOptions } from '../api/common-query-params'
import { MemberDto } from '../dto/member'
import { MemberInviteDto } from '../dto/member-invite'
import { MailService } from './mail'
import logger from '../logging/logger'
import { MemberRegistrationDto } from '../dto/member-registration'
import { ForgottenPasswordDto, NewPasswordDto } from '../dto/forgotten-password'
import { NewCredentialsDto } from '../dto/new-credentials'
import { MemberWithAssociationDto } from '../dto/member-with-association'
import { MemberUpdateDto } from '../dto/member-update'

export class MemberService implements Service {
  private clientInfo: ClientInfo
  private repository: MemberRepository

  private mailService: MailService

  constructor({ clientInfo, memberRepository, mailService }) {
    this.repository = memberRepository
    this.clientInfo = clientInfo
    this.mailService = mailService
  }

  async get(options: CommonQueryOptions): Promise<MemberItemsDto> {
    const { count, items } = await this.repository.get(this.dbOptions(options))

    const metadata = { offset: options.offset, limit: options.limit, total: count }

    return plainToInstance(
      MemberItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  async getById(id: string, options: CommonQueryOptions): Promise<MemberDto | null> {
    const item = await this.repository.findById(id, this.dbOptions(options, id))

    return plainToInstance(MemberDto, item, {
      excludeExtraneousValues: true,
    })
  }

  async getByUsername(
    username: string,
    options: CommonQueryOptions,
  ): Promise<MemberDto | null> {
    const dbOptions = {
      ...options,
      associationId: this.clientInfo.association,
      projection: '-preferences',
    }

    let item = await this.repository.findByUsername(username, dbOptions)
    if (item)
      item = _.pick(
        item,
        this.adjustProjection(options.projection, item._id.toHexString()),
      )

    return plainToInstance(MemberDto, item, {
      excludeExtraneousValues: true,
    })
  }

  async getInvited(id: string, registrationToken: string): Promise<MemberDto | null> {
    const item = await this.repository.findByRegistrationToken(
      id,
      registrationToken,
      bcrypt.compare,
    )

    return plainToInstance(MemberWithAssociationDto, item, {
      excludeExtraneousValues: true,
    })
  }

  async invite(invitation: MemberInviteDto): Promise<MemberDto | null> {
    const registrationToken = crypto.randomBytes(20).toString('hex')
    const invitedMember = await this.inviteIntoDatabase(registrationToken, invitation)

    if (invitedMember)
      this.mailService
        .sendRegistrationEmail(invitedMember, registrationToken)
        .then((info) =>
          logger.debug(`Registration mail is sent to ${info.envelope.to}.`),
        )
        .catch((err) => logger.debug(`Failed to send registration mail.`, err))

    return plainToInstance(MemberDto, invitedMember, {
      excludeExtraneousValues: true,
    })
  }

  async register(
    id: string,
    token: string,
    registration: MemberRegistrationDto,
  ): Promise<MemberDto | null | undefined> {
    const updatedMember = await this.registerIntoDatabase(id, token, registration)

    if (!updatedMember) return updatedMember

    return plainToInstance(MemberDto, updatedMember, { excludeExtraneousValues: true })
  }

  async labelForgottenPassword(restorationInfo: ForgottenPasswordDto) {
    const { associationId: association, email } = restorationInfo

    const restorationToken = crypto.randomBytes(20).toString('hex')

    const member = await this.repository.labelForgottenPassword(
      association,
      email,
      await this.hashToken(restorationToken),
    )

    if (member)
      this.mailService
        .sendRestorationEmail(member, restorationToken)
        .then((info) =>
          logger.debug(`Restoration mail is sent to ${info.envelope.to}.`),
        )
        .catch((err) =>
          logger.error(`Failed to send restoration mail to ${err.envelope.to}`),
        )

    return member
  }

  async restorePassword(
    id: string,
    restorationToken: string,
    { password }: NewPasswordDto,
  ) {
    return await this.repository.restorePassword(
      id,
      restorationToken,
      await this.hashPassword(password),
      bcrypt.compare,
    )
  }

  async updateCredentials(
    newCredentials: NewCredentialsDto,
  ): Promise<MemberDto | null | undefined> {
    if (newCredentials.username) {
      const { username } = newCredentials
      const alreadyExists = await this.usernameExists(username)
      if (alreadyExists) return undefined
    }

    if (newCredentials.password)
      newCredentials.password = await this.hashPassword(newCredentials.password)

    const updated = await this.repository.updateCredentials(
      this.clientInfo._id,
      newCredentials,
    )

    return plainToInstance(MemberDto, updated, { excludeExtraneousValues: true })
  }

  /**
   * @throws NotPresidentError
   * @throws RegisteredMemberAlterError
   */
  async update(id: string, newContent: MemberUpdateDto): Promise<MemberDto | null> {
    // wants to update himself --> always permitted
    // wants to update others --> only permitted if he is a president and the target is not a registered member

    if (this.clientInfo._id !== id)
      if (!this.clientInfo.hasRole('president')) {
        throw new NotPresidentError()
      } else {
        const target = await this.repository.findById(id, {
          associationId: this.clientInfo.association,
          projection: 'isRegistered',
        })

        if (target && target.isRegistered)
          throw new RegisteredMemberAlterError()
      }

    const updatedMember = await this.repository.update(id, newContent)

    return plainToInstance(MemberDto, updatedMember, { excludeExtraneousValues: true })
  }

  private usernameExists(username: string): Promise<boolean> {
    return this.repository.existsWithUsername(username, this.clientInfo.association)
  }

  private async inviteIntoDatabase(
    registrationToken: string,
    invitation: MemberInviteDto,
  ) {
    let member = {
      ...invitation,
      association: this.clientInfo.association,
      isRegistered: false,
    }

    member = _.pickBy(member, (it) => it !== undefined)
    registrationToken = await this.hashToken(registrationToken)

    return this.repository.invite(member, registrationToken)
  }

  private async registerIntoDatabase(
    id: string,
    registrationToken: string,
    registration: object,
  ) {
    let member = {
      _id: id,
      isRegistered: true,
      ...registration,
      password: await this.hashPassword(registration['password']),
    }

    member = _.pickBy(member, (it) => it !== undefined)

    try {
      return await this.repository.register(member, registrationToken, bcrypt.compare)
    } catch (ex: any) {
      // if unique values are duplicated, mongoose will throw an error that has a property 'code' with the value of '11000'
      if (ex.code == 11000) return undefined
      throw ex
    }
  }

  private async hashToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(1)
    return await bcrypt.hash(token, salt)
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(config.get('crypto.bcryptRounds'))
    return await bcrypt.hash(password, salt)
  }

  private dbOptions(
    options: CommonQueryOptions,
    requestedId: string | undefined = undefined,
  ): MemberQueryOptions {
    return {
      ...options,
      associationId: this.clientInfo.association,
      projection: this.adjustProjection(options.projection, requestedId).join(' '),
      sort: options.sort || 'name',
      showUnregistered: this.clientInfo.roles.includes('president'),
    }
  }

  private adjustProjection(
    projection: 'lite' | 'full',
    requestedId: string | undefined = undefined,
  ): string[] {
    const visibleFields = [
      '_id',
      'isRegistered',
      'username',
      'name',
      'email',
      'phoneNumber',
      'roles',
    ]

    const isPermittedForMore =
      projection == 'full' &&
      (this.clientInfo.hasRole('president') || this.clientInfo._id == requestedId)

    if (isPermittedForMore) visibleFields.push('guardNumber', 'address', 'idNumber')

    return visibleFields
  }
}

/**
 * Thrown when a given operation is only allowed for presidents
 */
export class NotPresidentError extends Error {}

/**
 * Thrown when a (president) client wants to alter another member who is registered.
 */
export class RegisteredMemberAlterError extends Error {}
