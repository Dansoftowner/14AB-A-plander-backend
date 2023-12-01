import jwt from 'jsonwebtoken'
import config from 'config'
import _ from 'lodash'
import { Member } from '../models/member'

export interface MemberInfo {
  _id: string
  association: string
}

export function generateToken(member: Member): string {
  return jwt.sign(_.pick(member, ['_id', 'association']), config.get('jwt.privateKey'))
}

export function decodeMemberInfo(token: string): MemberInfo {
  return jwt.verify(token, config.get('jwt.privateKey')) as MemberInfo
}
