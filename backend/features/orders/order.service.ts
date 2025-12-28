import { supabase } from '../../config/supabase';
import { randomUUID } from 'crypto';
import type { 
  Order, 
  OrderItem, 
  CreateOrderRequest, 
  UpdateOrderItemsRequest, 
  OrderHistoryFilters,
  DbOrder 
} from './order.types';

/**
 * OrderService - Lógica de negocio para Órdenes
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 * Mantiene las queries optimizadas con Resource Embedding
 */

/**
 * Transforma datos de BD al formato del frontend
 */
const transformDbOrderToOrder = (dbOrder: DbOrder): Order => ({
  id: dbOrder.id,
  timestamp: dbOrder.timestamp,
  status: dbOrder.status as Order['status'],
  tableNumber: dbOrder.table_number,
  orderType: dbOrder.order_type || 'Dine-In',
  customerName: dbOrder.customer_name,
  items: (dbOrder.order_items || []).map(item => ({
    menuItemId: item.menu_item_id,
    menuItemName: item.menu_item_name,
    price: item.price,
    quantity: item.quantity,
    notes: item.notes
  }))
});

/**
 * Obtiene todas las órdenes (sin filtros)
 * ✅ Usa Resource Embedding - O(1) query
 */
export const getAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        menu_item_id,
        menu_item_name,
        price,
        quantity,
        notes
      )
    `)
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Error fetching orders: ${error.message}`);
  }

  return (data || []).map(transformDbOrderToOrder);
};

/**
 * Obtiene órdenes filtradas por estado (solo del día actual)
 * ✅ Usa Resource Embedding - O(1) query
 */
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = startOfDay.getTime();

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        menu_item_id,
        menu_item_name,
        price,
        quantity,
        notes
      )
    `)
    .gte('timestamp', startTimestamp)
    .order('timestamp', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching orders by status: ${error.message}`);
  }

  return (data || []).map(transformDbOrderToOrder);
};

/**
 * Crea una nueva orden con sus items
 */
export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  const { items, tableNumber, orderType = 'Dine-In', customerName } = orderData;

  // Validaciones
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items requeridos');
  }

  if (orderType === 'Dine-In' && !tableNumber) {
    throw new Error('El número de mesa es obligatorio para órdenes Dine-In');
  }

  // Validar cada item
  for (const item of items) {
    if (!item.menuItemId || !item.menuItemName || item.price === undefined || item.quantity === undefined) {
      throw new Error('Each order item must have menuItemId, menuItemName, price, and quantity');
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new Error('Price must be a positive number');
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error('Quantity must be a positive integer');
    }
  }

  const timestamp = Date.now();
  const orderId = `ORD-${timestamp.toString().slice(-6)}`;

  // Insertar orden
  const { data: orderDbData, error: orderError } = await supabase
    .from('orders')
    .insert([{
      id: orderId,
      timestamp,
      status: 'Pendiente',
      table_number: orderType === 'Dine-In' ? tableNumber : null,
      order_type: orderType,
      customer_name: orderType === 'Takeaway' ? customerName : null
    }])
    .select()
    .single();

  if (orderError) {
    throw new Error(`Error creating order: ${orderError.message}`);
  }

  // Insertar items
  const orderItems = items.map((item) => {
    const isCustomItem = item.menuItemId && item.menuItemId.toString().startsWith('CUSTOM-');
    
    return {
      order_id: orderId,
      menu_item_id: isCustomItem ? randomUUID() : item.menuItemId,
      menu_item_name: item.menuItemName,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null
    };
  });

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    throw new Error(`Error creating order items: ${itemsError.message}`);
  }

  // Retornar orden creada
  return {
    id: orderId,
    timestamp,
    status: 'Pendiente',
    orderType,
    tableNumber: orderType === 'Dine-In' ? tableNumber || null : null,
    customerName: orderType === 'Takeaway' ? customerName || null : null,
    items
  };
};

