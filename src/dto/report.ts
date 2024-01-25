import { Expose, Type } from 'class-transformer'

/**
 * @openapi
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier of the report
 *           example: 655f15d623380f3b6a0f7b28
 *         assignment:
 *           type: string
 *           description: ID of the assignment the report belongs to
 *           example:
 *         method:
 *           schema:
 *              type: string
 *              enum: ['bicycle', 'vehicle', 'pedestrian']
 *           description: Describes how the event was managed (by bicycle, vehicle etc..).
 *           example: 'pedestrian'
 *         purpose:
 *           type: string
 *           description: ...!
 *         licensePlateNumber:
 *           type: string
 *           description: License plate number of the patrol car
 *         startKm:
 *           type: number
 *           description: Odometer reading at the start of the patrol
 *         endKm:
 *           type: number
 *           description: Odometer reading at the end of the patrol
 *         externalOrganization:
 *           type: string
 *           description: Name of external organization if any
 *         externalRepresentative:
 *           type: string
 *           description: Name of representative from external organization if any
 *         description:
 *           type: string
 *           description: Short description
 */
export class ReportDto {
  @Expose()
  _id!: string

  @Expose()
  assignment!: string

  @Expose()
  method!: string

  @Expose()
  purpose!: string

  @Expose()
  licensePlateNumber?: string

  @Expose()
  @Type(() => Number)
  startKm?: number

  @Expose()
  @Type(() => Number)
  endKm?: number

  @Expose()
  externalOrganization?: string

  @Expose()
  externalRepresentative?: string

  @Expose()
  description?: string
}
