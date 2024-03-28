import { RevRecord, RevRecordData } from './rev-record';
import { RevRecordFieldIndex, RevRecordIndex, RevRecordInvalidatedValue, RevRecordValueRecentChangeTypeId } from './rev-record-types';

/**
 * An interface for providing access to records in a data store. Called by the Grid Adapter to retrieve data to display.
 * @public
 */
export interface RevRecordStore {
    setRecordEventers(recordsEventers: RevRecordStore.RecordsEventers): void;

    /**
     * Gets the value of a record
     * @param index - The record index
     */
    getRecord(index: RevRecordIndex): RevRecord;

    /**
     * Retrieves the underlying records
     * @returns An array of the currently available records
     * The Grid Adapter will not modify the returned array
     */
    getRecords(): readonly RevRecord[];

    /** Get the number of current records available */
    readonly recordCount: number;
}

/** @public */
export namespace RevRecordStore {
    export interface RecordsEventers {
        beginChange(): void;
        endChange(): void;

        allRecordsDeleted(): void;
        recordDeleted(recordIndex: RevRecordIndex): void;
        recordsDeleted(recordIndex: number, count: number): void;
        recordInserted(recordIndex: RevRecordIndex, recent?: boolean): void;
        recordsInserted(firstInsertedRecordIndex: RevRecordIndex, count: number, recent?: boolean): void;
        recordMoved(fromRecordIndex: RevRecordIndex, toRecordIndex: RevRecordIndex): void;
        recordsMoved(fromRecordIndex: RevRecordIndex, toRecordIndex: RevRecordIndex, moveCount: number): void;
        recordReplaced(recordIndex: RevRecordIndex): void;
        recordsReplaced(recordIndex: RevRecordIndex, count: number): void;
        recordsSpliced(recordIndex: RevRecordIndex, deleteCount: number, insertCount: number): void;
        recordsLoaded(recent?: boolean): void;

        invalidateAll(): void;
        invalidateRecord(recordIndex: RevRecordIndex, recent?: boolean): void;
        invalidateRecords(recordIndex: RevRecordIndex, count: number, recent?: boolean): void;
        invalidateValue(
            fieldIndex: RevRecordFieldIndex,
            recordIndex: RevRecordIndex,
            valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId
        ): void;
        invalidateRecordValues(recordIndex: RevRecordIndex, invalidatedValues: readonly RevRecordInvalidatedValue[]): void;
        invalidateRecordFields(recordIndex: RevRecordIndex, fieldIndex: RevRecordFieldIndex, fieldCount: number): void;
        invalidateRecordAndValues(
            recordIndex: RevRecordIndex,
            invalidatedValues: readonly RevRecordInvalidatedValue[],
            recordUpdateRecent?: boolean
        ): void;
        invalidateFiltering(): void;
        invalidateFields(fieldIndexes: readonly RevRecordFieldIndex[]): void;
    }
}

/** @public */
export interface RevRecordDataStore extends RevRecordStore {
    revRecordData: true;

    /**
     * Gets the value of a record
     * @param index - The record index
     */
    getRecord(index: RevRecordIndex): RevRecordData;

    /**
     * Retrieves the underlying records
     * @returns An array of the currently available records
     * The Grid Adapter will not modify the returned array
     */
    getRecords(): readonly RevRecordData[];
}
