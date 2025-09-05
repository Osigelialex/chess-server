import express from 'express';
import GameController from '../controllers/game.controller';
import GameService from '../service/game.service';
import { validateDto } from '../middleware/validation.middleware';
import { CreateGameDto } from '../dto/game.dto';
import { authMiddleware } from '../middleware/auth.middleware';


const router = express.Router();

const gameService = new GameService();
const gameController = new GameController(gameService);

router.post('', authMiddleware, validateDto(CreateGameDto), gameController.createGame);
router.get('/history', authMiddleware, gameController.gameHistory);
router.post('/:gameId/join', authMiddleware, gameController.joinGame);
router.get('/:gameId', authMiddleware, gameController.getGameById);

export default router;
