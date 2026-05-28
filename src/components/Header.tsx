import React from 'react';
import { Save, Clock, Loader2 } from 'lucide-react';

interface HeaderProps {
  lastSaved: string | null;
  forceSave: () => void;
  isSaving?: boolean;
}

export default function Header({ lastSaved, forceSave, isSaving }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          T
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Tyssa</h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Laboratorio</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {lastSaved && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <Clock size={14} />
            <span>Guardado: {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        <button 
          onClick={forceSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Guardando...' : 'Guardar ahora'}
        </button>
      </div>
    </header>
  );
}
