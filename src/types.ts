export interface Project {
  id: string;
  name: string;
}

export interface WaterContentRow {
  id: string;
  centimeter: string;
  capsule: string;
  wCapsule: string;
  wshC: string;
  wssC: string;
}

export interface SpecificGravityCalibrationRow {
  id: string;
  tempSup: string;
  tempMed: string;
  tempInf: string;
  wfw: string;
}

export interface SpecificGravityTestRow {
  id: string;
  flask: number;
  temp: string;
  wfws: string;
  tara: string;
  wt: string;
  wts: string;
}

export interface SieveRow {
  id: string;
  inch: string;
  opening: number;
  retained: string | number;
}

export interface AtterbergRow {
  id: string;
  blows: string;
  taraNumber?: string;
  wt: string;
  wtsh: string;
  wtss: string;
}

export interface LinearShrinkageRow {
  id: string;
  barNumber: string;
  initialLength: string;
  finalLength: string;
}

export interface Sample {
  id: string;
  projectId: string;
  location: string;
  date: string;
  boring: string;
  sampleNumber: string;
  depthFrom: string;
  depthTo: string;
  
  waterContent: WaterContentRow[];
  organicMatter: WaterContentRow[];
  
  specificGravity: {
    calibration: SpecificGravityCalibrationRow[];
    calibration2: SpecificGravityCalibrationRow[];
    test: SpecificGravityTestRow[];
    calibration1Flask?: string;
    calibration2Flask?: string;
    testSource?: '1' | '2';
  };
  
  granulometry: {
    initialWeight: string;
    taraWeight: string;
    sieves: SieveRow[];
    pass4WetWeight: string;
    pass4DryWeight: string;
    pass4TaraWeight: string;
    subsample2Weight: string;
    predominantMaterial?: string;
    groupSymbol?: string;
    sucsClass?: string;
    gw1?: string;
    gw2?: string;
    sw1?: string;
    sw2?: string;
  };
  
  atterberg: {
    liquidLimit: AtterbergRow[];
    plasticLimit: AtterbergRow[];
    linearShrinkage: LinearShrinkageRow[];
  };
}

export interface AppState {
  projects: Project[];
  samples: Sample[];
  currentSampleId: string | null;
  lastSaved: string | null;
}
