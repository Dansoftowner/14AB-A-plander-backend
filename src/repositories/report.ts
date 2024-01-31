import ReportModel, { Report } from '../models/report'
import AssignmentModel from '../models/assignment'
import { Repository } from '../base/repository'
import { ReportDto } from '../dto/report'
import {
  AssignmentIsNotOverError,
  AssignmentNotFoundError,
  ReportAlreadyExistsError,
  ReportNotFoundError,
  ReporterIsNotAssigneeError,
} from '../exception/report-errors'
import mongoose from 'mongoose'
import assignment from '../models/assignment'
import { ClientInfo } from '../utils/jwt'

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

  async update(
    associationId: string,
    assignmentId: string,
    memberId: string,
    payload: ReportDto,
  ): Promise<Report> {
    return Promise.reject()
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
}
