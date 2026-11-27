import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import ProtectedRoute from '../layouts/ProtectedRoute';
import ModulePlaceholder from '../components/ui/ModulePlaceholder';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/market" replace /> },
      {
        path: 'login',
        element: <ModulePlaceholder code="AUTH_LOGIN" endpoint="POST /api/v1/auth/login" />,
      },
      {
        path: 'market',
        element: <ModulePlaceholder code="AUCTION_MARKET" endpoint="GET /api/v1/market/auctions" />,
      },
      {
        path: 'guilds',
        element: <ModulePlaceholder code="GUILD_DIRECTORY" endpoint="GET /api/v1/guilds" />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute minRole="USER">
            <ModulePlaceholder code="PLAYER_HUB" endpoint="GET /api/v1/players/me/profile" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trades',
        element: (
          <ProtectedRoute minRole="USER">
            <ModulePlaceholder code="DIRECT_TRADES" endpoint="GET /api/v1/market/trades/me" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'operator',
        element: (
          <ProtectedRoute minRole="MODERATOR">
            <ModulePlaceholder code="OPERATOR_AUDIT" endpoint="GET /api/v1/operator/overview" />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}