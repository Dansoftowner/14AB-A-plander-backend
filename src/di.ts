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
import { MailService } from './services/mail'
import { AssignmentController } from './api/controllers/assignment'
import { AssignmentRoutes } from './api/routes/assignments'
import { AssignmentService } from './services/assignment'
import { AssignmentRepository } from './repositories/assignment'
import { ReportController } from './api/controllers/report'
import { ReportRoutes } from './api/routes/reports'
import { ReportService } from './services/report'
import { ReportRepository } from './repositories/report'
import { ChatService } from './services/chat'
import { ChatRepository } from './repositories/chat'
import { ChatMessageRoutes } from './api/routes/chat-messages'
import { ChatMessageController } from './api/controllers/chat-message'

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
})

container.register({
  app: asClass(App).proxy().singleton(),
  io: asFunction(() => container.resolve('app').io),

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

  assignmentController: asClass(AssignmentController),
  assignmentRoutes: asClass(AssignmentRoutes),
  assignmentService: asClass(AssignmentService).scoped(),
  assignmentRepository: asClass(AssignmentRepository).scoped(),

  reportController: asClass(ReportController),
  reportRoutes: asClass(ReportRoutes),
  reportService: asClass(ReportService).scoped(),
  reportRepository: asClass(ReportRepository).scoped(),

  mailService: asClass(MailService),

  chatRepository: asClass(ChatRepository),
  chatService: asClass(ChatService).singleton(),
  chatMessageRoutes: asClass(ChatMessageRoutes),
  chatMessageController: asClass(ChatMessageController),
})

export default container
