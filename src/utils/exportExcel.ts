import XlsxPopulate from 'xlsx-populate';
import Papa from 'papaparse';
import { AppState, Sample } from '../types';
import { 
  calculateAverageWaterContent, 
  calculateSpecificGravityCalibration, 
  calculateSpecificGravityTest, 
  calculateGranulometry, 
  calculateAtterberg 
} from './calculations';
import { getTaraValue } from './constants';

const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwz49JHn8EHR0oIXAkc6Nr24sJs__sslPvT9d6yA8utyhxFcJi7EkEWF2G31095QYDOlQ/exec';

const WHITELIST: Record<string, string[]> = {
  'Datos': ['D8', 'D9', 'D10', 'J8', 'J9', 'J10', 'L10'],
  'w%': ['G7', 'H7', 'J7', 'K7'],
  'MO': ['G7', 'H7', 'J7', 'K7'],
  'Calibración de matraz 1': [
    'C15',
    'C17', 'C18', 'C19', 'C20', 'C21',
    'D17', 'D18', 'D19', 'D20', 'D21',
    'E17', 'E18', 'E19', 'E20', 'E21',
    'G17', 'G18', 'G19', 'G20', 'G21',
    'D24', 'E24', 'F24',
    'C28',
    'C30', 'C31', 'C32', 'C33', 'C34',
    'D30', 'D31', 'D32', 'D33', 'D34',
    'E30', 'E31', 'E32', 'E33', 'E34',
    'G30', 'G31', 'G32', 'G33', 'G34',
    'D37', 'E37', 'F37'
  ],
  'Gs': [
    'C16', 'C17', 'C18', 'C19', 'C20',
    'D16', 'D17', 'D18', 'D19', 'D20',
    'E16', 'E17', 'E18', 'E19', 'E20',
    'G16', 'G17', 'G18', 'G19', 'G20',
    'D23', 'E23', 'F23',
    'C29', 'C30', 'C31', 'C32', 'C33',
    'D29', 'D30', 'D31', 'D32', 'D33',
    'E29', 'E30', 'E31', 'E32', 'E33',
    'G29', 'G30', 'G31', 'G32', 'G33',
    'D36', 'E36', 'F36',
    'D40', 'D41',
    'E40', 'E41',
    'G40', 'G41',
    'H40', 'H41',
    'I40', 'I41',
    'J40', 'J41'
  ],
  'Granulometría': [
    'E14',
    'J17',
    'E23', 'E24', 'E25', 'E26', 'E27', 'E28', 'E29', 'E30',
    'J23',
    'J25', 'J26', 'J27', 'J28', 'J29', 'J30',
    'F32', 'F34', 'F35', 'G35', 'F36', 'G36',
    'L32', 'L33', 'L34', 'L35', 'L36',
    'J32', 'J33', 'J34', 'J35', 'J36'
  ],
  'Límites': [
    'C16', 'D16', 'F16', 'G16',
    'C17', 'D17', 'F17', 'G17',
    'C18', 'D18', 'F18', 'G18',
    'C19', 'D19', 'F19', 'G19',
    'C25', 'E25', 'F25',
    'C26', 'E26', 'F26',
    'L25', 'M25', 'N25',
    'L26', 'M26', 'N26'
  ]
};

const writeIfAllowedXlsxPopulate = (sheet: any, cellRef: string, value: any) => {
  if (!sheet) return;
  const sheetName = sheet.name();
  const allowedCells = WHITELIST[sheetName];
  
  if (!allowedCells || !allowedCells.includes(cellRef)) {
    return;
  }

  if (value !== null && value !== undefined && value !== '' && !Number.isNaN(value)) {
    sheet.cell(cellRef).value(value);
    console.log(`[Export] Escrito en hoja '${sheetName}', celda ${cellRef}: ${value}`);
  }
};

