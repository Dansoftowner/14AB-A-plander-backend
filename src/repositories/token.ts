import { Repository } from '../base/repository'
import registrationTokenModel, { RegistrationToken } from '../models/registration-token'

export class TokenRepository implements Repository {
  async insertRegistrationToken(memberId: string, token: string) {
    await registrationTokenModel.insertMany({ memberId, token })
  }
}
