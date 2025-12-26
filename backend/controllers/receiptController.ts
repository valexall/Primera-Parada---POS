import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Crea y almacena un recibo en la base de datos
 */
const createReceiptInDB = async (
  saleId: string,
  orderId: string,
  orderNumber: string,
  tableNumber: string | undefined,
  items: any[],
  totalAmount: number,
  paymentMethod: string,
  timestamp: string
) => {
  // Calcular subtotal, IGV (18%) y total
  const subtotal = totalAmount / 1.18;
  const tax = totalAmount - subtotal;

  // Generar número de recibo único basado en la fecha y el ID
  const date = new Date(timestamp);
  const receiptNumber = `R-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${saleId.substring(0, 8).toUpperCase()}`;

  // Insertar el recibo en la base de datos
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      sale_id: saleId,
      receipt_number: receiptNumber,
      order_id: orderId,
      table_number: tableNumber,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(totalAmount.toFixed(2)),
      payment_method: paymentMethod,
      items: items,
      issued_at: timestamp
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    saleId: data.sale_id,
    receiptNumber: data.receipt_number,
    orderId: data.order_id,
    orderNumber,
    tableNumber: data.table_number,
    items,
    subtotal: parseFloat(data.subtotal),
    tax: parseFloat(data.tax),
    total: parseFloat(data.total),
    paymentMethod: data.payment_method,
    timestamp: data.issued_at
  };
};

/**
 * Obtiene los datos completos del recibo para una venta específica
 */
export const getReceipt = async (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;

    if (!saleId) {
      return res.status(400).json({ error: 'ID de venta requerido' });
    }

    // Primero intentar obtener el recibo de la BD
    const { data: existingReceipt, error: receiptError } = await supabase
      .from('receipts')
      .select('*')
      .eq('sale_id', saleId)
      .single();

    // Si ya existe el recibo en la BD, devolverlo
    if (existingReceipt && !receiptError) {
      const receipt = {
        id: existingReceipt.id,
        saleId: existingReceipt.sale_id,
        receiptNumber: existingReceipt.receipt_number,
        orderId: existingReceipt.order_id,
        orderNumber: existingReceipt.order_id,
        tableNumber: existingReceipt.table_number,
        items: existingReceipt.items,
        subtotal: parseFloat(existingReceipt.subtotal),
        tax: parseFloat(existingReceipt.tax),
        total: parseFloat(existingReceipt.total),
        paymentMethod: existingReceipt.payment_method,
        timestamp: existingReceipt.issued_at
      };
      return res.json(receipt);
    }

    // Si no existe, crear uno nuevo
    // Obtener información de la venta
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .select(`
        id,
        order_id,
        total_amount,
        payment_method,
        created_at,
        is_receipt_issued
      `)
      .eq('id', saleId)
      .single();

    if (saleError || !saleData) {
      throw saleError || new Error('Venta no encontrada');
    }

    // Obtener información de la orden
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        timestamp,
        table_number
      `)
      .eq('id', saleData.order_id)
      .single();

    if (orderError) throw orderError;

    // Obtener items de la orden
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', saleData.order_id);

    if (itemsError) throw itemsError;

    const items = (itemsData || []).map((item: any) => ({
      menuItemId: item.menu_item_id,
      menuItemName: item.menu_item_name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      notes: item.notes || ''
    }));

    // Crear y almacenar el recibo
    const receipt = await createReceiptInDB(
      saleData.id,
      saleData.order_id,
      orderData.id,
      orderData.table_number,
      items,
      parseFloat(saleData.total_amount),
      saleData.payment_method,
      saleData.created_at
    );

    // Actualizar el estado de emisión de recibo si aún no estaba marcado
    if (!saleData.is_receipt_issued) {
      await supabase
        .from('sales')
        .update({ is_receipt_issued: true })
        .eq('id', saleId);
    }

    res.json(receipt);
  } catch (error) {
    console.error('[ReceiptController] Error obteniendo recibo:', error);
    res.status(500).json({ error: 'Error al obtener el recibo' });
  }
};

/**
 * Obtiene todos los recibos emitidos (historial)
 */
export const getReceiptHistory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = supabase
      .from('receipts')
      .select('*')
      .order('issued_at', { ascending: false })
      .limit(Number(limit));

    if (startDate && endDate) {
      query = query
        .gte('issued_at', `${startDate}T00:00:00`)
        .lte('issued_at', `${endDate}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatear los datos
    const receipts = (data || []).map((receipt: any) => ({
      id: receipt.id,
      saleId: receipt.sale_id,
      receiptNumber: receipt.receipt_number,
      orderId: receipt.order_id,
      tableNumber: receipt.table_number,
      total: parseFloat(receipt.total),
      paymentMethod: receipt.payment_method,
      timestamp: receipt.issued_at
    }));

    res.json(receipts);
  } catch (error) {
    console.error('[ReceiptController] Error obteniendo historial de recibos:', error);
    res.status(500).json({ error: 'Error al obtener historial de recibos' });
  }
};
