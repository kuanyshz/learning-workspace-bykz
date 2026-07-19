export type FrustrationLevel = "low" | "medium" | "high" | "critical";

export type FrustrationEventType =
  | "input"
  | "backspace"
  | "delete"
  | "correction"
  | "paste"
  | "undo"
  | "error"
  | "pause";

export interface FrustrationEvent {
  type: FrustrationEventType;
  timestamp: number;
  content?: string;
  metadata?: {
    cursorPos?: number;
    lineNumber?: number;
    errorMessage?: string;
  };
}

export interface FrustrationStats {
  currentLevel: FrustrationLevel;
  eventCount: number;
  backspaceCount: number;
  correctionCount: number;
  editFrequency: number;
}

export interface FrustrationResponse {
  level: FrustrationLevel;
  shouldOfferHelp: boolean;
  suggestedAction?: string;
  hints?: string[];
  timestamp: number;
}
