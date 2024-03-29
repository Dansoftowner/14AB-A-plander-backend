import { Expose, Type } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *    Association:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: 'Unique identifier of the association'
 *          example: '655f15d623380f3b6a0f7b28'
 *        name:
 *          type: string
 *          description: 'Full name of the association'
 *          example: 'Börcsi Polgárõr Egyesület'
 *        location:
 *          type: string
 *          description: 'The location of the association'
 *          example: '9152 Börcs Erzsébet tér 3'
 *        certificate:
 *          type: string
 *          description: 'The official identifer of the association'
 *          example: '08/0019'
 */
export class AssociationDto {
  @Expose({ name: '_id' })
  @Type(() => String)
  id!: string

  @Expose()
  name!: string

  @Expose()
  location!: string

  @Expose()
  certificate!: string
}
