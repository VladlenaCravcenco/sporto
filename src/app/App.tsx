import { RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { router } from './routes';
import { Analytics } from "@vercel/analytics/next"

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <CategoriesProvider>
            <RouterProvider router={router} />
          </CategoriesProvider>
        </CartProvider>
      </LanguageProvider>
      <Analytics />
    </AuthProvider>
  );
}