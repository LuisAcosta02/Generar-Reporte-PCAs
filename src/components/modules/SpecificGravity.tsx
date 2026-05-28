import React from 'react';
import { Sample, SpecificGravityTestRow, SpecificGravityCalibrationRow } from '../../types';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Table, Thead, Tbody, Th, Td } from '../ui/Table';
import { calculateSpecificGravityCalibration } from '../../utils/calculations';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface SpecificGravityProps {
  sample: Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
}

const FLASK_OPTIONS = Array.from({length: 14}, (_, i) => `Matraz No. ${i+1}`);

export default function SpecificGravity({ sample, updateSample }: SpecificGravityProps) {
  const handleTestChange = (index: number, field: keyof SpecificGravityTestRow, value: string) => {
    const newRows = [...sample.specificGravity.test];
    newRows[index] = { ...newRows[index], [field]: value };
    updateSample(sample.id, { specificGravity: { ...sample.specificGravity, test: newRows } });
  };

  const handleCalibrationChange = (calNum: 1 | 2, index: number, field: keyof SpecificGravityCalibrationRow, value: string) => {
    const calKey = calNum === 1 ? 'calibration' : 'calibration2';
    const newRows = [...(sample.specificGravity[calKey] || [])];
    
    // Ensure array is long enough
    while (newRows.length <= index) {
      newRows.push({ id: `row-${newRows.length}`, tempSup: '', tempMed: '', tempInf: '', wfw: '' });
    }
    
    newRows[index] = { ...newRows[index], [field]: value };
    updateSample(sample.id, { specificGravity: { ...sample.specificGravity, [calKey]: newRows } });
  };

  const handleFlaskChange = (calNum: 1 | 2, value: string) => {
    const calKey = calNum === 1 ? 'calibration1Flask' : 'calibration2Flask';
    updateSample(sample.id, { specificGravity: { ...sample.specificGravity, [calKey]: value } });
  };

  const handleSourceChange = (value: string) => {
    updateSample(sample.id, { specificGravity: { ...sample.specificGravity, testSource: value as '1' | '2' } });
  };

  // Ensure default values exist
  const flask1Id = sample.specificGravity.calibration1Flask || 'Matraz No. 1';
  const flask2Id = sample.specificGravity.calibration2Flask || 'Matraz No. 2';
  const testSource = sample.specificGravity.testSource || '1';

  const getPaddedRows = (rows?: SpecificGravityCalibrationRow[]) => {
    const current = rows || [];
    const padded = [...current];
    while (padded.length < 5) {
      padded.push({ id: `empty-${padded.length}`, tempSup: '', tempMed: '', tempInf: '', wfw: '' });
    }
    return padded;
  };

  const cal1Rows = getPaddedRows(sample.specificGravity.calibration);
  const cal2Rows = getPaddedRows(sample.specificGravity.calibration2);

  const cal1Result = calculateSpecificGravityCalibration(cal1Rows);
  const cal2Result = calculateSpecificGravityCalibration(cal2Rows);

  const activeResult = testSource === '1' ? cal1Result : cal2Result;
  const activeFlaskId = testSource === '1' ? flask1Id : flask2Id;

  let gsSum = 0;
  let gsCount = 0;

  const testResults = sample.specificGravity.test.map(row => {
    const temp = Number(row.temp);
    const wfws = Number(row.wfws);
    const tara = Number(row.tara);
    const wts = Number(row.wts);
    const wt = Number(row.wt);

    if (row.temp === '' || row.wfws === '' || row.tara === '' || row.wts === '' || row.wt === '' || !activeResult) return null;

    const wfw = activeResult.equation[0] * temp * temp + activeResult.equation[1] * temp + activeResult.equation[2];
    const ws = wts - wt;

    if (wfw + ws - wfws === 0) return null;
    const gs = ws / (wfw + ws - wfws);
    gsSum += gs;
    gsCount++;
    return gs;
  });

  const averageGs = gsCount > 0 ? gsSum / gsCount : null;

  const renderCalibration = (calNum: 1 | 2, flaskId: string, rows: SpecificGravityCalibrationRow[], result: ReturnType<typeof calculateSpecificGravityCalibration>) => {
    const fitData = [];
    if (result) {
      for(let x=15; x<=30; x++) fitData.push({x, y: result.equation[0]*x*x + result.equation[1]*x + result.equation[2]});
    }

    const chartData = {
      datasets: [
        {
          label: 'Datos',
          data: result ? result.points.map(p => ({ x: p[0], y: p[1] })) : [],
          backgroundColor: 'rgba(79, 70, 229, 1)',
          pointRadius: 5,
        },
        {
          label: 'Curva',
          data: fitData,
          borderColor: 'rgba(79, 70, 229, 0.5)',
          showLine: true,
          fill: false,
          pointRadius: 0,
        }
      ]
    };

    return (
      <div className="bg-white p-6 rounded shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b pb-2 gap-2">
          <h3 className="text-lg font-bold">A. Calibración de Matraz (Curva {calNum})</h3>
          <select 
            value={flaskId} 
            onChange={(e) => handleFlaskChange(calNum, e.target.value)}
            className="border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            {FLASK_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Table>
              <Thead>
                <tr>
                  <Th>Temp. Sup. (°C)</Th>
                  <Th>Temp. Med. (°C)</Th>
                  <Th>Temp. Inf. (°C)</Th>
                  <Th>Promedio (°C)</Th>
                  <Th>Peso Wfw (g)</Th>
                </tr>
              </Thead>
              <Tbody>
                {rows.map((row, i) => {
                  const avg = (row.tempSup !== '' && row.tempMed !== '' && row.tempInf !== '') 
                    ? ((Number(row.tempSup) + Number(row.tempMed) + Number(row.tempInf)) / 3).toFixed(2) 
                    : '-';
                  return (
                    <tr key={row.id || i}>
                      <Td><input type="number" step="0.1" value={row.tempSup ?? ''} onChange={(e) => handleCalibrationChange(calNum, i, 'tempSup', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td><input type="number" step="0.1" value={row.tempMed ?? ''} onChange={(e) => handleCalibrationChange(calNum, i, 'tempMed', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td><input type="number" step="0.1" value={row.tempInf ?? ''} onChange={(e) => handleCalibrationChange(calNum, i, 'tempInf', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                      <Td className="bg-gray-50 text-center font-mono text-gray-600">{avg}</Td>
                      <Td><input type="number" step="0.01" value={row.wfw ?? ''} onChange={(e) => handleCalibrationChange(calNum, i, 'wfw', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
            <div className="mt-4 p-3 bg-indigo-50 rounded text-sm text-indigo-900">
              <p className="font-semibold mb-1">Ecuación de Ajuste:</p>
              {result ? (
                <>
                  <p className="font-mono">
                    y = {result.equation[0].toFixed(5)}x² 
                    {result.equation[1] >= 0 ? ' + ' : ' - '}{Math.abs(result.equation[1]).toFixed(4)}x 
                    {result.equation[2] >= 0 ? ' + ' : ' - '}{Math.abs(result.equation[2]).toFixed(2)}
                  </p>
                  <p className="font-mono mt-1">R² = {result.r2}</p>
                </>
              ) : (
                <p className="text-gray-500 italic">Ingrese al menos 3 filas con datos para calcular la ecuación.</p>
              )}
            </div>
          </div>
          <div className="h-64">
            <Scatter 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { title: { display: true, text: 'Temperatura Promedio (°C)' } },
                  y: { title: { display: true, text: 'Peso Wfw (g)' } }
                }
              }} 
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">Gravedad Específica (ASTM C128)</h2>
      </div>

      {renderCalibration(1, flask1Id, cal1Rows, cal1Result)}
      {renderCalibration(2, flask2Id, cal2Rows, cal2Result)}

      <div className="bg-white p-6 rounded shadow mt-8">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-bold">B. Determinación de Densidad Relativa</h3>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Usar ecuación de:</label>
            <select 
              value={testSource} 
              onChange={(e) => handleSourceChange(e.target.value)}
              className="border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="1">Curva 1 ({flask1Id})</option>
              <option value="2">Curva 2 ({flask2Id})</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <tr>
                <Th>Matraz</Th>
                <Th>Temp (°C)</Th>
                <Th>Wfw (g) calc.</Th>
                <Th>Wfws (g)</Th>
                <Th>Tara No.</Th>
                <Th>Wt (g)</Th>
                <Th>Wt+s (g)</Th>
                <Th>Ws (g)</Th>
                <Th>Gs</Th>
              </tr>
            </Thead>
            <Tbody>
              {sample.specificGravity.test.map((row, idx) => {
                const temp = Number(row.temp);
                let wfw = '';
                if (row.temp !== '' && activeResult) {
                  wfw = (activeResult.equation[0] * temp * temp + activeResult.equation[1] * temp + activeResult.equation[2]).toFixed(2);
                }
                
                const wt = Number(row.wt);
                const wts = Number(row.wts);
                let ws = '';
                if (row.wt !== '' && row.wts !== '') {
                  ws = (wts - wt).toFixed(2);
                }

                return (
                  <tr key={row.id}>
                    <Td>
                      <select 
                        value={row.flask ?? ''} 
                        onChange={(e) => handleTestChange(idx, 'flask', e.target.value)}
                        className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="">Seleccione...</option>
                        {Array.from({length: 15}, (_, i) => (
                          <option key={i+1} value={i+1}>{i+1}</option>
                        ))}
                      </select>
                    </Td>
                    <Td><input type="number" step="0.1" value={row.temp ?? ''} onChange={(e) => handleTestChange(idx, 'temp', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                    <Td className="font-mono bg-gray-50 text-center font-bold text-indigo-800">{wfw}</Td>
                    <Td><input type="number" step="0.01" value={row.wfws ?? ''} onChange={(e) => handleTestChange(idx, 'wfws', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                    <Td><input type="text" value={row.tara ?? ''} onChange={(e) => handleTestChange(idx, 'tara', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                    <Td><input type="number" step="0.01" value={row.wt ?? ''} onChange={(e) => handleTestChange(idx, 'wt', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                    <Td><input type="number" step="0.01" value={row.wts ?? ''} onChange={(e) => handleTestChange(idx, 'wts', e.target.value)} className="w-full border-gray-300 rounded p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500" /></Td>
                    <Td className="font-mono bg-gray-50 text-center">{ws}</Td>
                    <Td className="font-mono bg-indigo-50 text-center font-medium text-indigo-700">
                      {testResults[idx] !== null ? testResults[idx]!.toFixed(3) : '-'}
                    </Td>
                  </tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
        <div className="mt-4 text-right">
          <span className="text-lg font-bold text-indigo-700">
            Promedio Gs: {averageGs !== null ? averageGs.toFixed(3) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
