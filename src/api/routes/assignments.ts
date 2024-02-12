import { RoutesProvider } from '../../base/routes-provider'
import { AssignmentInsertionDto } from '../../dto/assignment/assignment-insertion'
import { AssignmentUpdateDto } from '../../dto/assignment/assignment-update'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import president from '../../middlewares/president'
import validate from '../../middlewares/validate'
import validateObjectId from '../../middlewares/validate-objectid'
import { AssignmentController } from '../controllers/assignment'

export class AssignmentRoutes extends RoutesProvider {
  constructor(assignmentController: AssignmentController) {
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
     *      Two projection modes:
     *        - `lite` - Show only `_id`, `title`, `start`, `end`
     *        - `full` - Show all fields
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

    /**
     * @openapi
     * /api/assignments/{id}:
     *  get:
     *    tags:
     *      - Assignments
     *    description: |
     *      Fetches the assignment based on the given *id* from the currently logged in member's association.
     *
     *      Two projection modes:
     *        - `lite` - Show only `_id`, `title`, `start`, `end`
     *        - `full` - Show all fields
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the assignment.
     *      - $ref: '#/components/parameters/projectionParam'
     *    responses:
     *      200:
     *        description: The assignment is fetched.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Assignment'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      400:
     *        description: |
     *          Either:
     *          - The given id has invalid format (errorCode: 'invalid-object-id').
     *          - The provided token is invalid (errorCode: 'invalid-token').
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Error'
     *      404:
     *        $ref: '#/components/responses/NotFound'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/:id',
      auth,
      validateObjectId,
      asyncErrorHandler((req, res) => controller.getAssignment(req, res)),
    )

    /**
     * @openapi
     * /api/assignments:
     *  post:
     *    tags:
     *      - Assignments
     *    description: |
     *       Allows **presidents** to insert new assignments to the association.
     *
     *       - Inserting assignments in **the past** is **forbidden**.
     *
     *       **Authentication is required** before using this endpoint.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/AssignmentInsertion'
     *    responses:
     *      201:
     *        description: Insertion proceeded. Returns the information about the created assignment.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Assignment'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      403:
     *       $ref: '#/components/responses/NotPresident'
     *      422:
     *       $ref: '#/components/responses/PastAssignmentInsert'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/',
      auth,
      president,
      validate(AssignmentInsertionDto.validationSchema),
      asyncErrorHandler((req, res) => controller.createAssignment(req, res)),
    )

    /**
     * @openapi
     * /api/assignments/{id}:
     *  patch:
     *    tags:
     *      - Assignments
     *    description: |
     *       Allows **presidents** to update assignments.
     *
     *       **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the assignment.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/AssignmentUpdate'
     *    responses:
     *      200:
     *        description: Update proceeded. Returns the information about the updated assignment.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Assignment'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      403:
     *       $ref: '#/components/responses/NotPresident'
     *      422:
     *       $ref: '#/components/responses/InvalidAssignmentBoundaries'
     *      423:
     *       $ref: '#/components/responses/AssignmentCannotBeAltered'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.patch(
      '/:id',
      auth,
      validateObjectId,
      president,
      validate(AssignmentUpdateDto.validationSchema),
      asyncErrorHandler((req, res) => controller.updateAssignment(req, res)),
    )

    /**
     * @openapi
     * /api/assignments/{id}:
     *  delete:
     *    tags:
     *      - Assignments
     *    description: |
     *      Allows **presidents** to delete assignments.
     *
     *      > Note: if there is a report submitted for the assignment, it will be deleted as well.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the assignment.
     *    responses:
     *      200:
     *        description: Deletion proceeded. The details of the deleted assignment are returned.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Assignment'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      403:
     *       $ref: '#/components/responses/NotPresident'
     *      404:
     *        $ref: '#/components/responses/NotFound'
     *      423:
     *        $ref: '#/components/responses/AssignmentCannotBeAltered'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.delete(
      '/:id',
      auth,
      president,
      validateObjectId,
      asyncErrorHandler((req, res) => controller.deleteAssignment(req, res)),
    )
  }
}
