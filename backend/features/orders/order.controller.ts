import { Request, Response } from 'express';
import * as OrderService from './order.service';
import type { CreateOrderRequest, UpdateOrderStatusRequest, UpdateOrderItemsRequest } from './order.types';

/**
 * OrderController - Capa HTTP delgada
 * Solo maneja req/res y delega la lógica al Service
 */

/**
 * GET /api/orders
 * Obtiene todas las órdenes
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await OrderService.getAllOrders();
    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: error.message || 'Error fetching orders'
    });
  }
};

/**
 * GET /api/orders/status/:status
 * Obtiene órdenes filtradas por estado (solo del día actual)
 */
export const getOrdersByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;
    const orders = await OrderService.getOrdersByStatus(status);
    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({
      error: error.message || 'Error fetching orders by status'
    });
  }
};

/**
 * POST /api/orders
 * Crea una nueva orden
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderData: CreateOrderRequest = req.body;
    const newOrder = await OrderService.createOrder(orderData);
    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    // Errores de validación (400)
    if (error.message.includes('requerido') || 
        error.message.includes('obligatorio') ||
        error.message.includes('must have') ||
        error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    // Errores del servidor (500)
    res.status(500).json({
      error: error.message || 'Error creating order'
    });
  }
};

/**
 * PUT /api/orders/:id/status
 * Actualiza el estado de una orden
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status }: UpdateOrderStatusRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const updatedOrder = await OrderService.updateOrderStatus(id, status);
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    
    // Not found
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    // Validación
    if (error.message.includes('must be')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({
      error: error.message || 'Error updating order status'
    });
  }
};

/**
 * PUT /api/orders/:id/items
 * Actualiza los items de una orden
 */
export const updateOrderItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const itemsData: UpdateOrderItemsRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const updatedOrder = await OrderService.updateOrderItems(id, itemsData);
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Error updating order items:', error);
    
    // Not found
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    // Validación
    if (error.message.includes('requerido') || 
        error.message.includes('debe') ||
        error.message.includes('pagada')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({
      error: error.message || 'Error al actualizar los items de la orden'
    });
  }
};

/**
 * DELETE /api/orders/:id
 * Elimina una orden
 */
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Order ID es requerido' });
      return;
    }

    const result = await OrderService.deleteOrder(id);
    res.json(result);
  } catch (error: any) {
    console.error('Error deleting order:', error);
    
    // Not found
    if (error.message.includes('no encontrada')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    // Validación
    if (error.message.includes('entregada')) {
      res.status(400).json({ error: error.message });
      return;
    }
    
    res.status(500).json({
      error: error.message || 'Error eliminando la orden'
    });
  }
};

/**
 * GET /api/orders/history
 * Obtiene el historial de órdenes con paginación
 */
export const getOrderHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, status, page, limit } = req.query;
    
    // Parsear parámetros de paginación con valores por defecto
    const pageNumber = page ? parseInt(page as string, 10) : 1;
    const limitNumber = limit ? parseInt(limit as string, 10) : 20;
    
    // Validar parámetros de paginación
    if (isNaN(pageNumber) || pageNumber < 1) {
      res.status(400).json({ error: 'Page debe ser un número mayor a 0' });
      return;
    }
    
    if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      res.status(400).json({ error: 'Limit debe estar entre 1 y 100' });
      return;
    }
    
    const result = await OrderService.getOrderHistory({
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
      page: pageNumber,
      limit: limitNumber
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      error: error.message || 'Error obteniendo historial de órdenes'
    });
  }
};
