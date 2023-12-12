import { Repository } from '../base/repository'
import registrationTokenModel, { RegistrationToken } from '../models/registration-token'

export class TokenRepository implements Repository {
  async insertRegistrationToken(memberId: string, token: string) {
    await registrationTokenModel.insertMany({ memberId, token })
  }

  async registrationTokenExists(
    memberId: string,
    registrationToken: string,
  ): Promise<boolean> {
    const token = await registrationTokenModel.exists({
      memberId,
      token: registrationToken,
    })

    return token != null
  }
}
