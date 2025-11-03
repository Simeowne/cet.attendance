import React from 'react';
import { View } from '../types';
import { Bars3Icon } from './icons';

interface HeaderProps {
  currentView: View;
  onMenuClick: () => void;
}

const viewTitles: Record<View, string> = {
    dashboard: 'Attendance Log',
    analytics: 'Dashboard',
    students: 'Manage Students',
    logout: 'Logging out...'
};

const Header: React.FC<HeaderProps> = ({ currentView, onMenuClick }) => {
  const title = viewTitles[currentView] || 'Dashboard';

  return (
    <header className="bg-white shadow-sm z-10 flex-shrink-0">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden mr-4 p-2 text-slate-600 hover:text-slate-900"
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
          {title}
        </h1>
      </div>
    </header>
  );
};

export default Header;