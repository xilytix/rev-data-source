import { GridSettings } from '@xilytix/revgrid';

/** @public */
export interface AppOnlyGridSettings {
    // /** The highlight duration when all values/records are changed. 0 to disable*/
    // allChangedRecentDuration: RevRecordSysTick.Span;
    // /** The highlight duration for added values. 0 to disable*/
    // recordInsertedRecentDuration: RevRecordSysTick.Span;
    // /** The highlight duration for updated records. 0 to disable*/
    // recordUpdatedRecentDuration: RevRecordSysTick.Span;
    // /** The highlight duration for changed values. 0 to disable */
    // valueChangedRecentDuration: RevRecordSysTick.Span;

    focusedRowBorderWidth: number;

    grayedOutForegroundColor: GridSettings.Color;
    focusedRowBackgroundColor: GridSettings.Color | undefined;
    focusedRowBorderColor: GridSettings.Color | undefined;
    focusedCellBorderColor: GridSettings.Color;

    valueRecentlyModifiedBorderColor: GridSettings.Color;
    valueRecentlyModifiedUpBorderColor: GridSettings.Color;
    valueRecentlyModifiedDownBorderColor: GridSettings.Color;
    recordRecentlyUpdatedBorderColor: GridSettings.Color;
    recordRecentlyInsertedBorderColor: GridSettings.Color;
}
