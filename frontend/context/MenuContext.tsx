import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { MenuItem } from '../types';
import { menuService } from '../services/menuService';
import { supabaseClient } from '../services/supabaseClient';

interface MenuContextType {
  menuItems: MenuItem[];
  isLoading: boolean;
  refetchMenu: () => Promise<void>;
  updateMenuItemLocal: (id: string, updates: Partial<MenuItem>) => void;
  addMenuItemLocal: (item: MenuItem) => void;
  removeMenuItemLocal: (id: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial del menú
  const loadMenu = useCallback(async () => {
    try {
      const items = await menuService.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch manual (para casos edge)
  const refetchMenu = async () => {
    try {
      const items = await menuService.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error('Error refetching menu:', error);
    }
  };

  // Optimistic update local (sin refetch)
  const updateMenuItemLocal = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(current => 
      current.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const addMenuItemLocal = (item: MenuItem) => {
    setMenuItems(current => [...current, item]);
  };

  const removeMenuItemLocal = (id: string) => {
    setMenuItems(current => current.filter(item => item.id !== id));
  };

  // Carga inicial
  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // ⚡ REALTIME: Suscripción a cambios en menu_items (igual que orders)
  useEffect(() => {
    const channel = supabaseClient
      .channel('menu-items-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'menu_items'
      }, (payload) => {
        const newItem = payload.new as MenuItem;
        console.log('🆕 Nuevo item en menú (realtime):', newItem.name);
        setMenuItems(current => {
          // Evitar duplicados
          if (current.some(item => item.id === newItem.id)) {
            return current;
          }
          return [...current, newItem];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'menu_items'
      }, (payload) => {
        const updatedItem = payload.new as MenuItem;
        console.log('✏️ Item actualizado (realtime):', updatedItem.name);
        setMenuItems(current =>
          current.map(item => item.id === updatedItem.id ? updatedItem : item)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'menu_items'
      }, (payload) => {
        const deletedId = payload.old.id;
        console.log('🗑️ Item eliminado (realtime):', deletedId);
        setMenuItems(current => current.filter(item => item.id !== deletedId));
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        isLoading,
        refetchMenu,
        updateMenuItemLocal,
        addMenuItemLocal,
        removeMenuItemLocal
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

// Separar el hook en otro archivo para Fast Refresh
// eslint-disable-next-line react-refresh/only-export-components
export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
};
