import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import validateObjectid from '../../middlewares/validate-objectid'
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
     *      - The visibility of certain attributes depends on the role of the currently logged in member.
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

    /**
     * @openapi
     * /api/members/me:
     *  get:
     *    tags:
     *      - Members
     *    description: |
     *      Fetches the member who is currently logged in.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - $ref: '#/components/parameters/projectionParam'
     *    responses:
     *      200:
     *        description: The member is fetched.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Member'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      400:
     *        $ref: '#/components/responses/InvalidToken'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/members/me',
      auth,
      asyncErrorHandler((req, res) => controller.getMe(req, res)),
    )

    /**
     * @openapi
     * /api/members/{id}:
     *  get:
     *    tags:
     *      - Members
     *    description: |
     *      Fetches the member based on the given *id* from the currently logged in member's association.
     *
     *      - The visibility of certain attributes depends on the role of the currently logged in member.
     *      - But if the member requested **is the same** as the currently logged in one, then the even sensitive attributes can be viewed.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the member.
     *      - $ref: '#/components/parameters/projectionParam'
     *    responses:
     *      200:
     *        description: The member is fetched.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Member'
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
      '/members/:id',
      auth,
      validateObjectid,
      asyncErrorHandler((req, res) => controller.getMemberById(req, res)),
    )

    /**
     * @openapi
     * /api/members/username/{username}:
     *  get:
     *    tags:
     *      - Members
     *    description: |
     *      Fetches the member based on the given *username* from the currently logged in member's association.
     *
     *      - The visibility of certain attributes depends on the role of the currently logged in member.
     *      - But if the member requested **is the same** as the currently logged in one, then the even sensitive attributes can be viewed.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: username
     *        schema:
     *          type: string
     *          required: true
     *          description: The username of the member.
     *      - $ref: '#/components/parameters/projectionParam'
     *    responses:
     *      200:
     *        description: The member is fetched.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/Member'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      400:
     *        $ref: '#/components/responses/InvalidToken'
     *      404:
     *        $ref: '#/components/responses/NotFound'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/members/username/:username',
      auth,
      asyncErrorHandler((req, res) => controller.getMemberByUsername(req, res)),
    )
  }
}
