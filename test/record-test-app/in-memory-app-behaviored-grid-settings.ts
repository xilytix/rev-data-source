import {
    GridSettings,
    InMemoryStandardBehavioredGridSettings
} from '@xilytix/revgrid';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { AppGridSettings } from './app-grid-settings';
import { AppOnlyGridSettings } from './app-only-grid-settings';

/** @public */
export class InMemoryAppBehavioredGridSettings extends InMemoryStandardBehavioredGridSettings implements AppBehavioredGridSettings {
    private _focusedRowBorderWidth: number;
    private _grayedOutForegroundColor: GridSettings.Color;
    private _focusedRowBackgroundColor: GridSettings.Color | undefined;
    private _focusedRowBorderColor: GridSettings.Color | undefined;
    private _focusedCellBorderColor: GridSettings.Color;
    private _valueRecentlyModifiedBorderColor: GridSettings.Color;
    private _valueRecentlyModifiedUpBorderColor: GridSettings.Color;
    private _valueRecentlyModifiedDownBorderColor: GridSettings.Color;
    private _recordRecentlyUpdatedBorderColor: GridSettings.Color;
    private _recordRecentlyInsertedBorderColor: GridSettings.Color;

    get focusedRowBorderWidth() { return this._focusedRowBorderWidth; }
    set focusedRowBorderWidth(value: number) {
        if (value !== this._focusedRowBorderWidth) {
            this.beginChange();
            this._focusedRowBorderWidth = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get grayedOutForegroundColor() { return this._grayedOutForegroundColor; }
    set grayedOutForegroundColor(value: GridSettings.Color) {
        if (value !== this._grayedOutForegroundColor) {
            this.beginChange();
            this._grayedOutForegroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get focusedRowBackgroundColor() { return this._focusedRowBackgroundColor; }
    set focusedRowBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._focusedRowBackgroundColor) {
            this.beginChange();
            this._focusedRowBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get focusedRowBorderColor() { return this._focusedRowBorderColor; }
    set focusedRowBorderColor(value: GridSettings.Color | undefined) {
        if (value !== this._focusedRowBorderColor) {
            this.beginChange();
            this._focusedRowBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get focusedCellBorderColor() { return this._focusedCellBorderColor; }
    set focusedCellBorderColor(value: GridSettings.Color) {
        if (value !== this._focusedCellBorderColor) {
            this.beginChange();
            this._focusedCellBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get valueRecentlyModifiedBorderColor() { return this._valueRecentlyModifiedBorderColor; }
    set valueRecentlyModifiedBorderColor(value: GridSettings.Color) {
        if (value !== this._valueRecentlyModifiedBorderColor) {
            this.beginChange();
            this._valueRecentlyModifiedBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get valueRecentlyModifiedUpBorderColor() { return this._valueRecentlyModifiedUpBorderColor; }
    set valueRecentlyModifiedUpBorderColor(value: GridSettings.Color) {
        if (value !== this._valueRecentlyModifiedUpBorderColor) {
            this.beginChange();
            this._valueRecentlyModifiedUpBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get valueRecentlyModifiedDownBorderColor() { return this._valueRecentlyModifiedDownBorderColor; }
    set valueRecentlyModifiedDownBorderColor(value: GridSettings.Color) {
        if (value !== this._valueRecentlyModifiedDownBorderColor) {
            this.beginChange();
            this._valueRecentlyModifiedDownBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get recordRecentlyUpdatedBorderColor() { return this._recordRecentlyUpdatedBorderColor; }
    set recordRecentlyUpdatedBorderColor(value: GridSettings.Color) {
        if (value !== this._recordRecentlyUpdatedBorderColor) {
            this.beginChange();
            this._recordRecentlyUpdatedBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    get recordRecentlyInsertedBorderColor() { return this._recordRecentlyInsertedBorderColor; }
    set recordRecentlyInsertedBorderColor(value: GridSettings.Color) {
        if (value !== this._recordRecentlyInsertedBorderColor) {
            this.beginChange();
            this._recordRecentlyInsertedBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    override merge(settings: Partial<AppGridSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<AppGridSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof AppOnlyGridSettings;
            switch (gridSettingsKey) {
                case 'focusedRowBorderWidth':
                    if (this._focusedRowBorderWidth !== requiredSettings.focusedRowBorderWidth) {
                        this._focusedRowBorderWidth = requiredSettings.focusedRowBorderWidth;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'grayedOutForegroundColor':
                    if (this._grayedOutForegroundColor !== requiredSettings.grayedOutForegroundColor) {
                        this._grayedOutForegroundColor = requiredSettings.grayedOutForegroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'focusedRowBackgroundColor':
                    if (this._focusedRowBackgroundColor !== requiredSettings.focusedRowBackgroundColor) {
                        this._focusedRowBackgroundColor = requiredSettings.focusedRowBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'focusedRowBorderColor':
                    if (this._focusedRowBorderColor !== requiredSettings.focusedRowBorderColor) {
                        this._focusedRowBorderColor = requiredSettings.focusedRowBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'focusedCellBorderColor':
                    if (this._focusedCellBorderColor !== requiredSettings.focusedCellBorderColor) {
                        this._focusedCellBorderColor = requiredSettings.focusedCellBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'valueRecentlyModifiedBorderColor':
                    if (this._valueRecentlyModifiedBorderColor !== requiredSettings.valueRecentlyModifiedBorderColor) {
                        this._valueRecentlyModifiedBorderColor = requiredSettings.valueRecentlyModifiedBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'valueRecentlyModifiedUpBorderColor':
                    if (this._valueRecentlyModifiedUpBorderColor !== requiredSettings.valueRecentlyModifiedUpBorderColor) {
                        this._valueRecentlyModifiedUpBorderColor = requiredSettings.valueRecentlyModifiedUpBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'valueRecentlyModifiedDownBorderColor':
                    if (this._valueRecentlyModifiedDownBorderColor !== requiredSettings.valueRecentlyModifiedDownBorderColor) {
                        this._valueRecentlyModifiedDownBorderColor = requiredSettings.valueRecentlyModifiedDownBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'recordRecentlyUpdatedBorderColor':
                    if (this._recordRecentlyUpdatedBorderColor !== requiredSettings.recordRecentlyUpdatedBorderColor) {
                        this._recordRecentlyUpdatedBorderColor = requiredSettings.recordRecentlyUpdatedBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'recordRecentlyInsertedBorderColor':
                    if (this._recordRecentlyInsertedBorderColor !== requiredSettings.recordRecentlyInsertedBorderColor) {
                        this._recordRecentlyInsertedBorderColor = requiredSettings.recordRecentlyInsertedBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        return this.endChange();
    }

    override clone() {
        const copy = new InMemoryAppBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
