import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AdminProvider>
    </AuthProvider>
  </StrictMode>
);