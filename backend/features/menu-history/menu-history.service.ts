import { supabase } from '../../config/supabase';
import { ValidationError, NotFoundError } from '../../middleware/errorHandler';
import type {
  MenuSnapshot,
  TopSellingItem,
  RevenueTrend,
  GenerateSnapshotRequest,
  SnapshotFilters,
  TopSellingFilters,
  RevenueTrendFilters,
  PaginatedResponse,
  CategoryPerformance,
  HourlySalesPattern,
  DayComparison
} from './menu-history.types';

/**
 * MenuHistoryService - Lógica de negocio para Historial de Menú
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 */

/**
 * Genera o actualiza un snapshot del menú para una fecha específica
 */
export const generateSnapshot = async (
  snapshotData: GenerateSnapshotRequest
): Promise<{ message: string; data: MenuSnapshot }> => {
  const { date, notes } = snapshotData;
  const snapshotDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Get all menu items for the snapshot
  const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('*')
    .order('name');

  if (menuError) {
    throw new Error(`Error fetching menu items: ${menuError.message}`);
  }

  // 2. Get all orders for the specified date using timestamp field
  const startOfDay = new Date(`${snapshotDate}T00:00:00`).getTime();
  const endOfDay = new Date(`${snapshotDate}T23:59:59`).getTime();

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('timestamp', startOfDay)
    .lte('timestamp', endOfDay);

  if (ordersError) {
    throw new Error(`Error fetching orders: ${ordersError.message}`);
  }

  // 3. Get all order items for these orders
  const orderIds = orders?.map(o => o.id) || [];
  
  let orderItems: any[] = [];
  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      throw new Error(`Error fetching order items: ${itemsError.message}`);
    }
    orderItems = items || [];
  }

  // 4. Calculate sales statistics per menu item
  const salesStats: any = {};
  let totalItemsSold = 0;

  menuItems?.forEach(item => {
    salesStats[item.id] = {
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity_sold: 0,
      revenue: 0,
      times_ordered: 0
    };
  });

  orderItems.forEach(item => {
    if (salesStats[item.menu_item_id]) {
      salesStats[item.menu_item_id].quantity_sold += item.quantity;
      salesStats[item.menu_item_id].revenue += item.quantity * item.price;
      salesStats[item.menu_item_id].times_ordered += 1;
      totalItemsSold += item.quantity;
    }
  });

  // 5. Calculate aggregated metrics from sales table
  let totalRevenue = 0;
  
  if (orderIds.length > 0) {
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount')
      .in('order_id', orderIds);
    
    if (!salesError && salesData) {
      totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
    }
  }
  
  const totalOrders = orders?.length || 0;

  // Count order types (match schema values)
  const dineInOrders = orders?.filter(o => o.order_type === 'Dine-In').length || 0;
  const takeawayOrders = orders?.filter(o => o.order_type === 'Takeaway').length || 0;

  // Calculate average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Find peak hour (hour with most orders) - use timestamp field
  const hourCounts: { [key: number]: number } = {};
  orders?.forEach(order => {
    const hour = new Date(order.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let peakHour: number | null = null;
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  });

  // 6. Check if snapshot already exists for this date
  const { data: existing } = await supabase
    .from('menu_history')
    .select('id')
    .eq('snapshot_date', snapshotDate)
    .single();

  const snapshotPayload = {
    snapshot_date: snapshotDate,
    menu_items: menuItems,
    sales_stats: Object.values(salesStats),
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    total_items_sold: totalItemsSold,
    dine_in_orders: dineInOrders,
    takeaway_orders: takeawayOrders,
    avg_order_value: avgOrderValue,
    peak_hour: peakHour,
    notes: notes || null
  };

  // Update or insert
  if (existing) {
    const { data, error } = await supabase
      .from('menu_history')
      .update(snapshotPayload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating snapshot: ${error.message}`);
    }
    return { message: 'Snapshot actualizado', data };
  } else {
    const { data, error } = await supabase
      .from('menu_history')
      .insert(snapshotPayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating snapshot: ${error.message}`);
    }
    return { message: 'Snapshot generado', data };
  }
};

/**
 * Obtiene todos los snapshots con paginación y filtros
 */
