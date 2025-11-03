import React from 'react';
import { View } from '../types';
import { DashboardIcon, UsersIcon, ChartBarIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ArrowLeftOnRectangleIcon, XMarkIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const navItems = [
    { view: 'dashboard', label: 'Attendance Log', icon: DashboardIcon },
    { view: 'analytics', label: 'Dashboard', icon: ChartBarIcon },
    { view: 'students', label: 'Students', icon: UsersIcon },
  ];

  const baseStyle = "flex items-center space-x-4 px-4 py-3 rounded-lg font-medium transition-colors duration-200 w-full";
  const activeStyle = "bg-green-700 text-white";
  const inactiveStyle = "text-green-100 hover:bg-green-600 hover:text-white";

  return (
    <aside className={`bg-green-800 text-white flex flex-col transition-transform duration-300 ease-in-out z-40
      md:relative md:translate-x-0 
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      fixed h-full w-64 p-4
      `}>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className={`flex items-center justify-between px-2 mb-8 transition-opacity duration-300 ${isCollapsed && 'md:justify-center'}`}>
            <span className={`text-2xl font-bold text-white tracking-wider whitespace-nowrap ${isCollapsed && 'md:hidden'}`}>
                Attendance Pro
            </span>
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-green-200 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
      
        <nav className="flex flex-col space-y-2">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view as View)}
              className={`${baseStyle} ${currentView === item.view ? activeStyle : inactiveStyle} ${isCollapsed ? 'md:justify-center md:!space-x-0' : ''}`}
              aria-label={item.label}
              title={isCollapsed ? item.label : ''}
              aria-current={currentView === item.view ? 'page' : undefined}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100 w-auto'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-shrink-0 pt-4 border-t border-green-700">
          <button
            onClick={() => setView('logout')}
            className={`${baseStyle} ${inactiveStyle} !py-2 ${isCollapsed ? 'md:justify-center md:!space-x-0' : 'justify-start'}`}
            title={isCollapsed ? 'Logout & Clear Data' : ''}
          >
            <ArrowLeftOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
            <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100 w-auto'}`}>Logout</span>
          </button>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex ${baseStyle} ${inactiveStyle} !py-2 ${isCollapsed ? 'justify-center !space-x-0' : 'justify-start'}`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
             {isCollapsed 
                ? <ChevronDoubleRightIcon className="w-6 h-6 flex-shrink-0" /> 
                : <ChevronDoubleLeftIcon className="w-6 h-6 flex-shrink-0" />
             }
             <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Collapse</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;