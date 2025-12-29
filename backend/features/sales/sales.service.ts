import { supabase } from '../../config/supabase';
import type { 
  SaleWithOrder, 
  CreateSaleRequest, 
  CreatePartialSaleRequest,
  SalesHistoryFilters,
  PartialSaleResponse,
  PaginatedResponse
} from './sales.types';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../../middleware/errorHandler';

/**
 * SalesService - Lógica de negocio para Ventas
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 */

/**
 * Obtiene el historial de ventas con filtros opcionales y paginación
 * ✅ Usa Resource Embedding - O(1) query
 * ✅ Server-Side Pagination con .range()
 */
export const getSalesHistory = async (filters: SalesHistoryFilters): Promise<PaginatedResponse<SaleWithOrder>> => {
  const { startDate, endDate, page = 1, limit = 20 } = filters;

  // Calcular rango para paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('sales')
    .select(`
      *,
      orders (
        id,
        timestamp,
        table_number,
        order_type,
        customer_name,
        order_items (
          menu_item_name,
          quantity
        )
      )
    `, { count: 'exact' })  // Habilitar conteo total
    .order('created_at', { ascending: false })
    .range(from, to);  // Aplicar paginación

  // Filtros opcionales de fecha
  if (startDate && endDate) {
    query = query
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching sales history: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};

/**
 * Crea una venta completa
 */
export const createSale = async (saleData: CreateSaleRequest) => {
  const { orderId, paymentMethod, amount, isReceiptIssued = false } = saleData;

  // Validación de datos obligatorios
  if (!orderId || !paymentMethod || !amount) {
    throw new Error('Faltan datos requeridos');
  }

  // Registrar la venta
  const { data: sale, error: saleError } = await supabase
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
    throw new Error(`Error creating sale: ${saleError.message}`);
  }

  // Actualizar estado de la orden
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'Pagado' })
    .eq('id', orderId);

  if (orderUpdateError) {
    throw new Error(`Error updating order status: ${orderUpdateError.message}`);
  }

  return sale;
};

/**
 * Crea una venta parcial (solo algunos items de la orden)
 */
export const createPartialSale = async (
  partialSaleData: CreatePartialSaleRequest
): Promise<PartialSaleResponse> => {
  const {
    orderId,
    paymentMethod,
    isReceiptIssued = false,
    selectedItems
  } = partialSaleData;

  // Validación de datos obligatorios
  if (!orderId || !paymentMethod || !selectedItems || selectedItems.length === 0) {
    throw new Error('Faltan datos requeridos');
  }

  // Obtener la orden original
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    throw new Error('Orden no encontrada');
  }

  // Obtener los items de la orden
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    throw new Error(`Error fetching order items: ${itemsError.message}`);
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
        throw new Error(`Cantidad inválida para item ${item.menu_item_name}`);
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
    throw new Error(`Error creating partial order: ${partialOrderError.message}`);
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
    throw new Error(`Error inserting partial order items: ${insertItemsError.message}`);
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
    throw new Error(`Error creating sale: ${saleError.message}`);
  }

  // Actualizar la orden original
  // Eliminar items completamente pagados
  if (itemsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .in('id', itemsToRemove);

    if (deleteError) {
      throw new Error(`Error removing paid items: ${deleteError.message}`);
    }
  }

  // Actualizar cantidades de items parcialmente pagados
  for (const item of remainingItems) {
    const { error: updateError } = await supabase
      .from('order_items')
      .update({ quantity: item.newQuantity })
      .eq('id', item.id);

    if (updateError) {
      throw new Error(`Error updating item quantity: ${updateError.message}`);
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
      throw new Error(`Error updating order status: ${updateOrderError.message}`);
    }
  }

  return {
    ...saleData,
    isPartialPayment: remainingOrderItems && remainingOrderItems.length > 0,
    originalOrderId: orderId,
    partialOrderId
  };
};
