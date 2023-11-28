import _ from 'lodash'
import config from 'config'
import { CookieOptions, Request, Response } from 'express'
import { Controller } from '../../base/controller'
import memberModel from '../../models/member'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export class AuthenticationController implements Controller {
  async auth(req: Request, res: Response) {
    const payload = req.body

    if (!payload.associationId) return res.status(400).send()
    if (!payload.user) return res.status(400).send()
    if (!payload.password) return res.status(400).send()

    let member
    if (payload.user.includes('@')) {
      member = await memberModel.findOne({
        association: payload.associationId,
        email: payload.user,
      })
    } else {
      member = await memberModel.findOne({
        association: payload.associationId,
        username: payload.user,
      })
    }

    if (!member) return res.status(401).send()

    const validPassword = await bcrypt.compare(payload.password, member.password)
    if (!validPassword) return res.status(401).send()

    const token = jwt.sign(_.pick(member, ['_id']), config.get('jwt.privateKey'))

    const cookieOptions: CookieOptions = { sameSite: 'lax', httpOnly: true }
    if (payload.isAutoLogin) cookieOptions.maxAge = 365 * 24 * 60 * 60 * 1000

    res.cookie('plander_auth', token, cookieOptions)
    res.json(token)
  }
}
