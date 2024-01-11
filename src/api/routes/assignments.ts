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
    /**
     * @openapi
     * /api/assignments:
     *  get:
     *    tags:
     *      - Assignments
     *    description: |
     *      Fetches the assignments of the association.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - $ref: '#/components/parameters/startDateParam'
     *      - $ref: '#/components/parameters/endDateParam'
     *      - $ref: '#/components/parameters/projectionParam'
     *      - $ref: '#/components/parameters/sortParam'
     *    responses:
     *      200:
     *        description: Assignments fetched successfully.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/AssignmentItems'
     *      400:
     *        $ref: '#/components/responses/InvalidToken'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
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
