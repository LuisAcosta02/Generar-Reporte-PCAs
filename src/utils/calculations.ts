import regression from 'regression';
import { Sample, WaterContentRow, SpecificGravityCalibrationRow, SpecificGravityTestRow, SieveRow, AtterbergRow } from '../types';

export const calculateWaterContent = (row: WaterContentRow): number | null => {
  if (row.wshC !== '' && row.wssC !== '' && row.wCapsule !== '') {
    const wshC = Number(row.wshC);
    const wssC = Number(row.wssC);
    const wCapsule = Number(row.wCapsule);
    if (wssC - wCapsule !== 0) {
      return ((wshC - wssC) / (wssC - wCapsule)) * 100;
    }
  }
  return null;
};

export const calculateAverageWaterContent = (rows: WaterContentRow[]): number | null => {
  const contents = rows.map(calculateWaterContent).filter(val => val !== null) as number[];
  if (contents.length === 0) return null;
  return contents.reduce((a, b) => a + b, 0) / contents.length;
};

export const calculateSpecificGravityCalibration = (rows: SpecificGravityCalibrationRow[]) => {
  const points: [number, number][] = [];
  rows.forEach(row => {
    if (row.tempSup !== '' && row.tempMed !== '' && row.tempInf !== '' && row.wfw !== '') {
      const avgTemp = (Number(row.tempSup) + Number(row.tempMed) + Number(row.tempInf)) / 3;
      points.push([avgTemp, Number(row.wfw)]);
    }
  });
  
  if (points.length < 3) return null; // Need at least 3 points for quadratic
  
  const result = regression.polynomial(points, { order: 2, precision: 6 });
  return {
    equation: result.equation, // [a, b, c] for ax^2 + bx + c
    r2: result.r2,
    points: result.points
  };
};

export const calculateSpecificGravityTest = (row: SpecificGravityTestRow, calibrationEquation: number[] | null): number | null => {
  if (!calibrationEquation || row.temp === '' || row.wfws === '' || row.tara === '' || row.wts === '' || row.wt === '') return null;
  
  const temp = Number(row.temp);
  const wfws = Number(row.wfws);
  const tara = Number(row.tara);
  const wts = Number(row.wts);
  const wt = Number(row.wt);
  
  // y = ax^2 + bx + c
  const [a, b, c] = calibrationEquation;
  const wfw = a * temp * temp + b * temp + c;
  const ws = wts - wt;
  
  if (wfw + ws - wfws === 0) return null;
  return ws / (wfw + ws - wfws);
};

