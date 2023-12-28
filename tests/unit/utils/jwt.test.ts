import mongoose from 'mongoose'
import { generateToken, verifyToken } from '../../../src/utils/jwt'
import { Member } from '../../../src/models/member'
import _ from 'lodash'

describe('jwt token utility', () => {
  const member = {
    _id: new mongoose.Types.ObjectId(),
    association: new mongoose.Types.ObjectId(),
    roles: ['member'],
  }

  const execute = () => {
    return generateToken(member as Member)
  }

  it('should generate token', () => {
    const token = execute()

    expect(_.keys(verifyToken(token))).toEqual(
      expect.arrayContaining(['_id', 'association']),
    )
  })

  it('should store id in token', () => {
    const token = execute()

    expect(verifyToken(token)).toHaveProperty('_id', member._id.toHexString())
  })

  it('should store association in token', () => {
    const token = execute()

    expect(verifyToken(token)).toHaveProperty(
      'association',
      member.association.toHexString(),
    )
  })
})
