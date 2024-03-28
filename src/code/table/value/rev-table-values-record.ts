/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

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
