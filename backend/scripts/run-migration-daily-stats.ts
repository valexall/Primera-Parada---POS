import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Script para ejecutar la migración de fix_daily_menu_stats
 */
async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración: 2026-01-14_fix_daily_menu_stats.sql');
    
    const migrationPath = path.join(__dirname, '../database/migrations/2026-01-14_fix_daily_menu_stats.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      process.exit(1);
    }
    
    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Ahora las estadísticas incluirán órdenes "Entregado" y "Pagado"');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

runMigration();
