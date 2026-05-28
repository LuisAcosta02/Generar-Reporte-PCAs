import { useState, useEffect, useCallback } from 'react';
import { AppState, Sample, Project, SieveRow } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { syncToGoogleSheets, generateRawData } from '../utils/exportExcel';

const defaultSieves: SieveRow[] = [
  { id: uuidv4(), inch: '3"', opening: 76.2, retained: '' },
  { id: uuidv4(), inch: '2"', opening: 50.8, retained: '' },
  { id: uuidv4(), inch: '1 1/2"', opening: 38.1, retained: '' },
  { id: uuidv4(), inch: '1"', opening: 25.4, retained: '' },
  { id: uuidv4(), inch: '3/4"', opening: 19.05, retained: '' },
  { id: uuidv4(), inch: '1/2"', opening: 12.7, retained: '' },
  { id: uuidv4(), inch: '3/8"', opening: 9.525, retained: '' },
  { id: uuidv4(), inch: '1/4"', opening: 6.35, retained: '' },
  { id: uuidv4(), inch: 'No. 4', opening: 4.76, retained: '' },
  { id: uuidv4(), inch: 'No. 10', opening: 2.0, retained: '' },
  { id: uuidv4(), inch: 'No. 20', opening: 0.84, retained: '' },
  { id: uuidv4(), inch: 'No. 40', opening: 0.42, retained: '' },
  { id: uuidv4(), inch: 'No. 60', opening: 0.25, retained: '' },
  { id: uuidv4(), inch: 'No. 100', opening: 0.149, retained: '' },
  { id: uuidv4(), inch: 'No. 200', opening: 0.074, retained: '' },
];

const createEmptySample = (projectId: string): Sample => ({
  id: uuidv4(),
  projectId,
  location: '',
  date: new Date().toISOString().split('T')[0],
  boring: '',
  sampleNumber: '',
  depthFrom: '',
  depthTo: '',
  waterContent: Array(3).fill(null).map(() => ({ id: uuidv4(), centimeter: '', capsule: '', wCapsule: '', wshC: '', wssC: '' })),
  organicMatter: Array(3).fill(null).map(() => ({ id: uuidv4(), centimeter: '', capsule: '', wCapsule: '', wshC: '', wssC: '' })),
  specificGravity: {
    calibration: Array(5).fill(null).map(() => ({ id: uuidv4(), tempSup: '', tempMed: '', tempInf: '', wfw: '' })),
    calibration2: Array(5).fill(null).map(() => ({ id: uuidv4(), tempSup: '', tempMed: '', tempInf: '', wfw: '' })),
    test: Array(2).fill(null).map(() => ({ id: uuidv4(), flask: 1, temp: '', wfws: '', tara: '', wt: '', wts: '' })),
    calibration1Flask: '',
    calibration2Flask: '',
    testSource: '1',
  },
  granulometry: {
    initialWeight: '',
    taraWeight: '',
    sieves: defaultSieves.map(s => ({ ...s, id: uuidv4() })),
    pass4WetWeight: '',
    pass4DryWeight: '',
    pass4TaraWeight: '',
    subsample2Weight: '',
    predominantMaterial: '',
    groupSymbol: '',
    sucsClass: '',
    gw1: '',
    gw2: '',
    sw1: '',
    sw2: '',
  },
  atterberg: {
    liquidLimit: Array(4).fill(null).map(() => ({ id: uuidv4(), blows: '', taraNumber: '', wt: '', wtsh: '', wtss: '' })),
    plasticLimit: Array(3).fill(null).map(() => ({ id: uuidv4(), blows: '', taraNumber: '', wt: '', wtsh: '', wtss: '' })),
    linearShrinkage: Array(2).fill(null).map(() => ({ id: uuidv4(), barNumber: '', initialLength: '', finalLength: '' })),
  }
});

const initialState: AppState = {
  projects: [],
  samples: [],
  currentSampleId: null,
  lastSaved: null,
};

export function useStore() {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.fetchState().then(data => {
      if (mounted) {
        if (data) setState(data);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const saveToStorage = useCallback(async (newState: AppState) => {
    setIsSaving(true);
    const stateWithTime = { ...newState, lastSaved: new Date().toISOString() };
    setState(stateWithTime);
    await api.saveState(stateWithTime);
    setIsSaving(false);
  }, []);

  const addProject = (name: string) => {
    const newProject = { id: uuidv4(), name };
    const newState = { ...state, projects: [...state.projects, newProject] };
    saveToStorage(newState);
    return newProject;
  };

  const deleteProject = (id: string) => {
    const newState = {
      ...state,
      projects: state.projects.filter(p => p.id !== id),
      samples: state.samples.filter(s => s.projectId !== id),
      currentSampleId: state.samples.find(s => s.projectId === id)?.id === state.currentSampleId ? null : state.currentSampleId
    };
    saveToStorage(newState);
  };

  const addSample = (projectId: string) => {
    const newSample = createEmptySample(projectId);
    const newState = {
      ...state,
      samples: [...state.samples, newSample],
      currentSampleId: newSample.id
    };
    saveToStorage(newState);
    return newSample;
  };

  const updateSample = (sampleId: string, updates: Partial<Sample>) => {
    const newState = {
      ...state,
      samples: state.samples.map(s => s.id === sampleId ? { ...s, ...updates } : s)
    };
    saveToStorage(newState);
  };

  const setCurrentSample = (id: string | null) => {
    setState(prev => ({ ...prev, currentSampleId: id }));
  };

  // Auto-save effect
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      saveToStorage(state);
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [state, saveToStorage, isLoading]);

  const forceSave = async () => {
    await saveToStorage(state);
    
    // Sincronización automática silenciosa con Google Sheets
    if (state.currentSampleId) {
      const currentSample = state.samples.find(s => s.id === state.currentSampleId);
      if (currentSample) {
        try {
          const rawDataArray = generateRawData(state, [currentSample]);
          if (rawDataArray.length > 0) {
            await syncToGoogleSheets(rawDataArray[0]);
          }
        } catch (err) {
          console.error('[Auto-Sync] Error al sincronizar con Google Sheets:', err);
        }
      }
    }
  };

  return {
    state,
    isLoading,
    isSaving,
    addProject,
    deleteProject,
    addSample,
    updateSample,
    setCurrentSample,
    forceSave
  };
}
