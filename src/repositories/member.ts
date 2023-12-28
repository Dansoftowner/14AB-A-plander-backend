import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import MemberModel, { Member } from '../models/member'
import { sanitizeForRegex as s } from '../utils/sanitize'
import RegistrationTokenModel from '../models/registration-token'
import RestorationTokenModel from '../models/restoration-token'
import _ from 'lodash'
import { NewCredentialsDto } from '../dto/new-credentials'
import { MemberUpdateDto } from '../dto/member-update'
import { MemberRegistrationDto } from '../dto/member-registration'
import { MemberInviteDto } from '../dto/member-invite'
import { MemberPreferencesDto } from '../dto/member-preferences'

export interface MemberQueryOptions {
  associationId: string
  offset?: number
  limit?: number
  sort?: string
  searchTerm?: string
  projection?: string
  showUnregistered?: boolean
}

export class MemberRepository implements Repository {
  async get(options: MemberQueryOptions): Promise<{ count: number; items: Member[] }> {
    const { offset, limit, sort, projection } = options
    const filter = this.filterQuery(options)

    const count = await MemberModel.countDocuments(filter)
    const items = await MemberModel.find(filter)
      .skip(offset!)
      .limit(limit!)
      .sort(sort)
      .select(projection!)

    return { count, items }
  }

  async findById(id: string, options: MemberQueryOptions) {
    const filter = this.filterQuery(options)
    filter._id = id

    return MemberModel.findOne(filter).select(options.projection!)
  }

  async findByEmail(
    email: string,
    options: MemberQueryOptions,
  ): Promise<Member | null> {
    const filter = this.filterQuery(options)
    filter.email = email

    return (await MemberModel.findOne(filter).select(options.projection!)) as Member
  }

  async findByUsername(
    username: string,
    options: MemberQueryOptions,
  ): Promise<Member | null> {
    const filter = this.filterQuery(options)
    filter.username = username

    return (await MemberModel.findOne(filter).select(options.projection!)) as Member
  }

  async findByRegistrationToken(
    id: string,
    registrationToken: string,
    compareTokens: (token: string, encrypted: string) => Promise<boolean>,
  ): Promise<Member | null> {
    const tokenEntry = await RegistrationTokenModel.findOne({
      memberId: id,
    })

    if (!tokenEntry) return null

    const areTokensEqual = await compareTokens(registrationToken, tokenEntry.token)
    if (!areTokensEqual) return null

    return await MemberModel.findById(id).populate('association', 'name')
  }

  async existsWithEmail(email: string, associationId: string): Promise<boolean> {
    return (await MemberModel.exists({ email, association: associationId })) != null
  }

  async existsWithUsername(username, associationId): Promise<boolean> {
    return (await MemberModel.exists({ username, association: associationId })) != null
  }

  async existsWithId(id: string): Promise<boolean> {
    return (await MemberModel.exists({ _id: id })) != null
  }

  countPresidents(associationId: string): Promise<number> {
    return MemberModel.countDocuments({
      association: associationId,
      roles: 'president',
    })
  }

  async isPresident(id: string, associationId: string): Promise<boolean> {
    return (
      (await MemberModel.exists({
        _id: id,
        association: associationId,
        roles: 'president',
      })) != null
    )
  }

  async invite(
    associationId: string,
    invitation: MemberInviteDto,
    registrationToken: string,
  ): Promise<Member | null> {
    const registeredMember = await MemberModel.exists({
      association: associationId,
      email: invitation.email,
      isRegistered: true,
    })

    if (registeredMember) return null

    invitation = _.pickBy(invitation, (it) => it !== undefined)

    const inserted = await MemberModel.findOneAndReplace(
      {
        association: associationId,
        email: invitation.email,
      },
      {
        isRegistered: false,
        association: associationId,
        ...invitation,
      },
      { upsert: true, new: true },
    )

    await RegistrationTokenModel.findOneAndReplace(
      {
        memberId: inserted._id,
      },
      { memberId: inserted._id, token: registrationToken },
      { upsert: true },
    )

    return inserted
  }

