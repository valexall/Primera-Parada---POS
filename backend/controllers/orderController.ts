import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
export const getOrders = async (req: Request, res: Response) => {
  try {
    const {
      data: ordersData,
      error: ordersError
    } = await supabase.from('orders').select('*').order('timestamp', {
      ascending: false
    });
    if (ordersError) throw ordersError;
    const ordersWithItems = await Promise.all((ordersData || []).map(async order => {
      const {
        data: itemsData,
        error: itemsError
      } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      if (itemsError) throw itemsError;
      return {
        id: order.id,
        timestamp: order.timestamp,
        status: order.status,
        tableNumber: order.table_number,
        items: (itemsData || []).map(item => ({
          menuItemId: item.menu_item_id,
          menuItemName: item.menu_item_name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes
        }))
      };
    }));
    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Error fetching orders'
    });
  }
};
export const getOrdersByStatus = async (req: Request, res: Response) => {
  try {
    const {
      status
    } = req.params;
    let query = supabase.from('orders').select('*').order('timestamp', {
      ascending: false
    });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    const {
      data: ordersData,
      error: ordersError
    } = await query;
    if (ordersError) throw ordersError;
    const ordersWithItems = await Promise.all((ordersData || []).map(async order => {
      const {
        data: itemsData,
        error: itemsError
      } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      if (itemsError) throw itemsError;
      return {
        id: order.id,
        timestamp: order.timestamp,
        status: order.status,
        tableNumber: order.table_number,
        items: (itemsData || []).map(item => ({
          menuItemId: item.menu_item_id,
          menuItemName: item.menu_item_name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes
        }))
      };
    }));
    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({
      error: 'Error fetching orders by status'
    });
  }
};
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, tableNumber, orderType = 'Dine-In', customerName } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items requeridos' });
    }
    
    // Validar según el tipo de orden
    if (orderType === 'Dine-In' && !tableNumber) {
      return res.status(400).json({ error: 'El número de mesa es obligatorio para órdenes Dine-In' });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.menuItemId || !item.menuItemName || item.price === undefined || item.quantity === undefined) {
        return res.status(400).json({
          error: 'Each order item must have menuItemId, menuItemName, price, and quantity'
        });
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        return res.status(400).json({
          error: 'Price must be a positive number'
        });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({
          error: 'Quantity must be a positive integer'
        });
      }
    }
    const timestamp = Date.now();
    const orderId = `ORD-${timestamp.toString().slice(-6)}`;
    // Insert order
    const { data: orderData, error: orderError } = await supabase
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
    if (orderError) throw orderError;
    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      menu_item_id: item.menuItemId,
      menu_item_name: item.menuItemName,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null
    }));
    const {
      error: itemsError
    } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;
    res.status(201).json({
      id: orderId,
      timestamp,
      status: 'Pendiente',
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber : undefined,
      customerName: orderType === 'Takeaway' ? customerName : undefined,
      items
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Error creating order'
    });
  }
};
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const {
      id
    } = req.params;
    const {
      status
    } = req.body;
    if (!id) {
      return res.status(400).json({
        error: 'Order ID is required'
      });
    }
    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }
    const validStatuses = ['Pendiente', 'Listo', 'Entregado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    const timestamp = Date.now();
    const {
      data,
      error
    } = await supabase.from('orders').update({
      status,
      timestamp
    }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }
    // Fetch order items
    const {
      data: itemsData,
      error: itemsError
    } = await supabase.from('order_items').select('*').eq('order_id', id);
    if (itemsError) throw itemsError;
    res.json({
      id: data.id,
      timestamp: data.timestamp,
      status: data.status,
      orderType: data.order_type || 'Dine-In',
      tableNumber: data.table_number,
      customerName: data.customer_name,
      items: (itemsData || []).map(item => ({
        menuItemId: item.menu_item_id,
        menuItemName: item.menu_item_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes
      }))
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Error updating order status'
    });
  }
};

export const updateOrderItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items requeridos' });
    }

    // Validar que la orden existe y no está pagada
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !orderData) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (orderData.status === 'Pagado') {
      return res.status(400).json({ error: 'No se puede editar una orden ya pagada' });
    }

    // Validar cada item
    for (const item of items) {
      if (!item.menuItemId || !item.menuItemName || item.price === undefined || item.quantity === undefined) {
        return res.status(400).json({
          error: 'Cada item debe tener menuItemId, menuItemName, price y quantity'
        });
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        return res.status(400).json({
          error: 'El precio debe ser un número positivo'
        });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({
          error: 'La cantidad debe ser un entero positivo'
        });
      }
    }

    // Eliminar todos los items actuales de la orden
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (deleteError) throw deleteError;

    // Insertar los nuevos items
    const orderItems = items.map((item: any) => ({
      order_id: id,
      menu_item_id: item.menuItemId,
      menu_item_name: item.menuItemName,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Actualizar timestamp de la orden
    const timestamp = Date.now();
    const { error: updateError } = await supabase
      .from('orders')
      .update({ timestamp })
      .eq('id', id);

    if (updateError) throw updateError;

    // Retornar la orden actualizada
    const { data: updatedItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    res.json({
      id,
      timestamp,
      status: orderData.status,
      tableNumber: orderData.table_number,
      items: (updatedItems || []).map(item => ({
        menuItemId: item.menu_item_id,
        menuItemName: item.menu_item_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes
      }))
    });
  } catch (error) {
    console.error('Error updating order items:', error);
    res.status(500).json({
      error: 'Error al actualizar los items de la orden'
    });
  }
};