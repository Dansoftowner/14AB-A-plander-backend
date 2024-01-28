import ReportModel, { Report } from '../models/report'
import AssignmentModel from '../models/assignment'
import { Repository } from '../base/repository'
import { ReportDto } from '../dto/report'
import {
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReporterIsNotAssigneeError,
} from '../exception/report-errors'
import mongoose from 'mongoose'

export class ReportRepository implements Repository {
  /**
   * @throws AssignmentNotFoundError
   * @throws SubmitterIsNotAssigneeError
   */
  async create(
    associationId: string,
    memberId: string,
    payload: ReportDto,
  ): Promise<Report> {
    const targetAssignment = await AssignmentModel.findOne({
      _id: payload.assignment,
      association: associationId,
    })

    if (!targetAssignment) throw new AssignmentNotFoundError()

    const memberAssignee = targetAssignment.assignees.find(
      (it) => it._id.toHexString() === memberId,
    )

    if (!memberAssignee) throw new ReporterIsNotAssigneeError()

    const reportExists = await ReportModel.exists({ assignment: payload.assignment })
    if (reportExists) throw new ReportAlreadyExistsError()

    const report = new ReportModel({
      ...payload,
      member: memberId,
      assignment: payload.assignment,
    })

    return await report.save()
  }

  /**
   * Fetches a single report along with the assignment and association data.
   *
   * @param id the id of the report
   */
  async fatFindById(id: string | mongoose.Types.ObjectId): Promise<any> {
    const array = await ReportModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id.toString()) } },
      {
        $lookup: {
          from: 'assignments',
          localField: 'assignment',
          foreignField: '_id',
          as: 'assignment',
        },
      },
      {
        $lookup: {
          from: 'associations',
          localField: 'assignment.association',
          foreignField: '_id',
          as: 'association',
        },
      },
      {
        $unwind: {
          path: '$assignment',
        },
      },
      {
        $unwind: {
          path: '$association',
        },
      },
    ])

    return array.length ? array[0] : null
  }
}
