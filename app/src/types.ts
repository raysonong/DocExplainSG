/**
 * Mirrors the backend `AnalysisResult` schema (api/app/schemas.py).
 * Keep these in sync with the Pydantic models.
 */

export type AppLanguage = 'en' | 'zh' | 'ms' | 'ta';

export type DocumentType =
  | 'cpf'
  | 'hdb'
  | 'iras'
  | 'mom'
  | 'insurance'
  | 'town_council'
  | 'utility'
  | 'other';

export type Urgency = 'none' | 'low' | 'medium' | 'high';

export interface Deadline {
  date: string;
  description: string;
  is_urgent: boolean;
}

export interface Action {
  description: string;
  linked_deadline_index: number | null;
  amount: string | null;
}

export interface ReferenceNumber {
  label: string;
  value: string;
}

export interface GlossaryItem {
  term: string;
  explanation: string;
}

export interface AnalysisResult {
  language: AppLanguage;
  document_type: DocumentType;
  issuer: string;
  title: string;
  summary: string;
  urgency: Urgency;
  deadlines: Deadline[];
  actions: Action[];
  reference_numbers: ReferenceNumber[];
  glossary: GlossaryItem[];
  confidence_notes: string | null;
  disclaimer: string;
}

/** A file the user picked or captured, normalised across the pickers. */
export interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  /** True for PDFs (rendered as an icon rather than an image thumbnail). */
  isPdf: boolean;
}
