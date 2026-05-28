import React from 'react';
import { Sample, WaterContentRow } from '../../types';
import { calculateAverageWaterContent } from '../../utils/calculations';
import WaterContentTable from '../shared/WaterContentTable';

interface WaterContentProps {
  sample: Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
}

export default function WaterContent({ sample, updateSample }: WaterContentProps) {
  const handleRowChange = (index: number, updates: Partial<WaterContentRow>) => {
    const newRows = [...sample.waterContent];
    newRows[index] = { ...newRows[index], ...updates };
    updateSample(sample.id, { waterContent: newRows });
  };

  const average = calculateAverageWaterContent(sample.waterContent);

  return (
    <WaterContentTable
      title="Contenido de Agua Natural (ASTM D2216)"
      rows={sample.waterContent}
      sample={sample}
      average={average}
      colorTheme="indigo"
      onChange={handleRowChange}
    />
  );
}
