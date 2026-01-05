// backend/controllers/salesController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const createSale = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentMethod, amount, isReceiptIssued } = req.body;

    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Paso 1: Registro de la venta en la tabla 'sales'
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          order_id: orderId,
          payment_method: paymentMethod, // 'Efectivo' o 'Yape'
          total_amount: amount,
          is_receipt_issued: isReceiptIssued || false
        }
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // 2. Actualizar el estado de la orden a 'Pagado'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Pagado' })
      .eq('id', orderId);

    if (updateError) throw updateError;

    res.status(201).json(saleData);
  } catch (error) {
    console.error('Error procesando venta:', error);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
};