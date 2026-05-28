import React from 'react';
import { Sample, SieveRow } from '../../types';
import { calculateGranulometry, calculateAtterberg, calculateSUCS } from '../../utils/calculations';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LogarithmicScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Table, Thead, Tbody, Th, Td } from '../ui/Table';
import { Input } from '../ui/Input';

ChartJS.register(LogarithmicScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface GranulometryProps {
  sample: Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
}

export default function Granulometry({ sample, updateSample }: GranulometryProps) {
  const handleMainChange = (field: keyof Sample['granulometry'], value: string) => {
    updateSample(sample.id, { granulometry: { ...sample.granulometry, [field]: value } });
  };

  const handleSieveChange = (index: number, value: string) => {
    const newSieves = [...sample.granulometry.sieves];
    newSieves[index] = { ...newSieves[index], retained: value === '' ? '' : Number(value) };
    updateSample(sample.id, { granulometry: { ...sample.granulometry, sieves: newSieves } });
  };

  const calcResult = calculateGranulometry(sample);
  const atterbergResult = calculateAtterberg(sample);

  let calculatedGroupSymbol = '';
  let calculatedSucsClass = '';
  let calculatedPredominant = '';

  if (calcResult) {
    const { gravel, sand, fines } = calcResult;
    if (gravel > sand && gravel > fines) calculatedPredominant = 'Grava';
    else if (sand > gravel && sand > fines) calculatedPredominant = 'Arena';
    else if (fines > gravel && fines > sand) calculatedPredominant = 'Finos';

    const sucs = calculateSUCS(
      calcResult.fines,
      calcResult.gravel,
      calcResult.sand,
      atterbergResult.ll,
      atterbergResult.ip,
      calcResult.cu,
      calcResult.cc
    );
    
    if (sucs !== '-') {
      calculatedGroupSymbol = sucs;
      // We can map the symbol to a name if needed, or just use the symbol
      if (calcResult.fines >= 50) {
        calculatedSucsClass = atterbergResult.sucsName !== '-' ? atterbergResult.sucsName : calculatedSucsClass;
      } else {
        // Basic mapping for coarse soils
        const names: Record<string, string> = {
          'GW': 'Grava bien graduada',
          'GP': 'Grava mal graduada',
          'GM': 'Grava limosa',
          'GC': 'Grava arcillosa',
          'SW': 'Arena bien graduada',
          'SP': 'Arena mal graduada',
          'SM': 'Arena limosa',
          'SC': 'Arena arcillosa',
          'GW-GM': 'Grava bien graduada con limo',
          'GW-GC': 'Grava bien graduada con arcilla',
          'GP-GM': 'Grava mal graduada con limo',
          'GP-GC': 'Grava mal graduada con arcilla',
          'SW-SM': 'Arena bien graduada con limo',
          'SW-SC': 'Arena bien graduada con arcilla',
          'SP-SM': 'Arena mal graduada con limo',
          'SP-SC': 'Arena mal graduada con arcilla',
        };
        calculatedSucsClass = names[sucs] || calculatedSucsClass;
      }
    }
  }
  
  const displayGroupSymbol = sample.granulometry.groupSymbol !== undefined && sample.granulometry.groupSymbol !== '' 
    ? sample.granulometry.groupSymbol 
    : calculatedGroupSymbol;

  const displaySucsClass = sample.granulometry.sucsClass !== undefined && sample.granulometry.sucsClass !== ''
    ? sample.granulometry.sucsClass
    : calculatedSucsClass;

  const displayPredominant = sample.granulometry.predominantMaterial !== undefined && sample.granulometry.predominantMaterial !== ''
    ? sample.granulometry.predominantMaterial
    : calculatedPredominant;

  const chartData = {
    datasets: [
      {
        label: 'Curva Granulométrica',
        data: calcResult ? calcResult.results.filter(r => r.opening > 0).map(r => ({ x: r.opening, y: r.passingPercent })) : [],
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        showLine: true,
        pointRadius: 4,
        tension: 0.1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'logarithmic' as const,
        position: 'bottom' as const,
        reverse: true, // Standard for granulometry (larger sieves on left)
        title: { display: true, text: 'Abertura (mm)' },
        min: 0.01,
        max: 100,
      },
      y: {
        type: 'linear' as const,
        title: { display: true, text: '% Que Pasa' },
        min: 0,
        max: 100,
      }
    }
  };

  const no4Index = sample.granulometry.sieves.findIndex(s => s.inch === 'No. 4');
  const coarseSieves = sample.granulometry.sieves.slice(0, no4Index + 1);
  const fineSieves = sample.granulometry.sieves.slice(no4Index + 1);

  return (
    <div className="space-y-8">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">Análisis Granulométrico</h2>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border mb-8">
        <h3 className="font-medium text-gray-700 border-b pb-4 mb-4">Datos Principales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Numero de Sondeo N°:</span>
              <span className="font-mono">{sample.boring || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Numero de Muestra N°:</span>
              <span className="font-mono">{sample.sampleNumber || '-'}</span>
            </div>
            <Input
              label="Peso de la muestra inicial (g)"
              type="number"
              value={sample.granulometry.initialWeight ?? ''}
              onChange={(e) => handleMainChange('initialWeight', e.target.value)}
            />
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Retenido No. 4 gr:</span>
              <span className="font-mono">{calcResult ? calcResult.retainedNo4.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Mat. que pasa No. 4 gr:</span>
              <span className="font-mono">{calcResult ? calcResult.passingNo4.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Muestra total corregida gr:</span>
              <span className="font-mono">{calcResult ? calcResult.totalSampleCorrected.toFixed(3) : '-'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Peso húmedo mat que pasa No. 4 gr:</span>
              <span className="font-mono">{sample.granulometry.initialWeight || '-'}</span>
            </div>
            <Input
              label="Peso de la tara gr"
              type="number"
              value={sample.granulometry.taraWeight ?? ''}
              onChange={(e) => handleMainChange('taraWeight', e.target.value)}
            />
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Peso seco mat que pasa No. 4 gr:</span>
              <span className="font-mono">
                {sample.granulometry.initialWeight && sample.granulometry.taraWeight 
                  ? (Number(sample.granulometry.initialWeight) - Number(sample.granulometry.taraWeight)).toFixed(3) 
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Contenido de agua mat que pasa No. 4:</span>
              <span className="font-mono">{calcResult ? calcResult.waterContentPass4.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Mat. que pasa No. 4 corregido gr:</span>
              <span className="font-mono">{calcResult ? calcResult.passingNo4Corrected.toFixed(3) : '-'}</span>
            </div>
            <Input
              label="Peso submuestra 2 gr"
              type="number"
              value={sample.granulometry.subsample2Weight ?? ''}
              onChange={(e) => handleMainChange('subsample2Weight', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border rounded-lg p-4 h-80 flex items-center justify-center">
             {calcResult && calcResult.results.some(r => r.retained !== '') ? (
              <Scatter data={chartData} options={chartOptions} />
            ) : (
              <p className="text-gray-400 text-sm text-center">Ingrese pesos retenidos para generar la curva</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="overflow-x-auto">
            <h3 className="text-md font-medium text-gray-700 mb-2">MATERIAL CRIBADO MALLA 3" Y RETENIDO MALLA N°4</h3>
            <Table>
              <Thead>
                <tr>
                  <Th>Malla</Th>
                  <Th>Abertura (mm)</Th>
                  <Th>Retenido (g)</Th>
                  <Th>% Parcial</Th>
                  <Th>% Que Pasa</Th>
                </tr>
              </Thead>
              <Tbody>
                {coarseSieves.map((sieve, idx) => {
                  const result = calcResult?.results[idx];
                  return (
                    <tr key={sieve.id} className="hover:bg-gray-50">
                      <Td className="font-medium text-gray-700">{sieve.inch}</Td>
                      <Td className="text-gray-500">{sieve.opening.toFixed(3)}</Td>
                      <Td>
                        <input 
                          type="number" 
                          value={sieve.retained ?? ''} 
                          onChange={(e) => handleSieveChange(idx, e.target.value)} 
                          className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                      </Td>
                      <Td className="font-mono text-gray-600 bg-gray-50">
                        {result && sieve.retained !== '' ? result.partial.toFixed(2) : '-'}
                      </Td>
                      <Td className="font-mono font-medium text-indigo-700 bg-indigo-50/30">
                        {result && sieve.retained !== '' ? result.passingPercent.toFixed(2) : '-'}
                      </Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>

          <div className="overflow-x-auto">
            <h3 className="text-md font-medium text-gray-700 mb-2">MATERIAL CRIBADO MALLA N°4 Y RETENIDO MALLA N°200</h3>
            <Table>
              <Thead>
                <tr>
                  <Th>Malla</Th>
                  <Th>Abertura (mm)</Th>
                  <Th>Retenido (g)</Th>
                  <Th>% Parcial</Th>
                  <Th>% Que Pasa</Th>
                </tr>
              </Thead>
              <Tbody>
                {fineSieves.map((sieve, idx) => {
                  const actualIdx = idx + no4Index + 1;
                  const result = calcResult?.results[actualIdx];
                  return (
                    <tr key={sieve.id} className="hover:bg-gray-50">
                      <Td className="font-medium text-gray-700">{sieve.inch}</Td>
                      <Td className="text-gray-500">{sieve.inch === 'Fondo' ? '-' : sieve.opening.toFixed(3)}</Td>
                      <Td>
                        <input 
                          type="number" 
                          value={sieve.retained ?? ''} 
                          onChange={(e) => handleSieveChange(actualIdx, e.target.value)} 
                          className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                        />
                      </Td>
                      <Td className="font-mono text-gray-600 bg-gray-50">
                        {result && sieve.retained !== '' ? result.partial.toFixed(2) : '-'}
                      </Td>
                      <Td className="font-mono font-medium text-indigo-700 bg-indigo-50/30">
                        {result && sieve.retained !== '' ? result.passingPercent.toFixed(2) : '-'}
                      </Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border mt-8">
        <h3 className="font-medium text-gray-700 border-b pb-4 mb-4">Clasificación y Resultados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <Input
              label="Material Predominante"
              type="text"
              value={displayPredominant}
              onChange={(e) => handleMainChange('predominantMaterial', e.target.value)}
            />
            <Input
              label="Símbolo de Grupo"
              type="text"
              value={displayGroupSymbol}
              onChange={(e) => handleMainChange('groupSymbol', e.target.value)}
            />
            <Input
              label="Clasificación S.U.C.S."
              type="text"
              value={displaySucsClass}
              onChange={(e) => handleMainChange('sucsClass', e.target.value)}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Grava Bien Graduada GW"
                  type="text"
                  value={sample.granulometry.gw1 || ''}
                  onChange={(e) => handleMainChange('gw1', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="&nbsp;"
                  type="text"
                  value={sample.granulometry.gw2 || ''}
                  onChange={(e) => handleMainChange('gw2', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Arena Bien Graduada SW"
                  type="text"
                  value={sample.granulometry.sw1 || ''}
                  onChange={(e) => handleMainChange('sw1', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="&nbsp;"
                  type="text"
                  value={sample.granulometry.sw2 || ''}
                  onChange={(e) => handleMainChange('sw2', e.target.value)}
                />
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-600 font-medium">D10 mm:</span>
                <span className="font-mono">{calcResult && calcResult.d10 ? calcResult.d10.toFixed(3) : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-600 font-medium">D30 mm:</span>
                <span className="font-mono">{calcResult && calcResult.d30 ? calcResult.d30.toFixed(3) : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-600 font-medium">D60 mm:</span>
                <span className="font-mono">{calcResult && calcResult.d60 ? calcResult.d60.toFixed(3) : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-600 font-medium">Cu = D60/D10:</span>
                <span className="font-mono">{calcResult && calcResult.cu ? calcResult.cu.toFixed(3) : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-600 font-medium">Cc = (D30²)/(D10*D60):</span>
                <span className="font-mono">{calcResult && calcResult.cc ? calcResult.cc.toFixed(3) : '-'}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">&gt; 3" %:</span>
              <span className="font-mono">{calcResult ? calcResult.greaterThan3Inch.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Grava %:</span>
              <span className="font-mono">{calcResult ? calcResult.gravel.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Arena %:</span>
              <span className="font-mono">{calcResult ? calcResult.sand.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Finos %:</span>
              <span className="font-mono">{calcResult ? calcResult.fines.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2 bg-gray-100 p-2 rounded">
              <span className="text-gray-800 font-bold">Suma:</span>
              <span className="font-mono font-bold">{calcResult ? calcResult.sumFractions.toFixed(3) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
