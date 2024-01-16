import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../params/assignments-query-params'
import { AssignmentService } from '../../services/assignment'
import { asValue } from 'awilix'
import di from '../../di'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'
import { AssignmentInsertionDto } from '../../dto/assignment-insertion'
import { AssigneeNotFoundError } from '../../exception/assignment-errors'

export class AssignmentController implements Controller {
  async getAssignments(req: Request, res: Response) {
    const options = resolveOptions(req)

    const result = await this.service(req).get(options)

    res.json(instanceToPlain(result))
  }

  async getAssignment(req: Request, res: Response) {
    const id = req.params.id
    const options = resolveOptions(req)

    const result = await this.service(req).getById(id, options)

    if (!result) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

    res.status(200).json(instanceToPlain(result))
  }

  async createAssignment(req: Request, res: Response) {
    const payload = plainToInstance(AssignmentInsertionDto, req.body)

    try {
      const result = await this.service(req).create(payload)

      res.status(201).send(instanceToPlain(result))
    } catch (e) {
      if (e instanceof AssigneeNotFoundError)
        throw new ApiError(400, ApiErrorCode.ASSIGNEE_NOT_FOUND)
      throw e
    }
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
