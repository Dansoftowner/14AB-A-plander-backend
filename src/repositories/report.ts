import ReportModel, { Report } from '../models/report'
import AssignmentModel, { Assignment } from '../models/assignment'
import { Repository } from '../base/repository'
import { ReportDto } from '../dto/report/report'
import {
  AssignmentIsNotOverError,
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReportCannotBeAlteredError,
  ReportNotFoundError,
  ReportUpdaterIsNotAuthorError,
  ReporterIsNotAssigneeError,
} from '../exception/report-errors'
import mongoose from 'mongoose'
import assignment from '../models/assignment'
import { ClientInfo } from '../utils/jwt'
import { ReportUpdateDto } from '../dto/report/report-update'
import { differenceInDays } from 'date-fns'

export class ReportRepository implements Repository {
  /**
   * @throws AssignmentNotFoundError
   * @throws SubmitterIsNotAssigneeError
   */
  async create(
    associationId: string,
    assignmentId: string,
    memberId: string,
    payload: ReportDto,
  ): Promise<Report> {
    const targetAssignment = await AssignmentModel.findOne({
      _id: assignmentId,
      association: associationId,
    })

    if (!targetAssignment) throw new AssignmentNotFoundError()
    if (targetAssignment.end > new Date()) throw new AssignmentIsNotOverError()

    const memberAssignee = targetAssignment.assignees.find(
      (it) => it._id.toHexString() === memberId,
    )

    if (!memberAssignee) throw new ReporterIsNotAssigneeError()
    if (targetAssignment.report) throw new ReportAlreadyExistsError()

    const report = new ReportModel({
      ...payload,
      member: memberId,
    })

    targetAssignment.report = report._id

    await report.save()
    await targetAssignment.save()

    return report
  }

  /**
   * @throws ReportNotFoundError
   * @throws ReportUpdaterIsNotAuthorError
   * @throws ReportCannotBeUpdatedError
   */
  async update(
    associationId: string,
    assignmentId: string,
    memberId: string,
    payload: ReportUpdateDto,
  ): Promise<Report | null> {
    const targetAssignment = await AssignmentModel.findOne({
      _id: assignmentId,
      association: associationId,
    })

    if (!targetAssignment) return null
    if (!targetAssignment.report) throw new ReportNotFoundError()

    if (!this.isAssignee(targetAssignment, memberId))
      throw new ReportUpdaterIsNotAuthorError()

    const report = await ReportModel.findById(targetAssignment.report)

    if (!report) throw new ReportNotFoundError()
    if (!(report.member.toHexString() === memberId))
      throw new ReportUpdaterIsNotAuthorError()

    if (differenceInDays(new Date(), report.submittedAt) >= 3)
      throw new ReportCannotBeAlteredError()

    await report.updateOne({ $set: payload }, { new: true })

    return await ReportModel.findById(report._id)
  }

  /**
   *
   * @throws ReportNotFoundError
   */
  async get(associationId: string, assignmentId: string): Promise<Report | null> {
    const targetAssignment = await AssignmentModel.findOne({
      _id: assignmentId,
      association: associationId,
    }).populate('report')

    if (!targetAssignment) return null

    if (!targetAssignment.report) throw new ReportNotFoundError()

    return targetAssignment.report as unknown as Report
  }

  /**
   * @throws ReportNotFoundError
   * @throws ReportUpdaterIsNotAuthorError
   * @throws ReportCannotBeUpdatedError
   */
  async delete(
    associationId: string,
    assignmentId: string,
    memberId: string,
  ): Promise<Report | null> {
    const assignment = await AssignmentModel.findOne({
      association: associationId,
      _id: assignmentId,
    })

    if (!assignment) return null
    if (!assignment.report) throw new ReportNotFoundError()

    if (!this.isAssignee(assignment, memberId))
      throw new ReportUpdaterIsNotAuthorError()

    const report = await ReportModel.findById(assignment.report)

    if (!report) throw new ReportNotFoundError()
    if (!(report.member.toHexString() === memberId))
      throw new ReportUpdaterIsNotAuthorError()

    if (differenceInDays(new Date(), report.submittedAt) >= 3)
      throw new ReportCannotBeAlteredError()

    await report.deleteOne()

    return report
  }

  /**
   * Fetches the assignment populated with the association and assignment.
   *
   * @param assignmentId the id of the assignment
   * @throws ReportNotFoundError
   */
  async findAssignmentWithReport(
    associationId: string,
    assignmentId: string,
  ): Promise<any> {
    const assignment = await AssignmentModel.findOne({
      _id: assignmentId,
      association: associationId,
    })
      .populate('association')
      .populate('report')

    if (assignment && !assignment.report) throw new ReportNotFoundError()

    return assignment
  }

  private isAssignee(assignment: Assignment, assignee: string): boolean {
    return assignment.assignees.map((it) => it._id.toHexString()).includes(assignee)
  }
}
