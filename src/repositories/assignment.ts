import { FilterQuery } from 'mongoose'
import { Repository } from '../base/repository'
import AssignmentModel, { Assignment } from '../models/assignment'

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
