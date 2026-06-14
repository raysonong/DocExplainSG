/**
 * Shared state for one analysis flow: the files the user selected, the mode
 * (explain an official letter vs summarize any document), and the result.
 *
 * A small Context store (rather than route params) keeps file data and the
 * result available across the Home -> Review -> Result screens without
 * serialising large payloads through navigation.
 */

import { createContext, useContext, useMemo, useState } from 'react';

import type { AnalysisMode, AnalysisResult, GenericSummary, SelectedFile } from '../types';

interface AnalysisState {
  files: SelectedFile[];
  addFiles: (files: SelectedFile[]) => void;
  removeFile: (uri: string) => void;
  clearFiles: () => void;

  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;

  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;

  summary: GenericSummary | null;
  setSummary: (summary: GenericSummary | null) => void;

  reset: () => void;
}

const AnalysisContext = createContext<AnalysisState | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('analyze');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [summary, setSummary] = useState<GenericSummary | null>(null);

  const value = useMemo<AnalysisState>(
    () => ({
      files,
      addFiles: (incoming) =>
        setFiles((prev) => {
          // De-dupe by uri so re-picking the same file doesn't double up.
          const seen = new Set(prev.map((f) => f.uri));
          return [...prev, ...incoming.filter((f) => !seen.has(f.uri))];
        }),
      removeFile: (uri) => setFiles((prev) => prev.filter((f) => f.uri !== uri)),
      clearFiles: () => setFiles([]),
      mode,
      setMode,
      result,
      setResult,
      summary,
      setSummary,
      reset: () => {
        setFiles([]);
        setResult(null);
        setSummary(null);
      },
    }),
    [files, mode, result, summary],
  );

  return (
    <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisState {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return ctx;
}
