import { BrowserRouter } from 'react-router-dom';
import ThemeProvider from './app/providers/ThemeProvider';
import AuthProvider from './app/providers/AuthProvider';
import { SocietyProvider, UiProvider } from './app/store/ui.store';
import AppRoutes from './app/router';
import ActionToast from './components/ui/ActionToast';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocietyProvider>
            <UiProvider>
              <AppRoutes />
              <ActionToast />
            </UiProvider>
          </SocietyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
