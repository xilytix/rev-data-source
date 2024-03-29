import { defaultStandardGridSettings } from '@xilytix/revgrid';
import { AppGridSettings } from './app-grid-settings';
import { defaultAppOnlyGridSettings } from './default-app-only-grid-settings';

/** @public */
export const defaultAppGridSettings: AppGridSettings = {
    ...defaultStandardGridSettings,
    ...defaultAppOnlyGridSettings,
} as const;
