import React, { useState } from 'react';
import { AppState, Sample } from '../../types';
import { Download, FileSpreadsheet, AlertCircle, FileText, Settings, X, CloudUpload } from 'lucide-react';
import { exportAllData, exportCurrentSample, exportWithTemplate, exportPersonalizedReports, syncToGoogleSheets, generateRawData } from '../../utils/exportExcel';

interface ExportProps {
  state: AppState;
}

export default function Export({ state }: ExportProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);

  const handleExportAllRaw = async () => {
    try {
      setErrorMsg(null);
      setIsExporting(true);
      await exportAllData(state, state.samples);
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al exportar los datos.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCurrentRaw = async () => {
    try {
      setErrorMsg(null);
      if (!state.currentSampleId) {
        setErrorMsg('Seleccione una muestra primero.');
        return;
      }
      setIsExporting(true);
      const currentSample = state.samples.find(s => s.id === state.currentSampleId);
      if (!currentSample) throw new Error('Muestra no encontrada.');
      
      const project = state.projects.find(p => p.id === currentSample.projectId)?.name || 'Proyecto';
      await exportCurrentSample(state, currentSample, project);
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al exportar los datos.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTemplate = async () => {
    try {
      setErrorMsg(null);
      if (!state.currentSampleId) {
        setErrorMsg('Seleccione una muestra primero.');
        return;
      }
      setIsExporting(true);
      const currentSample = state.samples.find(s => s.id === state.currentSampleId);
      if (!currentSample) throw new Error('Muestra no encontrada.');
      
      await exportWithTemplate(state, [currentSample]);
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al generar el reporte.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncToSheets = async () => {
    try {
      setErrorMsg(null);
      if (!state.currentSampleId) {
        setErrorMsg('Seleccione una muestra primero.');
        return;
      }
      setIsExporting(true);
      const currentSample = state.samples.find(s => s.id === state.currentSampleId);
      if (!currentSample) throw new Error('Muestra no encontrada.');
      
      const rawDataArray = generateRawData(state, [currentSample]);
      if (rawDataArray.length > 0) {
        await syncToGoogleSheets(rawDataArray[0]);
        alert('Sincronización con Google Sheets completada con éxito.');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al sincronizar con Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    try {
      setErrorMsg(null);
      if (selectedSamples.length === 0) {
        setErrorMsg('Seleccione al menos una muestra.');
        return;
      }
      setIsExporting(true);
      const samplesToExport = state.samples.filter(s => selectedSamples.includes(s.id));
      await exportPersonalizedReports(state, samplesToExport);
      setShowCustomModal(false);
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al exportar los datos.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSampleSelection = (id: string) => {
    setSelectedSamples(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Exportación de Resultados</h2>
        <p className="text-gray-500">Descarga los datos procesados en formato Excel (.xlsx) o genera reportes estructurados.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <button 
          onClick={handleExportAllRaw}
          disabled={isExporting}
          className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 hover:border-indigo-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Exportar Todo</h3>
            <p className="text-xs text-gray-500 mt-1">Todas las muestras (Bruto).</p>
          </div>
        </button>

        <button 
          onClick={handleExportCurrentRaw}
          disabled={!state.currentSampleId || isExporting}
          className={`flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-xl transition-all group ${
            state.currentSampleId && !isExporting
              ? 'border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 cursor-pointer' 
              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${
            state.currentSampleId ? 'bg-emerald-100 text-emerald-600 group-hover:scale-110' : 'bg-gray-200 text-gray-400'
          }`}>
            <FileSpreadsheet size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Muestra Actual</h3>
            <p className="text-xs text-gray-500 mt-1">Solo la muestra activa (Bruto).</p>
          </div>
        </button>

        <button 
          onClick={() => setShowCustomModal(true)}
          disabled={isExporting}
          className="flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed border-blue-300 rounded-xl hover:bg-blue-50 hover:border-blue-500 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Settings size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Personalizada</h3>
            <p className="text-xs text-gray-500 mt-1">Seleccionar muestras (Bruto).</p>
          </div>
        </button>

        <button 
          onClick={handleExportTemplate}
          disabled={!state.currentSampleId || isExporting}
          className={`flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-xl transition-all group ${
            state.currentSampleId && !isExporting
              ? 'border-amber-300 hover:bg-amber-50 hover:border-amber-500 cursor-pointer' 
              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${
            state.currentSampleId ? 'bg-amber-100 text-amber-600 group-hover:scale-110' : 'bg-gray-200 text-gray-400'
          }`}>
            <FileText size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Reporte</h3>
            <p className="text-xs text-gray-500 mt-1">Generar reporte con plantilla.</p>
          </div>
        </button>

        <button 
          onClick={handleSyncToSheets}
          disabled={!state.currentSampleId || isExporting}
          className={`flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-xl transition-all group ${
            state.currentSampleId && !isExporting
              ? 'border-green-300 hover:bg-green-50 hover:border-green-500 cursor-pointer' 
              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${
            state.currentSampleId ? 'bg-green-100 text-green-600 group-hover:scale-110' : 'bg-gray-200 text-gray-400'
          }`}>
            <CloudUpload size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Sincronizar</h3>
            <p className="text-xs text-gray-500 mt-1">Enviar a Google Sheets.</p>
          </div>
        </button>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Exportación Personalizada</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {state.projects.map(project => {
                  const projectSamples = state.samples.filter(s => s.projectId === project.id);
                  if (projectSamples.length === 0) return null;
                  
                  return (
                    <div key={project.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">{project.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {projectSamples.map(sample => (
                          <label key={sample.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedSamples.includes(sample.id)}
                              onChange={() => toggleSampleSelection(sample.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">
                              Sondeo: {sample.boring} | Muestra: {sample.sampleNumber}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {selectedSamples.length} muestras seleccionadas
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCustomExport}
                  disabled={selectedSamples.length === 0 || isExporting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Download size={18} />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