export const getSnapshots = async (
  filters: SnapshotFilters
): Promise<PaginatedResponse<MenuSnapshot>> => {
  const { page = 1, limit = 10, startDate, endDate } = filters;
  const pageNum = page;
  const limitNum = limit;
  const offset = (pageNum - 1) * limitNum;

  let query = supabase
    .from('menu_history')
    .select('*', { count: 'exact' })
    .order('snapshot_date', { ascending: false });

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('snapshot_date', startDate);
  }
  if (endDate) {
    query = query.lte('snapshot_date', endDate);
  }

  // Apply pagination
  query = query.range(offset, offset + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching snapshots: ${error.message}`);
  }

  return {
    data: data || [],
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil((count || 0) / limitNum)
    }
  };
};

/**
 * Obtiene un snapshot específico por fecha
 */
export const getSnapshotByDate = async (date: string): Promise<MenuSnapshot> => {
  const { data, error } = await supabase
    .from('menu_history')
    .select('*')
    .eq('snapshot_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Snapshot no encontrado');
    }
    throw new Error(`Error fetching snapshot: ${error.message}`);
  }

  return data;
};

/**
 * Elimina un snapshot
 */
export const deleteSnapshot = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('menu_history')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting snapshot: ${error.message}`);
  }
};

/**
 * Obtiene los items más vendidos en un rango de fechas
 */
export const getTopSellingItems = async (
  filters: TopSellingFilters
): Promise<TopSellingItem[]> => {
  const { startDate, endDate, limit = 10 } = filters;
  const limitNum = limit;

  let query = supabase
    .from('menu_history')
    .select('sales_stats');

  if (startDate) {
    query = query.gte('snapshot_date', startDate);
  }
  if (endDate) {
    query = query.lte('snapshot_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching top selling items: ${error.message}`);
  }

  // Aggregate sales across all snapshots
  const aggregated: any = {};

  data?.forEach(snapshot => {
    const stats = snapshot.sales_stats as any[];
    stats.forEach(item => {
      if (!aggregated[item.menu_item_id]) {
        aggregated[item.menu_item_id] = {
          menu_item_id: item.menu_item_id,
          name: item.name,
          total_quantity: 0,
          total_revenue: 0,
          times_ordered: 0
        };
      }
      aggregated[item.menu_item_id].total_quantity += item.quantity_sold;
      aggregated[item.menu_item_id].total_revenue += item.revenue;
      aggregated[item.menu_item_id].times_ordered += item.times_ordered;
    });
  });

  // Sort by total quantity sold and limit
  const topItems = Object.values(aggregated)
    .sort((a: any, b: any) => b.total_quantity - a.total_quantity)
    .slice(0, limitNum);

  return topItems as TopSellingItem[];
};

/**
 * Obtiene tendencias de ventas a lo largo del tiempo
 */
export const getRevenueTrends = async (
  filters: RevenueTrendFilters
): Promise<RevenueTrend[]> => {
  const { startDate, endDate } = filters;

  let query = supabase
    .from('menu_history')
    .select('snapshot_date, total_revenue, total_orders, avg_order_value')
    .order('snapshot_date', { ascending: true });

  if (startDate) {
    query = query.gte('snapshot_date', startDate);
  }
  if (endDate) {
    query = query.lte('snapshot_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching revenue trends: ${error.message}`);
  }

  return data || [];
};

/**
 * Obtiene el rendimiento por categorías de menú
 */
export const getCategoryPerformance = async (
  filters: TopSellingFilters
): Promise<CategoryPerformance[]> => {
  const { startDate, endDate } = filters;

  let query = supabase
    .from('menu_history')
    .select('sales_stats, menu_items, total_revenue');

  if (startDate) {
    query = query.gte('snapshot_date', startDate);
  }
  if (endDate) {
    query = query.lte('snapshot_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching category performance: ${error.message}`);
  }

  // Aggregate by category
  const categoryMap: any = {};
  let totalRevenue = 0;

  data?.forEach(snapshot => {
    totalRevenue += snapshot.total_revenue;
    const stats = snapshot.sales_stats as any[];
    const menuItems = snapshot.menu_items as any[];

    stats.forEach(stat => {
      const menuItem = menuItems.find((item: any) => item.id === stat.menu_item_id);
      if (menuItem) {
        const category = menuItem.category || 'Sin categoría';
        
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            total_quantity: 0,
            total_revenue: 0,
            items_count: 0,
            prices: []
          };
        }

        categoryMap[category].total_quantity += stat.quantity_sold;
        categoryMap[category].total_revenue += stat.revenue;
        categoryMap[category].items_count += 1;
        categoryMap[category].prices.push(stat.price);
      }
    });
  });

  // Calculate averages and percentages
  const categories: CategoryPerformance[] = Object.values(categoryMap).map((cat: any) => ({
    category: cat.category,
    total_quantity: cat.total_quantity,
    total_revenue: cat.total_revenue,
    items_count: cat.items_count,
    avg_price: cat.prices.reduce((sum: number, p: number) => sum + p, 0) / cat.prices.length,
    percentage_of_total: totalRevenue > 0 ? (cat.total_revenue / totalRevenue) * 100 : 0
  }));

  return categories.sort((a, b) => b.total_revenue - a.total_revenue);
};

/**
 * Obtiene patrones de ventas por hora
 */
export const getHourlySalesPattern = async (
  filters: TopSellingFilters
): Promise<HourlySalesPattern[]> => {
  const { startDate, endDate } = filters;

  try {
    // Get orders within date range using timestamp field
    let query = supabase
      .from('orders')
      .select('id, timestamp')
      .in('status', ['Pagado', 'Entregado']);

    if (startDate) {
      const startTimestamp = new Date(`${startDate}T00:00:00`).getTime();
      query = query.gte('timestamp', startTimestamp);
    }
    if (endDate) {
      const endTimestamp = new Date(`${endDate}T23:59:59`).getTime();
      query = query.lte('timestamp', endTimestamp);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders for hourly pattern:', ordersError);
      // Return empty pattern instead of throwing
      return Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        orders_count: 0,
        revenue: 0,
        avg_order_value: 0
      }));
    }

    // Get sales for these orders
    const orderIds = orders?.map(o => o.id) || [];
    let salesData: any[] = [];
    
    if (orderIds.length > 0) {
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('order_id, total_amount')
        .in('order_id', orderIds);
      
      if (!salesError && sales) {
        salesData = sales;
      }
    }

    // Create a map of order_id to sales data
    const salesMap = new Map();
    salesData.forEach(sale => {
      salesMap.set(sale.order_id, parseFloat(sale.total_amount || 0));
    });

    // Group by hour
    const hourlyData: any = {};
    
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = {
        hour: i,
        orders_count: 0,
        revenue: 0
      };
    }

    orders?.forEach((order: any) => {
      const hour = new Date(order.timestamp).getHours();
      hourlyData[hour].orders_count += 1;
      const saleAmount = salesMap.get(order.id) || 0;
      hourlyData[hour].revenue += saleAmount;
    });

    // Calculate averages
    const pattern: HourlySalesPattern[] = Object.values(hourlyData).map((data: any) => ({
      hour: data.hour,
      orders_count: data.orders_count,
      revenue: data.revenue,
      avg_order_value: data.orders_count > 0 ? data.revenue / data.orders_count : 0
    }));

    return pattern;
  } catch (error) {
    console.error('Error in getHourlySalesPattern:', error);
    // Return empty pattern on any error
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders_count: 0,
      revenue: 0,
      avg_order_value: 0
    }));
  }
};

