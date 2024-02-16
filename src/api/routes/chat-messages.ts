import { Controller } from '../../base/controller'
import { RoutesProvider } from '../../base/routes-provider'
import asyncErrorHandler from '../../middlewares/async-error-handler'
import auth from '../../middlewares/auth'
import { ChatMessageController } from '../controllers/chat-message'

export class ChatMessageRoutes extends RoutesProvider {
  constructor(chatMessageController: ChatMessageController) {
    super(chatMessageController)
  }

  override get prefix() {
    return 'chats'
  }

  protected initializeRoutes(controller: ChatMessageController): void {
    /**
     * @openapi
     * /api/chats:
     *  get:
     *    tags:
     *      - Chats
     *    description: |
     *      Fetches the previously sent chat messages of the logged in member's association.
     *
     *      **Authentication is required** before using this endpoint.
     *    parameters:
     *      - $ref: '#/components/parameters/offsetParam'
     *      - $ref: '#/components/parameters/limitParam'
     *    responses:
     *      200:
     *        description: Chat messages fetched successfully.
     *        content:
     *          application/json:
     *            schema:
     *                $ref: '#/components/schemas/ChatItems'
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
      asyncErrorHandler((req, res) => controller.getChatMessages(req, res)),
    )
  }
}
