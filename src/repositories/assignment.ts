import _ from 'lodash'
import mongoose, { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import AssignmentModel, { Assignment } from '../models/assignment'
import ReportModel from '../models/report'
import MemberModel, { Member } from '../models/member'
import { AssignmentInsertionDto } from '../dto/assignment/assignment-insertion'
import {
  AssigneeNotFoundError,
  InsertionInThePastError,
  InvalidTimeBoundariesError,
} from '../exception/assignment-errors'
import { isIterable, notFalsy } from '../utils/commons'
import { AssignmentUpdateDto } from '../dto/assignment/assignment-update'
import { ClientInfo } from '../utils/jwt'

export interface AssignmentsDbQueryOptions {
  start?: Date
  end?: Date
  projection?: string
  sort?: string
}

export class AssignmentRepository implements Repository {
  constructor(private clientInfo: ClientInfo) {}

  get(options: AssignmentsDbQueryOptions): Promise<Assignment[]> {
    const { projection, sort } = options
    return AssignmentModel.find(this.filterQuery(options))
      .select(projection!)
      .sort(sort)
  }

  findById(
    id: string | mongoose.Types.ObjectId,
    options: AssignmentsDbQueryOptions,
  ): Promise<Assignment> {
    const { projection } = options

    return AssignmentModel.findOne({
      _id: id,
      association: this.clientInfo.association,
    }).select(projection!)
  }

  /**
   * @throws AssigneeNotFoundError
   * @throws InsertionInThePastError
   */
  async insert(
    associationId: string | mongoose.Types.ObjectId,
    insertion: AssignmentInsertionDto,
  ): Promise<Assignment> {
    if (insertion.end < new Date()) throw new InsertionInThePastError()

    const assignment = new AssignmentModel({
      association: associationId,
      ...insertion,
      assignees: await this.populateAssignees(insertion.assignees),
    })

    return await assignment.save()
  }

  /**
   * @throws AssigneeNotFound
   * @throws InvalidTimeBoundariesError
   */
  async update(
    associationId: string | mongoose.Types.ObjectId,
    id: string | mongoose.Types.ObjectId,
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
      assignment.assignees = await this.populateAssignees(update.assignees)

    return await assignment.save()
  }

  async delete(
    associationId: string | mongoose.Types.ObjectId,
    id: string | mongoose.Types.ObjectId,
  ): Promise<Assignment | null> {
    const assignment = await AssignmentModel.findOneAndDelete({
      association: associationId,
      _id: id,
    })

    await ReportModel.findByIdAndDelete(assignment?.report)

    return assignment
  }

  private async populateAssignees(assignees: string[]): Promise<any[]> {
    const members: Member[] = []
    if (isIterable(assignees))
      for (const assigneeId of assignees) {
        const member = await MemberModel.findOne({
          association: this.clientInfo.association,
          _id: assigneeId,
          isRegistered: true,
        })
        if (!member) throw new AssigneeNotFoundError()
        members.push(_.pick(member, ['_id', 'name']))
      }
    return members
  }

  private filterQuery(options: AssignmentsDbQueryOptions): FilterQuery<Assignment> {
    const { start, end } = options

    return {
      association: this.clientInfo.association,
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
