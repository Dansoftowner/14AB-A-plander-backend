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
import { AssignmentDto } from '../dto/assignment'
import { AssignmentInsertionDto } from '../dto/assignment-insertion'

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

  async getById(
    id: string,
    options: AssignmentsQueryOptions,
  ): Promise<AssignmentDto | null> {
    const item = await this.repository.findById(id, this.toDbQuery(options))

    return plainToInstance(AssignmentDto, item, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    })
  }

  /**
   * @throws AssigneeNotFound
   */
  async create(insertion: AssignmentInsertionDto): Promise<AssignmentDto> {
    const item = await this.repository.insert(this.clientInfo.association, insertion)

    return plainToInstance(AssignmentDto, item, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    })
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
