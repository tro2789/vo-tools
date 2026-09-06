'use client';

import { Download } from 'lucide-react';
import { RailSection } from '@/components/shell';
import {
  PricingConfig,
  PricingModel,
  QuoteResult,
  formatCurrency,
} from '@/utils/pricingTypes';

interface QuoteSectionProps {
  /** `compare` prices the revised script and shows the base / minimum breakdown. */
  variant?: 'single' | 'compare';
  pricingConfig: PricingConfig;
  updatePricingConfig: <K extends keyof PricingConfig>(key: K, value: PricingConfig[K]) => void;
  quote: QuoteResult | null;
  wordCount: number;
  clientName: string;
  setClientName: (name: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  handleDownloadPDF: () => void;
}

const RATE_FIELD: Record<
  PricingModel,
  { key: 'ratePerWord' | 'ratePerMinute' | 'projectRate'; label: string; step: string }
> = {
  per_word: { key: 'ratePerWord', label: 'Rate / word', step: '0.01' },
  per_minute: { key: 'ratePerMinute', label: 'Rate / minute', step: '1' },
  per_project: { key: 'projectRate', label: 'Project rate', step: '1' },
};

const INPUT =
  'h-6 w-[70px] border border-line-strong bg-panel px-[6px] text-right text-[11px] text-ink outline-none';

function NumberRow({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-[12px] text-muted">{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className={INPUT}
      />
    </label>
  );
}

export const QuoteSection = ({
  variant = 'single',
  pricingConfig,
  updatePricingConfig,
  quote,
  wordCount,
  clientName,
  setClientName,
  projectName,
  setProjectName,
  handleDownloadPDF,
}: QuoteSectionProps) => {
  const rate = RATE_FIELD[pricingConfig.model];

  const baseLabel = (() => {
    switch (pricingConfig.model) {
      case 'per_word':
        return `Base (${wordCount} × ${formatCurrency(pricingConfig.ratePerWord)})`;
      case 'per_minute':
        return `Base (${Math.ceil(quote?.readingMinutes ?? 0)} × ${formatCurrency(pricingConfig.ratePerMinute)})`;
      default:
        return 'Base (project rate)';
    }
  })();

  return (
    <RailSection
      last
      label={variant === 'compare' ? 'QUOTE · REVISED' : 'QUOTE'}
      labelRight={
        <select
          aria-label="Pricing model"
          value={pricingConfig.model}
          onChange={(event) => updatePricingConfig('model', event.target.value as PricingModel)}
          className="h-6 border border-line-strong bg-panel px-1 text-[11px] text-body outline-none"
        >
          <option value="per_word">Per word</option>
          <option value="per_minute">Per minute</option>
          <option value="per_project">Per project</option>
        </select>
      }
    >
      <div className="flex flex-col gap-[6px]">
        <NumberRow
          label={rate.label}
          value={pricingConfig[rate.key]}
          step={rate.step}
          onChange={(value) => updatePricingConfig(rate.key, value)}
        />
        <NumberRow
          label="Minimum fee"
          value={pricingConfig.minimumFee}
          step="1"
          onChange={(value) => updatePricingConfig('minimumFee', value)}
        />
        <NumberRow
          label="Revision surcharge"
          value={pricingConfig.revisionSurcharge}
          step="1"
          onChange={(value) => updatePricingConfig('revisionSurcharge', value)}
        />
      </div>

      {variant === 'compare' ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] text-muted">{baseLabel}</span>
            <span className="text-[12px] text-body">{formatCurrency(quote?.basePrice ?? 0)}</span>
          </div>
          {quote?.includesMinimumFee && (
            <div className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
              <span className="text-[12px] text-muted">Minimum fee applied</span>
              <span className="text-[12px] text-body">{formatCurrency(quote.minimumFee)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">Initial recording</span>
            <span className="text-[20px] font-semibold text-ink">
              {formatCurrency(quote?.finalPrice ?? 0)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] text-muted">Revision / pickup</span>
            <span className="text-[12px] text-body">
              {formatCurrency(quote?.revisionPrice ?? 0)}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-line pt-[10px]">
            <span className="text-[13px] font-semibold text-ink">Initial recording</span>
            <span className="text-[20px] font-semibold text-ink">
              {formatCurrency(quote?.finalPrice ?? 0)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 text-[11px] text-muted uppercase">
            <span>
              {quote?.includesMinimumFee ? 'MIN FEE APPLIED · ' : ''}
              BASE {formatCurrency(quote?.basePrice ?? 0)}
            </span>
            <span>PICKUP {formatCurrency(quote?.revisionPrice ?? 0)}</span>
          </div>
        </>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Client"
            aria-label="Client name for the quote PDF"
            className="h-[26px] min-w-0 flex-1 border border-line-strong bg-panel px-2 text-[12px] text-ink outline-none placeholder:text-muted"
          />
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project"
            aria-label="Project name for the quote PDF"
            className="h-[26px] min-w-0 flex-1 border border-line-strong bg-panel px-2 text-[12px] text-ink outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={!quote}
          className={`flex w-full items-center justify-center gap-2 bg-button text-[12px] font-medium text-panel disabled:cursor-not-allowed disabled:opacity-50 ${
            variant === 'compare' ? 'h-8' : 'h-[30px]'
          }`}
        >
          <Download width={14} height={14} aria-hidden="true" />
          Download quote PDF
        </button>
      </div>
    </RailSection>
  );
};
