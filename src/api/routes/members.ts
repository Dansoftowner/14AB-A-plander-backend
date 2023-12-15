import { RoutesProvider } from '../../base/routes-provider'
import { ForgottenPasswordDto } from '../../dto/forgotten-password'
import { MemberInviteDto } from '../../dto/member-invite'
import { MemberRegistrationDto } from '../../dto/member-registration'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import president from '../../middlewares/president'
import validate from '../../middlewares/validate'
import validateObjectid, { validateObjectId } from '../../middlewares/validate-objectid'
import { MemberController } from '../controllers/member'
import { ApiError } from '../error/api-error'
import { ApiErrorCode } from '../error/api-error-codes'

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

    /**
     * @openapi
     * /api/members:
     *  post:
     *    tags:
     *      - Members
     *    description: |
     *       Invites a new member to join the association.
     *       - Only presidents have the permission to invite new members.
     *       - The president has to provide **only the email** of the new member, altough he can specify additional information as well.
     *       - Calling this endpoint will trigger a mail to the new member that contains a **registration link**.
     *       - Until the new member accepts the registration link, the data will be stored in an **unregistered** state.
     *
     *       **Authentication is required** before using this endpoint.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/MemberInvite'
     *    responses:
     *      201:
     *        description: Invitation proceeded. Returns the information about the invited member.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Member'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      403:
     *       $ref: '#/components/responses/NotPresident'
     *      422:
     *        $ref: '#/components/responses/EmailReserved'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/members',
      auth,
      president,
      validate(MemberInviteDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.inviteMember(req, res)),
    )

    /**
     * @openapi
     * /api/members/register/{id}/{registrationToken}:
     *  get:
     *    tags:
     *      - Members
     *    security: []
     *    description: |
     *       Basically this endpoint gives back the information that the president who invited
     *       the member has provided through the [`POST /api/members`](#/Members/post_api_members) endpoint.
     *
     *       This endpoint will be **typically called by an invited member who recieved a registration link** through e-mail.
     *
     *       **Authentication is not required** before using this endpoint, since the `registrationToken` identifies the client.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the invited member.
     *      - in: path
     *        name: registrationToken
     *        schema:
     *          type: string
     *          required: true
     *          description: The registration token of the invited member.
     *    responses:
     *      200:
     *        description: Succeeded. Returns the information about the invited member.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Member'
     *      404:
     *        $ref: '#/components/responses/InvalidURL'
     *      422:
     *        $ref: '#/components/responses/UsernameIdNumberReserved'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.get(
      '/members/register/:id/:registrationToken',
      validateObjectId(new ApiError(404, ApiErrorCode.INVALID_URL)),
      asyncErrorHandler((req, res) => controller.getInvitedMember(req, res)),
    )

    /**
     * @openapi
     * /api/members/register/{id}/{registrationToken}:
     *  post:
     *    tags:
     *      - Members
     *    security: []
     *    description: |
     *       An invited member can register through this endpoint.
     *       This endpoint will be **typically called by an invited member who recieved a registration link** through e-mail.
     *
     *       - The invited member can provide personal data and credentials.
     *       - Technically the member is already present in the database, so this endpoint basically **updates** a resource.
     *
     *       **Authentication is not required** before using this endpoint, since the `registrationToken` identifies the client.
     *    parameters:
     *      - in: path
     *        name: id
     *        schema:
     *          type: string
     *          required: true
     *          description: The unique id of the invited member.
     *      - in: path
     *        name: registrationToken
     *        schema:
     *          type: string
     *          required: true
     *          description: The registration token of the invited member.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/MemberRegistration'
     *    responses:
     *      201:
     *        description: Registration proceeded. Returns the information about the registered member.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Member'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      404:
     *        $ref: '#/components/responses/InvalidURL'
     *      422:
     *        $ref: '#/components/responses/UsernameIdNumberReserved'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/members/register/:id/:registrationToken',
      validateObjectId(new ApiError(404, ApiErrorCode.INVALID_URL)),
      validate(MemberRegistrationDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.registerMember(req, res)),
    )

    this.router.post(
      '/members/forgotten-password',
      validate(ForgottenPasswordDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.labelForgottenPassword(req, res)),
    )
  }
}
