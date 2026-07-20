import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#FFFFFF',
              color: '#111827',
              fontSize: '14px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;