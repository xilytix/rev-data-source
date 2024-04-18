// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    AssertInternalError,
    IndexedRecord,
    Integer,
    MultiEvent,
} from '@xilytix/sysutils';
import { RevRecordFieldIndex, RevRecordIndex, RevRecordInvalidatedValue, RevRecordStore } from '../../../record/server/internal-api';
import { RevTable } from './rev-table';

/** @public */
export class RevTableRecordStore<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> implements RevRecordStore {
    private _table: RevTable<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> | undefined;

    private _recordsEventers: RevRecordStore.RecordsEventers;

    private _allRecordsDeletedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordsLoadedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordsInsertedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordsReplacedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordsMovedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordsDeletedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordValuesChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordSequentialFieldValuesChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _recordChangedSubscriptionId: MultiEvent.SubscriptionId;

    get table() { return this._table; }
    get recordCount(): Integer {
        return this._table === undefined ? 0 : this._table.recordCount;
    }

    setTable(value: RevTable<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>) {
        if (this._table !== undefined) {
            this.unbindTable(this._table);
            this._recordsEventers.allRecordsDeleted(); // should already be done
        }
        this._table = value;
        this.bindTable(value);
        const recordCount = this._table.recordCount;
        if (recordCount > 0) {
            this._recordsEventers.recordsLoaded();
        }
    }

    setRecordEventers(recordsEventers: RevRecordStore.RecordsEventers): void {
        this._recordsEventers = recordsEventers;
    }

    getRecord(index: number): IndexedRecord {
        if (this._table === undefined) {
            throw new AssertInternalError('TFGRV882455', `${index}`);
        } else {
            return this._table.getRecord(index);
        }
    }

    getRecords(): readonly IndexedRecord[] {
        if (this._table === undefined) {
            return [];
        } else {
            return this._table.records;
        }
    }

    beginChange() {
        this._recordsEventers.beginChange();
    }
    endChange() {
        this._recordsEventers.endChange();
    }
    recordsLoaded() {
        this._recordsEventers.recordsLoaded();
    }
    recordsInserted(index: Integer, count: Integer) {
        this._recordsEventers.recordsInserted(index, count);
    }
    recordsDeleted(index: Integer, count: Integer) {
        this._recordsEventers.recordsDeleted(index, count);
    }
    allRecordsDeleted() {
        this._recordsEventers.allRecordsDeleted();
    }
    invalidateRecordValues(recordIndex: RevRecordIndex, invalidatedValues: readonly RevRecordInvalidatedValue[]) {
        this._recordsEventers.invalidateRecordValues(
            recordIndex,
            invalidatedValues
        );
    }
    invalidateRecordFields(recordIndex: RevRecordIndex, fieldIndex: RevRecordFieldIndex, fieldCount: Integer) {
        this._recordsEventers.invalidateRecordFields(recordIndex, fieldIndex, fieldCount);
    }
    invalidateRecord(recordIndex: RevRecordIndex) {
        this._recordsEventers.invalidateRecord(recordIndex);
    }

    private bindTable(table: RevTable<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>) {
        this._allRecordsDeletedSubscriptionId = table.subscribeAllRecordsDeletedEvent(() => { this._recordsEventers.allRecordsDeleted(); });
        this._recordsLoadedSubscriptionId = table.subscribeRecordsLoadedEvent(() => { this._recordsEventers.recordsLoaded(); });
        this._recordsInsertedSubscriptionId = table.subscribeRecordsInsertedEvent(
            (index, count) => { this._recordsEventers.recordsInserted(index, count); }
        );
        this._recordsReplacedSubscriptionId = table.subscribeRecordsReplacedEvent(
            (index, count) => { this._recordsEventers.recordsReplaced(index, count); }
        );
        this._recordsMovedSubscriptionId = table.subscribeRecordsMovedEvent(
            (fromIndex, toIndex, count) => { this._recordsEventers.recordsMoved(fromIndex, toIndex, count); }
        );
        this._recordsDeletedSubscriptionId = table.subscribeRecordsDeletedEvent(
            (index, count) => { this._recordsEventers.recordsDeleted(index, count); }
        );
        this._recordValuesChangedSubscriptionId = table.subscribeRecordValuesChangedEvent(
            (recordIdx, invalidatedValues) => { this._recordsEventers.invalidateRecordValues(recordIdx, invalidatedValues); }
        );
        this._recordSequentialFieldValuesChangedSubscriptionId = table.subscribeRecordSequentialFieldValuesChangedEvent(
            (recordIdx, fieldIdx, fieldCount) => { this._recordsEventers.invalidateRecordFields(recordIdx, fieldIdx, fieldCount); }
        );
        this._recordChangedSubscriptionId = table.subscribeRecordChangedEvent(
            (recordIdx) => { this._recordsEventers.invalidateRecord(recordIdx); }
        );
    }

    private unbindTable(table: RevTable<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>) {
        table.unsubscribeAllRecordsDeletedEvent(this._allRecordsDeletedSubscriptionId);
        this._allRecordsDeletedSubscriptionId = undefined;
        table.unsubscribeRecordsLoadedEvent(this._recordsLoadedSubscriptionId);
        this._recordsLoadedSubscriptionId = undefined;
        table.unsubscribeRecordsInsertedEvent(this._recordsInsertedSubscriptionId);
        this._recordsInsertedSubscriptionId = undefined;
        table.unsubscribeRecordsReplacedEvent(this._recordsReplacedSubscriptionId);
        this._recordsReplacedSubscriptionId = undefined;
        table.unsubscribeRecordsMovedEvent(this._recordsMovedSubscriptionId);
        this._recordsMovedSubscriptionId = undefined;
        table.unsubscribeRecordsDeletedEvent(this._recordsDeletedSubscriptionId);
        this._recordsDeletedSubscriptionId = undefined;
        table.unsubscribeRecordValuesChangedEvent(this._recordValuesChangedSubscriptionId);
        this._recordValuesChangedSubscriptionId = undefined;
        table.unsubscribeRecordSequentialFieldValuesChangedEvent(this._recordSequentialFieldValuesChangedSubscriptionId);
        this._recordSequentialFieldValuesChangedSubscriptionId = undefined;
        table.unsubscribeRecordChangedEvent(this._recordChangedSubscriptionId);
        this._recordChangedSubscriptionId = undefined;
    }
}
