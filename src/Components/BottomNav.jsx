import React from 'react';
import { Home, Calendar, BarChart3, Users, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'marcadores', label: 'Partidos', icon: Calendar },
    { id: 'tablas', label: 'Tablas', icon: BarChart3 },
    { id: 'miequipo', label: 'Mi Equipo', icon: Users },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070707] bg-opacity-80 backdrop-blur-xl border-t border-[#121212] px-4 py-2 pb-5 md:pb-3 max-w-md mx-auto shadow-[0_-5px_30px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-300 focus:outline-none"
            >
              {/* Glowing Background Glow on Active */}
              {isActive && (
                <span className="absolute -top-1 w-12 h-6 bg-basketball opacity-15 blur-md rounded-full transition-all duration-300" />
              )}
              
              {/* Icon Container with active styling */}
              <div
                className={`flex items-center justify-center p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-[#f57c00] transform -translate-y-1'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-5 h-5 stroke-[2] ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>

              {/* Label */}
              <span
                className={`text-[9px] font-bold tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>

              {/* Top accent bar on active */}
              {isActive && (
                <span className="absolute -top-2 w-5 h-0.5 bg-basketball rounded-full shadow-[0_0_8px_#f57c00]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
