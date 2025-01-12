import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminContextType {
  isAdmin: boolean;
  setAdminKey: (key: string) => void;
  clearAdmin: () => void;
}

const ADMIN_KEY = 'SuperBasedAdmin'; // Replace with your actual secret key

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('adminMode') === 'true';
  });

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('adminMode', 'true');
      // Set admin role in Supabase user metadata
      supabase.auth.updateUser({
        data: { is_admin: true }
      });
    } else {
      localStorage.removeItem('adminMode');
      // Remove admin role from Supabase user metadata
      supabase.auth.updateUser({
        data: { is_admin: false }
      });
    }
  }, [isAdmin]);

  const setAdminKey = async (key: string) => {
    if (key === ADMIN_KEY) {
      try {
        // Update user metadata in Supabase
        const { error } = await supabase.auth.updateUser({
          data: { is_admin: true }
        });

        if (error) throw error;
        setIsAdmin(true);
      } catch (error) {
        console.error('Error setting admin role:', error);
        alert('Failed to set admin role');
      }
    } else {
      alert('Invalid admin key');
    }
  };

  const clearAdmin = async () => {
    try {
      // Remove admin role from user metadata
      const { error } = await supabase.auth.updateUser({
        data: { is_admin: false }
      });

      if (error) throw error;
      setIsAdmin(false);
    } catch (error) {
      console.error('Error clearing admin role:', error);
      alert('Failed to clear admin role');
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, setAdminKey, clearAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}