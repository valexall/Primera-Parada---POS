import express from 'express';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';
const router = express.Router();
router.get('/', getMenu);
router.post('/', addMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);
export default router;