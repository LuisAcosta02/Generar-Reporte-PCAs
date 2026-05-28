import React from 'react';
import { Sample, WaterContentRow } from '../../types';
import { calculateAverageWaterContent } from '../../utils/calculations';
import WaterContentTable from '../shared/WaterContentTable';

interface OrganicMatterProps {
  sample: Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
}

export default function OrganicMatter({ sample, updateSample }: OrganicMatterProps) {
  const handleRowChange = (index: number, updates: Partial<WaterContentRow>) => {
    const newRows = [...sample.organicMatter];
    newRows[index] = { ...newRows[index], ...updates };
    updateSample(sample.id, { organicMatter: newRows });
  };

  const average = calculateAverageWaterContent(sample.organicMatter);

  return (
    <WaterContentTable
      title="Materia Orgánica"
      rows={sample.organicMatter}
      sample={sample}
      average={average}
      colorTheme="emerald"
      onChange={handleRowChange}
    />
  );
}
