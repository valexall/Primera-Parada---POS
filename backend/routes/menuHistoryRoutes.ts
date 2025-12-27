import { Router } from 'express';
import { 
  generateSnapshot, 
  getSnapshots, 
  getSnapshotByDate, 
  deleteSnapshot,
  getTopSellingItems,
  getRevenueTrends
} from '../controllers/menuHistoryController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Generate or update snapshot for a date
router.post('/generate', generateSnapshot);

// Get all snapshots with pagination and filters
router.get('/', getSnapshots);

// Get specific snapshot by date
router.get('/date/:date', getSnapshotByDate);

// Delete a snapshot
router.delete('/:id', deleteSnapshot);

// Analytics endpoints
router.get('/analytics/top-selling', getTopSellingItems);
router.get('/analytics/revenue-trends', getRevenueTrends);

export default router;