/**
 * Actualiza el estado de una orden
 * ✅ Usa Resource Embedding - O(1) query
 */
export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<Order> => {
  const validStatuses = ['Pendiente', 'Listo', 'Entregado'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const timestamp = Date.now();

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, timestamp })
    .eq('id', orderId)
    .select(`
      *,
      order_items (
        id,
        menu_item_id,
        menu_item_name,
        price,
        quantity,
        notes
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error updating order status: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order not found');
  }

  return transformDbOrderToOrder(data);
};

/**
 * Actualiza los items de una orden
 * ✅ Usa Resource Embedding - O(1) query
 */
export const updateOrderItems = async (orderId: string, itemsData: UpdateOrderItemsRequest): Promise<Order> => {
  const { items } = itemsData;

  // Validaciones
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items requeridos');
  }

  // Verificar que la orden existe y no está pagada
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    throw new Error('Orden no encontrada');
  }

  if (orderData.status === 'Pagado') {
    throw new Error('No se puede editar una orden ya pagada');
  }

  // Validar cada item
  for (const item of items) {
    if (!item.menuItemId || !item.menuItemName || item.price === undefined || item.quantity === undefined) {
      throw new Error('Cada item debe tener menuItemId, menuItemName, price y quantity');
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new Error('El precio debe ser un número positivo');
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error('La cantidad debe ser un entero positivo');
    }
  }

  // Eliminar items actuales
  const { error: deleteError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (deleteError) {
    throw new Error(`Error deleting order items: ${deleteError.message}`);
  }

  // Insertar nuevos items
  const orderItems = items.map((item) => {
    const isCustomItem = item.menuItemId && item.menuItemId.toString().startsWith('CUSTOM-');
    
    return {
      order_id: orderId,
      menu_item_id: isCustomItem ? randomUUID() : item.menuItemId,
      menu_item_name: item.menuItemName,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null
    };
  });

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    throw new Error(`Error inserting order items: ${itemsError.message}`);
  }

  // Actualizar timestamp y obtener orden completa con items
  const timestamp = Date.now();
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ timestamp })
    .eq('id', orderId)
    .select(`
      *,
      order_items (
        id,
        menu_item_id,
        menu_item_name,
        price,
        quantity,
        notes
      )
    `)
    .single();

  if (updateError) {
    throw new Error(`Error updating order: ${updateError.message}`);
  }

  return transformDbOrderToOrder(updatedOrder);
};

/**
 * Elimina una orden y sus items
 */
export const deleteOrder = async (orderId: string): Promise<{ message: string }> => {
  // Verificar que la orden existe y su estado
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Orden no encontrada');
  }

  if (order.status === 'Entregado') {
    throw new Error('No se puede eliminar una orden ya entregada');
  }

  // Eliminar items primero (foreign key constraint)
  const { error: deleteItemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (deleteItemsError) {
    throw new Error(`Error deleting order items: ${deleteItemsError.message}`);
  }

  // Eliminar orden
  const { error: deleteOrderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (deleteOrderError) {
    throw new Error(`Error deleting order: ${deleteOrderError.message}`);
  }

  return { message: 'Orden eliminada exitosamente' };
};

/**
 * Obtiene el historial de órdenes (días anteriores)
 * ✅ Usa Resource Embedding - O(1) query
 */
export const getOrderHistory = async (filters: OrderHistoryFilters): Promise<Order[]> => {
  const { startDate, endDate, status } = filters;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startTimestamp = startOfToday.getTime();

  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        menu_item_id,
        menu_item_name,
        price,
        quantity,
        notes
      )
    `)
    .lt('timestamp', startTimestamp)
    .order('timestamp', { ascending: false });

  // Filtros opcionales
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    query = query.gte('timestamp', start.getTime());
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte('timestamp', end.getTime());
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching order history: ${error.message}`);
  }

  return (data || []).map(transformDbOrderToOrder);
};
