import React from 'react';
import {
  LayoutDashboard,
  Pill,
  CheckCircle2,
  BarChart3,
  Users,
  FileText,
  Heart,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'medicines',  label: 'Medicines',    icon: Pill },
  { id: 'tracking',   label: 'Dose Tracking',icon: CheckCircle2 },
  { id: 'analytics',  label: 'Analytics',    icon: BarChart3 },
  { id: 'caregiver',  label: 'Caregiver',    icon: Users },
  { id: 'reports',    label: 'Reports',      icon: FileText },
];

export default function Sidebar({ activePage, setActivePage, isOpen, setIsOpen, user, onLogout }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 bg-white border-r border-gray-100 shadow-lg
          flex flex-col transition-transform duration-300
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 leading-tight">MediTrack AI</h1>
              <p className="text-xs text-gray-400">Adherence Platform</p>
            </div>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActivePage(id); setIsOpen(false); }}
              className={`nav-link w-full text-left ${activePage === id ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer note */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-semibold text-gray-700">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Log out</span>
          </button>
          <p className="text-xs text-gray-400 leading-relaxed">
            Demo Mode: data is stored locally. Not for real medical use.
          </p>
        </div>
      </aside>

      {/* Mobile header burger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setIsOpen(true)} className="text-gray-500">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary-600" />
          <span className="font-bold text-gray-800 text-sm">MediTrack AI</span>
        </div>
      </div>
    </>
  );
}

