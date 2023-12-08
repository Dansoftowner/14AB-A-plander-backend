import { createContainer, asClass, asFunction, InjectionMode } from 'awilix'
import { App } from './app'
import AssociationService from './services/association'
import AssociationController from './api/controllers/association'
import AssocationRoutes from './api/routes/associations'
import { AssociationRepository } from './repositories/association'
import { AuthenticationController } from './api/controllers/authentication'
import { AuthenticationRoutes } from './api/routes/authentication'
import { AuthenticationService } from './services/authentication'
import { MemberRepository } from './repositories/member'
import { MemberController } from './api/controllers/member'
import { MemberRoutes } from './api/routes/members'
import { MemberService } from './services/member'

const container = createContainer({
  injectionMode: InjectionMode.PROXY,
})

container.register({
  app: asClass(App).singleton(),

  associationRepository: asClass(AssociationRepository),
  associationService: asClass(AssociationService),
  associationController: asClass(AssociationController),
  associationRoutes: asClass(AssocationRoutes),

  memberRepository: asClass(MemberRepository),
  memberService: asClass(MemberService).scoped(),
  memberController: asClass(MemberController),
  memberRoutes: asClass(MemberRoutes),

  authenticationService: asClass(AuthenticationService),
  authenticationController: asClass(AuthenticationController),
  authenticationRoutes: asClass(AuthenticationRoutes),
})

export default container
