import { Request, Response } from 'express'
import { Controller } from '../../base/controller'
import { resolveOptions } from '../params/assignments-query-params'
import { AssignmentService } from '../../services/assignment'
import { asValue } from 'awilix'
import di from '../../di'
import { instanceToPlain, plainToInstance } from 'class-transformer'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'
import { AssignmentInsertionDto } from '../../dto/assignment/assignment-insertion'
import {
  AssigneeNotFoundError,
  AssignmentCannotBeAlteredError,
  InsertionInThePastError,
  InvalidTimeBoundariesError,
} from '../../exception/assignment-errors'
import { AssignmentUpdateDto } from '../../dto/assignment/assignment-update'

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
      if (e instanceof InsertionInThePastError)
        throw new ApiError(422, ApiErrorCode.PAST_ASSIGNMENT_INSERT)
      throw e
    }
  }

  async updateAssignment(req: Request, res: Response) {
    const id = req.params.id
    const payload = plainToInstance(AssignmentUpdateDto, req.body)

    try {
      const result = await this.service(req).update(id, payload)

      if (!result) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      res.status(200).send(instanceToPlain(result))
    } catch (e) {
      if (e instanceof AssigneeNotFoundError)
        throw new ApiError(400, ApiErrorCode.ASSIGNEE_NOT_FOUND)
      if (e instanceof InvalidTimeBoundariesError)
        throw new ApiError(422, ApiErrorCode.INVALID_ASSIGNMENT_BOUNDARIES)
      if (e instanceof AssignmentCannotBeAlteredError)
        throw new ApiError(423, ApiErrorCode.ASSIGNMENT_CANNOT_BE_ALTERED)
      throw e
    }
  }

  async deleteAssignment(req: Request, res: Response) {
    const id = req.params.id

    try {
      const result = await this.service(req).delete(id)

      if (!result) throw new ApiError(404, ApiErrorCode.MISSING_RESOURCE)

      res.status(200).send(instanceToPlain(result))
    } catch (e) {
      if (e instanceof AssignmentCannotBeAlteredError)
        throw new ApiError(423, ApiErrorCode.ASSIGNMENT_CANNOT_BE_ALTERED)
      throw e;
    }
  }

  private service(req: Request): AssignmentService {
    return req.scope!.resolve('assignmentService')
  }
}
