import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { AssignmentItemsDto } from '../dto/assignment/assignment-items'
import { ClientInfo } from '../utils/jwt'
import { AssignmentsQueryOptions } from '../api/params/assignments-query-params'
import _ from 'lodash'
import {
  AssignmentRepository,
  AssignmentsDbQueryOptions,
} from '../repositories/assignment'
import { AssignmentDto } from '../dto/assignment/assignment'
import { AssignmentInsertionDto } from '../dto/assignment/assignment-insertion'
import { AssignmentUpdateDto } from '../dto/assignment/assignment-update'

export class AssignmentService implements Service {
  constructor(
    private clientInfo: ClientInfo,
    private assignmentRepository: AssignmentRepository,
  ) {}

  async get(options: AssignmentsQueryOptions): Promise<AssignmentItemsDto> {
    const items = await this.assignmentRepository.get(this.toDbQuery(options))
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
    const item = await this.assignmentRepository.findById(id, this.toDbQuery(options))

    return plainToInstance(AssignmentDto, item, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    })
  }

  /**
   * @throws AssigneeNotFound
   */
  async create(insertion: AssignmentInsertionDto): Promise<AssignmentDto> {
    const item = await this.assignmentRepository.insert(
      this.clientInfo.association,
      insertion,
    )

    return plainToInstance(AssignmentDto, item, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    })
  }

  /**
   * @throws AssigneeNotFound
   * @throws InvalidTimeBoundariesError
   */
  async update(id: string, update: AssignmentUpdateDto) {
    const item = await this.assignmentRepository.update(
      this.clientInfo.association,
      id,
      update,
    )

    return plainToInstance(AssignmentDto, item, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    })
  }

  async delete(id: string): Promise<AssignmentDto | null> {
    const item = await this.assignmentRepository.delete(this.clientInfo.association, id)

    return plainToInstance(AssignmentDto, item, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    })
  }

  private toDbQuery(options: AssignmentsQueryOptions): AssignmentsDbQueryOptions {
    return {
      ...options,
      projection: this.adjustProjection(options.projection).join(' '),
    }
  }

  private adjustProjection(projection: 'lite' | 'full'): string[] {
    const visibleFields = ['_id', 'title', 'start', 'end', 'report']

    if (projection === 'full') visibleFields.push('location', 'assignees')

    return visibleFields
  }
}
