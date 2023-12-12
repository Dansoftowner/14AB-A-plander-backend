import { Service } from '../base/service'
import { TokenRepository } from '../repositories/token'
import { randomBytes } from 'crypto'

export class TokenService implements Service {
  private repository: TokenRepository

  constructor({ tokenRepository }) {
    this.repository = tokenRepository
  }

  async generateRegistrationToken(memberId: string): Promise<string> {
    const token = this.generateToken()

    await this.repository.insertRegistrationToken(memberId, token)

    return token
  }

  hasRegistrationToken(memberId: string, registrationToken: string): Promise<boolean> {
    return this.repository.hasRegistrationToken(memberId, registrationToken)
  }

  removeRegistrationToken(id: string): Promise<void> {
    return this.repository.removeRegistrationToken(id)
  }

  private generateToken(): string {
    return randomBytes(20).toString('hex')
  }
}
