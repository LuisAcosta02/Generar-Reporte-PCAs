import React from 'react';
import { Sample, AtterbergRow, LinearShrinkageRow } from '../../types';
import { calculateAtterberg } from '../../utils/calculations';
import { getTaraValue } from '../../utils/constants';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LogarithmicScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Table, Thead, Tbody, Th, Td } from '../ui/Table';

ChartJS.register(LogarithmicScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface AtterbergProps {
  sample: Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
}

export default function AtterbergLimits({ sample, updateSample }: AtterbergProps) {
  const handleLLChange = (index: number, field: keyof AtterbergRow, value: string) => {
    const newRows = [...sample.atterberg.liquidLimit];
    newRows[index] = { ...newRows[index], [field]: value };
    
    if (field === 'taraNumber') {
      const taraValue = getTaraValue(Number(value));
      newRows[index].wt = taraValue !== null ? taraValue.toString() : '';
    }
    
    updateSample(sample.id, { atterberg: { ...sample.atterberg, liquidLimit: newRows } });
  };

  const handlePLChange = (index: number, field: keyof AtterbergRow, value: string) => {
    const newRows = [...sample.atterberg.plasticLimit];
    newRows[index] = { ...newRows[index], [field]: value };
    
    if (field === 'taraNumber') {
      const taraValue = getTaraValue(Number(value));
      newRows[index].wt = taraValue !== null ? taraValue.toString() : '';
    }
    
    updateSample(sample.id, { atterberg: { ...sample.atterberg, plasticLimit: newRows } });
  };

  const handleLSChange = (index: number, field: keyof LinearShrinkageRow, value: string) => {
    const newRows = [...(sample.atterberg.linearShrinkage || [])];
    if (!newRows[index]) {
      newRows[index] = { id: Math.random().toString(), barNumber: '', initialLength: '', finalLength: '' };
    }
    newRows[index] = { ...newRows[index], [field]: value };
    updateSample(sample.id, { atterberg: { ...sample.atterberg, linearShrinkage: newRows } });
  };

  const calcResult = calculateAtterberg(sample);

  const flowChartData = {
    datasets: [
      {
        label: 'Puntos de Ensayo',
        data: calcResult.llPoints.map(p => ({ x: p[0], y: p[1] })),
        backgroundColor: 'rgba(79, 70, 229, 1)',
        pointRadius: 5,
      },
      {
        label: 'Curva de Fluidez',
        data: calcResult.llEquation ? [10, 25, 40].map(x => ({ x, y: calcResult.llEquation!.equation[0] + calcResult.llEquation!.equation[1] * Math.log(x) })) : [],
        borderColor: 'rgba(79, 70, 229, 0.5)',
        showLine: true,
        fill: false,
        pointRadius: 0,
      }
    ]
  };

  // A-line: IP = 0.73 * (LL - 20)
  // U-line: IP = 0.9 * (LL - 8)
  const plasticityChartData = {
    datasets: [
      {
        label: 'Muestra',
        data: calcResult.ll !== null && calcResult.ip !== null ? [{ x: calcResult.ll, y: calcResult.ip }] : [],
        backgroundColor: 'rgba(239, 68, 68, 1)',
        pointRadius: 8,
        pointStyle: 'rectRot',
      },
      {
        label: 'Línea A',
        data: [{ x: 20, y: 0 }, { x: 100, y: 0.73 * (100 - 20) }],
        borderColor: 'rgba(107, 114, 128, 0.8)',
        showLine: true,
        fill: false,
        pointRadius: 0,
        borderDash: [5, 5],
      },
      {
        label: 'Línea U',
        data: [{ x: 8, y: 0 }, { x: 100, y: 0.9 * (100 - 8) }],
        borderColor: 'rgba(156, 163, 175, 0.5)',
        showLine: true,
        fill: false,
        pointRadius: 0,
        borderDash: [2, 2],
      }
    ]
  };

  // Calculate Linear Shrinkage average
  const lsRows = sample.atterberg.linearShrinkage || [];
  const lsValues = lsRows.map(row => {
    const initial = Number(row.initialLength);
    const final = Number(row.finalLength);
    if (row.initialLength !== '' && row.finalLength !== '' && initial !== 0) {
      return ((initial - final) / initial) * 100;
    }
    return null;
  }).filter(val => val !== null) as number[];
  
  const lsAverage = lsValues.length > 0 ? lsValues.reduce((a, b) => a + b, 0) / lsValues.length : null;

  const renderTaraOptions = () => {
    const options = [<option key="empty" value="">-</option>];
    for (let i = 1; i <= 255; i++) {
      options.push(<option key={i} value={i}>{i}</option>);
    }
    return options;
  };

  return (
    <div className="space-y-8">
      <div className="border-b pb-2 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Límites de Atterberg</h2>
        <div className="flex gap-4">
          <div className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            LL: {calcResult.ll !== null ? calcResult.ll.toFixed(1) : '-'}
          </div>
          <div className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            LP: {calcResult.pl !== null ? calcResult.pl.toFixed(1) : '-'}
          </div>
          <div className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
            IP: {calcResult.ip !== null ? calcResult.ip.toFixed(1) : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Límite Líquido */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-1">Límite Líquido</h3>
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <tr>
                  <Th>No. de golpes</Th>
                  <Th>No. de tara</Th>
                  <Th>Wt</Th>
                  <Th>Wt+sh</Th>
                  <Th>Wt+ss</Th>
                  <Th>Ww</Th>
                  <Th>Wss</Th>
                  <Th>ω</Th>
                </tr>
              </Thead>
              <Tbody>
                {sample.atterberg.liquidLimit.map((row, idx) => {
                  const wt = Number(row.wt);
                  const wtsh = Number(row.wtsh);
                  const wtss = Number(row.wtss);
                  
                  let ww = '-';
                  let wss = '-';
                  let w = '-';
                  
                  if (row.wt !== '' && row.wtsh !== '' && row.wtss !== '') {
                    const wwVal = wtsh - wtss;
                    const wssVal = wtss - wt;
                    ww = wwVal.toFixed(2);
                    wss = wssVal.toFixed(2);
                    if (wssVal !== 0) {
                      w = ((wwVal / wssVal) * 100).toFixed(2);
                    }
                  }
                  
                  return (
                    <tr key={row.id}>
                      <Td><input type="number" value={row.blows ?? ''} onChange={(e) => handleLLChange(idx, 'blows', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td>
                        <select value={row.taraNumber ?? ''} onChange={(e) => handleLLChange(idx, 'taraNumber', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          {renderTaraOptions()}
                        </select>
                      </Td>
                      <Td className="font-mono bg-gray-50 text-center">{row.wt !== '' ? Number(row.wt).toFixed(2) : '-'}</Td>
                      <Td><input type="number" value={row.wtsh ?? ''} onChange={(e) => handleLLChange(idx, 'wtsh', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td><input type="number" value={row.wtss ?? ''} onChange={(e) => handleLLChange(idx, 'wtss', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td className="font-mono bg-gray-50 text-center">{ww}</Td>
                      <Td className="font-mono bg-gray-50 text-center">{wss}</Td>
                      <Td className="font-mono bg-gray-50 text-center">{w}</Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
          
          <div className="bg-white border rounded-lg p-4 h-64 flex items-center justify-center mt-6">
            {calcResult.llPoints.length >= 2 ? (
              <Scatter 
                data={flowChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { type: 'logarithmic', title: { display: true, text: 'Número de Golpes (N)' }, min: 10, max: 100 },
                    y: { title: { display: true, text: 'Contenido de Agua (%)' } }
                  }
                }} 
              />
            ) : (
              <p className="text-gray-400 text-sm">Ingrese al menos 2 puntos para la curva de fluidez</p>
            )}
          </div>
        </div>

        {/* Límite Plástico y Carta */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-1">Límite Plástico</h3>
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <tr>
                  <Th>No. de tara</Th>
                  <Th>Wt</Th>
                  <Th>Wt+sh</Th>
                  <Th>Wt+ss</Th>
                  <Th>Ww</Th>
                  <Th>Wss</Th>
                  <Th>ω</Th>
                </tr>
              </Thead>
              <Tbody>
                {sample.atterberg.plasticLimit.map((row, idx) => {
                  const wt = Number(row.wt);
                  const wtsh = Number(row.wtsh);
                  const wtss = Number(row.wtss);
                  
                  let ww = '-';
                  let wss = '-';
                  let w = '-';
                  
                  if (row.wt !== '' && row.wtsh !== '' && row.wtss !== '') {
                    const wwVal = wtsh - wtss;
                    const wssVal = wtss - wt;
                    ww = wwVal.toFixed(2);
                    wss = wssVal.toFixed(2);
                    if (wssVal !== 0) {
                      w = ((wwVal / wssVal) * 100).toFixed(2);
                    }
                  }
                  
                  return (
                    <tr key={row.id}>
                      <Td>
                        <select value={row.taraNumber ?? ''} onChange={(e) => handlePLChange(idx, 'taraNumber', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                          {renderTaraOptions()}
                        </select>
                      </Td>
                      <Td className="font-mono bg-gray-50 text-center">{row.wt !== '' ? Number(row.wt).toFixed(2) : '-'}</Td>
                      <Td><input type="number" value={row.wtsh ?? ''} onChange={(e) => handlePLChange(idx, 'wtsh', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td><input type="number" value={row.wtss ?? ''} onChange={(e) => handlePLChange(idx, 'wtss', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td className="font-mono bg-gray-50 text-center">{ww}</Td>
                      <Td className="font-mono bg-gray-50 text-center">{wss}</Td>
                      <Td className="font-mono bg-gray-50 text-center">{w}</Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
          
          <h3 className="text-md font-medium text-gray-700 border-b pb-1 mt-6">Contracción Lineal</h3>
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <tr>
                  <Th>No. de barra</Th>
                  <Th>Linicial (cm)</Th>
                  <Th>Lfinal (cm)</Th>
                  <Th>LC (%)</Th>
                </tr>
              </Thead>
              <Tbody>
                {(sample.atterberg.linearShrinkage || []).map((row, idx) => {
                  let lc = 'N/A';
                  if (row.initialLength !== '' && row.finalLength !== '') {
                    const initial = Number(row.initialLength);
                    const final = Number(row.finalLength);
                    if (initial !== 0) {
                      lc = (((initial - final) / initial) * 100).toFixed(2);
                    }
                  }
                  
                  return (
                    <tr key={row.id}>
                      <Td><input type="text" value={row.barNumber ?? ''} onChange={(e) => handleLSChange(idx, 'barNumber', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td><input type="number" value={row.initialLength ?? ''} onChange={(e) => handleLSChange(idx, 'initialLength', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td><input type="number" value={row.finalLength ?? ''} onChange={(e) => handleLSChange(idx, 'finalLength', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td className="font-mono bg-gray-50 text-center">{lc}</Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>

          <h3 className="text-md font-medium text-gray-700 border-b pb-1 mt-6">Carta de Plasticidad</h3>
          <div className="bg-white border rounded-lg p-4 h-64 flex items-center justify-center">
            {calcResult.ll !== null && calcResult.ip !== null ? (
              <Scatter 
                data={plasticityChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { type: 'linear', title: { display: true, text: 'Límite Líquido (LL)' }, min: 0, max: 100 },
                    y: { type: 'linear', title: { display: true, text: 'Índice Plástico (IP)' }, min: 0, max: 60 }
                  }
                }} 
              />
            ) : (
              <p className="text-gray-400 text-sm">Complete LL y LP para ver la carta</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border mt-8">
        <h3 className="font-medium text-gray-700 border-b pb-4 mb-4">Clasificación y Resultados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Clasificación S.U.C.S. parte fina:</span>
              <span className="font-mono font-bold text-indigo-700">{calcResult.sucsAbbrev}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Según Terzaghi y Peck, el Material es de:</span>
              <span className="font-mono text-gray-800">{calcResult.sucsName}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">y de:</span>
              <span className="font-mono text-gray-800">{calcResult.compressibility}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Índice de Consistencia Ic :</span>
              <span className="font-mono">{calcResult.ic !== null ? calcResult.ic.toFixed(3) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Densidad relativa de sólidos:</span>
              <span className="font-mono">{calcResult.gs !== null ? calcResult.gs.toFixed(3) : '-'}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Límite Líquido (LL) :</span>
              <span className="font-mono">{calcResult.ll !== null ? calcResult.ll.toFixed(2) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Límite Plástico (LP) :</span>
              <span className="font-mono">{calcResult.pl !== null ? calcResult.pl.toFixed(2) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Índice de Plasticidad (IP) :</span>
              <span className="font-mono">{calcResult.ip !== null ? calcResult.ip.toFixed(2) : '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Límite de Contracción (LC) :</span>
              <span className="font-mono">{lsAverage !== null ? lsAverage.toFixed(2) : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-gray-600 font-medium">Contenido Natural (Wn) :</span>
              <span className="font-mono">{calcResult.wn !== null ? calcResult.wn.toFixed(2) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
