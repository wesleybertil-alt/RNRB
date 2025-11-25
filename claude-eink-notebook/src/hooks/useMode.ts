import { useModeStore, MODE_CONFIG } from '../stores/modeStore';
import type { Mode } from '../types';
import { triggerEinkRefresh } from '../lib/eink-utils';

export const useMode = () => {
  const { current, setMode } = useModeStore();

  const switchMode = (mode: Mode) => {
    setMode(mode);
    // Trigger e-ink refresh on mode change
    triggerEinkRefresh();
  };

  const config = MODE_CONFIG[current];

  return {
    current,
    switchMode,
    placeholder: config.placeholder,
    accentStyle: config.accentStyle,
    label: config.label,
    allModes: Object.keys(MODE_CONFIG) as Mode[],
    getConfig: (mode: Mode) => MODE_CONFIG[mode],
  };
};
