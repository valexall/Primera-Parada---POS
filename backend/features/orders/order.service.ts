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
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../../middleware/errorHandler';

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
    id: item.id, // Incluir el ID del item
    menuItemId: item.menu_item_id,
    menuItemName: item.menu_item_name,
    price: item.price,
    quantity: item.quantity,
    notes: item.notes,
    itemStatus: item.item_status || 'Pendiente'
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
        notes,
        item_status
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
        notes,
        item_status
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
 * Obtiene una orden por su ID
 * ✅ Usa Resource Embedding - O(1) query
 */
export const getOrderById = async (id: string): Promise<Order> => {
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
        item_status,
        notes
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching order by id: ${error.message}`);
  }

  if (!data) {
    throw new Error('Order not found');
  }

  return transformDbOrderToOrder(data);
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
        notes,
        item_status
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
 * ✅ OPTIMIZADO: Usa UPSERT inteligente en lugar de DELETE+INSERT
 * Preserva IDs existentes, actualiza modificados, inserta nuevos, elimina removidos
 */
export const updateOrderItems = async (orderId: string, itemsData: UpdateOrderItemsRequest): Promise<Order> => {
  const { items } = itemsData;

  // Validaciones
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items requeridos');
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

  // Preparar items en formato JSON para el procedimiento almacenado
  const itemsJson = items.map((item) => ({
    id: item.id || null,  // Si tiene ID, se actualiza; si no, se inserta
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    price: item.price,
    quantity: item.quantity,
    notes: item.notes || null,
    itemStatus: item.itemStatus || 'Pendiente'
  }));

  // ✅ Llamar al procedimiento almacenado de UPSERT optimizado
  // Esto reemplaza DELETE + INSERT por operaciones atómicas inteligentes
  const { data, error } = await supabase.rpc('upsert_order_items_optimized', {
    p_order_id: orderId,
    p_items: itemsJson  // ⚠️ NO usar JSON.stringify - Supabase lo maneja automáticamente
  });

  if (error) {
    throw new Error(`Error updating order items: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Order not found after update');
  }

  // Transformar el resultado
  const orderData = data[0];
  return {
    id: orderData.id,
    timestamp: orderData.timestamp,
    status: orderData.status as Order['status'],
    tableNumber: orderData.table_number,
    orderType: orderData.order_type || 'Dine-In',
    customerName: orderData.customer_name,
    items: (orderData.order_items_json || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      itemStatus: item.itemStatus || 'Pendiente'
    }))
  };
};

/**
 * Actualiza el estado de un item individual de una orden
 * ✅ OPTIMIZADO: Usa procedimiento almacenado - 1 query en lugar de 4
 * Lógica inteligente: Si todos los items están "Listos", actualiza la orden a "Listo" automáticamente
 */
export const updateOrderItemStatus = async (
  itemId: string, 
  newItemStatus: 'Pendiente' | 'Listo' | 'Entregado',
  orderId: string
): Promise<Order> => {
  // Validar estado
  const validStatuses: Array<'Pendiente' | 'Listo' | 'Entregado'> = ['Pendiente', 'Listo', 'Entregado'];
  if (!validStatuses.includes(newItemStatus)) {
    throw new Error(`Item status must be one of: ${validStatuses.join(', ')}`);
  }

  // ✅ Llamar al procedimiento almacenado optimizado
  // Esto reemplaza 4 queries secuenciales por 1 sola transacción atómica
  const { data, error } = await supabase.rpc('update_order_item_status_optimized', {
    p_item_id: itemId,
    p_new_status: newItemStatus,
    p_order_id: orderId
  });

  if (error) {
    throw new Error(`Error updating item status: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Order not found after update');
  }

  // Transformar el resultado del procedimiento almacenado
  const orderData = data[0];
  return {
    id: orderData.id,
    timestamp: orderData.timestamp,
    status: orderData.status as Order['status'],
    tableNumber: orderData.table_number,
    orderType: orderData.order_type || 'Dine-In',
    customerName: orderData.customer_name,
    items: (orderData.order_items_json || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes,
      itemStatus: item.itemStatus || 'Pendiente'
    }))
  };
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
 * Obtiene el historial de órdenes (días anteriores) con paginación
 * ✅ Usa Resource Embedding - O(1) query
 * ✅ Implementa paginación del lado del servidor
 */
export const getOrderHistory = async (filters: OrderHistoryFilters): Promise<import('./order.types').PaginatedResponse<Order>> => {
  const { startDate, endDate, status, page = 1, limit = 20 } = filters;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startTimestamp = startOfToday.getTime();

  // Calcular rango para paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;

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
    `, { count: 'exact' })  // Habilitar conteo total
    .lt('timestamp', startTimestamp)
    .order('timestamp', { ascending: false })
    .range(from, to);  // Aplicar paginación

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

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching order history: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (data || []).map(transformDbOrderToOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
};