export const calculateGranulometry = (sample: Sample) => {
  const { initialWeight, taraWeight, sieves, subsample2Weight } = sample.granulometry;
  if (initialWeight === '' || taraWeight === '') return null;
  
  const initial = Number(initialWeight);
  const tara = Number(taraWeight);
  
  // Find index of No. 4 sieve
  const no4Index = sieves.findIndex(s => s.inch === 'No. 4');
  if (no4Index === -1) return null;

  // Calculate Retenido No. 4
  let retainedNo4 = 0;
  for (let i = 0; i <= no4Index; i++) {
    retainedNo4 += Number(sieves[i].retained) || 0;
  }

  const passingNo4 = initial - retainedNo4;

  // Calculate water content of passing No. 4
  let waterContentPass4 = 0;
  const wet = initial;
  const dry = initial - tara;
  if (dry !== 0) {
    waterContentPass4 = ((wet - dry) / dry) * 100;
  }

  const passingNo4Corrected = Number((passingNo4 / (1 + waterContentPass4 / 100)).toFixed(3));
  const totalSampleCorrected = retainedNo4 + passingNo4Corrected;

  const sub2Weight = Number(subsample2Weight) || 0;

  let currentPassing = 100;
  const results = sieves.map((sieve, index) => {
    const retained = Number(sieve.retained) || 0;
    let partial = 0;
    let scaledPartial = 0;

    if (index <= no4Index) {
      // Coarse sieves (3" to No. 4)
      partial = totalSampleCorrected > 0 ? (retained / totalSampleCorrected) * 100 : 0;
      scaledPartial = partial;
    } else {
      // Fine sieves (No. 10 to 200 and Fondo)
      partial = sub2Weight > 0 ? (retained / sub2Weight) * 100 : 0;
      scaledPartial = totalSampleCorrected > 0 ? partial * (passingNo4Corrected / totalSampleCorrected) : 0;
    }

    currentPassing -= scaledPartial;
    // Ensure passing doesn't go below 0 due to floating point
    const passingPercent = sieve.inch === 'Fondo' ? 0 : Math.max(0, currentPassing);

    return { ...sieve, partial, passingPercent };
  });

  // Interpolate D10, D30, D60
  const getD = (percent: number) => {
    for (let i = 0; i < results.length - 1; i++) {
      if (results[i].inch === 'Fondo' || results[i+1].inch === 'Fondo') continue;
      const p1 = results[i].passingPercent;
      const p2 = results[i + 1].passingPercent;
      const d1 = results[i].opening;
      const d2 = results[i + 1].opening;

      if (p1 >= percent && p2 <= percent) {
        if (p1 === p2) return d1;
        if (d1 > 0 && d2 > 0) {
          const logD1 = Math.log10(d1);
          const logD2 = Math.log10(d2);
          const logD = logD1 + ((percent - p1) / (p2 - p1)) * (logD2 - logD1);
          return Math.pow(10, logD);
        }
      }
    }
    return null;
  };

  const d10 = getD(10);
  const d30 = getD(30);
  const d60 = getD(60);

  const cu = (d60 !== null && d10 !== null && d10 > 0) ? d60 / d10 : null;
  const cc = (d30 !== null && d10 !== null && d60 !== null && d10 > 0 && d60 > 0) ? (d30 * d30) / (d10 * d60) : null;
  
  // Calculate fractions
  const sieve3inch = results.find(s => s.inch === '3"');
  const sieveNo4 = results.find(s => s.inch === 'No. 4');
  const sieveNo200 = results.find(s => s.inch === 'No. 200');

  const passing3inch = sieve3inch ? sieve3inch.passingPercent : 100;
  const passingNo4Percent = sieveNo4 ? sieveNo4.passingPercent : 100;
  const passingNo200Percent = sieveNo200 ? sieveNo200.passingPercent : 0;

  const greaterThan3Inch = 100 - passing3inch;
  const gravel = passing3inch - passingNo4Percent;
  const sand = passingNo4Percent - passingNo200Percent;
  const fines = passingNo200Percent;
  const sumFractions = greaterThan3Inch + gravel + sand + fines;

  return { 
    results, 
    retainedNo4, 
    passingNo4, 
    waterContentPass4, 
    passingNo4Corrected, 
    totalSampleCorrected,
    d10, d30, d60, cu, cc,
    greaterThan3Inch, gravel, sand, fines, sumFractions
  };
};

export const calculateSUCS = (
  finos: number | null,
  grava: number | null,
  arena: number | null,
  ll: number | null,
  ip: number | null,
  cu: number | null,
  cc: number | null
): string => {
  if (finos === null || grava === null || arena === null) {
    return '-';
  }

  const isGravel = grava > arena;
  const isWellGraded = (isGravel) 
    ? (cu !== null && cc !== null && cu >= 4 && cc >= 1 && cc <= 3)
    : (cu !== null && cc !== null && cu >= 6 && cc >= 1 && cc <= 3);

  if (finos >= 50) {
    if (ll === null || ip === null) return '-';
    const aLine = 0.73 * (ll - 20);
    if (ll >= 50) {
      return ip >= aLine ? 'CH' : 'MH';
    } else {
      if (ip >= aLine && ip > 7) return 'CL';
      if (ip >= aLine && ip >= 4 && ip <= 7) return 'CL-ML';
      return 'ML';
    }
  }

  if (finos < 5) {
    if (isGravel) {
      return isWellGraded ? 'GW' : 'GP';
    } else {
      return isWellGraded ? 'SW' : 'SP';
    }
  } else if (finos > 12) {
    const getFinesSymbol = () => {
      if (ll === null || ip === null) return 'M/C';
      const aLine = 0.73 * (ll - 20);
      if (ip >= aLine && ip > 7) return 'C';
      if (ip >= aLine && ip >= 4 && ip <= 7) return 'C-M';
      return 'M';
    };
    const finesSymbol = getFinesSymbol();
    if (isGravel) {
      return `G${finesSymbol}`;
    } else {
      return `S${finesSymbol}`;
    }
  } else {
    // 5 <= finos <= 12
    const getFinesSymbol = () => {
      if (ll === null || ip === null) return 'M/C';
      const aLine = 0.73 * (ll - 20);
      if (ip >= aLine && ip > 7) return 'C';
      if (ip >= aLine && ip >= 4 && ip <= 7) return 'C-M';
      return 'M';
    };
    const finesSymbol = getFinesSymbol();
    if (isGravel) {
      return isWellGraded ? `GW-G${finesSymbol}` : `GP-G${finesSymbol}`;
    } else {
      return isWellGraded ? `SW-S${finesSymbol}` : `SP-S${finesSymbol}`;
    }
  }
};

