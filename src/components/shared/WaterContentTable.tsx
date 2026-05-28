import React from 'react';
import { WaterContentRow, Sample } from '../../types';
import { calculateWaterContent } from '../../utils/calculations';
import { getTaraValue } from '../../utils/constants';
import { Table, Thead, Tbody, Th, Td } from '../ui/Table';
import { Input } from '../ui/Input';

interface Props {
  title: string;
  rows: WaterContentRow[];
  sample: Sample;
  average: number | null;
  colorTheme?: 'indigo' | 'emerald';
  onChange: (index: number, updates: Partial<WaterContentRow>) => void;
}

export default function WaterContentTable({ title, rows, sample, average, colorTheme = 'indigo', onChange }: Props) {
  const themeClasses = colorTheme === 'emerald'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', focus: 'focus:ring-emerald-500 focus:border-emerald-500' }
    : { bg: 'bg-indigo-50', text: 'text-indigo-700', focus: 'focus:ring-indigo-500 focus:border-indigo-500' };

  const renderTaraOptions = () => {
    const options = [<option key="empty" value=""></option>];
    for (let i = 1; i <= 255; i++) {
      options.push(<option key={i} value={i}>{i}</option>);
    }
    return options;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className={`text-sm font-medium px-3 py-1 rounded-full ${themeClasses.bg} ${themeClasses.text}`}>
          Promedio: {average !== null ? `${average.toFixed(2)}%` : '-'}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <Thead>
            <tr>
              <Th>Sondeo</Th>
              <Th>Muestra</Th>
              <Th>Profundidad (m)</Th>
              <Th>Longitud (cm)</Th>
              <Th>No. Cápsula</Th>
              <Th>Peso Cápsula (g)</Th>
              <Th>Wsh+C (g)</Th>
              <Th>Wss+C (g)</Th>
              <Th>Contenido (%)</Th>
            </tr>
          </Thead>
          <Tbody>
            {rows.map((row, idx) => {
              const result = calculateWaterContent(row);
              return (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <Td className="bg-gray-50 text-gray-600">{sample.boring || '-'}</Td>
                  <Td className="bg-gray-50 text-gray-600">{sample.sampleNumber || '-'}</Td>
                  <Td className="bg-gray-50 text-gray-600">
                    {sample.depthFrom && sample.depthTo ? `${sample.depthFrom} - ${sample.depthTo}` : '-'}
                  </Td>
                  <Td><Input value={row.centimeter ?? ''} onChange={(e) => onChange(idx, { centimeter: e.target.value })} className={themeClasses.focus} /></Td>
                  <Td>
                    <select
                      value={row.capsule ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const taraValue = getTaraValue(Number(val));
                        onChange(idx, { capsule: val, wCapsule: taraValue !== null ? taraValue.toString() : '' });
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm ${themeClasses.focus}`}
                    >
                      {renderTaraOptions()}
                    </select>
                  </Td>
                  <Td><Input type="number" step="0.01" value={row.wCapsule ?? ''} readOnly disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" /></Td>
                  <Td><Input type="number" step="0.01" value={row.wshC ?? ''} onChange={(e) => onChange(idx, { wshC: e.target.value })} className={themeClasses.focus} /></Td>
                  <Td><Input type="number" step="0.01" value={row.wssC ?? ''} onChange={(e) => onChange(idx, { wssC: e.target.value })} className={themeClasses.focus} /></Td>
                  <Td className="font-mono text-center bg-gray-50 text-gray-700 font-medium">{result !== null ? result.toFixed(2) : '-'}</Td>
                </tr>
              );
            })}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}
