import { supabase } from '../../config/supabase';
import type { Supply, CreateSupplyRequest, RegisterPurchaseRequest } from './inventory.types';

/**
 * InventoryService - Lógica de negocio para Inventario
 * Todas las funciones retornan datos puros (sin objetos Response de Express)
 */

/**
 * Obtiene lista de insumos ordenada por nombre
 */
export const getSupplies = async (): Promise<Supply[]> => {
  const { data, error } = await supabase
    .from('supplies')
    .select('*')
    .order('name');
  
  if (error) {
    throw new Error(`Error fetching supplies: ${error.message}`);
  }

  return data || [];
};

/**
 * Registra un insumo nuevo
 */
export const createSupply = async (supplyData: CreateSupplyRequest): Promise<Supply> => {
  const { name, unit, min_stock } = supplyData;

  if (!name || !unit || min_stock === undefined) {
    throw new Error('Faltan datos requeridos');
  }

  const { data, error } = await supabase
    .from('supplies')
    .insert([{ name, unit, min_stock, current_stock: 0 }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating supply: ${error.message}`);
  }

  return data;
};

/**
 * Registra una compra (aumenta stock) usando transacción RPC
 * Esto registra automáticamente el gasto asociado
 */
export const registerPurchase = async (purchaseData: RegisterPurchaseRequest): Promise<void> => {
  const { supplyId, quantity, cost, description } = purchaseData;

  if (!supplyId || !quantity || !cost) {
    throw new Error('Faltan datos requeridos');
  }

  // Obtenemos el nombre primero (necesario para el log de gastos)
  const { data: supply, error: supplyError } = await supabase
    .from('supplies')
    .select('name')
    .eq('id', supplyId)
    .single();

  if (supplyError || !supply) {
    throw new Error('Insumo no encontrado');
  }

  // LLAMADA RPC TRANSACCIONAL
  const { error } = await supabase.rpc('register_purchase_transaction', {
    p_supply_id: supplyId,
    p_quantity: quantity,
    p_cost: cost,
    p_description: description || 'Compra de reposición',
    p_supply_name: supply.name
  });

  if (error) {
    throw new Error(`Error registering purchase: ${error.message}`);
  }
};
