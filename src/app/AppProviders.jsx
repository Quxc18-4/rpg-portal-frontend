import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

export default function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}