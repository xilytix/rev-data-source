// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer, } from '@xilytix/sysutils';
import { RevRecordValueRecentChangeTypeId } from '../../../record/server/internal-api';
import { RevTableValue } from '../value/internal-api';

/** @public */
export abstract class RevTableValueSource<RenderValueTypeId, RenderAttributeTypeId> {
    valueChangesEvent: RevTableValueSource.ValueChangesEvent<RenderValueTypeId, RenderAttributeTypeId>;
    allValuesChangeEvent: RevTableValueSource.AllValuesChangeEvent<RenderValueTypeId, RenderAttributeTypeId>;
    becomeIncubatedEventer: RevTableValueSource.BecomeIncubatedEventer;

    protected _beenIncubated = false;

    constructor(private readonly _firstFieldIndexOffset: Integer ) { }

    get beenIncubated(): boolean { return this._beenIncubated; }
    get fieldCount() { return this.getfieldCount(); }
    get firstFieldIndexOffset() { return this._firstFieldIndexOffset; }

    protected notifyValueChangesEvent(valueChanges: RevTableValueSource.ValueChange<RenderValueTypeId, RenderAttributeTypeId>[]) {
        for (let i = 0; i < valueChanges.length; i++) {
            valueChanges[i].fieldIndex += this._firstFieldIndexOffset;
        }
        this.valueChangesEvent(valueChanges);
    }

    protected notifyAllValuesChangeEvent(newValues: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[]) {
        this.allValuesChangeEvent(this._firstFieldIndexOffset, newValues);
    }

    protected initialiseBeenIncubated(value: boolean) {
        this._beenIncubated = value;
    }

    protected processDataCorrectnessChanged(allValues: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[], incubated: boolean) {
        this.allValuesChangeEvent(this._firstFieldIndexOffset, allValues);

        if (incubated) {
            this.checkNotifyBecameIncubated();
        }
    }

    private checkNotifyBecameIncubated() {
        if (!this._beenIncubated) {
            this._beenIncubated = true;
            this.becomeIncubatedEventer();
        }
    }

    abstract activate(): RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[];
    abstract deactivate(): void;
    abstract getAllValues(): RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[];

    protected abstract getfieldCount(): Integer;
}

/** @public */
export namespace RevTableValueSource {
    export interface ChangedValue<RenderValueTypeId, RenderAttributeTypeId> {
        fieldIdx: Integer;
        newValue: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>;
    }

    export interface ValueChange<RenderValueTypeId, RenderAttributeTypeId> {
        fieldIndex: Integer;
        newValue: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>;
        recentChangeTypeId: RevRecordValueRecentChangeTypeId | undefined;
    }
    export namespace ValueChange {
        export function arrayIncludesFieldIndex<RenderValueTypeId, RenderAttributeTypeId>(array: readonly ValueChange<RenderValueTypeId, RenderAttributeTypeId>[], fieldIndex: Integer, end: Integer): boolean {
            for (let i = 0; i < end; i++) {
                const valueChange = array[i];
                if (valueChange.fieldIndex === fieldIndex) {
                    return true;
                }
            }
            return false;
        }
    }

    export type BeginValuesChangeEvent = (this: void) => void;
    export type EndValuesChangeEvent = (this: void) => void;
    export type ValueChangesEvent<RenderValueTypeId, RenderAttributeTypeId> = (valueChanges: ValueChange<RenderValueTypeId, RenderAttributeTypeId>[]) => void;
    export type AllValuesChangeEvent<RenderValueTypeId, RenderAttributeTypeId> = (firstFieldIdxOffset: Integer, newValues: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[]) => void;
    export type BecomeIncubatedEventer = (this: void) => void;
    export type Constructor<RenderValueTypeId, RenderAttributeTypeId> = new(firstFieldIdxOffset: Integer, recordIdx: Integer) => RevTableValueSource<RenderValueTypeId, RenderAttributeTypeId>;
}
