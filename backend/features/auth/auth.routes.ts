import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  register,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  toggleUserStatus,
  deleteUser
} from './auth.controller';
import { verifyToken, verifyAdmin } from '../../middleware/authMiddleware';

const router = express.Router();


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Demasiados intentos de login',
    message: 'Por seguridad, tu IP ha sido bloqueada temporalmente. Intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiados intentos de registro',
    message: 'Intenta nuevamente en 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


router.post('/login', loginLimiter, login);


router.post('/register', registerLimiter, register);


router.get('/users', verifyToken, verifyAdmin, getAllUsers);


router.get('/users/:id', verifyToken, verifyAdmin, getUserById);

router.put('/users/:id', verifyToken, verifyAdmin, updateUser);

router.put('/users/:id/password', verifyToken, verifyAdmin, updateUserPassword);

router.patch('/users/:id/status', verifyToken, verifyAdmin, toggleUserStatus);

router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);

export default router;
