import express from 'express';
import AuthController from '../controllers/auth.controller';
import AuthService from '../service/auth.service';
import { validateDto } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { SignupDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

const router = express.Router();

// dependencies
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/signup', validateDto(SignupDto), authController.signup);
router.post('/login', validateDto(LoginDto), authController.login);
router.post('/refresh', validateDto(RefreshTokenDto), authController.refresh);
router.get('/profile', authMiddleware, authController.fetchProfile);
router.post('/logout', authMiddleware, authController.logout);

export default router;
