import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import { MemberController } from '../controllers/member'

export class MemberRoutes extends RoutesProvider {
  constructor({ memberController }) {
    super(memberController)
  }

  override initializeRoutes(controller: MemberController) {
    /**
     * @openapi
     * /api/members:
     *  get:
     *    tags:
     *      - Members
     *    description: |
     *      Fetches the members who are in the same association as the currently logged in member.
     *
     *      The visibility of certain attributes depends on the role of the currently logged in member.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - $ref: '#/components/parameters/offsetParam'
     *      - $ref: '#/components/parameters/limitParam'
     *      - $ref: '#/components/parameters/projectionParam'
     *      - $ref: '#/components/parameters/sortParam'
     *      - $ref: '#/components/parameters/searchQueryParam'
     *    responses:
     *      200:
     *        description: Members fetched successfully.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/MemberItems'
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
      '/members',
      auth,
      asyncErrorHandler((req, res) => controller.getMembers(req, res)),
    )
  }
}
