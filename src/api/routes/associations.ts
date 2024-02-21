import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import validateObjectId from '../../middlewares/validate-objectid'
import AssociationController from '../controllers/association'

export default class AssocationRoutes extends RoutesProvider {
  constructor(associationController: AssociationController) {
    super(associationController)
  }

  override get prefix() {
    return 'associations'
  }

  protected initializeRoutes(controller: AssociationController) {
    /**
     * @openapi
     * /api/associations:
     *  get:
     *    tags:
     *      - Associations
     *    security: []
     *    description: |
     *      Fetches the registered associations.
     *
     *      **Authentication is not required** before using this endpoint.
     *    parameters:
     *      - $ref: '#/components/parameters/offsetParam'
     *      - $ref: '#/components/parameters/limitParam'
     *      - $ref: '#/components/parameters/projectionParam'
     *      - $ref: '#/components/parameters/sortParam'
     *      - $ref: '#/components/parameters/searchQueryParam'
     *    responses:
     *      200:
     *        description: Associations fetched successfully.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/AssociationItems'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/',
      asyncErrorHandler((req, res) => controller.getAssociations(req, res)),
    )

    /**
     * @openapi
     * /api/associations/mine:
     *  get:
     *    tags:
     *      - Associations
     *    description: Fetches the currently logged in member's association.
     *    parameters:
     *      - $ref: '#/components/parameters/projectionParam'
     *    responses:
     *      200:
     *        description: The association is fetched.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Association'
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
      '/mine',
      auth,
      asyncErrorHandler((req, res) => controller.getMyAssociation(req, res)),
    )

    /**
     * @openapi
     * /api/associations/{id}:
     *  get:
     *    tags:
     *      - Associations
     *    security: []
     *    description: |
     *      Fetches the association based on the given id.
     *
     *      **Authentication is not required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the association.
     *      - $ref: '#/components/parameters/projectionParam'
     *    responses:
     *      200:
     *        description: The association is fetched.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Association'
     *      400:
     *        $ref: '#/components/responses/InvalidObjectId'
     *      404:
     *        $ref: '#/components/responses/NotFound'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/:id',
      validateObjectId,
      asyncErrorHandler((req, res) => controller.getAssociationById(req, res)),
    )
  }
}
