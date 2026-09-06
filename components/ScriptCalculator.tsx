'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, GitCompare, RotateCcw, ScrollText, Upload } from 'lucide-react';
import {
  Button,
  DocumentBar,
  RailSection,
  SavedIndicator,
  SectionLabel,
  Segmented,
  StatusBar,
  Workspace,
  type SavedState,
} from './shell';
import { ScriptEditor } from './editor/ScriptEditor';
import {
  ScriptEditorWithPronunciation,
  type EditorViewMode,
} from './editor/ScriptEditorWithPronunciation';
import { MetricsBlock } from './analysis/MetricsBlock';
import { SpeedControl } from './analysis/SpeedControl';
import { formatClock, formatCountDelta } from './analysis/format';
import { ExpansionSettings } from './settings/ExpansionSettings';
import { QuoteSection } from './pricing/QuoteSection';
import { DeltaTable } from './comparison/DeltaTable';
import { DiffPanes } from './comparison/DiffPanes';
import { LookedUpList, type Lookup } from './pronunciation/LookedUpList';
import { useScriptAnalysis } from '@/hooks/useScriptAnalysis';
import { useComparison } from '@/hooks/useComparison';
import { usePricing } from '@/hooks/usePricing';
import { useExpansionOptions } from '@/hooks/useExpansionOptions';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAutosave } from '@/hooks/useAutosave';
import { useScriptDocument } from '@/hooks/useScriptDocument';
import { ExpansionOptions } from '@/utils/expansionOptions';
import { PricingConfig, formatCurrency } from '@/utils/pricingTypes';

const DEFAULT_WPM = 150;
const MIN_WPM = 75;
const MAX_WPM = 160;

const PLACEHOLDER =
  'Paste your script. Numbers, dates, currencies and measurements are counted the way you would read them aloud — $1,250 counts as five words, not one.';

const SAMPLE_SCRIPT = `Introducing the Vantage Series. Engineered for the way you actually work — and priced at $1,250 for a limited time.

Every unit ships with a 10,000-hour warranty. That's a full 15% longer than anything else in its class.

Visit vantage.example.com to reserve yours before October 12th.`;

const SPEED_HELPER =
  'Set this to your own pace once and it sticks. Most read-throughs land between 140 and 160.';

const QUOTE_HELPER =
  'Add a script and set a rate to see a quote, then export it as a PDF with your client and project on it.';

const PRONUNCIATION_HELPER =
  'Only words in the North American dictionary respond to a click. Names and coined product words usually will not — mark those in the script yourself.';

/** Persisted analysis state. `script` is legacy — it now lives in the shared script document. */
interface PersistedState {
  script?: string;
  originalScript: string;
  revisedScript: string;
  comparisonMode: boolean;
  wpm: number;
  expansionOptions: ExpansionOptions;
  pricingConfig: PricingConfig;
  clientName: string;
  projectName: string;
  showPricing: boolean;
  showExpansionSettings: boolean;
}

