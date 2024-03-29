import { AppOnlyGridSettings } from './app-only-grid-settings';

/** @public */
export const defaultAppOnlyGridSettings: AppOnlyGridSettings = {
    focusedRowBorderWidth: 1,

    grayedOutForegroundColor: '#595959',
    focusedRowBackgroundColor: '#6e6835',
    focusedRowBorderColor: '#C8B900',
    focusedCellBorderColor: 'DeepSkyBlue',

    valueRecentlyModifiedBorderColor: '#8C5F46',
    valueRecentlyModifiedUpBorderColor: '#64FA64',
    valueRecentlyModifiedDownBorderColor: '#4646FF',
    recordRecentlyUpdatedBorderColor: 'orange',
    recordRecentlyInsertedBorderColor: 'pink',
} as const;
