import { Expose, Type } from 'class-transformer'
import { AssociationDto } from './association'
import { MemberDto } from './member'

/**
 * @openapi
 * components:
 *  schemas:
 *   MemberWithAssociation:
 *     allOf:
 *      - $ref: '#/components/schemas/Member'
 *      - type: object
 *        properties:
 *          association:
 *            $ref: '#/components/schemas/Association'
 *
 */
export class MemberWithAssociationDto extends MemberDto {
  @Expose()
  @Type(() => AssociationDto)
  association!: AssociationDto
}
