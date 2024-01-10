import { plainToInstance } from 'class-transformer'
import { Service } from '../base/service'
import { AssignmentItemsDto } from '../dto/assignment-items'
import { ClientInfo } from '../utils/jwt'

export class AssignmentService implements Service {
  private clientInfo: ClientInfo

  constructor({ clientInfo }) {
    this.clientInfo = clientInfo
  }

  get(options: { start: Date; end: Date }): AssignmentItemsDto {
    // TODO:
    return plainToInstance(AssignmentItemsDto, undefined, {
      excludeExtraneousValues: true,
    })
  }
}
