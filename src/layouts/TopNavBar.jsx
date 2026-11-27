import { NavLink, Link } from 'react-router-dom';
import { PRIMARY_NAV_ITEMS } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function TopNavBar() {
  const { user, isAuthenticated, checkRole, logout } = useAuth();
  const { lang, toggleLanguage } = useLanguage();

  const visibleItems = PRIMARY_NAV_ITEMS.filter((item) => checkRole(item.minRole));

  return (
    <header className="h-[52px] w-full border-b border-border-strong bg-surface">
      <div className="mx-auto flex h-full max-w-[1360px] items-center justify-between px-4">
        {/* Left: Brand & Primary Tabs */}
        <div className="flex h-full items-center gap-6">
          <Link
            to="/market"
            className="font-mono text-sm font-bold tracking-tight text-ink-primary"
          >
            RPGCORE <span className="text-accent-emerald">//</span> PORTAL
          </Link>

          <nav className="flex h-full items-center">
            {visibleItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex h-full items-center border-x border-transparent px-3.5 text-xs font-semibold tracking-wide transition-colors',
                    isActive
                      ? 'border-x-border-strong bg-subheader text-accent-emerald'
                      : 'text-ink-secondary hover:bg-canvas hover:text-ink-primary',
                  ].join(' ')
                }
              >
                {item.label[lang]}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Language Switcher & Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="border border-border-strong bg-canvas px-2.5 py-1 font-mono text-xs font-semibold text-ink-primary hover:bg-subheader"
          >
            [{lang === 'vi' ? 'VI | en' : 'vi | EN'}]
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="border border-border-subtle bg-canvas px-2.5 py-1 font-mono text-xs text-ink-primary">
                <span>{user.username}</span>
                {user.isVip && (
                  <span className="ml-1.5 font-semibold text-accent-amber">[VIP]</span>
                )}
                {user.role && user.role !== 'USER' && (
                  <span className="ml-1.5 font-semibold text-accent-emerald">
                    [{user.role}]
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={logout}
                className="border border-border-strong bg-surface px-2.5 py-1 font-mono text-xs font-semibold text-accent-crimson hover:bg-subheader"
              >
                {lang === 'vi' ? 'THOÁT' : 'LOGOUT'}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="border border-border-strong bg-accent-emerald px-3 py-1 font-mono text-xs font-semibold text-white hover:opacity-95"
            >
              {lang === 'vi' ? 'ĐĂNG NHẬP' : 'LOGIN'}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}