export const ScriptCalculator = () => {
  // Clear localStorage before any state initialisation when the reset flag is set.
  if (typeof window !== 'undefined') {
    const isResetting = sessionStorage.getItem('vo-tools-resetting');
    if (isResetting === 'true') {
      sessionStorage.removeItem('vo-tools-resetting');
      localStorage.removeItem('vo-tools-state');
    }
  }

  const [persistedState, setPersistedState] = useLocalStorage<PersistedState | null>(
    'vo-tools-state',
    null,
  );

  const { title, text, setTitle, setText, reset: resetDocument } = useScriptDocument();

  const [comparisonMode, setComparisonMode] = useState<boolean>(
    persistedState?.comparisonMode ?? false,
  );
  const [originalScript, setOriginalScript] = useState<string>(
    persistedState?.originalScript ?? '',
  );
  const [revisedScript, setRevisedScript] = useState<string>(persistedState?.revisedScript ?? '');
  const [wpm, setWpm] = useState<number>(persistedState?.wpm ?? DEFAULT_WPM);

  const [viewMode, setViewMode] = useState<EditorViewMode>('edit');
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [docSaving, setDocSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // One-time migration of the old `script` blob field into the shared document.
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    const legacy = persistedState?.script;
    if (legacy && legacy.trim() && !text) {
      setText(legacy);
    }
    // Runs once on mount; the shared document is the source of truth afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedScript = useDebounce(text, 300);
  const debouncedOriginalScript = useDebounce(originalScript, 300);
  const debouncedRevisedScript = useDebounce(revisedScript, 300);

  const { expansionOptions, showExpansionSettings, toggleExpansionOption } = useExpansionOptions(
    persistedState?.expansionOptions,
  );

  const singleAnalysis = useScriptAnalysis(debouncedScript, wpm, expansionOptions);
  const originalAnalysis = useScriptAnalysis(debouncedOriginalScript, wpm, expansionOptions);
  const revisedAnalysis = useScriptAnalysis(debouncedRevisedScript, wpm, expansionOptions);
  const comparison = useComparison(debouncedOriginalScript, debouncedRevisedScript);

  const activeAnalysis = comparisonMode ? revisedAnalysis : singleAnalysis;

  const {
    pricingConfig,
    updatePricingConfig,
    showPricing,
    clientName,
    setClientName,
    projectName,
    setProjectName,
    quote,
    handleDownloadPDF,
  } = usePricing(
    activeAnalysis.wordCount,
    wpm,
    activeAnalysis.timeEstimate,
    persistedState?.pricingConfig,
    persistedState?.clientName,
    persistedState?.projectName,
    persistedState?.showPricing,
  );

  const saveState = useCallback(() => {
    setPersistedState({
      originalScript,
      revisedScript,
      comparisonMode,
      wpm,
      expansionOptions,
      pricingConfig,
      clientName,
      projectName,
      showPricing,
      showExpansionSettings,
    });
  }, [
    originalScript,
    revisedScript,
    comparisonMode,
    wpm,
    expansionOptions,
    pricingConfig,
    clientName,
    projectName,
    showPricing,
    showExpansionSettings,
    setPersistedState,
  ]);

  const { hasUnsavedChanges } = useAutosave(
    {
      originalScript,
      revisedScript,
      comparisonMode,
      wpm,
      expansionOptions,
      pricingConfig,
      clientName,
      projectName,
      showPricing,
      showExpansionSettings,
    },
    saveState,
    30000,
  );

  // The document persists on every keystroke; flash "saving" briefly so the edit is acknowledged.
  const handleTextChange = useCallback(
    (next: string) => {
      setText(next);
      setDocSaving(true);
    },
    [setText],
  );

  useEffect(() => {
    if (!docSaving) return;
    const timer = setTimeout(() => setDocSaving(false), 600);
    return () => clearTimeout(timer);
  }, [docSaving, text]);

  const hasAnyScript = Boolean(text.trim() || originalScript.trim() || revisedScript.trim());
  const isFirstRun = !comparisonMode && !text.trim();

  const savedState: SavedState = !hasAnyScript
    ? 'empty'
    : hasUnsavedChanges || docSaving
      ? 'saving'
      : 'saved';

  const toggleComparisonMode = (mode: 'single' | 'compare') => {
    const next = mode === 'compare';
    if (next === comparisonMode) return;
    if (next) {
      setOriginalScript(text);
      setRevisedScript('');
      setViewMode('edit');
    }
    setComparisonMode(next);
  };

  const handleReset = useCallback(() => {
    localStorage.removeItem('vo-tools-state');
    resetDocument();
    window.location.reload();
  }, [resetDocument]);

  const handlePasteFromClipboard = async () => {
    setImportError(null);
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText.trim()) {
        handleTextChange(clipboardText);
      } else {
        setImportError('Your clipboard is empty.');
      }
    } catch {
      setImportError('Clipboard access was blocked. Paste into the editor instead.');
    }
  };

  const handleOpenFile = (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => handleTextChange(String(reader.result ?? ''));
    reader.onerror = () => setImportError('That file could not be read.');
    reader.readAsText(file);
  };

  const rate = wpm || 1;
  const secondsFor = (wordCount: number, pauseTime: number) => ({
    wordsOnly: (wordCount / rate) * 60,
    total: (wordCount / rate) * 60 + pauseTime,
  });

  const singleSeconds = secondsFor(
    singleAnalysis.wordCount,
    singleAnalysis.pauseAnalysis.totalPauseTime,
  );
  const revisedSeconds = secondsFor(
    revisedAnalysis.wordCount,
    revisedAnalysis.pauseAnalysis.totalPauseTime,
  );

  const wordDelta = revisedAnalysis.wordCount - originalAnalysis.wordCount;

  const firstRunActions = useMemo(
    () => (
      <div className="px-7 pb-6">
        <div className="flex flex-wrap gap-2">
          <Button size={32} icon={FileText} onClick={handlePasteFromClipboard}>
            Paste from clipboard
          </Button>
          <Button size={32} icon={Upload} onClick={() => fileInputRef.current?.click()}>
            Open a .txt file
          </Button>
          <Button size={32} onClick={() => handleTextChange(SAMPLE_SCRIPT)}>
            Load a sample script
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="sr-only"
          aria-label="Open a .txt script file"
          onChange={(event) => {
            handleOpenFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        {importError ? <p className="mt-2 text-[11px] text-bad">{importError}</p> : null}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importError],
  );

  const documentIcon = comparisonMode
    ? GitCompare
    : viewMode === 'pronunciation' && text.trim()
      ? BookOpen
      : FileText;

  const main = comparisonMode ? (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="grid grid-cols-1 gap-px border-b border-line bg-line lg:grid-cols-2">
        <ScriptEditor
          compact
          label="ORIGINAL"
          height="h-[240px]"
          value={originalScript}
          onChange={setOriginalScript}
          placeholder="Paste your original script here..."
        />
        <ScriptEditor
          compact
          label="REVISED"
          labelTone="ink"
          height="h-[240px]"
          value={revisedScript}
          onChange={setRevisedScript}
          placeholder="Paste your revised script here..."
        />
      </div>

      <div className="flex h-[30px] shrink-0 items-center justify-between gap-3 border-b border-line bg-subtle px-[14px]">
        <SectionLabel>DIFFERENCE</SectionLabel>
        <div className="flex items-center gap-[14px] text-[11px] text-muted uppercase">
          <span className="flex items-center gap-[6px]">
            <span className="h-[9px] w-[9px] border border-ok bg-ok-bg" />
            ADDED
          </span>
          <span className="flex items-center gap-[6px]">
            <span className="h-[9px] w-[9px] border border-bad bg-bad-bg" />
            REMOVED
          </span>
        </div>
      </div>

      <DiffPanes
        originalSegments={comparison.diffSegments.originalSegments}
        revisedSegments={comparison.diffSegments.revisedSegments}
      />
    </div>
  ) : (
    <ScriptEditorWithPronunciation
      value={text}
      onChange={handleTextChange}
      placeholder={PLACEHOLDER}
      label="Script"
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onLookup={(word, pronunciation) =>
        setLookups((prev) => [
          { word, pronunciation },
          ...prev.filter((entry) => entry.word !== word),
        ])
      }
      bottomSlot={isFirstRun ? firstRunActions : undefined}
    />
  );

  const speedSection = (
    <SpeedControl
      wpm={wpm}
      setWpm={setWpm}
      minWpm={MIN_WPM}
      maxWpm={MAX_WPM}
      helper={isFirstRun ? SPEED_HELPER : undefined}
    />
  );

  const expansionSection = (
    <ExpansionSettings
      expansionOptions={expansionOptions}
      toggleExpansionOption={toggleExpansionOption}
    />
  );

  const showPronunciationRail = !comparisonMode && viewMode === 'pronunciation' && !!text.trim();

  const rail = comparisonMode ? (
    <>
      <DeltaTable
        originalWordCount={originalAnalysis.wordCount}
        revisedWordCount={revisedAnalysis.wordCount}
        originalPauseTime={originalAnalysis.pauseAnalysis.totalPauseTime}
        revisedPauseTime={revisedAnalysis.pauseAnalysis.totalPauseTime}
        wpm={wpm}
      />
      {speedSection}
      {expansionSection}
      <QuoteSection
        variant="compare"
        pricingConfig={pricingConfig}
        updatePricingConfig={updatePricingConfig}
        quote={quote}
        wordCount={revisedAnalysis.wordCount}
        clientName={clientName}
        setClientName={setClientName}
        projectName={projectName}
        setProjectName={setProjectName}
        handleDownloadPDF={handleDownloadPDF}
      />
    </>
  ) : showPronunciationRail ? (
    <>
      <MetricsBlock
        wordCount={singleAnalysis.wordCount}
        totalTime={formatClock(singleSeconds.total)}
        wordsOnlyTime={formatClock(singleSeconds.wordsOnly)}
        pauseTime={singleAnalysis.pauseAnalysis.totalPauseTime}
        pauseCount={singleAnalysis.pauseAnalysis.pauseCount}
      />
      <LookedUpList lookups={lookups} />
      <RailSection last>
        <p className="text-[12px] leading-[1.55] text-body">{PRONUNCIATION_HELPER}</p>
      </RailSection>
    </>
  ) : (
    <>
      <MetricsBlock
        wordCount={singleAnalysis.wordCount}
        totalTime={formatClock(singleSeconds.total)}
        wordsOnlyTime={formatClock(singleSeconds.wordsOnly)}
        pauseTime={singleAnalysis.pauseAnalysis.totalPauseTime}
        pauseCount={singleAnalysis.pauseAnalysis.pauseCount}
        empty={isFirstRun}
      />
      {speedSection}
      {expansionSection}
      {isFirstRun ? (
        <RailSection last label="QUOTE">
          <p className="text-[12px] leading-[1.55] text-muted">{QUOTE_HELPER}</p>
        </RailSection>
      ) : (
        <QuoteSection
          pricingConfig={pricingConfig}
          updatePricingConfig={updatePricingConfig}
          quote={quote}
          wordCount={singleAnalysis.wordCount}
          clientName={clientName}
          setClientName={setClientName}
          projectName={projectName}
          setProjectName={setProjectName}
          handleDownloadPDF={handleDownloadPDF}
        />
      )}
    </>
  );

  const statusLeft = comparisonMode
    ? [
        `${revisedAnalysis.wordCount} WORDS`,
        `${formatClock(revisedSeconds.total)} TOTAL`,
        `${formatCountDelta(wordDelta)} WORDS VS ORIGINAL`,
        `${wpm} WPM`,
      ]
    : [
        `${singleAnalysis.wordCount} WORDS`,
        `${formatClock(singleSeconds.total)} TOTAL`,
        `${wpm} WPM`,
        ...(isFirstRun
          ? []
          : [
              showPronunciationRail
                ? 'PRONUNCIATION VIEW'
                : `${singleAnalysis.pauseAnalysis.pauseCount} PAUSES`,
            ]),
      ];

  const statusRight = isFirstRun
    ? ['NOTHING TO SAVE YET']
    : showPronunciationRail
      ? [`${lookups.length} LOOKUPS`, savedState === 'saving' ? 'SAVING…' : 'AUTOSAVED']
      : [
          `QUOTE ${formatCurrency(quote?.finalPrice ?? 0)}`,
          savedState === 'saving' ? 'SAVING…' : 'AUTOSAVED',
        ];

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col bg-page">
      <DocumentBar
        icon={documentIcon}
        title={
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled script"
            aria-label="Script title"
            className="w-full max-w-[280px] border-none bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted sm:w-[280px]"
          />
        }
        meta={<SavedIndicator state={savedState} />}
        actions={
          <>
            <Segmented
              label="Analysis mode"
              value={comparisonMode ? 'compare' : 'single'}
              onChange={toggleComparisonMode}
              options={[
                { value: 'single', label: 'Single' },
                { value: 'compare', label: 'Compare', disabled: !hasAnyScript },
              ]}
            />
            {!comparisonMode && (
              <Link
                href="/teleprompter"
                className="inline-flex h-[26px] shrink-0 items-center gap-[6px] border border-line-strong bg-panel px-[10px] text-[11px] whitespace-nowrap text-muted"
              >
                <ScrollText width={13} height={13} aria-hidden="true" />
                Send to teleprompter
              </Link>
            )}
            <Button size={26} tone="muted" icon={RotateCcw} onClick={handleReset}>
              Reset
            </Button>
          </>
        }
      />

      <Workspace main={main} rail={rail} mainClassName="min-h-[420px] lg:min-h-[640px]" />

      <StatusBar left={statusLeft} right={statusRight} />
    </div>
  );
};
