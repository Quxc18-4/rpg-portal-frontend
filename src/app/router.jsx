import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import ProtectedRoute from '../layouts/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import AuctionMarketPage from '../pages/market/AuctionMarketPage';
import LicenseMarketPage from '../pages/market/LicenseMarketPage';
import TradeHistoryPage from '../pages/market/TradeHistoryPage';
import GuildDirectoryPage from '../pages/guild/GuildDirectoryPage';
import GuildDetailPage from '../pages/guild/GuildDetailPage';
import PlayerHubPage from '../pages/player/PlayerHubPage';
import PublicProfilePage from '../pages/player/PublicProfilePage';
import OperatorAuditPage from '../pages/operator/OperatorAuditPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/market" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'market', element: <AuctionMarketPage /> },
      { path: 'market/licenses', element: <LicenseMarketPage /> },
      { path: 'guilds', element: <GuildDirectoryPage /> },
      {
        path: 'guilds/me',
        element: (
          <ProtectedRoute minRole="USER">
            <GuildDetailPage isMe />
          </ProtectedRoute>
        ),
      },
      { path: 'guilds/:id', element: <GuildDetailPage /> },
      {
        path: 'trades',
        element: (
          <ProtectedRoute minRole="USER">
            <TradeHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute minRole="USER">
            <PlayerHubPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'players/:username',
        element: <PublicProfilePage />,
      },
      {
        path: 'operator',
        element: (
          <ProtectedRoute minRole="MODERATOR">
            <OperatorAuditPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}