  async register(
    id: string,
    registrationToken: string,
    registration: MemberRegistrationDto,
    compareTokens: (token: string, encrypted: string) => Promise<boolean>,
  ): Promise<Member | null> {
    const tokenEntry = await RegistrationTokenModel.findOne({
      memberId: id,
    })

    if (!tokenEntry) return null

    const areTokensEqual = await compareTokens(registrationToken, tokenEntry.token)
    if (!areTokensEqual) return null

    await tokenEntry.deleteOne()

    registration = _.pickBy(registration, (it) => it !== undefined)

    return await MemberModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isRegistered: true,
          ...registration,
        },
      },
      { new: true },
    )
  }

  async labelForgottenPassword(
    association: string,
    email: string,
    restorationToken: string,
  ): Promise<Member | null> {
    const member = await this.findByEmail(email, { associationId: association })
    if (!member) return null

    await RestorationTokenModel.replaceOne(
      { memberId: member._id },
      { memberId: member._id, token: restorationToken },
      { upsert: true },
    )

    return member
  }

  async restorePassword(
    id: string,
    restorationToken: string,
    password: string,
    compareTokens: (token: string, encrypted: string) => Promise<boolean>,
  ): Promise<Member | null> {
    const tokenEntry = await RestorationTokenModel.findOne({
      memberId: id,
    })

    if (!tokenEntry) return null

    const areTokensEqual = await compareTokens(restorationToken, tokenEntry.token)
    if (!areTokensEqual) return null

    await tokenEntry.deleteOne()

    return await MemberModel.findByIdAndUpdate(id, {
      $set: {
        password,
      },
    })
  }

  async updateCredentials(
    id: string,
    newCredentials: NewCredentialsDto,
  ): Promise<Member | null> {
    return await MemberModel.findByIdAndUpdate(
      id,
      {
        $set: _.pick(newCredentials, ['email', 'username', 'password']),
      },
      { new: true },
    )
  }

  async update(
    id: string,
    associationId: string,
    newContent: MemberUpdateDto,
  ): Promise<Member | null> {
    return await MemberModel.findOneAndUpdate(
      { _id: id, association: associationId },
      {
        $set: newContent,
      },
      { new: true },
    )
  }

  delete(id: string, associationId: string): Promise<Member | null> {
    return MemberModel.findOneAndDelete({ _id: id, association: associationId })
  }

  /**
   * @returns null if member not found
   * @returns undefined if member found but it has no preferences
   */
  async getPreferences(id: string): Promise<object | null | undefined> {
    const member = await MemberModel.findById(id).select('preferences')
    if (!member) return null

    return member.preferences || undefined
  }

  async updatePreferences(
    id: string,
    preferences: MemberPreferencesDto,
  ): Promise<object | null> {
    const valuesToSet = _.pickBy(preferences, (it) => it !== null)
    const fieldsToRemove = _.pickBy(preferences, (it) => it === null)

    const member = await MemberModel.findByIdAndUpdate(
      id,
      {
        $set: _.mapKeys(valuesToSet, (_, key) => `preferences.${key}`),
        $unset: _.mapKeys(fieldsToRemove, (_, key) => `preferences.${key}`),
      },
      { new: true },
    ).select('preferences')

    if (!member) return null

    return member.preferences!
  }

  async transferRoles(
    associationId: string,
    fromId: string,
    toId: string,
    copy: boolean,
  ): Promise<Member | null> {
    const sourceMember = await MemberModel.findOne({
      _id: fromId,
      isRegistered: true,
      association: associationId,
    })

    if (!sourceMember) return null

    const updatedMember = await MemberModel.findOneAndUpdate(
      { _id: toId, isRegistered: true, association: associationId },
      {
        $set: {
          roles: sourceMember!.roles,
        },
      },
      { new: true },
    )

    if (!updatedMember) return null

    if (!copy) {
      sourceMember.roles = ['member']
      await sourceMember.save()
    }

    return updatedMember
  }

  private filterQuery(options: MemberQueryOptions): FilterQuery<Member> {
    const filterObj: FilterQuery<Member> = {
      association: options.associationId,
      isRegistered: true,
    }

    if (options.showUnregistered) delete filterObj.isRegistered
    if (options.searchTerm) filterObj.name = new RegExp(s(options.searchTerm), 'i')

    return filterObj
  }
}
