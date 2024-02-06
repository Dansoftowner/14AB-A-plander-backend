import _ from 'lodash'
import config from 'config'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { MemberItemsDto } from '../dto/member/member-items'
import { MemberQueryOptions, MemberRepository } from '../repositories/member'
import { ClientInfo } from '../utils/jwt'
import { CommonQueryOptions } from '../api/params/common-query-params'
import { MemberDto } from '../dto/member/member'
import { MemberInviteDto } from '../dto/member/member-invite'
import { MailService } from './mail'
import logger from '../logging/logger'
import { MemberRegistrationDto } from '../dto/member/member-registration'
import { ForgottenPasswordDto, NewPasswordDto } from '../dto/member/forgotten-password'
import { NewCredentialsDto } from '../dto/member/new-credentials'
import { MemberWithAssociationDto } from '../dto/member/member-with-association'
import { MemberUpdateDto } from '../dto/member/member-update'
import {
  EmailReservedError,
  NotPresidentError,
  UsernameReservedError,
} from '../exception/member-errors'
import { RegisteredMemberAlterError } from '../exception/member-errors'
import { PresidentDeletionError } from '../exception/member-errors'
import { NoOtherPresidentError } from '../exception/member-errors'
import { ValueReservedError } from '../exception/value-reserved-error'
import { MemberPreferencesDto } from '../dto/member/member-preferences'

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
    const hashedRegistrationToken = await this.hashToken(registrationToken)

    const invitedMember = await this.repository.invite(
      this.clientInfo.association,
      invitation,
      hashedRegistrationToken,
    )

    if (invitedMember)
      this.mailService
        .sendRegistrationEmail(invitedMember, registrationToken)
        .then((info) =>
          logger.debug(`Registration mail is sent to ${info.envelope.to}.`),
        )
        .catch((err) => logger.error(`Failed to send registration mail.`, err))

    return plainToInstance(MemberDto, invitedMember, {
      excludeExtraneousValues: true,
    })
  }

  /**
   * @throws ValueReservedError
   */
  async register(
    id: string,
    token: string,
    registration: MemberRegistrationDto,
  ): Promise<MemberDto | null> {
    registration.password = await this.hashPassword(registration.password)

    try {
      const updatedMember = await this.repository.register(
        id,
        token,
        registration,
        bcrypt.compare,
      )

      return plainToInstance(MemberDto, updatedMember, {
        excludeExtraneousValues: true,
      })
    } catch (ex: any) {
      // if unique values are duplicated, mongoose will throw an error that has a property 'code' with the value of '11000'
      if (ex.code == 11000) throw new ValueReservedError()
      throw ex
    }
  }

  async labelForgottenPassword(restorationInfo: ForgottenPasswordDto) {
    const { associationId: association, email } = restorationInfo

    const restorationToken = crypto.randomBytes(20).toString('hex')
    const restorationTokenHash = await this.hashToken(restorationToken)

    const member = await this.repository.labelForgottenPassword(
      association,
      email,
      restorationTokenHash,
    )

    if (member)
      this.mailService
        .sendRestorationEmail(member, restorationToken)
        .then((info) =>
          logger.debug(`Restoration mail is sent to ${info.envelope.to}.`),
        )
        .catch((err) => logger.error('Failed to send restoration mail', err))

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

  /**
   * @throws UsernameReservedError
   */
  async updateCredentials(
    newCredentials: NewCredentialsDto,
  ): Promise<MemberDto | null> {
    await this.requireUniqueUsername(newCredentials.username)
    await this.requireUniqueEmail(newCredentials.email)

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

        if (target && target.isRegistered) throw new RegisteredMemberAlterError()
      }

    try {
      const updatedMember = await this.repository.update(
        id,
        this.clientInfo.association,
        newContent,
      )

      return plainToInstance(MemberDto, updatedMember, {
        excludeExtraneousValues: true,
      })
    } catch (ex: any) {
      if (ex.code === 11000) throw new ValueReservedError()
      throw ex
    }
  }

  /**
   * @throws NoOtherPresidentError
   * @throws PresidentDeletionError
   */
  async delete(id: string): Promise<MemberDto | null> {
    // we assume that the current member is a president

    if (this.clientInfo._id === id) {
      // the president wants to delete himself

      const areThereOtherPresidents =
        (await this.repository.countPresidents(this.clientInfo.association)) > 1

      if (!areThereOtherPresidents) throw new NoOtherPresidentError()
    } else {
      const isPresident = await this.repository.isPresident(
        id,
        this.clientInfo.association,
      )

      if (isPresident) throw new PresidentDeletionError()
    }

    const deleted = await this.repository.delete(id, this.clientInfo.association)

    return plainToInstance(MemberDto, deleted, { excludeExtraneousValues: true })
  }

  async getPreferences() {
    const prefs = await this.repository.getPreferences(this.clientInfo._id)
    if (prefs !== null) return prefs ?? {}
    return null
  }

  async updatePreferences(preferences: MemberPreferencesDto) {
    return await this.repository.updatePreferences(this.clientInfo._id, preferences)
  }

  async transferRoles(memberId: string, copy: boolean) {
    const updatedMember = await this.repository.transferRoles(
      this.clientInfo.association,
      this.clientInfo._id,
      memberId,
      copy,
    )

    return plainToInstance(MemberDto, updatedMember, { excludeExtraneousValues: true })
  }

  /**
   * Utility method for throwing a `UsernameReservedError` if the given `username` is already taken.
   *
   * @param username
   */
  private async requireUniqueUsername(username: string | undefined) {
    if (username) {
      const alreadyExists = await this.repository.existsWithUsername(
        username,
        this.clientInfo.association,
      )

      if (alreadyExists) throw new UsernameReservedError()
    }
  }

  /**
   * Utility method for throwing an `EmailReservedError` if the given `email` is already taken.
   *
   * @param email
   */
  private async requireUniqueEmail(email: string | undefined) {
    if (email) {
      const alreadyExists = await this.repository.existsWithEmail(
        email,
        this.clientInfo.association,
      )

      if (alreadyExists) throw new EmailReservedError()
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
      showUnregistered: this.clientInfo.hasRole('president'),
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

    if (projection === 'full') visibleFields.push('guardNumber')

    const isPermittedForMore =
      projection == 'full' &&
      (this.clientInfo.hasRole('president') || this.clientInfo._id == requestedId)

    if (isPermittedForMore) visibleFields.push('address', 'idNumber')

    return visibleFields
  }
}
