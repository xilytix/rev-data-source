// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevTableValue } from './rev-table-value';

/** @public */
export abstract class RevGenericTableValue<T, RenderValueTypeId, RenderAttributeTypeId> extends RevTableValue<RenderValueTypeId, RenderAttributeTypeId> {
    private _data: T | undefined;
    private _definedData: T;

    get definedData() { return this._definedData; }

    get data() { return this._data; }
    set data(value: T | undefined) {
        this._data = value;
        if (value !== undefined) {
            this._definedData = value;
        }
    }

    isUndefined() {
        return this._data === undefined;
    }

    clear() {
        this._data = undefined;
    }
}
