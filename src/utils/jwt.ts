import jwt from 'jsonwebtoken'
import config from 'config'
import { Types } from 'mongoose'
import _ from 'lodash'
import { Member } from '../models/member'

export class ClientInfo {
  _id!: string
  association!: string

  // altough roles are not stored in the token (anymore),
  // still this property should be initialized for making it compatible with depending codebases
  roles!: string[]

  hasRole(role: string): boolean {
    return this.roles.includes(role)
  }
}

export function generateToken(member: Member): string {
  return jwt.sign(assembleClientInfo(member), config.get('jwt.privateKey'))
}

export function verifyToken(token: string): ClientInfo {
  return decodeClientInfo(jwt.verify(token, config.get('jwt.privateKey')))
}

function assembleClientInfo(member: Member): object {
  return {
    _id: encodeId(member._id),
    association: encodeId(member.association),
  }
}

function decodeClientInfo(raw: any): ClientInfo {
  const clientInfo = new ClientInfo()
  clientInfo._id = raw._id
  clientInfo.association = raw.association
  return clientInfo
}

function encodeId(id: Types.ObjectId | string): string {
  if (id instanceof Types.ObjectId) return id.toHexString()
  return id?.toString()
}
