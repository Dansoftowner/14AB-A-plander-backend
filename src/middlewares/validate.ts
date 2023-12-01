import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import { ApiError } from '../api/error/api-error'
import { ApiErrorCode } from '../api/error/api-error-codes'
import { getResourceBundle } from '../utils/i18n'

export default (validationSchema: Joi.Schema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const validationResult = validationSchema.validate(req.body, {
      abortEarly: true,
      messages: getResourceBundle(req.language, 'validation'),
    })

    if (validationResult.error)
      throw new ApiError(
        400,
        ApiErrorCode.INVALID_PAYLOAD,
        validationResult.error.details[0].message,
      )

    next()
  }
