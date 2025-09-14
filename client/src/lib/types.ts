export interface IssueDetectionResult {
  issueType: "pothole" | "garbage" | "streetlight" | "water_leakage" | "road_damage" | "other";
  confidence: number;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedDepartment: string;
}

export interface TranscriptionResult {
  transcription: string;
  language: string;
  extractedInfo: {
    issueType: string;
    location?: string;
    description: string;
    priority: string;
  };
}

export interface MapFilters {
  issueType: string;
  status: string;
  timePeriod: string;
}

export interface IssueFormData {
  title: string;
  description: string;
  issueType: string;
  priority: string;
  location: string;
  latitude?: number;
  longitude?: number;
  address: string;
  ward: string;
  reporterId?: string;
  language: string;
}
