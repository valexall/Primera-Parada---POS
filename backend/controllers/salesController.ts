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

interface PartialSaleBody {
  orderId: string;
  paymentMethod: string;
  isReceiptIssued?: boolean;
  selectedItems: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export const createPartialSale = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      paymentMethod,
      isReceiptIssued = false,
      selectedItems
    } = req.body as PartialSaleBody;

    // Validación de datos obligatorios
    if (!orderId || !paymentMethod || !selectedItems || selectedItems.length === 0) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Obtener la orden original
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Obtener los items de la orden
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      throw itemsError;
    }

    // Calcular el monto de los items seleccionados y validar
    let totalAmount = 0;
    const itemsToRemove: any[] = [];
    const remainingItems: any[] = [];

    for (const item of orderItems || []) {
      const selectedItem = selectedItems.find(
        si => si.menuItemId === item.menu_item_id
      );

      if (selectedItem) {
        if (selectedItem.quantity > item.quantity) {
          return res.status(400).json({ 
            error: `Cantidad inválida para item ${item.menu_item_name}` 
          });
        }

        totalAmount += item.price * selectedItem.quantity;

        if (selectedItem.quantity === item.quantity) {
          // Marcar para eliminar completamente
          itemsToRemove.push(item.id);
        } else {
          // Actualizar cantidad restante
          remainingItems.push({
            id: item.id,
            newQuantity: item.quantity - selectedItem.quantity
          });
        }
      }
    }

    // Crear un nuevo ID para la venta parcial
    const timestamp = Date.now();
    const partialOrderId = `${orderId}-P${timestamp.toString().slice(-6)}`;

    // Crear una nueva orden para la venta parcial (para mantener historial)
    const { data: partialOrderData, error: partialOrderError } = await supabase
      .from('orders')
      .insert([{
        id: partialOrderId,
        timestamp,
        status: 'Pagado',
        table_number: orderData.table_number
      }])
      .select()
      .single();

    if (partialOrderError) {
      throw partialOrderError;
    }

    // Copiar los items seleccionados a la nueva orden
    const partialOrderItems = selectedItems.map(si => {
      const originalItem = orderItems?.find(oi => oi.menu_item_id === si.menuItemId);
      return {
        order_id: partialOrderId,
        menu_item_id: si.menuItemId,
        menu_item_name: originalItem?.menu_item_name || '',
        price: originalItem?.price || 0,
        quantity: si.quantity,
        notes: originalItem?.notes || null
      };
    });

    const { error: insertItemsError } = await supabase
      .from('order_items')
      .insert(partialOrderItems);

    if (insertItemsError) {
      throw insertItemsError;
    }

    // Registrar la venta
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        order_id: partialOrderId,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        is_receipt_issued: isReceiptIssued
      })
      .select()
      .single();

    if (saleError) {
      throw saleError;
    }

    // Actualizar la orden original
    // Eliminar items completamente pagados
    if (itemsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .in('id', itemsToRemove);

      if (deleteError) {
        throw deleteError;
      }
    }

    // Actualizar cantidades de items parcialmente pagados
    for (const item of remainingItems) {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({ quantity: item.newQuantity })
        .eq('id', item.id);

      if (updateError) {
        throw updateError;
      }
    }

    // Verificar si quedan items en la orden original
    const { data: remainingOrderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    // Si no quedan items, marcar la orden original como Pagado
    if (!remainingOrderItems || remainingOrderItems.length === 0) {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: 'Pagado' })
        .eq('id', orderId);

      if (updateOrderError) {
        throw updateOrderError;
      }
    }

    return res.status(201).json({
      ...saleData,
      isPartialPayment: remainingOrderItems && remainingOrderItems.length > 0,
      originalOrderId: orderId,
      partialOrderId
    });
  } catch (error) {
    console.error('[SalesController] Error procesando venta parcial:', error);
    return res.status(500).json({ error: 'Error al registrar la venta parcial' });
  }
};
