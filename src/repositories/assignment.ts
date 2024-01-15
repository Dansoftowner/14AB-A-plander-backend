import _ from 'lodash'
import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import AssignmentModel, { Assignment } from '../models/assignment'
import MemberModel, { Member } from '../models/member'
import { AssignmentInsertionDto } from '../dto/assignment-insertion'
import { AssigneeNotFoundError } from '../exception/assignment-errors'

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
      assignees: [],
    })

    for (const assigneeId of insertion.assignees) {
      const member = await MemberModel.findOne({
        association: associationId,
        _id: assigneeId,
      })
      if (!member) throw new AssigneeNotFoundError()
      assignment.assignees.push(_.pick(member, ['_id', 'name']))
    }

    return await assignment.save()
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
}