export const generateRawData = (state: AppState, samples: Sample[]) => {
  return samples.map(sample => {
    const project = state.projects.find(p => p.id === sample.projectId)?.name || 'Desconocido';
    
    const wAvg = calculateAverageWaterContent(sample.waterContent);
    const moAvg = calculateAverageWaterContent(sample.organicMatter);
    const cal1Result = calculateSpecificGravityCalibration(sample.specificGravity.calibration);
    const cal2Result = calculateSpecificGravityCalibration(sample.specificGravity.calibration2 || []);
    const gran = calculateGranulometry(sample);
    const att = calculateAtterberg(sample);

    const row: any = {
      'Proyecto': project,
      'Localización': sample.location,
      'Fecha': sample.date,
      'Sondeo': sample.boring,
      'Número de muestra': sample.sampleNumber,
      'Profundidad desde (m)': sample.depthFrom,
      'Profundidad hasta (m)': sample.depthTo,
    };

    // w%
    row['w% Longitud (cm)'] = sample.waterContent[0]?.centimeter || '';
    row['w% No. Cápsula'] = sample.waterContent[0]?.capsule || '';
    row['w% Wsh+C (g)'] = sample.waterContent[0]?.wshC || '';
    row['w% Wss+C (g)'] = sample.waterContent[0]?.wssC || '';
    
    let wResult = '';
    if (sample.waterContent[0]) {
        const wshC = Number(sample.waterContent[0].wshC);
        const wssC = Number(sample.waterContent[0].wssC);
        const wC = Number(sample.waterContent[0].wCapsule);
        if (wshC && wssC && wC) {
            wResult = (((wshC - wssC) / (wssC - wC)) * 100).toFixed(2);
        }
    }
    row['w% Resultado (%)'] = wResult;
    row['w% Promedio (%)'] = wAvg !== null ? wAvg.toFixed(2) : '';

    // MO
    row['MO Longitud (cm)'] = sample.organicMatter[0]?.centimeter || '';
    row['MO No. Cápsula'] = sample.organicMatter[0]?.capsule || '';
    row['MO Wsh+C (g)'] = sample.organicMatter[0]?.wshC || '';
    row['MO Wss+C (g)'] = sample.organicMatter[0]?.wssC || '';
    
    let moResult = '';
    if (sample.organicMatter[0]) {
        const wshC = Number(sample.organicMatter[0].wshC);
        const wssC = Number(sample.organicMatter[0].wssC);
        const wC = Number(sample.organicMatter[0].wCapsule);
        if (wshC && wssC && wC) {
            moResult = (((wshC - wssC) / (wssC - wC)) * 100).toFixed(2);
        }
    }
    row['MO Resultado (%)'] = moResult;
    row['MO Promedio (%)'] = moAvg !== null ? moAvg.toFixed(2) : '';

    // Gs Curva 1
    row['Curva 1 Matraz No.'] = sample.specificGravity.calibration1Flask || '';
    for (let i = 0; i < 5; i++) {
        row[`Curva 1 Temp. Sup. ${i+1}`] = sample.specificGravity.calibration[i]?.tempSup || '';
    }
    for (let i = 0; i < 5; i++) {
        row[`Curva 1 Temp. Med. ${i+1}`] = sample.specificGravity.calibration[i]?.tempMed || '';
    }
    for (let i = 0; i < 5; i++) {
        row[`Curva 1 Temp. Inf. ${i+1}`] = sample.specificGravity.calibration[i]?.tempInf || '';
    }
    for (let i = 0; i < 5; i++) {
        row[`Curva 1 Peso Wfw ${i+1}`] = sample.specificGravity.calibration[i]?.wfw || '';
    }
    row['Curva 1 Ecuación A'] = cal1Result?.equation[0] || '';
    row['Curva 1 Ecuación B'] = cal1Result?.equation[1] || '';
    row['Curva 1 Ecuación C'] = cal1Result?.equation[2] || '';

    // Gs Curva 2
    const cal2 = sample.specificGravity.calibration2 || [];
    row['Curva 2 Matraz No.'] = sample.specificGravity.calibration2Flask || '';
    for (let i = 0; i < 5; i++) {
        row[`Curva 2 Temp. Sup. ${i+1}`] = cal2[i]?.tempSup || '';
    }
    for (let i = 0; i < 5; i++) {
        row[`Curva 2 Temp. Med. ${i+1}`] = cal2[i]?.tempMed || '';
    }
    for (let i = 0; i < 5; i++) {
        row[`Curva 2 Temp. Inf. ${i+1}`] = cal2[i]?.tempInf || '';
    }
    for (let i = 0; i < 5; i++) {
        row[`Curva 2 Peso Wfw ${i+1}`] = cal2[i]?.wfw || '';
    }
    row['Curva 2 Ecuación A'] = cal2Result?.equation[0] || '';
    row['Curva 2 Ecuación B'] = cal2Result?.equation[1] || '';
    row['Curva 2 Ecuación C'] = cal2Result?.equation[2] || '';

    // Gs Determinación
    for (let i = 0; i < 2; i++) {
        row[`Determinación Temp${i+1} (°C)`] = sample.specificGravity.test[i]?.temp || '';
        row[`Determinación Wfws${i+1} (g)`] = sample.specificGravity.test[i]?.wfws || '';
        row[`Determinación Tara${i+1} No.`] = sample.specificGravity.test[i]?.tara || '';
        row[`Determinación Wt${i+1} (g)`] = sample.specificGravity.test[i]?.wt || '';
        row[`Determinación Wt+s${i+1} (g)`] = sample.specificGravity.test[i]?.wts || '';
    }
    row['Gs Calculado'] = att?.gs != null ? att.gs.toFixed(3) : '';

    // Granulometría
    row['Peso muestra inicial (g)'] = sample.granulometry.initialWeight || '';
    const sieves = ['3"', '2"', '1 1/2"', '1"', '3/4"', '1/2"', '3/8"', '1/4"', 'No. 4', 'No. 10', 'No. 20', 'No. 40', 'No. 60', 'No. 100', 'No. 200'];
    sieves.forEach(sieve => {
      const s = sample.granulometry.sieves.find(x => x.inch === sieve);
      row[`Retenido ${sieve} (g)`] = s?.retained || '';
    });
    
    let predominant = sample.granulometry.predominantMaterial;
    if (!predominant && gran) {
      if (gran.gravel > gran.sand && gran.gravel > gran.fines) predominant = 'Grava';
      else if (gran.sand > gran.gravel && gran.sand > gran.fines) predominant = 'Arena';
      else if (gran.fines > gran.gravel && gran.fines > gran.sand) predominant = 'Finos';
    }

    let sucsClass = sample.granulometry.groupSymbol;
    if (!sucsClass && att) {
      sucsClass = att.sucsAbbrev;
    }

    row['Mat. pasa No.4 corregido (g)'] = ''; // Placeholder
    row['Material Predominante'] = predominant || '';
    row['Clasificación S.U.C.S.'] = sucsClass || '';
    row['>3" %'] = gran?.gravel ?? '';
    row['Grava %'] = gran?.gravel ?? '';
    row['Arena %'] = gran?.sand ?? '';
    row['Finos %'] = gran?.fines ?? '';
    
    let sumPerc = '';
    if (gran && gran.gravel !== null && gran.sand !== null && gran.fines !== null) {
        sumPerc = (gran.gravel + gran.sand + gran.fines).toFixed(2);
    }
    row['Suma %'] = sumPerc;
    
    row['D10 (mm)'] = gran?.d10 || '';
    row['D30 (mm)'] = gran?.d30 || '';
    row['D60 (mm)'] = gran?.d60 || '';
    row['Cu'] = gran?.cu || '';
    row['Cc'] = gran?.cc || '';
    
    row['Grava bien graduada GW (F35)'] = sample.granulometry.gw1 || '';
    row['Grava bien graduada GW (G35)'] = sample.granulometry.gw2 || '';
    row['Arena bien graduada SW (F36)'] = sample.granulometry.sw1 || '';
    row['Arena bien graduada SW (G36)'] = sample.granulometry.sw2 || '';

    // Límites de Atterberg
    // LL
    for (let i = 0; i < 4; i++) {
        const ll = sample.atterberg.liquidLimit[i];
        row[`LL Golpe ${i+1}`] = ll?.blows || '';
        row[`LL Tara ${i+1}`] = ll?.taraNumber || '';
        row[`LL Wt+sh ${i+1}`] = ll?.wtsh || '';
        row[`LL Wt+ss ${i+1}`] = ll?.wtss || '';
        
        let wt = '';
        let ww = '';
        let wss = '';
        let w = '';
        if (ll && ll.taraNumber) {
            const taraVal = getTaraValue(Number(ll.taraNumber));
            if (taraVal) {
                wt = taraVal.toString();
                const wtsh = Number(ll.wtsh);
                const wtssVal = Number(ll.wtss);
                if (wtsh && wtssVal) {
                    ww = (wtsh - wtssVal).toFixed(2);
                    wss = (wtssVal - taraVal).toFixed(2);
                    if (Number(wss) > 0) {
                        w = ((Number(ww) / Number(wss)) * 100).toFixed(2);
                    }
                }
            }
        }
        row[`LL Wt ${i+1}`] = wt;
        row[`LL Ww ${i+1}`] = ww;
        row[`LL Wss ${i+1}`] = wss;
        row[`LL ω ${i+1}`] = w;
    }
    row['Límite Líquido'] = att?.ll ?? '';

    // LP
    for (let i = 0; i < 3; i++) {
        const lp = sample.atterberg.plasticLimit[i];
        row[`LP Tara ${i+1}`] = lp?.taraNumber || '';
        row[`LP Wt+sh ${i+1}`] = lp?.wtsh || '';
        row[`LP Wt+ss ${i+1}`] = lp?.wtss || '';
        
        let wt = '';
        let ww = '';
        let wss = '';
        let w = '';
        if (lp && lp.taraNumber) {
            const taraVal = getTaraValue(Number(lp.taraNumber));
            if (taraVal) {
                wt = taraVal.toString();
                const wtsh = Number(lp.wtsh);
                const wtssVal = Number(lp.wtss);
                if (wtsh && wtssVal) {
                    ww = (wtsh - wtssVal).toFixed(2);
                    wss = (wtssVal - taraVal).toFixed(2);
                    if (Number(wss) > 0) {
                        w = ((Number(ww) / Number(wss)) * 100).toFixed(2);
                    }
                }
            }
        }
        row[`LP Wt ${i+1}`] = wt;
        row[`LP Ww ${i+1}`] = ww;
        row[`LP Wss ${i+1}`] = wss;
        row[`LP ω ${i+1}`] = w;
    }
    row['Límite Plástico'] = att?.pl ?? '';
    row['Índice Plástico'] = att?.ip ?? '';

    // CL
    for (let i = 0; i < 2; i++) {
        const cl = sample.atterberg.linearShrinkage?.[i];
        row[`Contracción Lineal Linicial ${i+1}`] = cl?.initialLength || '';
        row[`Contracción Lineal Lfinal ${i+1}`] = cl?.finalLength || '';
        
        let lc = '';
        if (cl && cl.initialLength && cl.finalLength) {
            const li = Number(cl.initialLength);
            const lf = Number(cl.finalLength);
            if (li > 0 && lf > 0) {
                lc = (((li - lf) / li) * 100).toFixed(2);
            }
        }
        row[`Contracción Lineal LC% ${i+1}`] = lc;
    }
    
    row['Clasificación S.U.C.S. parte fina'] = att?.sucsName || '';

    return row;
  });
};

