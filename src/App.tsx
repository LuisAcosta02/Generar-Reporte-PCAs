import React, { useState } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import GeneralData from './components/modules/GeneralData';
import WaterContent from './components/modules/WaterContent';
import OrganicMatter from './components/modules/OrganicMatter';
import SpecificGravity from './components/modules/SpecificGravity';
import Granulometry from './components/modules/Granulometry';
import AtterbergLimits from './components/modules/AtterbergLimits';
import Export from './components/modules/Export';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { state, isLoading, isSaving, addProject, deleteProject, addSample, updateSample, setCurrentSample, forceSave } = useStore();
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const currentSample = state.samples.find(s => s.id === state.currentSampleId);

  const renderModule = () => {
    if (activeTab === 6) return <Export state={state} />;
    
    if (!currentSample) return <div className="p-8 text-center text-gray-500">Selecciona o crea una muestra en Datos Generales.</div>;

    switch (activeTab) {
      case 0: return <GeneralData sample={currentSample} updateSample={updateSample} state={state} addProject={addProject} deleteProject={deleteProject} addSample={addSample} setCurrentSample={setCurrentSample} />;
      case 1: return <WaterContent sample={currentSample} updateSample={updateSample} />;
      case 2: return <OrganicMatter sample={currentSample} updateSample={updateSample} />;
      case 3: return <SpecificGravity sample={currentSample} updateSample={updateSample} />;
      case 4: return <Granulometry sample={currentSample} updateSample={updateSample} />;
      case 5: return <AtterbergLimits sample={currentSample} updateSample={updateSample} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <Header lastSaved={state.lastSaved} forceSave={forceSave} isSaving={isSaving} />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 flex-1">
          {activeTab === 0 ? (
            <GeneralData sample={currentSample} updateSample={updateSample} state={state} addProject={addProject} deleteProject={deleteProject} addSample={addSample} setCurrentSample={setCurrentSample} />
          ) : (
            renderModule()
          )}
        </div>
      </main>
    </div>
  );
}