/**
 * Compara dos snapshots (día actual vs día anterior)
 */
export const compareSnapshots = async (
  currentDate: string,
  previousDate?: string
): Promise<DayComparison | null> => {
  // If no previous date provided, calculate it (1 day before)
  let prevDate = previousDate;
  if (!prevDate) {
    const current = new Date(currentDate);
    current.setDate(current.getDate() - 1);
    prevDate = current.toISOString().split('T')[0];
  }

  // Get both snapshots
  const [currentSnapshot, previousSnapshot] = await Promise.all([
    getSnapshotByDate(currentDate).catch(() => null),
    getSnapshotByDate(prevDate).catch(() => null)
  ]);

  if (!currentSnapshot || !previousSnapshot) {
    return null;
  }

  // Calculate changes
  const revenueChange = currentSnapshot.total_revenue - previousSnapshot.total_revenue;
  const revenueChangePercent = previousSnapshot.total_revenue > 0 
    ? (revenueChange / previousSnapshot.total_revenue) * 100 
    : 0;

  const ordersChange = currentSnapshot.total_orders - previousSnapshot.total_orders;
  const ordersChangePercent = previousSnapshot.total_orders > 0
    ? (ordersChange / previousSnapshot.total_orders) * 100
    : 0;

  const itemsSoldChange = currentSnapshot.total_items_sold - previousSnapshot.total_items_sold;
  const itemsSoldChangePercent = previousSnapshot.total_items_sold > 0
    ? (itemsSoldChange / previousSnapshot.total_items_sold) * 100
    : 0;

  return {
    previous_date: prevDate,
    current_date: currentDate,
    revenue_change: revenueChange,
    revenue_change_percent: revenueChangePercent,
    orders_change: ordersChange,
    orders_change_percent: ordersChangePercent,
    items_sold_change: itemsSoldChange,
    items_sold_change_percent: itemsSoldChangePercent
  };
};
