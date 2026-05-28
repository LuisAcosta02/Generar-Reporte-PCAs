import React from 'react';
import { Sample, AppState } from '../../types';
import SampleSummary from '../shared/SampleSummary';
import { Input } from '../ui/Input';
import ProjectManagement from './ProjectManagement';

interface GeneralDataProps {
  sample?: Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
  state: AppState;
  addProject: (name: string) => void;
  deleteProject: (id: string) => void;
  addSample: (projectId: string) => void;
  setCurrentSample: (id: string | null) => void;
}

export default function GeneralData({ sample, updateSample, state, addProject, deleteProject, addSample, setCurrentSample }: GeneralDataProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProjectManagement 
          state={state}
          addProject={addProject}
          deleteProject={deleteProject}
          addSample={addSample}
          setCurrentSample={setCurrentSample}
        />

        {sample && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Datos de la Muestra</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Localización"
                type="text"
                value={sample.location ?? ''}
                onChange={(e) => updateSample(sample.id, { location: e.target.value })}
              />
              <Input
                label="Fecha"
                type="date"
                value={sample.date ?? ''}
                onChange={(e) => updateSample(sample.id, { date: e.target.value })}
              />
              <Input
                label="Sondeo"
                type="text"
                value={sample.boring ?? ''}
                onChange={(e) => updateSample(sample.id, { boring: e.target.value })}
              />
              <Input
                label="Número de muestra"
                type="text"
                value={sample.sampleNumber ?? ''}
                onChange={(e) => updateSample(sample.id, { sampleNumber: e.target.value })}
              />
              <Input
                label="Profundidad desde (m)"
                type="number"
                value={sample.depthFrom ?? ''}
                onChange={(e) => updateSample(sample.id, { depthFrom: e.target.value })}
              />
              <Input
                label="Profundidad hasta (m)"
                type="number"
                value={sample.depthTo ?? ''}
                onChange={(e) => updateSample(sample.id, { depthTo: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {sample && <SampleSummary sample={sample} />}
    </div>
  );
}
