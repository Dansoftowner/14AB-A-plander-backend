import { Expose, Type } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *    DatePaginationInfo:
 *      type: object
 *      description: 'Includes the date-time boundaries.'
 *      properties:
 *        start:
 *           type: string
 *           description: The start date-time.
 *           example: '2022-12-01'
 *        end:
 *           type: string
 *           description: The end date-time.
 *           example: '2022-12-31'
 */
export class DatePaginationInfoDto {
  @Expose()
  @Type(() => Date)
  start!: Date

  @Expose()
  @Type(() => Date)
  end!: Date
}
