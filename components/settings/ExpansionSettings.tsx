'use client';

import { Chip, RailSection } from '@/components/shell';
import { ExpansionOptions, EXPANSION_LABELS } from '@/utils/expansionOptions';

interface ExpansionSettingsProps {
  expansionOptions: ExpansionOptions;
  toggleExpansionOption: (key: keyof ExpansionOptions) => void;
}

const KEYS = Object.keys(EXPANSION_LABELS) as Array<keyof ExpansionOptions>;

export const ExpansionSettings = ({
  expansionOptions,
  toggleExpansionOption,
}: ExpansionSettingsProps) => {
  return (
    <RailSection label="TEXT EXPANSION">
      <div className="flex flex-wrap gap-[6px]">
        {KEYS.map((key) => (
          <Chip
            key={key}
            label={EXPANSION_LABELS[key]}
            checked={expansionOptions[key]}
            onChange={() => toggleExpansionOption(key)}
            className="[&>span]:whitespace-nowrap"
          />
        ))}
      </div>
    </RailSection>
  );
};
