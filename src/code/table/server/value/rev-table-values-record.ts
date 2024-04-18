// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { IndexedRecord, Integer } from '@xilytix/sysutils';
import { RevTableValue } from './rev-table-value';

/** @public */
export class RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId> implements IndexedRecord {
    protected _values: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[];

    constructor(public index: Integer) {
        // no code
    }

    get values(): readonly RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[] { return this._values; }
}
