import { Expose } from 'class-transformer'

/**
 * @openapi
 * components:
 *  schemas:
 *    PaginationInfo:
 *      type: object
 *      description: 'Includes the required pagination data.'
 *      properties:
 *        total:
 *          type: integer
 *          description: 'The total associations registered in the database'
 *          example: 1
 *        offset:
 *          type: integer
 *          description: 'The number of items skipped.'
 *          example: 0
 *        limit:
 *          type: integer
 *          description: 'The maximum number of items'
 *          example: 10
 */
export class PaginationInfoDto {
  @Expose()
  total?: number

  @Expose()
  offset!: number

  @Expose()
  limit!: number
}
