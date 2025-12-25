// backend/controllers/salesController.ts
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

interface CreateSaleBody {
  orderId: string;
  paymentMethod: string;
  amount: number;
  isReceiptIssued?: boolean;
}

export const getSalesHistory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('sales')
      .select(`
        *,
        orders (
          id,
          timestamp,
          order_items (
            menu_item_name,
            quantity
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching sales history:', error);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      paymentMethod,
      amount,
      isReceiptIssued = false
    } = req.body as CreateSaleBody;

    // Validación de datos obligatorios
    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Registrar la venta
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        order_id: orderId,
        payment_method: paymentMethod,
        total_amount: amount,
        is_receipt_issued: isReceiptIssued
      })
      .select()
      .single();

    if (saleError) {
      throw saleError;
    }

    // Actualizar estado de la orden
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ status: 'Pagado' })
      .eq('id', orderId);

    if (orderUpdateError) {
      throw orderUpdateError;
    }

    return res.status(201).json(saleData);
  } catch (error) {
    console.error('[SalesController] Error procesando venta:', error);
    return res.status(500).json({ error: 'Error al registrar la venta' });
  }
};
