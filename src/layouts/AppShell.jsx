import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      <TopNavBar />
      <main className="mx-auto max-w-[1360px] px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}