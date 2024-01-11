import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { AssignmentItemsDto } from '../dto/assignment-items'
import { ClientInfo } from '../utils/jwt'
import { AssignmentsQueryOptions } from '../api/params/assignments-query-params'
import _ from 'lodash'
import {
  AssignmentRepository,
  AssignmentsDbQueryOptions,
} from '../repositories/assignment'

export class AssignmentService implements Service {
  private clientInfo: ClientInfo
  private repository: AssignmentRepository

  constructor({ clientInfo, assignmentRepository }) {
    this.clientInfo = clientInfo
    this.repository = assignmentRepository
  }

  async get(options: AssignmentsQueryOptions): Promise<AssignmentItemsDto> {
    const items = await this.repository.get(this.toDbQuery(options))
    const metadata = _.pick(options, ['start', 'end'])

    return plainToInstance(
      AssignmentItemsDto,
      { metadata, items },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      },
    )
  }

  private toDbQuery(options: AssignmentsQueryOptions): AssignmentsDbQueryOptions {
    return {
      associationId: this.clientInfo.association,

      ...options,

      projection: this.adjustProjection(options.projection).join(' '),
    }
  }

  private adjustProjection(projection: 'lite' | 'full'): string[] {
    const visibleFields = ['_id', 'title', 'start', 'end']

    if (projection === 'full') visibleFields.push('location', 'assignees')

    return visibleFields
  }
}