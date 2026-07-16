import express from 'express';
import {
  getMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDailyStats,
  toggleAvailability
} from './menu.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();


router.use(verifyToken);

router.get('/daily-stats', getDailyStats);

router.get('/', getMenu);

router.post('/', addMenuItem);

router.put('/:id', updateMenuItem);

router.delete('/:id', deleteMenuItem);

router.patch('/:id/availability', toggleAvailability);

export default router;
