
export interface LocationInfo {
  origin: string;
  destination: string;
}

export interface GroundingSource {
  title?: string;
  uri: string;
}

export interface CalculationResult {
  text: string;
  sources: GroundingSource[];
}

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
}
