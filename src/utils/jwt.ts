import jwt from 'jsonwebtoken'
import config from 'config'
import _ from 'lodash'
import { Member } from '../models/member'

export interface ClientInfo {
  _id: string
  association: string
}

export function generateToken(member: Member): string {
  return jwt.sign(_.pick(member, ['_id', 'association']), config.get('jwt.privateKey'))
}

export function decodeClientInfo(token: string): ClientInfo {
  return jwt.verify(token, config.get('jwt.privateKey')) as ClientInfo
}
