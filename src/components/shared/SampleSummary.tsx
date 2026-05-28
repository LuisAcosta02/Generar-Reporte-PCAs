import React from 'react';
import { Sample } from '../../types';
import { calculateAverageWaterContent, calculateSpecificGravityCalibration, calculateSpecificGravityTest, calculateGranulometry, calculateAtterberg, calculateSUCS } from '../../utils/calculations';

export default function SampleSummary({ sample }: { sample: Sample }) {
  const wNat = calculateAverageWaterContent(sample.waterContent);
  const calib = calculateSpecificGravityCalibration(sample.specificGravity.calibration);
  const gsTests = sample.specificGravity.test.map(row => calculateSpecificGravityTest(row, calib ? calib.equation : null)).filter(r => r !== null) as number[];
  const gs = gsTests.length > 0 ? gsTests.reduce((a, b) => a + b, 0) / gsTests.length : null;
  const gran = calculateGranulometry(sample);
  const att = calculateAtterberg(sample);

  const pasa4 = gran?.results.find(r => r.inch === 'No. 4')?.passingPercent;
  const pasa40 = gran?.results.find(r => r.inch === 'No. 40')?.passingPercent;
  const pasa200 = gran?.results.find(r => r.inch === 'No. 200')?.passingPercent;
  
  const grava = pasa4 !== undefined ? 100 - pasa4 : null;
  const arena = pasa4 !== undefined && pasa200 !== undefined ? pasa4 - pasa200 : null;
  const finos = pasa200 !== undefined ? pasa200 : null;

  const retained3 = gran?.results.find(r => r.inch === '3"')?.retained;
  const initialWeight = sample.granulometry.initialWeight ? Number(sample.granulometry.initialWeight) : null;
  const fragmentosRoca = (retained3 !== undefined && retained3 !== '' && initialWeight && initialWeight > 0) 
    ? (Number(retained3) / initialWeight) * 100 
    : null;

  const sucs = calculateSUCS(finos, grava, arena, att?.ll ?? null, att?.ip ?? null, gran?.cu ?? null, gran?.cc ?? null);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Resumen de Resultados</h2>
      <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex flex-col"><span className="text-gray-500">Retenido 3"</span><span className="font-mono font-medium">{retained3 || '-'} g</span></div>
        <div className="flex flex-col"><span className="text-gray-500">% Pasa No.4</span><span className="font-mono font-medium">{pasa4 !== undefined ? pasa4.toFixed(2) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">% Pasa No.40</span><span className="font-mono font-medium">{pasa40 !== undefined ? pasa40.toFixed(2) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">% Pasa No.200</span><span className="font-mono font-medium">{pasa200 !== undefined ? pasa200.toFixed(2) : '-'}</span></div>
        
        <div className="flex flex-col"><span className="text-gray-500">Grava (%)</span><span className="font-mono font-medium">{grava !== null ? grava.toFixed(2) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Arena (%)</span><span className="font-mono font-medium">{arena !== null ? arena.toFixed(2) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Finos (%)</span><span className="font-mono font-medium">{finos !== null ? finos.toFixed(2) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Fragmentos Roca (%)</span><span className="font-mono font-medium">{fragmentosRoca !== null ? fragmentosRoca.toFixed(2) : '-'}</span></div>
        
        <div className="flex flex-col"><span className="text-gray-500">Límite Líquido</span><span className="font-mono font-medium">{att?.ll !== null ? att!.ll.toFixed(1) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Límite Plástico</span><span className="font-mono font-medium">{att?.pl !== null ? att!.pl.toFixed(1) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Índice Plástico</span><span className="font-mono font-medium">{att?.ip !== null ? att!.ip.toFixed(1) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Límite Contracción</span><span className="font-mono font-medium">N/A</span></div>
        
        <div className="flex flex-col"><span className="text-gray-500">Densidad Relativa (Gs)</span><span className="font-mono font-medium">{gs !== null ? gs.toFixed(3) : '-'}</span></div>
        <div className="flex flex-col"><span className="text-gray-500">Contenido Agua Natural</span><span className="font-mono font-medium">{wNat !== null ? wNat.toFixed(2) : '-'}</span></div>
        <div className="flex flex-col col-span-2"><span className="text-gray-500">Clasificación SUCS</span><span className="font-mono font-medium text-indigo-600">{sucs}</span></div>
      </div>
    </div>
  );
}
