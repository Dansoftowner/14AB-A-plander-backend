import { Expose, Type } from 'class-transformer'
import { MemberDto } from './member'

/**
 * @openapi
 * components:
 *  schemas:
 *    Assignment:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: 'Unique identifier of the assignment'
 *          example: '655f15d623380f3b6a0f7b28'
 *        title:
 *          type: string
 *          description: 'The title of the assignment'
 *          example: 'Guard the Castle of Oligarchs'
 *        location:
 *          type: string
 *          description: 'The place where the task takes place.'
 *          example: '9152 Börcs Erzsébet tér 3'
 *        start:
 *           type: string
 *           format: date-time
 *           description: The start date-time of the assignment
 *        end:
 *           type: string
 *           format: date-time
 *           description: The end date-time of the assignment
 *        assignees:
 *           type: array
 *           description: The members assigned to the task
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                  type: string
 *                  example: '652f866cfc13ae3ce86c7ce7'
 *               name:
 *                  type: string
 *                  description: 'The full name of the member'
 *                  example: 'Reizinger Szabolcs'
 *        report:
 *          type: string
 *          description: 'Unique identifier of the report submitted for the assignment'
 *          example: '653104dbfc13ae1d116c812e'
 */
export class AssignmentDto {
  @Expose()
  @Type(() => String)
  _id!: string

  @Expose()
  title!: string

  @Expose()
  location!: string

  @Expose()
  @Type(() => Date)
  start!: Date

  @Expose()
  @Type(() => Date)
  end!: Date

  @Expose()
  @Type(() => MemberDto)
  assignees!: MemberDto[]

  @Expose()
  @Type(() => String)
  report!: string
}
