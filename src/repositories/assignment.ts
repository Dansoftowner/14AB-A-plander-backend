import _ from 'lodash'
import { FilterQuery, UpdateQuery } from 'mongoose'
import { Repository } from '../base/repository'
import AssignmentModel, { Assignment } from '../models/assignment'
import MemberModel, { Member } from '../models/member'
import { AssignmentInsertionDto } from '../dto/assignment-insertion'
import {
  AssigneeNotFoundError,
  InvalidTimeBoundariesError,
} from '../exception/assignment-errors'
import { isIterable, notFalsy } from '../utils/commons'
import { AssignmentUpdateDto } from '../dto/assignment-update'

export interface AssignmentsDbQueryOptions {
  start: Date
  end: Date
  projection: string
  sort: string
  associationId: string
}

export class AssignmentRepository implements Repository {
  get(options: AssignmentsDbQueryOptions): Promise<Assignment[]> {
    const { projection, sort } = options
    return AssignmentModel.find(this.filterQuery(options)).select(projection).sort(sort)
  }

  findById(id: string, options: AssignmentsDbQueryOptions): Promise<Assignment> {
    const { projection, associationId } = options

    return AssignmentModel.findOne({ _id: id, association: associationId }).select(
      projection,
    )
  }

  /**
   * @throws AssigneeNotFound
   */
  async insert(
    associationId: string,
    insertion: AssignmentInsertionDto,
  ): Promise<Assignment> {
    const assignment = new AssignmentModel({
      association: associationId,
      ...insertion,
      assignees: await this.populateAssignees(associationId, insertion.assignees),
    })

    return await assignment.save()
  }

  async update(
    associationId: string,
    id: string,
    update: AssignmentUpdateDto,
  ): Promise<Assignment | null> {
    const assignment = await AssignmentModel.findOne({
      _id: id,
      association: associationId,
    })

    if (!assignment) return null

    this.ensureTimeBoundariesIntegrity(
      notFalsy(update.start, assignment.start),
      notFalsy(update.end, assignment.end),
    )

    for (const prop of ['title', 'start', 'end', 'location'])
      if (update[prop]) assignment[prop] = update[prop]

    if (update.assignees)
      assignment.assignees = await this.populateAssignees(
        associationId,
        update.assignees,
      )

    return await assignment.save()
  }

  private async populateAssignees(
    associationId: string,
    assignees: string[],
  ): Promise<any[]> {
    const members: Member[] = []
    if (isIterable(assignees))
      for (const assigneeId of assignees) {
        const member = await MemberModel.findOne({
          association: associationId,
          _id: assigneeId,
        })
        if (!member) throw new AssigneeNotFoundError()
        members.push(_.pick(member, ['_id', 'name']))
      }
    return members
  }

  private filterQuery(options: AssignmentsDbQueryOptions): FilterQuery<Assignment> {
    const { start, end, associationId } = options

    return {
      association: associationId,
      start: {
        $gte: start,
        $lte: end,
      },
      end: {
        $gte: start,
        $lte: end,
      },
    }
  }

  private ensureTimeBoundariesIntegrity(start: Date, end: Date) {
    if (start > end) throw new InvalidTimeBoundariesError()
  }
}
