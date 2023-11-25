import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import validateObjectId from '../../middlewares/validate-objectid'
import AssociationController from '../controllers/association'

export default class AssocationRoutes extends RoutesProvider {
  constructor({ associationController }) {
    super(associationController)
  }

  protected initializeRoutes(controller: AssociationController) {
    /**
     * @openapi
     * /api/associations:
     *  get:
     *    tags:
     *      - Associations
     *    description: Fetches the registered associations.
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
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/associations',
      asyncErrorHandler((req, res) => controller.getAssociations(req, res)),
    )

    /**
     * @openapi
     * /api/associations/{id}:
     *  get:
     *    tags:
     *      - Associations
     *    description: Fetches the association based on the given id.
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
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/associations/:id',
      validateObjectId,
      asyncErrorHandler((req, res) => controller.getAssociationById(req, res)),
    )
  }
}
