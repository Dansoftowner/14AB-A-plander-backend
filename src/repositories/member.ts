import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import MemberModel, { Member } from '../models/member'
import { sanitizeForRegex as s } from '../utils/sanitize'
import RegistrationTokenModel from '../models/registration-token'
import crypto from 'crypto'
import _ from 'lodash'

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
  ): Promise<Member | null> {
    const isTokenPresent = await RegistrationTokenModel.exists({
      memberId: id,
      registrationToken,
    })

    if (!isTokenPresent) return null

    return await MemberModel.findById(id)
  }

  async existsWithEmail(email: string, associationId: string): Promise<boolean> {
    return (await MemberModel.exists({ email, association: associationId })) != null
  }

  async existsWithId(id: string): Promise<boolean> {
    return (await MemberModel.exists({ _id: id })) != null
  }

  async invite(member: object): Promise<{ invitedMember: Member; token: string }> {
    const inserted = await new MemberModel(member).save()

    const token = crypto.randomBytes(20).toString('hex')

    await new RegistrationTokenModel({
      memberId: inserted._id,
      token,
    }).save()

    return { invitedMember: inserted, token }
  }

  async register(member: object, token: string): Promise<Member | null> {
    const memberId = member['_id']

    const isTokenValid = await RegistrationTokenModel.findOneAndDelete({
      memberId,
      token,
    })

    if (!isTokenValid) return null

    return await MemberModel.findByIdAndUpdate(memberId, member, { new: true })
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
