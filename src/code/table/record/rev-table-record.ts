/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { RevRecordInvalidatedValue } from '@xilytix/revgrid';
import { ComparableList, Integer } from '@xilytix/sysutils';
import { RevTableValueSource } from '../value-source/internal-api';
import { RevTableValue, RevTableValuesRecord } from '../value/internal-api';

/** @public */
export class RevTableRecord<RenderValueTypeId, RenderAttributeTypeId> extends RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId> {
    private _sources = new ComparableList<RevTableValueSource<RenderValueTypeId, RenderAttributeTypeId>>();
    private _fieldCount = 0;
    private _beenIncubated = false;
    private _beginValuesChangeCount = 0;

    private readonly _valuesChangedEvent: RevTableRecord.ValuesChangedEventHandler;
    private readonly _sequentialFieldValuesChangedEvent: RevTableRecord.SequentialFieldValuesChangedEventHandler;
    private readonly _recordChangedEvent: RevTableRecord.RecordChangedEventHandler;

    constructor(
        index: Integer,
        eventHandlers: RevTableRecord.EventHandlers,
    ) {
        super(index);

        this._valuesChangedEvent = eventHandlers.valuesChanged;
        this._sequentialFieldValuesChangedEvent = eventHandlers.sequentialfieldValuesChanged;
        this._recordChangedEvent = eventHandlers.recordChanged;
    }

    get fieldCount() { return this._fieldCount; }

    activate() {
        let values: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[] = [];
        for (let i = 0; i < this._sources.count; i++) {
            const source = this._sources.getAt(i);
            const sourceValues = source.activate();
            values = values.concat(sourceValues);
        }

        this._values = values;
        this._beenIncubated = this.calculateBeenIncubated();
    }

    deactivate() {
        for (let i = 0; i < this._sources.count; i++) {
            const source = this._sources.getAt(i);
            source.deactivate();
        }
    }

    addSource(source: RevTableValueSource<RenderValueTypeId, RenderAttributeTypeId>) {
        source.valueChangesEvent = (valueChanges) => { this.handleSourceValueChangesEvent(valueChanges); };
        source.allValuesChangeEvent = (idx, newValues) => { this.handleSourceAllValuesChangeEvent(idx, newValues); };
        source.becomeIncubatedEventer = () => { this.handleBecomeIncubatedEvent(); };

        this._sources.add(source);
        this._fieldCount += source.fieldCount;
    }

    // setRecordDefinition(recordDefinition: TableRecordDefinition, newValueList: TableValueList) {
    //     this._definition = recordDefinition;
    //     this._valueList = newValueList;
    //     this._valueList.valueChangesEvent = (valueChanges) => this.handleValueChangesEvent(valueChanges);
    //     this._valueList.sourceAllValuesChangeEvent =
    //         (firstFieldIdx, newValues) => this.handleSourceAllValuesChangeEvent(firstFieldIdx, newValues);
    //     this._valueList.beenUsableBecameTrueEvent = () => { this._beenUsable = true; };
    // }

    updateAllValues() {
        this._values = this.getAllValues();
    }

    getAllValues(): RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[] {
        if (this._sources.count === 1) {
            return this._sources.getAt(0).getAllValues();
        } else {
            const values = new Array<RevTableValue<RenderValueTypeId, RenderAttributeTypeId>>(this._fieldCount);
            let idx = 0;
            for (let srcIdx = 0; srcIdx < this._sources.count; srcIdx++) {
                const sourceValues = this._sources.getAt(srcIdx).getAllValues();
                for (let srcValueIdx = 0; srcValueIdx < sourceValues.length; srcValueIdx++) {
                    values[idx++] = sourceValues[srcValueIdx];
                }
            }
            return values;
        }
    }

    clearRendering() {
        for (let i = 0; i < this._values.length; i++) {
            const value = this._values[i];
            value.clearRendering();
        }
    }

