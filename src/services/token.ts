import { Service } from '../base/service'
import { TokenRepository } from '../repositories/token'
import { randomBytes } from 'crypto'

export class TokenService implements Service {
  private tokenRepository: TokenRepository

  constructor({ tokenRepository }) {
    this.tokenRepository = tokenRepository
  }

  async generateRegistrationToken(memberId: string): Promise<string> {
    const token = this.generateToken()

    await this.tokenRepository.insertRegistrationToken(memberId, token)

    return token
  }

  async registrationTokenExists(memberId: string, registrationToken: string): Promise<boolean> { 
    return await this.tokenRepository.registrationTokenExists(memberId, registrationToken)
  }

  private generateToken(): string {
    return randomBytes(20).toString('hex')
  }
}
