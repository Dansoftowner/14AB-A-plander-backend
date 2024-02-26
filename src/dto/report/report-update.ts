import { Expose, Type } from 'class-transformer'
import Joi from 'joi'
import { JoiObjectId } from '../../utils/joi'

/**
 * @openapi
 * components:
 *   schemas:
 *     ReportUpdate:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier of the report
 *           example: '655f15d623380f3b6a0f7b28'
 *           readOnly: true
 *         method:
 *           schema:
 *              type: string
 *              enum: ['bicycle', 'vehicle', 'pedestrian']
 *           minLength: 5
 *           maxLength: 255
 *           description: Describes how the event was managed (by bicycle, vehicle etc..).
 *           example: 'pedestrian'
 *         purpose:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: Custom string provided by the client that describes the purpose of the service.
 *           example: 'Rendezvénybiztosítás'
 *         licensePlateNumber:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: License plate number of the vehicle (if vehicle was used).
 *           example: 'ABC-123'
 *         startKm:
 *           type: number
 *           min: 0
 *           description: Odometer reading at the start of the patrol.
 *           example: 12345
 *         endKm:
 *           type: number
 *           min: 0
 *           description: Odometer reading at the end of the patrol.
 *           example: 12356
 *         externalOrganization:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: Name of the external organization if there was collaboration.
 *           example: 'Rendőrség'
 *         externalRepresentative:
 *           type: string
 *           minLength: 5
 *           maxLength: 255
 *           description: Name of representative from external organization if any
 *           example: 'Csuhás Márton Őrnagy'
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 1240
 *           description: Description of remarkable events occured.
 */
export class ReportUpdateDto {
  method!: string
  purpose!: string
  licensePlateNumber?: string
  startKm?: number
  endKm?: number
  externalOrganization?: string
  externalRepresentative?: string
  description?: string

  static get validationSchema() {
    return Joi.object({
      method: Joi.string().valid('bicycle', 'vehicle', 'pedestrian'),
      purpose: Joi.string().min(5).max(255),
      licensePlateNumber: Joi.string().min(5).max(255).allow(null),
      startKm: Joi.number().min(0).allow(null),
      endKm: Joi.number().min(0).greater(Joi.ref('startKm')).allow(null),
      externalOrganization: Joi.string().min(5).max(255).allow(null),
      externalRepresentative: Joi.string()
        .allow(null)
        .min(5)
        .max(255)
        .when('externalOrganization', {
          is: Joi.exist(),
          then: Joi.required(),
          otherwise: Joi.allow(),
        }),
      description: Joi.string().min(5).max(1240).allow(null),
    })
  }
}