    private handleBecomeIncubatedEvent() {
        if (!this._beenIncubated) {

            const beenIncubated = this.calculateBeenIncubated();

            if (beenIncubated) {
                this._beenIncubated = true;
            }
        }
    }

    private handleSourceValueChangesEvent(valueChanges: RevTableRecord.ValueChange<RenderValueTypeId, RenderAttributeTypeId>[]) {
        const valueChangesCount = valueChanges.length;
        if (valueChangesCount > 0) {
            const invalidatedValues = new Array<RevRecordInvalidatedValue>(valueChangesCount);

            for (let i = 0; i < valueChangesCount; i++) {
                const { fieldIndex, newValue, recentChangeTypeId } = valueChanges[i];
                this._values[fieldIndex] = newValue;

                invalidatedValues[i] = {
                    fieldIndex,
                    typeId: recentChangeTypeId,
                };
            }

            this._valuesChangedEvent(this.index, invalidatedValues);
        }
    }

    private handleSourceAllValuesChangeEvent(firstFieldIndex: Integer, newValues: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>[]) {
        const newValuesCount = newValues.length;
        if (newValuesCount > 0) {
            let fieldIndex = firstFieldIndex;
            for (let i = 0; i < newValuesCount; i++) {
                this._values[fieldIndex++] = newValues[i];
            }

            const recordChange = firstFieldIndex === 0 && newValuesCount === this._values.length;
            if (recordChange) {
                this._recordChangedEvent(this.index);
            } else {
                this._sequentialFieldValuesChangedEvent(this.index, firstFieldIndex, newValuesCount);
            }
        }
    }
    private calculateBeenIncubated() {
        for (let i = 0; i < this._sources.count; i++) {
            const source = this._sources.getAt(i);
            if (!source.beenIncubated) {
                return false;
            }
        }

        return true;
    }

    /*private findValue(idx: Integer): TableValueList.FindValueResult {
        const sourceCount = this.sources.Count;
        if (idx >= 0 && sourceCount > 0) {
            for (let i = 0; i < sourceCount; i++) {
                const source = this.sources.GetItem(i);
                if (idx < source.nextIndexOffset) {
                    return {
                        found: true,
                        sourceIdx: i,
                        sourceFieldIdx: idx - source.firstFieldIndexOffset
                    };
                }
            }
        }

        return {
            found: false,
            sourceIdx: -1,
            sourceFieldIdx: -1
        };
    }*/
}

/** @public */
export namespace RevTableRecord {
    // export type Sources = ComparableList<TableValueSource>;
    // export type ChangedValue = TableValueSource.ChangedValue;
    export type ValueChange<RenderValueTypeId, RenderAttributeTypeId> = RevTableValueSource.ValueChange<RenderValueTypeId, RenderAttributeTypeId>;
    // export interface FindValueResult {
    //     found: boolean;
    //     sourceIdx: Integer;
    //     sourceFieldIdx: Integer;
    // }
    // export type BeginValuesChangeEvent = (this: void) => void;
    // export type EndValuesChangeEvent = (this: void) => void;
    // export type ValueChangesEvent = (valueChanges: TableValueSource.ValueChange[]) => void;
    // export type AllSourceValuesChangeEvent = (fieldIdx: Integer, newValues: TableValue[]) => void;
    // export type BeenUsableBecameTrueEvent = (this: void) => void;

    export type ValuesChangedEventHandler = (this: void, recordIdx: Integer, invalidatedValues: RevRecordInvalidatedValue[]) => void;
    export type SequentialFieldValuesChangedEventHandler = (this: void, recordIdx: Integer, fieldIdx: Integer, fieldCount: Integer) => void;
    export type RecordChangedEventHandler = (this: void, recordIdx: Integer) => void;

    export interface EventHandlers {
        readonly valuesChanged: ValuesChangedEventHandler;
        readonly sequentialfieldValuesChanged: SequentialFieldValuesChangedEventHandler;
        readonly recordChanged: RecordChangedEventHandler;
    }
}
