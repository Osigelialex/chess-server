import express from 'express';
import GameController from '../controllers/game.controller';
import GameService from '../service/game.service';
import { validateDto } from '../middleware/validation.middleware';
import { CreateGameDto, CreateGuestGameDto } from '../dto/game.dto';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const gameService = new GameService();
const gameController = new GameController(gameService);

/**
 * @swagger
 * /games:
 *   post:
 *     tags:
 *       - Games
 *     summary: Create a new game
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGameDTO'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CreateGameResponseDto'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('', authMiddleware, validateDto(CreateGameDto), gameController.createGame);

/**
 * @swagger
 * /games/guest:
 *   post:
 *     tags:
 *       - Games
 *     summary: Create a new guest game
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGuestGameDTO'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/GuestGameCreatedResponseDTO'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/guest', validateDto(CreateGuestGameDto), gameController.createGuestGame);

/**
 * @swagger
 * /games/history:
 *   get:
 *     tags:
 *       - Games
 *     summary: Get all games played by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The number of items to skip before starting to collect the result set
 *       - in: query
 *         name: limit
 *         schema: 
 *           type: integer
 *         description: The number of items to return
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedResponseDTO'
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RetrieveGameResponseDTO'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMetaDataDTO'
 */
router.get('/history', authMiddleware, gameController.gameHistory);

/**
 * @swagger
 * /games/{gameId}/join:
 *   post:
 *     tags:
 *       - Games
 *     security:
 *       - bearerAuth: []
 *     summary: Join a player to a game
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of game to join
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *                properties:
 *                  data:
 *                    $ref: '#/components/schemas/JoinedGuestGameResponseDTO'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:gameId/join', authMiddleware, gameController.joinGame);

/**
 * @swagger
 * /games/{code}/guest/join:
 *   post:
 *     tags:
 *       - Games
 *     summary: Join a player to a guest game
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: unique code of game to join
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *              schema:
 *                $ref: '#/components/schemas/ApiResponse'
 *       400: 
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:code/guest/join', gameController.joinGuestGame);

/**
 * @swagger
 * /games/{gameId}:
 *   get:
 *     tags:
 *       - Games
 *     security:
 *       - bearerAuth: []
 *     summary: Retrieve game by Id
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Of game to join
 *     responses:
 *       200: 
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RetrieveGameResponseDTO'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:gameId', authMiddleware, gameController.getGameById);

export default router;