export const calculateAtterberg = (sample: Sample) => {
  const llPoints: [number, number][] = [];
  const llContents: number[] = [];
  sample.atterberg.liquidLimit.forEach(row => {
    if (row.blows !== '' && row.wt !== '' && row.wtsh !== '' && row.wtss !== '') {
      const wsh = Number(row.wtsh);
      const wss = Number(row.wtss);
      const wt = Number(row.wt);
      const w = ((wsh - wss) / (wss - wt)) * 100;
      llPoints.push([Number(row.blows), w]);
      llContents.push(w);
    }
  });
  
  let llEquation = null;
  if (llPoints.length >= 2) {
    const result = regression.logarithmic(llPoints, { precision: 4 });
    llEquation = result;
  }
  
  const ll = llContents.length > 0 ? llContents.reduce((a, b) => a + b, 0) / llContents.length : null;
  
  const plContents = sample.atterberg.plasticLimit.map(row => {
    if (row.wt !== '' && row.wtsh !== '' && row.wtss !== '') {
      const wsh = Number(row.wtsh);
      const wss = Number(row.wtss);
      const wt = Number(row.wt);
      return ((wsh - wss) / (wss - wt)) * 100;
    }
    return null;
  }).filter(val => val !== null) as number[];
  
  const pl = plContents.length > 0 ? plContents.reduce((a, b) => a + b, 0) / plContents.length : null;
  
  const ip = (ll !== null && pl !== null) ? ll - pl : null;

  const wn = calculateAverageWaterContent(sample.waterContent);

  const testSource = sample.specificGravity.testSource || '1';
  const calKey = testSource === '1' ? 'calibration' : 'calibration2';
  const calRows = sample.specificGravity[calKey] || [];
  const activeResult = calculateSpecificGravityCalibration(calRows);
  
  let gsSum = 0;
  let gsCount = 0;
  if (activeResult) {
    sample.specificGravity.test.forEach(row => {
      const temp = Number(row.temp);
      const wfws = Number(row.wfws);
      const tara = Number(row.tara);
      const wts = Number(row.wts);
      const wt = Number(row.wt);

      if (row.temp !== '' && row.wfws !== '' && row.tara !== '' && row.wts !== '' && row.wt !== '') {
        const wfw = activeResult.equation[0] * temp * temp + activeResult.equation[1] * temp + activeResult.equation[2];
        const ws = wts - wt;
        if (wfw + ws - wfws !== 0) {
          const gs = ws / (wfw + ws - wfws);
          gsSum += gs;
          gsCount++;
        }
      }
    });
  }
  const gs = gsCount > 0 ? gsSum / gsCount : null;

  const ic = (ll !== null && wn !== null && ip !== null && ip !== 0) ? (ll - wn) / ip : null;

  let sucsAbbrev = '-';
  let sucsName = '-';
  let compressibility = '-';

  const granResult = calculateGranulometry(sample);
  const hasOrganic = sample.organicMatter && sample.organicMatter.some(r => r.wCapsule !== '' && r.wshC !== '' && r.wssC !== '');

  const sieveNo200Raw = sample.granulometry.sieves.find(s => s.inch === 'No. 200');
  const hasP200 = sieveNo200Raw && sieveNo200Raw.retained !== '';

  if (granResult && hasP200 && ll !== null && ip !== null) {
    const fines = granResult.fines;
    const sieveNo4 = granResult.results.find(s => s.inch === 'No. 4');
    const passingNo4 = sieveNo4 ? sieveNo4.passingPercent : 100;
    const cu = granResult.cu;
    const cc = granResult.cc;

    if (fines <= 50) {
      // Suelos gruesos (G)
      const isGravel = passingNo4 < 50;
      
      if (isGravel) {
        // Gravas (G)
        if (fines < 5) {
          if (cu !== null && cc !== null && cu >= 4 && cc >= 1 && cc <= 3) sucsAbbrev = 'GW';
          else sucsAbbrev = 'GP';
        } else if (fines > 12) {
          if (ip < 4) sucsAbbrev = 'GM';
          else if (ip > 7) sucsAbbrev = 'GC';
          else if (ip >= 4 && ip <= 7) sucsAbbrev = 'GM-GC';
        } else {
          // 5 to 12
          const isWellGraded = (cu !== null && cc !== null && cu >= 4 && cc >= 1 && cc <= 3);
          const prefix = isWellGraded ? 'GW' : 'GP';
          let suffix = 'GM';
          if (ip > 7) suffix = 'GC';
          else if (ip >= 4 && ip <= 7) suffix = 'GM-GC';
          sucsAbbrev = `${prefix}-${suffix}`;
        }
      } else {
        // Arenas (S)
        if (fines < 5) {
          if (cu !== null && cc !== null && cu >= 6 && cc >= 1 && cc <= 3) sucsAbbrev = 'SW';
          else sucsAbbrev = 'SP';
        } else if (fines > 12) {
          if (ip < 4) sucsAbbrev = 'SM';
          else if (ip > 7) sucsAbbrev = 'SC';
          else if (ip >= 4 && ip <= 7) sucsAbbrev = 'SM-SC';
        } else {
          // 5 to 12
          const isWellGraded = (cu !== null && cc !== null && cu >= 6 && cc >= 1 && cc <= 3);
          const prefix = isWellGraded ? 'SW' : 'SP';
          let suffix = 'SM';
          if (ip > 7) suffix = 'SC';
          else if (ip >= 4 && ip <= 7) suffix = 'SM-SC';
          sucsAbbrev = `${prefix}-${suffix}`;
        }
      }
    } else {
      // Suelos finos (F)
      if (ll < 50) {
        if (ip > 7) sucsAbbrev = 'CL';
        else if (ip <= 4) sucsAbbrev = 'ML';
        else sucsAbbrev = 'CL-ML';
      } else {
        if (ip > 7) sucsAbbrev = 'CH';
        else if (ip < 4) sucsAbbrev = 'MH';
        else sucsAbbrev = 'CH-MH';
      }
    }

    const descriptions: Record<string, string> = {
      'CL': 'Arcilla de baja plasticidad',
      'ML': 'Limo de baja plasticidad',
      'CH': 'Arcilla de alta plasticidad',
      'MH': 'Limo de alta plasticidad',
      'OL': 'Arcilla orgánica',
      'OH': 'Arcilla orgánica',
      'GW': 'Grava bien graduada',
      'GP': 'Grava mal graduada',
      'GM': 'Grava limosa',
      'GC': 'Grava arcillosa',
      'SW': 'Arena bien graduada',
      'SP': 'Arena mal graduada',
      'SM': 'Arena limosa',
      'SC': 'Arena arcillosa',
    };

    if (descriptions[sucsAbbrev]) {
      sucsName = descriptions[sucsAbbrev];
    } else if (sucsAbbrev.includes('-')) {
      const dualDesc: Record<string, string> = {
        'GW-GM': 'Grava bien graduada con limo',
        'GW-GC': 'Grava bien graduada con arcilla',
        'GP-GM': 'Grava mal graduada con limo',
        'GP-GC': 'Grava mal graduada con arcilla',
        'SW-SM': 'Arena bien graduada con limo',
        'SW-SC': 'Arena bien graduada con arcilla',
        'SP-SM': 'Arena mal graduada con limo',
        'SP-SC': 'Arena mal graduada con arcilla',
        'CL-ML': 'Arcilla limosa de baja plasticidad',
        'CH-MH': 'Arcilla limosa de alta plasticidad',
        'GM-GC': 'Grava limo-arcillosa',
        'SM-SC': 'Arena limo-arcillosa'
      };
      sucsName = dualDesc[sucsAbbrev] || sucsAbbrev;
    }

    if (sucsAbbrev.includes('L')) {
      compressibility = 'Baja plasticidad';
    } else if (sucsAbbrev.includes('H')) {
      compressibility = 'Alta plasticidad';
    } else {
      compressibility = '-';
    }
  }

  return { ll, pl, ip, llEquation, llPoints, wn, gs, ic, sucsAbbrev, sucsName, compressibility };
};
