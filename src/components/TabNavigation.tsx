import React from 'react';

interface TabNavigationProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

const tabs = [
  'Datos Generales',
  'Contenido de Agua',
  'Materia Orgánica',
  'Gravedad Específica',
  'Granulometría',
  'Límites de Atterberg',
  'Exportación'
];

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="flex overflow-x-auto border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => setActiveTab(index)}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === index
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
