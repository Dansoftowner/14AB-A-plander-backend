import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../params/assignments-query-params'
import { AssignmentService } from '../../services/assignment'
import { asValue } from 'awilix'
import di from '../../di'
import { instanceToPlain } from 'class-transformer'

export class AssignmentController implements Controller {
  async getAssignments(req: Request, res: Response) {
    const options = resolveOptions(req)

    const result = await this.service(req).get(options)

    res.json(instanceToPlain(result))
  }

  private service(req: Request): AssignmentService {
    if (!req.scope)
      return di
        .createScope()
        .register({ clientInfo: asValue(undefined) })
        .resolve('assignmentService')

    return req.scope!.resolve('assignmentService')
  }
}
