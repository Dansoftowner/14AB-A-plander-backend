import Joi from 'joi'
import { ScalarType } from '../../utils/scalar-type'

export class MemberPreferencesDto {
  [key: string]: ScalarType | Array<ScalarType>

  static get validationSchema(): Joi.ObjectSchema<MemberPreferencesDto> {
    const acceptedTypes = [Joi.string(), Joi.number(), Joi.boolean()].map((it) =>
      it.allow(null),
    )

    return (
      Joi.object()
        .max(10)
        .min(1)
        .unknown(true)
        .pattern(
          /^[^\.^\$]*$/,
          Joi.alternatives().try(
            ...acceptedTypes,
            Joi.array()
              .items(...acceptedTypes)
              .optional(),
          ),
        )
        // disable keys with '$' and '.' signs by applying a regex to them that never matches anything
        .pattern(/[\.\$]/, Joi.string().regex(/$./))
    )
  }
}
