import jwt from 'jsonwebtoken'
import config from 'config'
import _ from 'lodash'
import { Member } from '../models/member'

export function generateToken(member: Member): string {
  return jwt.sign(_.pick(member, ['_id']), config.get('jwt.privateKey'))
}
