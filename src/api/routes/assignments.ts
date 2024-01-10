import { Controller } from '../../base/controller'
import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import { AssignmentController } from '../controllers/assignment'

export class AssignmentRoutes extends RoutesProvider {
  constructor({ assignmentController }) {
    super(assignmentController)
  }

  override get prefix() {
    return 'assignments'
  }

  protected initializeRoutes(controller: AssignmentController): void {
    this.router.get(
      '/',
      auth,
      asyncErrorHandler((req, res) => controller.getAssignments(req, res)),
    )

    //this.router.get('/', controller.getAssignments)
    //this.router.post('/', controller.createAssignment)
    //this.router.put('/:id', controller.updateAssignment)
    //this.router.delete('/:id', controller.deleteAssignment)
  }
}
