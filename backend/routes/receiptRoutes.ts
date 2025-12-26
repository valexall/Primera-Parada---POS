import express from 'express';
import { getReceipt, getReceiptHistory } from '../controllers/receiptController';

const router = express.Router();

// Obtener un recibo específico por ID de venta
router.get('/:saleId', getReceipt);

// Obtener historial de recibos
router.get('/history/all', getReceiptHistory);

export default router;
