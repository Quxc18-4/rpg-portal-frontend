import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import ProtectedRoute from '../layouts/ProtectedRoute';

function ModulePlaceholder({ code, endpoint }) {
  return (
    <div className="border border-border-strong bg-surface p-6">
      <div className="font-mono text-xs font-semibold text-accent-emerald">
        [MODULE // {code}]
      </div>
      <p className="mt-2 font-mono text-xs text-ink-secondary">
        API Target: {endpoint}
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
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