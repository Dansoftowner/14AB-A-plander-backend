import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middleware/async-error-handler'
import AssociationController from './association-controller'

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
     *      - in: query
     *        name: offset
     *        schema:
     *          type: integer
     *          minimum: 0
     *          default: 0
     *        description: The number of items to skip before starting to collect the result set.
     *      - in: query
     *        name: limit
     *        schema:
     *          type: integer
     *          minimum: 0
     *          default: 10
     *        description: The maximum number of items to return.
     *      - in: query
     *        name: projection
     *        schema:
     *          type: string
     *          enum: ['lite', 'full']
     *          default: 'lite'
     *        description: Specifies the projection mode.
     *      - in: query
     *        name: orderBy
     *        type: string
     *        default: name
     *        description: Specifies the attribute used to sort the items.
     *      - in: query
     *        name: q
     *        type: string
     *        description: Performs a search based on the given value (searches in the assocation names).
     *    responses:
     *      200:
     *        description: Associations fetched successfully.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/AssociationItems'
     */
    this.router.get(
      '/associations',
      asyncErrorHandler((req, res) => controller.getAssociations(req, res)),
    )
  }
}
