import Joi from 'joi'

export class MemberRegistrationDto {
  username!: string
  password!: string
  guardNumber!: string
  name!: string
  address!: string
  idNumber!: string
  phoneNumber!: string

  static validationSchema() {
    return Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
      guardNumber: Joi.string().optional(),
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      idNumber: Joi.string().optional(),
      phoneNumber: Joi.string().optional(),
    })
  }
}