export const exportAllData = async (state: AppState, samples: Sample[]) => {
  const data = generateRawData(state, samples);
  if (data.length === 0) throw new Error('No hay datos para exportar.');

  const csv = Papa.unparse(data);
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Todos_los_datos_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportCurrentSample = async (state: AppState, sample: Sample, projectName: string) => {
  const data = generateRawData(state, [sample]);
  if (data.length === 0) throw new Error('No hay datos para exportar.');

  const csv = Papa.unparse(data);
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `${projectName}_${sample.boring}_${sample.sampleNumber}.csv`.replace(/[^a-z0-9_.-]/gi, '_');
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportPersonalizedReports = async (state: AppState, selectedSamples: Sample[]) => {
  await exportWithTemplate(state, selectedSamples);
};

const downloadBuffer = (buffer: ArrayBuffer, filename: string) => {
  const blob = new Blob([buffer], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseEquation = (eq: string) => {
  if (!eq) return { a: 0, b: 0, c: 0 };
  const cleanEq = eq.split('R²')[0].replace(/\s+/g, '');
  const match = cleanEq.match(/y=([+-]?[\d.]+)x²([+-]?[\d.]+)x([+-]?[\d.]+)/);
  if (match) {
    return {
      a: Number(match[1]),
      b: Number(match[2]),
      c: Number(match[3])
    };
  }
  return { a: 0, b: 0, c: 0 };
};

export const exportWithTemplate = async (state: AppState, samples: Sample[]) => {
  const templateUrl = 'https://raw.githubusercontent.com/lacosta-cpu/lab/9b15b28c7e34c5124154d3e3b155b92b785e4d87/pnatilla1.5.xlsm';

  
  let templateBuffer: ArrayBuffer;
  try {
    const response = await fetch(templateUrl);
    if (!response.ok) throw new Error('Error al descargar la plantilla');
    templateBuffer = await response.arrayBuffer();
  } catch (error) {
    throw new Error('No se pudo descargar la plantilla de Excel.');
  }

  for (const sample of samples) {
    const project = state.projects.find(p => p.id === sample.projectId)?.name || 'Desconocido';
    const workbook = await XlsxPopulate.fromDataAsync(templateBuffer);

    // 1. HOJA: Datos
    const wsDatos = workbook.sheet('Datos');
    if (wsDatos) {
      writeIfAllowedXlsxPopulate(wsDatos, 'D8', project);
      writeIfAllowedXlsxPopulate(wsDatos, 'D9', sample.location);
      writeIfAllowedXlsxPopulate(wsDatos, 'D10', sample.date);
      writeIfAllowedXlsxPopulate(wsDatos, 'J8', sample.boring);
      writeIfAllowedXlsxPopulate(wsDatos, 'J9', sample.sampleNumber);
      writeIfAllowedXlsxPopulate(wsDatos, 'J10', sample.depthFrom);
      writeIfAllowedXlsxPopulate(wsDatos, 'L10', sample.depthTo);
    }

    // 2. HOJA: w%
    const wsW = workbook.sheet('w%');
    if (wsW) {
      if (sample.waterContent[0]) {
        writeIfAllowedXlsxPopulate(wsW, 'G7', Number(sample.waterContent[0].centimeter));
        writeIfAllowedXlsxPopulate(wsW, 'H7', Number(sample.waterContent[0].capsule));
        writeIfAllowedXlsxPopulate(wsW, 'J7', Number(sample.waterContent[0].wshC));
        writeIfAllowedXlsxPopulate(wsW, 'K7', Number(sample.waterContent[0].wssC));
      }
    }

    // 3. HOJA: MO
    const wsMO = workbook.sheet('MO');
    if (wsMO) {
      if (sample.organicMatter[0]) {
        writeIfAllowedXlsxPopulate(wsMO, 'G7', Number(sample.organicMatter[0].centimeter));
        writeIfAllowedXlsxPopulate(wsMO, 'H7', Number(sample.organicMatter[0].capsule));
        writeIfAllowedXlsxPopulate(wsMO, 'J7', Number(sample.organicMatter[0].wshC));
        writeIfAllowedXlsxPopulate(wsMO, 'K7', Number(sample.organicMatter[0].wssC));
      }
    }

    // 4. HOJA: Calibración de matraz 1
    const wsCalib = workbook.sheet('Calibración de matraz 1');
    if (wsCalib) {
      // Curva 1
      writeIfAllowedXlsxPopulate(wsCalib, 'C15', "Calibración " + (sample.specificGravity.calibration1Flask || ''));
      
      if (sample.specificGravity.calibration[0]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'C17', Number(sample.specificGravity.calibration[0].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'C18', Number(sample.specificGravity.calibration[0].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'C19', Number(sample.specificGravity.calibration[0].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'C21', Number(sample.specificGravity.calibration[0].wfw));
      }
      if (sample.specificGravity.calibration[1]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'D17', Number(sample.specificGravity.calibration[1].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'D18', Number(sample.specificGravity.calibration[1].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'D19', Number(sample.specificGravity.calibration[1].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'D21', Number(sample.specificGravity.calibration[1].wfw));
      }
      if (sample.specificGravity.calibration[2]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'E17', Number(sample.specificGravity.calibration[2].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'E18', Number(sample.specificGravity.calibration[2].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'E19', Number(sample.specificGravity.calibration[2].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'E21', Number(sample.specificGravity.calibration[2].wfw));
      }
      if (sample.specificGravity.calibration[3]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'G17', Number(sample.specificGravity.calibration[3].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'G18', Number(sample.specificGravity.calibration[3].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'G19', Number(sample.specificGravity.calibration[3].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'G21', Number(sample.specificGravity.calibration[3].wfw));
      }

      const cal1Result = calculateSpecificGravityCalibration(sample.specificGravity.calibration);
      if (cal1Result) {
        writeIfAllowedXlsxPopulate(wsCalib, 'D24', cal1Result.equation[0]);
        writeIfAllowedXlsxPopulate(wsCalib, 'E24', cal1Result.equation[1]);
        writeIfAllowedXlsxPopulate(wsCalib, 'F24', cal1Result.equation[2]);
      }

      // Curva 2
      writeIfAllowedXlsxPopulate(wsCalib, 'C28', "Calibración " + (sample.specificGravity.calibration2Flask || ''));
      const cal2 = sample.specificGravity.calibration2 || [];
      if (cal2[0]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'C30', Number(cal2[0].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'C31', Number(cal2[0].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'C32', Number(cal2[0].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'C34', Number(cal2[0].wfw));
      }
      if (cal2[1]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'D30', Number(cal2[1].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'D31', Number(cal2[1].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'D32', Number(cal2[1].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'D34', Number(cal2[1].wfw));
      }
      if (cal2[2]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'E30', Number(cal2[2].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'E31', Number(cal2[2].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'E32', Number(cal2[2].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'E34', Number(cal2[2].wfw));
      }
      if (cal2[3]) {
        writeIfAllowedXlsxPopulate(wsCalib, 'G30', Number(cal2[3].tempSup));
        writeIfAllowedXlsxPopulate(wsCalib, 'G31', Number(cal2[3].tempMed));
        writeIfAllowedXlsxPopulate(wsCalib, 'G32', Number(cal2[3].tempInf));
        writeIfAllowedXlsxPopulate(wsCalib, 'G34', Number(cal2[3].wfw));
      }

      const cal2Result = calculateSpecificGravityCalibration(cal2);
      if (cal2Result) {
        writeIfAllowedXlsxPopulate(wsCalib, 'D37', cal2Result.equation[0]);
        writeIfAllowedXlsxPopulate(wsCalib, 'E37', cal2Result.equation[1]);
        writeIfAllowedXlsxPopulate(wsCalib, 'F37', cal2Result.equation[2]);
      }
    }

    // 5. HOJA: Gs
    const wsGs = workbook.sheet('Gs');
    if (wsGs) {
      // Curva 1
      for (let i = 0; i < 5; i++) {
        if (sample.specificGravity.calibration[i]) {
          writeIfAllowedXlsxPopulate(wsGs, `C${16+i}`, Number(sample.specificGravity.calibration[i].tempSup));
          writeIfAllowedXlsxPopulate(wsGs, `D${16+i}`, Number(sample.specificGravity.calibration[i].tempMed));
          writeIfAllowedXlsxPopulate(wsGs, `E${16+i}`, Number(sample.specificGravity.calibration[i].tempInf));
          writeIfAllowedXlsxPopulate(wsGs, `G${16+i}`, Number(sample.specificGravity.calibration[i].wfw));
        }
      }
      const cal1Result = calculateSpecificGravityCalibration(sample.specificGravity.calibration);
      if (cal1Result) {
        writeIfAllowedXlsxPopulate(wsGs, 'D23', cal1Result.equation[0]);
        writeIfAllowedXlsxPopulate(wsGs, 'E23', cal1Result.equation[1]);
        writeIfAllowedXlsxPopulate(wsGs, 'F23', cal1Result.equation[2]);
      }

      // Curva 2
      const cal2 = sample.specificGravity.calibration2 || [];
      for (let i = 0; i < 5; i++) {
        if (cal2[i]) {
          writeIfAllowedXlsxPopulate(wsGs, `C${29+i}`, Number(cal2[i].tempSup));
          writeIfAllowedXlsxPopulate(wsGs, `D${29+i}`, Number(cal2[i].tempMed));
          writeIfAllowedXlsxPopulate(wsGs, `E${29+i}`, Number(cal2[i].tempInf));
          writeIfAllowedXlsxPopulate(wsGs, `G${29+i}`, Number(cal2[i].wfw));
        }
      }
      const cal2Result = calculateSpecificGravityCalibration(cal2);
      if (cal2Result) {
        writeIfAllowedXlsxPopulate(wsGs, 'D36', cal2Result.equation[0]);
        writeIfAllowedXlsxPopulate(wsGs, 'E36', cal2Result.equation[1]);
        writeIfAllowedXlsxPopulate(wsGs, 'F36', cal2Result.equation[2]);
      }

      // Determinación de Densidad Relativa
      if (sample.specificGravity.test[0]) {
        writeIfAllowedXlsxPopulate(wsGs, 'D40', Number(sample.specificGravity.test[0].flask));
        writeIfAllowedXlsxPopulate(wsGs, 'E40', Number(sample.specificGravity.test[0].temp));
        writeIfAllowedXlsxPopulate(wsGs, 'G40', Number(sample.specificGravity.test[0].wfws));
        writeIfAllowedXlsxPopulate(wsGs, 'H40', Number(sample.specificGravity.test[0].tara));
        writeIfAllowedXlsxPopulate(wsGs, 'I40', Number(sample.specificGravity.test[0].wt));
        writeIfAllowedXlsxPopulate(wsGs, 'J40', Number(sample.specificGravity.test[0].wts));
      }
      if (sample.specificGravity.test[1]) {
        writeIfAllowedXlsxPopulate(wsGs, 'D41', Number(sample.specificGravity.test[1].flask));
        writeIfAllowedXlsxPopulate(wsGs, 'E41', Number(sample.specificGravity.test[1].temp));
        writeIfAllowedXlsxPopulate(wsGs, 'G41', Number(sample.specificGravity.test[1].wfws));
        writeIfAllowedXlsxPopulate(wsGs, 'H41', Number(sample.specificGravity.test[1].tara));
        writeIfAllowedXlsxPopulate(wsGs, 'I41', Number(sample.specificGravity.test[1].wt));
        writeIfAllowedXlsxPopulate(wsGs, 'J41', Number(sample.specificGravity.test[1].wts));
      }
    }

    // 6. HOJA: Granulometría
    const wsGran = workbook.sheet('Granulometría');
    if (wsGran) {
      writeIfAllowedXlsxPopulate(wsGran, 'E14', Number(sample.granulometry.initialWeight));
      writeIfAllowedXlsxPopulate(wsGran, 'J17', ''); // Mat. pasa No. 4 corregido
      
      const s3 = sample.granulometry.sieves.find(s => s.inch === '3"');
      const s2 = sample.granulometry.sieves.find(s => s.inch === '2"');
      const s1_5 = sample.granulometry.sieves.find(s => s.inch === '1 1/2"');
      const s1 = sample.granulometry.sieves.find(s => s.inch === '1"');
      const s3_4 = sample.granulometry.sieves.find(s => s.inch === '3/4"');
      const s1_2 = sample.granulometry.sieves.find(s => s.inch === '1/2"');
      const s3_8 = sample.granulometry.sieves.find(s => s.inch === '3/8"');
      const s1_4 = sample.granulometry.sieves.find(s => s.inch === '1/4"');
      const s4 = sample.granulometry.sieves.find(s => s.inch === 'No. 4');

      if (s3) writeIfAllowedXlsxPopulate(wsGran, 'E23', Number(s3.retained));
      if (s2) writeIfAllowedXlsxPopulate(wsGran, 'E24', Number(s2.retained));
      if (s1_5) writeIfAllowedXlsxPopulate(wsGran, 'E25', Number(s1_5.retained));
      if (s1) writeIfAllowedXlsxPopulate(wsGran, 'E26', Number(s1.retained));
      if (s3_4) writeIfAllowedXlsxPopulate(wsGran, 'E27', Number(s3_4.retained));
      if (s1_2) writeIfAllowedXlsxPopulate(wsGran, 'E28', Number(s1_2.retained));
      if (s3_8) writeIfAllowedXlsxPopulate(wsGran, 'E29', Number(s3_8.retained));
      if (s1_4) writeIfAllowedXlsxPopulate(wsGran, 'E30', Number(s1_4.retained));
      if (s4) writeIfAllowedXlsxPopulate(wsGran, 'J23', Number(s4.retained));
      
      const s10 = sample.granulometry.sieves.find(s => s.inch === 'No. 10');
      const s20 = sample.granulometry.sieves.find(s => s.inch === 'No. 20');
      const s40 = sample.granulometry.sieves.find(s => s.inch === 'No. 40');
      const s60 = sample.granulometry.sieves.find(s => s.inch === 'No. 60');
      const s100 = sample.granulometry.sieves.find(s => s.inch === 'No. 100');
      const s200 = sample.granulometry.sieves.find(s => s.inch === 'No. 200');

      if (s10) writeIfAllowedXlsxPopulate(wsGran, 'J25', Number(s10.retained));
      if (s20) writeIfAllowedXlsxPopulate(wsGran, 'J26', Number(s20.retained));
      if (s40) writeIfAllowedXlsxPopulate(wsGran, 'J27', Number(s40.retained));
      if (s60) writeIfAllowedXlsxPopulate(wsGran, 'J28', Number(s60.retained));
      if (s100) writeIfAllowedXlsxPopulate(wsGran, 'J29', Number(s100.retained));
      if (s200) writeIfAllowedXlsxPopulate(wsGran, 'J30', Number(s200.retained));
      
      const granResult = calculateGranulometry(sample);
      const attResult = calculateAtterberg(sample);
      
      let predominant = sample.granulometry.predominantMaterial;
      if (!predominant && granResult) {
        if (granResult.gravel > granResult.sand && granResult.gravel > granResult.fines) predominant = 'Grava';
        else if (granResult.sand > granResult.gravel && granResult.sand > granResult.fines) predominant = 'Arena';
        else if (granResult.fines > granResult.gravel && granResult.fines > granResult.sand) predominant = 'Finos';
      }

      let sucsClass = sample.granulometry.groupSymbol;
      if (!sucsClass && attResult) {
        sucsClass = attResult.sucsAbbrev;
      }

      if (granResult) {
        writeIfAllowedXlsxPopulate(wsGran, 'F32', predominant);
        writeIfAllowedXlsxPopulate(wsGran, 'F34', sucsClass);
        writeIfAllowedXlsxPopulate(wsGran, 'L32', granResult.gravel != null ? granResult.gravel / 100 : null); 
        writeIfAllowedXlsxPopulate(wsGran, 'L33', granResult.gravel != null ? granResult.gravel / 100 : null);
        writeIfAllowedXlsxPopulate(wsGran, 'L34', granResult.sand != null ? granResult.sand / 100 : null);
        writeIfAllowedXlsxPopulate(wsGran, 'L35', granResult.fines != null ? granResult.fines / 100 : null);
        
        if (granResult.gravel != null && granResult.sand != null && granResult.fines != null) {
           writeIfAllowedXlsxPopulate(wsGran, 'L36', (granResult.gravel + granResult.sand + granResult.fines) / 100);
        }

        writeIfAllowedXlsxPopulate(wsGran, 'J32', granResult.d10);
        writeIfAllowedXlsxPopulate(wsGran, 'J33', granResult.d30);
        writeIfAllowedXlsxPopulate(wsGran, 'J34', granResult.d60);
        writeIfAllowedXlsxPopulate(wsGran, 'J35', granResult.cu);
        writeIfAllowedXlsxPopulate(wsGran, 'J36', granResult.cc);
      }

      if (sample.granulometry.gw1) writeIfAllowedXlsxPopulate(wsGran, 'F35', Number(sample.granulometry.gw1));
      if (sample.granulometry.gw2) writeIfAllowedXlsxPopulate(wsGran, 'G35', Number(sample.granulometry.gw2));
      if (sample.granulometry.sw1) writeIfAllowedXlsxPopulate(wsGran, 'F36', Number(sample.granulometry.sw1));
      if (sample.granulometry.sw2) writeIfAllowedXlsxPopulate(wsGran, 'G36', Number(sample.granulometry.sw2));
    }

    // 7. HOJA: Límites
    const wsLimites = workbook.sheet('Límites');
    if (wsLimites) {
      // Límite Líquido
      for (let i = 0; i < 4; i++) {
        const row = sample.atterberg.liquidLimit[i];
        if (row) {
          const rowNum = 16 + i;
          writeIfAllowedXlsxPopulate(wsLimites, `C${rowNum}`, Number(row.blows));
          writeIfAllowedXlsxPopulate(wsLimites, `D${rowNum}`, Number(row.taraNumber));
          writeIfAllowedXlsxPopulate(wsLimites, `F${rowNum}`, Number(row.wtsh));
          writeIfAllowedXlsxPopulate(wsLimites, `G${rowNum}`, Number(row.wtss));
        }
      }

      // Límite Plástico
      for (let i = 0; i < 2; i++) {
        const row = sample.atterberg.plasticLimit[i];
        if (row) {
          const rowNum = 25 + i;
          writeIfAllowedXlsxPopulate(wsLimites, `C${rowNum}`, Number(row.taraNumber));
          writeIfAllowedXlsxPopulate(wsLimites, `E${rowNum}`, Number(row.wtsh));
          writeIfAllowedXlsxPopulate(wsLimites, `F${rowNum}`, Number(row.wtss));
        }
      }

      // Contracción Lineal
      const lsRows = sample.atterberg.linearShrinkage || [];
      for (let i = 0; i < 2; i++) {
        const row = lsRows[i];
        if (row) {
          const rowNum = 25 + i;
          writeIfAllowedXlsxPopulate(wsLimites, `L${rowNum}`, Number(row.barNumber) || (i + 1));
          writeIfAllowedXlsxPopulate(wsLimites, `M${rowNum}`, Number(row.initialLength));
          writeIfAllowedXlsxPopulate(wsLimites, `N${rowNum}`, Number(row.finalLength));
        }
      }
    }

    const buffer = await workbook.outputAsync();
    const filename = `${project}_${sample.boring}_${sample.sampleNumber}.xlsm`.replace(/[^a-z0-9_.-]/gi, '_');
    downloadBuffer(buffer, filename);

    // Sincronizar con Google Sheets automáticamente después de exportar
    try {
      const rawDataArray = generateRawData(state, [sample]);
      if (rawDataArray.length > 0) {
        await syncToGoogleSheets(rawDataArray[0]);
      }
    } catch (err) {
      console.error('Error al sincronizar muestra con Google Sheets', err);
    }
  }
};

/**
 * Sincroniza los datos de una muestra con Google Sheets a través de la Web App de Apps Script.
 * @param sampleData Objeto con los datos de la muestra generados por generateRawData
 */
export const syncToGoogleSheets = async (sampleData: any) => {
  try {
    console.log('[Export] Iniciando sincronización con Google Sheets...');
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: {
        // Es fundamental usar text/plain para evitar el preflight de CORS con Google Apps Script
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(sampleData),
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.result === 'success') {
      console.log('[Export] Sincronización exitosa con Google Sheets');
    } else {
      console.error('[Export] Error en la sincronización:', result.message);
      throw new Error(result.message || 'Error desconocido en la sincronización');
    }
  } catch (error) {
    console.error('[Export] Error de red al sincronizar con Google Sheets:', error);
    throw error;
  }
};

