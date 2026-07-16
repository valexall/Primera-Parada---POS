import express from 'express';
import {
  generateSnapshot,
  getSnapshots,
  getSnapshotByDate,
  deleteSnapshot,
  getTopSellingItems,
  getRevenueTrends,
  getCategoryPerformance,
  getHourlySalesPattern,
  compareSnapshots
} from './menu-history.controller';
import { verifyToken } from '../../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);

router.post('/snapshot', generateSnapshot);

router.get('/', getSnapshots);

router.get('/snapshots', getSnapshots);

router.get('/analytics/top-selling', getTopSellingItems);

router.get('/analytics/revenue-trends', getRevenueTrends);

router.get('/analytics/category-performance', getCategoryPerformance);

router.get('/analytics/hourly-pattern', getHourlySalesPattern);

router.get('/compare/:currentDate', compareSnapshots);

router.get('/date/:date', getSnapshotByDate);

router.delete('/snapshots/:id', deleteSnapshot);

export default router;
