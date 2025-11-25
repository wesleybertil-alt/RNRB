import React from 'react';
import { useMode } from '../hooks/useMode';
import type { Mode } from '../types';

const modes: Mode[] = ['draft', 'research', 'synthesis', 'writing'];

export const ModePills: React.FC = () => {
  const { current, switchMode, getConfig } = useMode();

  return (
    <div className="flex gap-2">
      {modes.map((mode) => {
        const config = getConfig(mode);
        const isActive = current === mode;

        return (
          <button
            key={mode}
            onClick={() => switchMode(mode)}
            className={`
              text-sm py-2 px-3 min-h-[48px] min-w-[48px]
              bg-transparent border-0 touch-target
              ${isActive
                ? 'font-semibold border-b-2 border-black text-black'
                : 'font-normal text-gray-600 border-b-2 border-transparent'
              }
            `}
            style={{ transition: 'none', touchAction: 'manipulation' }}
            aria-pressed={isActive}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
};
