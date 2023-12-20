import { RoutesProvider } from '../../base/routes-provider'
import { ForgottenPasswordDto, NewPasswordDto } from '../../dto/forgotten-password'
import { MemberInviteDto } from '../../dto/member-invite'
import { MemberRegistrationDto } from '../../dto/member-registration'
import { MemberUpdateDto } from '../../dto/member-update'
import { NewCredentialsDto } from '../../dto/new-credentials'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import password from '../../middlewares/password'
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
     *              $ref: '#/components/schemas/MemberWithAssociation'
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
     *      200:
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

    /**
     * @openapi
     * /api/members/forgotten-password:
     *  post:
     *    tags:
     *      - Members
     *    security: []
     *    description: |
     *       A member who forgot his password can restore his password via this endpoint.
     *
     *       - The member has to provide the **association** where he is registered and the **email address associated with his account**.
     *       - Calling this endpoint **triggers an email** to the provided address that contains a **restoration link**.
     *
     *       **Authentication is not required** before using this endpoint.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/ForgottenPassword'
     *    responses:
     *      202:
     *        description: >
     *            Succeeded. If the given email address is associated with an account
     *            in the particular association, the restoration email is triggered.
     *            **No content returned.**
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      422:
     *        $ref: '#/components/responses/EmailNotFound'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/members/forgotten-password',
      validate(ForgottenPasswordDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.labelForgottenPassword(req, res)),
    )

    /**
     * @openapi
     * /api/members/forgotten-password/{id}/{restorationToken}:
     *  post:
     *    tags:
     *      - Members
     *    security: []
     *    description: |
     *       A member who forgot his password and requested a restoration through the [`/api/members/forgotten-password`](#/Members/post_api_members_forgotten_password) endpoint
     *       can define a new password via this endpoint.
     *       This endpoint will be **typically called by a member who recieved a restoration link** through e-mail.
     *
     *       **Authentication is not required** before using this endpoint, since the `restorationToken` identifies the client.
     *    parameters:
     *      - in: path
     *        name: id
     *        description: The unique id of the member who forgot his password.
     *        schema:
     *          type: string
     *          required: true
     *      - in: path
     *        name: restorationToken
     *        description: The restoration token of the member who forgot his password.
     *        schema:
     *          type: string
     *          required: true
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/NewPassword'
     *    responses:
     *      204:
     *        description: Restoration proceeded. **No content returned.**
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      404:
     *        $ref: '#/components/responses/InvalidURL'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.post(
      '/members/forgotten-password/:id/:restorationToken',
      validateObjectId(new ApiError(404, ApiErrorCode.INVALID_URL)),
      validate(NewPasswordDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.restorePassword(req, res)),
    )

    /**
     * @openapi
     * /api/members/credentials/mine:
     *  patch:
     *    tags:
     *     - Members
     *    description: |
     *      A member can update his credentials (username and/or password) via this endpoint.
     *      Either username or password has to be provided.
     *
     *      **Authentication is required** before using this endpoint.
     *      Also, because it is a sensitive operation, the **current password** of the
     *      member **must be passed through the `x-current-pass` header**.
     *    parameters:
     *      - in: header
     *        name: x-current-pass
     *        description: The current password of the member.
     *        schema:
     *          type: string
     *          required: true
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/NewCredentials'
     *    responses:
     *      204:
     *        description: Update proceeded. **No content returned.**
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      422:
     *        $ref: '#/components/responses/UsernameReserved'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.patch(
      '/members/credentials/mine',
      auth,
      password,
      validate(NewCredentialsDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.updateCredentials(req, res)),
    )

    /**
     * @openapi
     * /api/members/me:
     *  patch:
     *    tags:
     *     - Members
     *    description: |
     *      A member can update his information via this endpoint.
     *
     *      **Authentication is required** before using this endpoint.
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/MemberUpdate'
     *    responses:
     *      200:
     *        description: Update proceeded. Returns the updated member.
     *        content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Member'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      404:
     *        description: This only occurs if the member is deleted from the database, but the token is still valid.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Error'
     *      409:
     *        $ref: '#/components/responses/IdNumberReserved'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.patch(
      '/members/me',
      auth,
      validate(MemberUpdateDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.updateMe(req, res)),
    )

    /**
     * @openapi
     * /api/members/{id}:
     *  patch:
     *    tags:
     *     - Members
     *    description: |
     *      A president can update the unregistered members' data in the association through this endpoint.
     *
     *      - **If the id is the same as the client's id that's like calling the [`PATCH /api/members/me`](#/Members/patch_api_members_me) endpoint.**
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - in: path
     *        name: id
     *        description: The id of the member that the president wants to update.
     *        schema:
     *          type: string
     *          required: true
     *    requestBody:
     *      required: true
     *      content:
     *       application/json:
     *        schema:
     *         $ref: '#/components/schemas/MemberUpdate'
     *    responses:
     *      200:
     *        description: Update proceeded. Returns the updated member.
     *        content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Member'
     *      400:
     *        $ref: '#/components/responses/InvalidPayload'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      404:
     *        $ref: '#/components/responses/NotFound'
     *      409:
     *        $ref: '#/components/responses/IdNumberReserved'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.patch(
      '/members/:id',
      auth,
      validateObjectId(new ApiError(404, ApiErrorCode.MISSING_RESOURCE)),
      validate(MemberUpdateDto.validationSchema()),
      asyncErrorHandler((req, res) => controller.updateMember(req, res)),
    )

    /**
     * @openapi
     * /api/members/{id}:
     *  delete:
     *    tags:
     *     - Members
     *    description: |
     *      Can be used to delete members from the given association.
     *
     *      - Only **presidents are permitted** to use this endpoint
     *      - Only **regular members** can be deleted
     *      - If a president **wants to remove himself** (by passing it's own id), that's only possible **if there are other presidents** present in the association.
     *
     *      **Authentication is required** before using this endpoint.
     *      Also, because it is a sensitive operation, the **current password** of the
     *      member **must be passed through the `x-current-pass` header**.
     *    parameters:
     *      - in: header
     *        name: x-current-pass
     *        description: The current password of the member.
     *        schema:
     *          type: string
     *          required: true
     *      - in: path
     *        name: id
     *        description: The id of the member that the president wants to delete.
     *        schema:
     *          type: string
     *          required: true
     *    responses:
     *      200:
     *        description: Deletion proceeded. The details of the deleted member are returned.
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/Member'
     *      400:
     *        $ref: '#/components/responses/InvalidToken'
     *      401:
     *        $ref: '#/components/responses/Unauthorized'
     *      403:
     *        $ref: '#/components/responses/PresidentDeletion'
     *      404:
     *        $ref: '#/components/responses/NotFound'
     *      422:
     *        $ref: '#/components/responses/NoOtherPresidents'
     *      429:
     *        $ref: '#/components/responses/SurpassedRateLimit'
     *      5XX:
     *        $ref: '#/components/responses/InternalServerError'
     */
    this.router.delete(
      '/members/:id',
      auth,
      president,
      password,
      validateObjectId(new ApiError(404, ApiErrorCode.MISSING_RESOURCE)),
      asyncErrorHandler((req, res) => controller.deleteMember(req, res)),
    )
  }
}
