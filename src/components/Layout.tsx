import { NavLink } from 'react-router-dom';
import { Home, Calendar, BarChart3, Bell, Settings } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/insights', icon: BarChart3, label: 'Insights' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌸</span>
            <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Bloom
            </h1>
          </div>
          <div className="text-xs text-gray-400">
            🔒 Private
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 px-1 transition-colors
                ${isActive ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
