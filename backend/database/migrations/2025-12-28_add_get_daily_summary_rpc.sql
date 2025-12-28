--=============================================
-- Migration: Add get_daily_summary RPC Function
-- Date: 2025-12-28
-- Author: Sistema de Optimización de Base de Datos
--=============================================
-- Purpose: 
--   Optimizar el cálculo del resumen diario delegando agregaciones
--   matemáticas de ventas y gastos a PostgreSQL en lugar de JavaScript.
--
-- Benefits:
--   ✅ Reduce CPU load en Node.js
--   ✅ Reduce transferencia de datos (solo envía resultado final)
--   ✅ Escalable para miles de registros
--   ✅ Usa índices optimizados de PostgreSQL
--
-- Usage:
--   Execute this SQL in your Supabase SQL Editor
--   After running, the backend will automatically use this RPC function
--=============================================

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS get_daily_summary(DATE);

-- Create the RPC function
CREATE OR REPLACE FUNCTION get_daily_summary(target_date DATE)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  v_total_sales DECIMAL(10, 2);
  v_total_expenses DECIMAL(10, 2);
  v_net_income DECIMAL(10, 2);
  v_cash_sales DECIMAL(10, 2);
  v_yape_sales DECIMAL(10, 2);
  v_date TEXT;
BEGIN
  -- Convert date to text format
  v_date := target_date::TEXT;
  
  -- Calculate total sales for the day
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_sales
  FROM sales
  WHERE DATE(created_at) = target_date;
  
  -- Calculate total expenses for the day
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_expenses
  FROM expenses
  WHERE DATE(created_at) = target_date;
  
  -- Calculate sales by payment method (Cash)
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_cash_sales
  FROM sales
  WHERE DATE(created_at) = target_date
    AND payment_method = 'Efectivo';
  
  -- Calculate sales by payment method (Yape)
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_yape_sales
  FROM sales
  WHERE DATE(created_at) = target_date
    AND payment_method = 'Yape';
  
  -- Calculate net income
  v_net_income := v_total_sales - v_total_expenses;
  
  -- Build JSON result
  result := json_build_object(
    'date', v_date,
    'totalSales', v_total_sales,
    'totalExpenses', v_total_expenses,
    'netIncome', v_net_income,
    'breakdown', json_build_object(
      'cash', v_cash_sales,
      'yape', v_yape_sales
    )
  );
  
  RETURN result;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION get_daily_summary(DATE) IS 
  'Returns daily financial summary with sales, expenses, net income, and payment method breakdown. ' ||
  'Optimized for performance by delegating aggregations to PostgreSQL.';

--=============================================
-- Verification Query
-- Run this to test the function works correctly
--=============================================
-- Example: Get today's summary
SELECT get_daily_summary(CURRENT_DATE);

-- Example: Get summary for specific date
-- SELECT get_daily_summary('2025-12-28');
