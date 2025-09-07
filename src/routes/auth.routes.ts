import express from 'express';
import AuthController from '../controllers/auth.controller';
import AuthService from '../service/auth.service';
import { validateDto } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { SignupDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

const router = express.Router();
const authService = new AuthService();
const authController = new AuthController(authService);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Signup a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupDTO'
 *     responses:
 *       201:
 *         description: Signed up successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponseDataDTO'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/signup', validateDto(SignupDto), authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDTO'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TokenResponseDataDTO'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', validateDto(LoginDto), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh a token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenDTO'
 *     responses:
 *       200:
 *         description: "Token refreshed successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RefreshTokenResponseDTO'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh', validateDto(RefreshTokenDto), authController.refresh);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Fetch user profile
 *     security:
 *        - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserResponseDTO'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/profile', authMiddleware, authController.fetchProfile);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Logout a user
 *     security:
 *        - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenDTO'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logout', authMiddleware, authController.logout);

export default router;
