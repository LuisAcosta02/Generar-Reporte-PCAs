import React, { useState } from 'react';
import { AppState } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';

interface ProjectManagementProps {
  state: AppState;
  addProject: (name: string) => void;
  deleteProject: (id: string) => void;
  addSample: (projectId: string) => void;
  setCurrentSample: (id: string | null) => void;
}

export default function ProjectManagement({ state, addProject, deleteProject, addSample, setCurrentSample }: ProjectManagementProps) {
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Gestión de Proyecto</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Proyecto</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nombre del proyecto"
            />
            <button
              onClick={handleCreateProject}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus size={16} /> Crear
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proyectos Existentes</label>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
            {state.projects.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay proyectos.</p>
            ) : (
              state.projects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm font-medium">{p.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addSample(p.id)}
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-100"
                    >
                      + Muestra
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Muestras del Proyecto</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            value={state.currentSampleId || ''}
            onChange={(e) => setCurrentSample(e.target.value || null)}
          >
            <option value="">-- Seleccionar Muestra --</option>
            {state.samples.map(s => {
              const proj = state.projects.find(p => p.id === s.projectId);
              return (
                <option key={s.id} value={s.id}>
                  {proj?.name} - Sondeo: {s.boring || 'N/A'} - Muestra: {s.sampleNumber || 'N/A'}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
