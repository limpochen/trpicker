/**
 * trPicker — Circular Time Range Picker (TypeScript declarations)
 */

export interface TrPickerOptions {
  /** Hour cycle: 12 or 24 (default 24) */
  hourCycle?: 12 | 24;
  /** Initial start minute 0–1439 (default 0) */
  startMinute?: number;
  /** Initial end minute 0–1439 (default 360) */
  endMinute?: number;
  /** Initial start hour as float (replaces startMinute) */
  startHour?: number;
  /** Initial end hour as float (replaces endMinute) */
  endHour?: number;
  /** Snap step in minutes (default 10) */
  stepMinute?: number;
  /** Start handle color (default '#4f46e5') */
  startColor?: string;
  /** End handle color (default '#ef4444') */
  endColor?: string;
  /** Arc color, or 'gradient' for a gradient (default '#28a050') */
  lineColor?: string;
  /** Dial tick detail level (default 'simple') */
  detailLevel?: 'simple' | 'detailed';
  /** Dial material style (default 'solid') */
  dialStyle?: 'solid' | 'metal';
  /** Use popup mode (default false) */
  popup?: boolean;
  /** Popup animation (default 'fade') */
  popupAnimation?: 'fade' | 'drop' | 'instant';
  /** Popup panel corner radius in px (default 16) */
  popupBorderRadius?: number;
  /** Show the fine slider (default true) */
  enableFineSlider?: boolean;
  /** Show the 12/24H toggle in the UI (default true) */
  enableModeSwitch?: boolean;
  /** Show the step selector in the UI (default true) */
  enableStepAdjust?: boolean;
  /** Show the detail toggle in the UI (default true) */
  enableDetailAdjust?: boolean;
  /** Enforce a minimum interval >= stepMinute (default true) */
  enableMinStep?: boolean;
  /** AM label for 12H mode (default 'AM') */
  amText?: string;
  /** PM label for 12H mode (default 'PM') */
  pmText?: string;
  /** Time change callback */
  onChange?: (startMinute: number, endMinute: number) => void;
}

export interface TrPickerDateTimeValues {
  startDay: Date;
  endDay: Date;
  durationMin: number;
}

/** SVG-based circular time-range picker supporting 24/12-hour modes */
export default class trPicker {
  constructor(container: HTMLElement, options?: TrPickerOptions);

  /** Current version string */
  static VERSION: string;
  /** Register a mode class (24h/12h) */
  static registerMode(
    mode: string,
    cls: new (container: HTMLElement, options?: TrPickerOptions) => trPicker
  ): void;

  startMinute: number;
  endMinute: number;
  hourCycle: 12 | 24;
  stepMinute: number;
  startColor: string;
  endColor: string;
  lineColor: string;
  detailLevel: 'simple' | 'detailed';
  dialStyle: 'solid' | 'metal';
  popup: boolean;
  popupAnimation: 'fade' | 'drop' | 'instant';
  popupBorderRadius: number;
  enableFineSlider: boolean;
  enableModeSwitch: boolean;
  enableStepAdjust: boolean;
  enableDetailAdjust: boolean;
  enableMinStep: boolean;
  amText: string;
  pmText: string;
  onChange: (startMinute: number, endMinute: number) => void;

  /** Change the snap step */
  setStep(minute: number): void;
  /** Set the start color */
  setStartColor(color: string): void;
  /** Set the end color */
  setEndColor(color: string): void;
  /** Set the arc color, or 'gradient' for a gradient */
  setLineColor(color: string): void;
  /** Switch the tick detail level */
  setDetailLevel(level: 'simple' | 'detailed'): void;
  /** Switch the dial style */
  setDialStyle(style: 'solid' | 'metal'): void;
  /** Switch the hour cycle */
  setHourCycle(cycle: 12 | 24): trPicker;
  /** @deprecated Use setHourCycle instead */
  setHourMode(mode: 12 | 24 | '12h' | '24h'): trPicker;
  /** Get date/time values */
  getDateTimeValues(baseDate?: Date | string): TrPickerDateTimeValues;
  /** Open the popup panel */
  open(): void;
  /** Close the popup panel */
  close(): void;
  /** Toggle the popup panel */
  toggle(): void;
  /** Destroy the component and release resources */
  destroy(): void;
}
