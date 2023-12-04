import jwt from 'jsonwebtoken'
import config from 'config'
import { Types } from 'mongoose'
import _ from 'lodash'
import { Member } from '../models/member'

const roleNumbers = new Map<string, number>([
  ['member', 1],
  ['president', 2],
])

export class ClientInfo {
  _id!: string
  association!: string
  roles!: string[]
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
    roles: encodeRoles(member.roles),
  }
}

function decodeClientInfo(raw: any): ClientInfo {
  const clientInfo = new ClientInfo()
  clientInfo._id = raw._id
  clientInfo.association = raw.association
  clientInfo.roles = decodeRoles(raw.roles)
  return clientInfo
}

function encodeId(id: Types.ObjectId | string): string {
  if (id instanceof Types.ObjectId) return id.toHexString()
  return id?.toString()
}

function encodeRoles(roles: string[]): number {
  return roles.reduce((acc: number, role: string) => {
    return acc | (roleNumbers.get(role) ?? 0)
  }, 0)
}

function decodeRoles(roles: number): string[] {
  const roleTitles: Set<string> = new Set(['member'])
  for (const [role, roleNumber] of roleNumbers.entries()) {
    if ((roles & roleNumber) == roleNumber) roleTitles.add(role)
  }
  return Array.from(roleTitles)
}
