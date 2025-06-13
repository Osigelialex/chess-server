import express from 'express';
import AuthController from '../controllers/auth.controller';
import AuthService from '../service/auth.service';
import { validateDto } from '../middleware/validation.middleware';
import { SignupDto, LoginDto } from '../dto/auth.dto';

const router = express.Router();

// dependencies
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/signup', validateDto(SignupDto), authController.signup);
router.post('/login', validateDto(LoginDto), authController.login);

export default router;
