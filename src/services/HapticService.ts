import { Save } from './SaveService';

type VibrationPattern = number | number[];

class HapticServiceImpl {
  vibrate(pattern: VibrationPattern): void {
    if (navigator.vibrate && !Save.isHapticDisabled()) {
      navigator.vibrate(pattern);
    }
  }

  isSupported(): boolean {
    return !!navigator.vibrate;
  }
}

export const Haptic = new HapticServiceImpl();
