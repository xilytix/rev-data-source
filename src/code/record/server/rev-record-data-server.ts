import { DataServer, RevApiError, RevListChangedTypeId } from '@xilytix/revgrid';
import { UnreachableCaseError } from '@xilytix/sysutils';
import { RevRecord } from './rev-record';
import { RevRecordArrayUtil } from './rev-record-array-utils';
import { RevRecordAssertError } from './rev-record-error';
import { RevRecordField } from './rev-record-field';
import { RevRecordRecentChanges } from './rev-record-recent-changes';
import { RevRecordRow } from './rev-record-row';
import { RevRecordRowMap } from './rev-record-row-map';
import { RevRecordSchemaServer } from './rev-record-schema-server';
import { RevRecordStore } from './rev-record-store';
import { RevRecordFieldIndex, RevRecordIndex, RevRecordInvalidatedValue, RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

/** @public */
export class RevRecordDataServer<SF extends RevRecordField> implements DataServer<SF>, RevRecordStore.RecordsEventers {
    private readonly _recordRowBindingKey = Symbol();

    private readonly _rows: RevRecordRow[]; // Rows in grid - used for comparison and holding recent change info
    private readonly _recordRowMap: RevRecordRowMap;
    private readonly _sortFieldSpecifiers: RevRecordDataServer.SortFieldSpecifier[] = [];

    private _beginChangeCount = 0;
    private _consistencyCheckRequired = false;

    private _comparer: RevRecordRow.Comparer | undefined;
    private _maxSortingFieldCount = 3;
    private _filterCallback: RevRecordDataServer.RecordFilterCallback | undefined;
    private _continuousFiltering = false;
    private _continuousSortingOrFilteringActive = false;

    private _rowOrderReversed = false;

    private readonly _recentChanges: RevRecordRecentChanges;

    private _callbackListener: DataServer.NotificationsClient;
    private _recordStoreEventersSet = false;

    constructor(
        private readonly _schemaServer: RevRecordSchemaServer<SF>,
        private readonly _recordStore: RevRecordStore,
    ) {
        this._recordRowMap = new RevRecordRowMap(this._recordRowBindingKey);
        this._rows = this._recordRowMap.rows;
        this._recentChanges = new RevRecordRecentChanges(
            this._recordRowMap,
            (expiredCellPositions, expiredCellCount, expiredRowIndexes, expiredRowCount) => {
                this.handleExpiredRecentChanges(expiredCellPositions, expiredCellCount, expiredRowIndexes, expiredRowCount);
            }
        );
        this._schemaServer.fieldListChangedEventer = (typeId, index, count) => {
            this.processFieldListChangedEvent(typeId, index, count);
        };
    }

    get recentChanges() { return this._recentChanges; }
    get rowCount(): number { return this._rows.length; }
    get recordCount(): number { return this._recordStore.recordCount; }

    get filterCallback(): RevRecordDataServer.RecordFilterCallback | undefined { return this._filterCallback; }
    set filterCallback(value: RevRecordDataServer.RecordFilterCallback | undefined) {
        this._filterCallback = value;
        this.updateContinuousSortingOrFilteringActive();
        this.invalidateFiltering();
    }

    get continuousFiltering(): boolean { return this._continuousFiltering; }
    set continuousFiltering(value: boolean) {
        this._continuousFiltering = value;
        this.updateContinuousSortingOrFilteringActive();
    }

    get isFiltered(): boolean { return this._filterCallback !== undefined; }
    get sortColumnCount(): number { return this._sortFieldSpecifiers.length; }
    get sortFieldSpecifiers(): readonly RevRecordDataServer.SortFieldSpecifier[] { return this._sortFieldSpecifiers; }
    get sortFieldSpecifierCount(): number { return this._sortFieldSpecifiers.length; }
    get rowOrderReversed(): boolean { return this._rowOrderReversed; }
    set rowOrderReversed(value: boolean) {
        if (value !== this._rowOrderReversed) {
            this._rowOrderReversed = value;
            this.invalidateAll();
        }
    }

    get allChangedRecentDuration() { return this._recentChanges.allChangedRecentDuration; }
    set allChangedRecentDuration(value: number) { this._recentChanges.allChangedRecentDuration = value; }
    get recordInsertedRecentDuration() { return this._recentChanges.recordInsertedRecentDuration; }
    set recordInsertedRecentDuration(value: number) { this._recentChanges.recordInsertedRecentDuration = value; }
    get recordUpdatedRecentDuration() { return this._recentChanges.recordUpdatedRecentDuration; }
    set recordUpdatedRecentDuration(value: number) { this._recentChanges.recordUpdatedRecentDuration = value; }
    get valueChangedRecentDuration() { return this._recentChanges.valueChangedRecentDuration; }
    set valueChangedRecentDuration(value: number) { this._recentChanges.valueChangedRecentDuration = value; }

    destroy() {
        this._schemaServer.fieldListChangedEventer = undefined;
        this._recentChanges.destroy();
    }

    subscribeDataNotifications(value: DataServer.NotificationsClient): void {
        this._callbackListener = value;
        if (!this._recordStoreEventersSet) {
            this._recordStore.setRecordEventers(this);
            this._recordStoreEventersSet = true;
        }
    }

    beginChange() {
        this._beginChangeCount++
        this._callbackListener.beginChange();
    }

    getRowCount(): number {
        return this._rows.length;
    }

    getRowIdFromIndex(rowIndex: number): unknown {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }

        const record = this._recordRowMap.getRecordFromRowIndex(rowIndex);
        return record;
    }

    getRowIndexFromId(rowId: unknown): number | undefined {
        const record = rowId as RevRecord;
        // Check if record has been deleted
        if (!this._recordRowMap.hasRecord(record)) {
            // this is a reference to a deleted record
            return undefined;
        } else {
            const row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
            if (row === undefined) {
                return undefined;
            } else {
                let rowIndex = row.index;
                if (this._rowOrderReversed) {
                    rowIndex = this.reverseRowIndex(rowIndex);
                }
                return rowIndex;
            }
        }
    }

    getViewValue(field: SF, rowIndex: number): DataServer.ViewValue {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }

        const record = this._recordRowMap.getRecordFromRowIndex(rowIndex);

        return field.getViewValue(record);
    }

    getEditValue(field: SF, rowIndex: number): DataServer.EditValue {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }

        const record = this._recordRowMap.getRecordFromRowIndex(rowIndex);

        return field.getEditValue(record);
    }

    setEditValue(field: SF, rowIndex: number, value: DataServer.EditValue) {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }

        const record = this._recordRowMap.getRecordFromRowIndex(rowIndex);

        field.setEditValue(record, value);
    }

    allRecordsDeleted(): void {
        this._recordRowMap.clear();
        this._recentChanges.processAllRowsDeleted();
        this._callbackListener.allRowsDeleted();
    }

    isAnyFieldSorted(fieldIndexes: readonly RevRecordFieldIndex[]): boolean {
        for (const field of fieldIndexes) {
            if (this.isFieldSorted(field)) {
                return true;
            }
        }

        return false;
    }

    isAnyFieldInRangeSorted(rangeFieldIndex: number, rangeCount: number) {
        const nextRangeFieldIndex = rangeFieldIndex + rangeCount;
        for (let fieldIndex = rangeFieldIndex; fieldIndex < nextRangeFieldIndex; fieldIndex++) {
            if (this.isFieldSorted(fieldIndex)) {
                return true;
            }
        }

        return false;
    }

    clearSortFieldSpecifiers(): void {
        this._sortFieldSpecifiers.length = 0;
        this._comparer = undefined;
        this.updateContinuousSortingOrFilteringActive();
    }

    endChange() {
        this._callbackListener.endChange();
        if (this._beginChangeCount-- === 0) {
            if (this._consistencyCheckRequired) {
                this.checkConsistency();
            }
        }
    }

    getFieldSortAscending(field: RevRecordFieldIndex | SF): boolean | undefined {
        const fieldIndex = typeof field === 'number' ? field : this._schemaServer.getFieldIndex(field);

        for (let Index = 0; Index < this._sortFieldSpecifiers.length; Index++) {
            if (this._sortFieldSpecifiers[Index].fieldIndex === fieldIndex) {
                return this._sortFieldSpecifiers[Index].ascending;
            }
        }

        return undefined;
    }

    getFieldSortPriority(field: RevRecordFieldIndex | SF): number | undefined {
        const fieldIndex = typeof field === 'number' ? field : this._schemaServer.getFieldIndex(field);

        for (let index = 0; index < this._sortFieldSpecifiers.length; index++) {
            if (this._sortFieldSpecifiers[index].fieldIndex === fieldIndex) {
                return index;
            }
        }

        return undefined;
    }

    getRecordIndexFromRowIndex(rowIndex: number): RevRecordIndex {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        return this._recordRowMap.getRecordIndexFromRowIndex(rowIndex);
    }

    getRecordRecentChangeTypeId(rowIndex: number): RevRecordRecentChangeTypeId | undefined {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        return this._recentChanges.getRecordRecentChangeTypeId(rowIndex);
    }

    // Should be ok to uncomment getViewRow() below.  Test.
    // getViewRow(rowIndex: number): DataServer.ViewRow {
    //     if (this._rowOrderReversed) {
    //         rowIndex = this.reverseRowIndex(rowIndex);
    //     }
    //     return this._rows[rowIndex];
    // }

    getRowIndexFromRecordIndex(recordIndex: RevRecordIndex): number | undefined {
        const rowIndex = this._recordRowMap.getRowIndexFromRecordIndex(recordIndex);
        if (this._rowOrderReversed) {
            if (rowIndex === undefined) {
                return undefined;
            } else {
                return this.reverseRowIndex(rowIndex);
            }
        } else {
            return rowIndex;
        }
    }

    getSortSpecifier(index: number): RevRecordDataServer.SortFieldSpecifier {
        return this._sortFieldSpecifiers[index];
    }

    getValueRecentChangeTypeId(field: SF, rowIndex: number) {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        return this._recentChanges.getValueRecentChangeTypeId(field.index, rowIndex);
    }

    invalidateAll(): void {
        if (this._continuousSortingOrFilteringActive) {
            this.repopulateRows();
        } else {
            this._callbackListener.invalidateAll();
        }
    }

    invalidateRecord(recordIndex: RevRecordIndex, recent?: boolean): void {
        this.checkConsistency();

        this.beginChange();
        try {
            const rowIndex = this.updateInvalidatedRecordRowIndex(recordIndex, this._sortFieldSpecifiers.length > 0);
            if (rowIndex >= 0) {
                if (recent === true) {
                    this._recentChanges.addRecordUpdatedChange(rowIndex);
                }
                this.callbackInvalidateRow(rowIndex);
            }

            this.checkConsistency();
        } finally {
            this.endChange();
        }
    }

    invalidateRecords(recordIndex: RevRecordIndex, count: number, recent?: boolean): void {
        this.checkConsistency();

        switch(count) {
            case 0: return; // nothing to invalidate
            case 1: {
                this.invalidateRecord(recordIndex, recent);
                break;
            }
            default: {
                this.invalidateAll(); // needs optimisation
            }
        }

        this.checkConsistency();
    }

    invalidateValue(
        fieldIndex: RevRecordFieldIndex,
        recordIndex: RevRecordIndex,
        valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId
    ): void {
        this.checkConsistency();

        this.beginChange();
        try {
            const rowIndex = this.updateInvalidatedRecordRowIndex(recordIndex, this.isFieldSorted(fieldIndex));

            if (rowIndex >= 0) {
                if (valueRecentChangeTypeId !== undefined) {
                    this._recentChanges.addValueChange(fieldIndex, rowIndex, valueRecentChangeTypeId);
                }
                this.callbackInvalidateCell(fieldIndex, rowIndex);
            }
            this.checkConsistency();
        } finally {
            this.endChange();
        }
    }

    invalidateRecordValues(recordIndex: RevRecordIndex, invalidatedValues: readonly RevRecordInvalidatedValue[]): void {
        this.checkConsistency();

        if (invalidatedValues.length > 0) {
            this.beginChange();
            try {
                const invalidatedFieldIndexes = invalidatedValues.map((invalidatedRecordValue) => invalidatedRecordValue.fieldIndex);
                const rowIndex = this.updateInvalidatedRecordRowIndex(recordIndex, this.isAnyFieldSorted(invalidatedFieldIndexes));

                if (rowIndex >= 0) {
                    this._recentChanges.addRecordValuesChanges(rowIndex, invalidatedValues);
                    this.callbackInvalidateRowCells(rowIndex, invalidatedFieldIndexes);
                }
                this.checkConsistency();
            } finally {
                this.endChange();
            }
        }
    }

    invalidateRecordFields(recordIndex: RevRecordIndex, fieldIndex: RevRecordFieldIndex, fieldCount: number): void {
        this.checkConsistency();

        if (fieldCount > 0) {
            this.beginChange();
            try {
                const rowIndex = this.updateInvalidatedRecordRowIndex(recordIndex, this.isAnyFieldInRangeSorted(fieldIndex, fieldCount));

                if (rowIndex >= 0) {
                    this.callbackInvalidateRowColumns(rowIndex, fieldIndex, fieldCount);
                }
                this.checkConsistency();
            } finally {
                this.endChange();
            }
        }
    }

    invalidateRecordAndValues(
        recordIndex: RevRecordIndex,
        invalidatedValues: readonly RevRecordInvalidatedValue[],
        recordUpdateRecent?: boolean
    ) {
        this.checkConsistency();

        this.beginChange();
        try {
            const rowIndex = this.updateInvalidatedRecordRowIndex(recordIndex, this._sortFieldSpecifiers.length > 0);

            if (rowIndex >= 0) {
                if (recordUpdateRecent === true) {
                    this._recentChanges.addRecordUpdatedChange(rowIndex);
                }
                this._recentChanges.addRecordValuesChanges(rowIndex, invalidatedValues);
                this.callbackInvalidateRow(rowIndex);
            }
            this.checkConsistency();
        } finally {
            this.endChange();
        }
    }

    invalidateFiltering() {
        this.repopulateRows();
    }

    invalidateFields(fieldIndexes: readonly RevRecordFieldIndex[]) {
        if (fieldIndexes.length > 0) {
            this.invalidateAll(); // in future optimise this to only invalidate affected fields
        }
    }

    isFieldSorted(fieldIndex: RevRecordFieldIndex): boolean {
        for (let index = 0; index < this._sortFieldSpecifiers.length; index++) {
            if (this._sortFieldSpecifiers[index].fieldIndex === fieldIndex) {
                return true;
            }
        }

        return false;
    }

    recordDeleted(recordIndex: RevRecordIndex): void {
        const continuousSortingOrFilteringActive = this._continuousSortingOrFilteringActive;
        if (continuousSortingOrFilteringActive) {
            this.beginChange();
            this._callbackListener.preReindex();
        }
        try {
            // Locate and remove the corresponding Row
            const rowIndex = this._recordRowMap.removeRecord(recordIndex);
            const recordIndexFieldIndexes = this._schemaServer.getFieldValueDependsOnRecordIndexFieldIndexes();

            if (rowIndex === undefined) {
                // We didn't change any visible rows, since they were filtered, but their indexes may have changed, so invalidate
                // the affected fields
                this.invalidateFields(recordIndexFieldIndexes);
                this.checkConsistency();
            } else {
                if (recordIndexFieldIndexes.length > 0) {
                    this.beginChange();
                    try {
                        this._recentChanges.processRowDeleted(rowIndex);
                        this.callbackRowsDeleted(rowIndex, 1);
                        this.invalidateFields(recordIndexFieldIndexes);
                        this.checkConsistency();
                    } finally {
                        this.endChange();
                    }
                } else {
                    this._recentChanges.processRowDeleted(rowIndex);
                    this.callbackRowsDeleted(rowIndex, 1);
                    this.checkConsistency();
                }
            }
        } finally {
            if (continuousSortingOrFilteringActive) {
                this._callbackListener.postReindex(false);
                this.endChange();
            }
        }
    }

    recordsDeleted(recordIndex: number, count: number) {
        switch (count) {
            case 0: return;
            case 1: {
                this.recordDeleted(recordIndex);
                return;
            }
            default: {
                const continuousSortingOrFilteringActive = this._continuousSortingOrFilteringActive;
                if (continuousSortingOrFilteringActive) {
                    this.beginChange();
                    this._callbackListener.preReindex();
                }
                try {
                    // Find the Records/Rows we'll be removing
                    const toBeDeletedRowIndexes = new Array<number | undefined>(count);
                    let toBeDeletedDefinedRowCount = 0;

                    for (let index = 0; index < count; index++) {
                        const rowIndex = this._recordRowMap.getRowIndexFromRecordIndex(recordIndex + index);
                        toBeDeletedRowIndexes[index] = rowIndex;

                        if (rowIndex !== undefined) {
                            toBeDeletedDefinedRowCount++;
                        }
                    }

                    this._recordRowMap.removeRecordsButNotRows(recordIndex, count); // rows will be deleted below

                    const recordIndexFieldIndexes = this._schemaServer.getFieldValueDependsOnRecordIndexFieldIndexes();

                    if (toBeDeletedDefinedRowCount === 0) {
                        // We didn't change any visible rows, since they were filtered, but their indexes may have changed, so invalidate
                        // the affected fields
                        this.invalidateFields(recordIndexFieldIndexes);
                        this.checkConsistency();
                    } else {
                        const toBeDeletedDefinedRowIndexes = toBeDeletedRowIndexes.filter(value => value !== undefined) as number[];

                        const deleteCount = toBeDeletedDefinedRowIndexes.length;
                        if (deleteCount === 0) {
                            this.checkConsistency();
                        } else {
                            toBeDeletedDefinedRowIndexes.sort((left, right) => left - right);

                            let blockInclusiveEndIndex = deleteCount - 1;
                            let previousRowIndex = toBeDeletedDefinedRowIndexes[blockInclusiveEndIndex];

                            if (!continuousSortingOrFilteringActive) {
                                this.beginChange();
                            }
                            this._recentChanges.beginMultipleChanges();
                            try {
                                for (let index = deleteCount - 2; index >= 0; index--) {
                                    const rowIndex = toBeDeletedDefinedRowIndexes[index];

                                    // Try and minimise the number of row splices we do
                                    if (rowIndex === previousRowIndex - 1) {
                                        previousRowIndex = rowIndex;
                                    } else {
                                        const length = blockInclusiveEndIndex - index;
                                        this._recordRowMap.deleteRowsButIgnoreRecords(previousRowIndex, length);
                                        this._recentChanges.processRowsDeleted(previousRowIndex, length);
                                        this.callbackRowsDeleted(previousRowIndex, length);

                                        blockInclusiveEndIndex = index;
                                        previousRowIndex = rowIndex;
                                    }
                                }

                                const length = blockInclusiveEndIndex + 1;
                                this._recordRowMap.deleteRowsButIgnoreRecords(previousRowIndex, length);
                                this._recentChanges.processRowsDeleted(previousRowIndex, length);
                                this.callbackRowsDeleted(previousRowIndex, length);

                                this.invalidateFields(recordIndexFieldIndexes);
                                this.checkConsistency();
                            } finally {
                                this._recentChanges.endMultipleChanges();
                                if (!continuousSortingOrFilteringActive) {
                                    this.endChange();
                                }
                            }
                        }
                    }
                } finally {
                    if (continuousSortingOrFilteringActive) {
                        this._callbackListener.postReindex(false);
                        this.endChange();
                    }
                }
            }
        }
    }

    recordInserted(recordIndex: RevRecordIndex, recent?: boolean): void {
        const continuousSortingOrFilteringActive = this._continuousSortingOrFilteringActive;
        if (continuousSortingOrFilteringActive) {
            this.beginChange();
            this._callbackListener.preReindex();
        }
        try {
            const record = this._recordStore.getRecord(recordIndex);
            const row = this.tryCreateRecordRow(record);
            RevRecord.bindRow(record, this._recordRowBindingKey, row);
            this._recordRowMap.insertRecord(record);

            if (row !== undefined) {
                // Record is not filtered out
                const rowIndex = row.index;
                this._recentChanges.processRecordInserted(rowIndex, recent === true);
                this.callbackRowsInserted(rowIndex, 1);
            }
            this.checkConsistency();
        } finally {
            if (continuousSortingOrFilteringActive) {
                this._callbackListener.postReindex(true);
                this.endChange();
            }
        }
    }

    recordsInserted(firstInsertedRecordIndex: RevRecordIndex, count: number, recent?: boolean): void {
        switch (count) {
            case 0: return;
            case 1: {
                this.recordInserted(firstInsertedRecordIndex, recent);
                return;
            }
            default: {
                const continuousSortingOrFilteringActive = this._continuousSortingOrFilteringActive;
                if (continuousSortingOrFilteringActive) {
                    this.beginChange();
                    this._callbackListener.preReindex();
                }
                try {
                    const insertedRecords = new Array<RevRecord>(count);
                    const nextRecordRangeIndex = firstInsertedRecordIndex + count;
                    let insertedRecIdx = 0
                    for (let recIdx = firstInsertedRecordIndex; recIdx < nextRecordRangeIndex; recIdx++) {
                        const record = this._recordStore.getRecord(recIdx);
                        insertedRecords[insertedRecIdx++] = record;
                    }
                    this._recordRowMap.insertRecordsButNotRows(firstInsertedRecordIndex, insertedRecords);

                    const insertedRows = new Array<RevRecordRow>(count);
                    let insertedRowCount = 0;

                    for (let recIdx = 0; recIdx < count; recIdx++) {
                        const record = insertedRecords[recIdx];
                        const row = this.tryCreateRecordRow(record);
                        if (row === undefined) {
                            RevRecord.unbindRow(record, this._recordRowBindingKey);
                        } else {
                            this._recordRowMap.insertRow(row);
                            insertedRows[insertedRowCount++] = row;
                        }
                    }

                    if (insertedRowCount === 0) {
                        this.checkConsistency();
                    } else {
                        insertedRows.length = insertedRowCount;

                        insertedRows.sort((left, right) => left.index - right.index);

                        let startBlockIndex = 0;
                        let startBlockRowIndex = insertedRows[startBlockIndex].index;
                        let nextRowIndex = startBlockRowIndex + 1;

                        if (!continuousSortingOrFilteringActive) {
                            this.beginChange();
                        }
                        this._recentChanges.beginMultipleChanges();
                        try {
                            for (let index = 1; index < insertedRowCount; index++) {
                                const rowIndex = insertedRows[index].index;

                                // Try and minimise the number of splices we do
                                if (rowIndex === nextRowIndex) {
                                    nextRowIndex++;
                                } else {
                                    const length = index - startBlockIndex;
                                    this._recentChanges.processRecordsInserted(startBlockRowIndex, length, recent === true);
                                    this.callbackRowsInserted(startBlockRowIndex, length);

                                    startBlockIndex = index;
                                    startBlockRowIndex = rowIndex;
                                    nextRowIndex = startBlockRowIndex + 1;
                                }
                            }

                            const length = insertedRowCount - startBlockIndex;
                            this._recentChanges.processRecordsInserted(startBlockRowIndex, length, recent === true);
                            this.callbackRowsInserted(startBlockRowIndex, length);
                            this.checkConsistency();
                        } finally {
                            this._recentChanges.endMultipleChanges();
                            if (!continuousSortingOrFilteringActive) {
                                this.endChange();
                            }
                        }
                    }
                } finally {
                    if (continuousSortingOrFilteringActive) {
                        this._callbackListener.postReindex(true);
                        this.endChange();
                    }
                }
            }
        }
    }

    recordMoved(fromIndex: RevRecordIndex, toIndex: RevRecordIndex) {
        if (this._comparer !== undefined || this._filterCallback !== undefined || this._rowOrderReversed ) {
            this.beginChange();
            try {
                this.recordsSpliced(fromIndex, toIndex, 1);
            } finally {
                this.endChange();
            }
        } else {
            this._recordRowMap.moveRecordWithRow(fromIndex, toIndex);
            this._callbackListener.rowsMoved(fromIndex, toIndex, 1);
        }
        this.checkConsistency();
    }

    recordsMoved(fromIndex: RevRecordIndex, toIndex: RevRecordIndex, moveCount: number) {
        if (this._comparer !== undefined || this._filterCallback !== undefined || this._rowOrderReversed ) {
            this.beginChange();
            try {
                this.recordsSpliced(fromIndex, toIndex, moveCount);
            } finally {
                this.endChange();
            }
        } else {
            this._recordRowMap.moveRecordsWithRow(fromIndex, toIndex, moveCount);
            this._callbackListener.rowsMoved(fromIndex, toIndex, moveCount);
        }
        this.checkConsistency();
    }

    recordReplaced(recordIndex: RevRecordIndex) {
        const record = this._recordStore.getRecord(recordIndex);
        const rowIndex = this._recordRowMap.replaceRecord(record);
        if (rowIndex !== undefined) {
            this._callbackListener.invalidateRow(rowIndex);
        }
        this.checkConsistency();
    }

    recordsReplaced(recordIndex: RevRecordIndex, count: number) {
        if (count > 0) {
            this.beginChange();
            try {
                const afterRangeIndex = recordIndex + count;
                for (let i = recordIndex; i < afterRangeIndex; i++) {
                    const record = this._recordStore.getRecord(i);
                    const rowIndex = this._recordRowMap.replaceRecord(record);
                    if (rowIndex !== undefined) {
                        this._callbackListener.invalidateRow(rowIndex);
                    }
                }
                this.checkConsistency();
            } finally {
                this.endChange();
            }
        }
    }

    recordsSpliced(recordIndex: RevRecordIndex, deleteCount: number, insertCount: number) {
        if (deleteCount <= 0) {
            if (insertCount <= 0) {
                return;
            } else {
                this.recordsInserted(recordIndex, insertCount, false);
            }
        } else {
            if (insertCount <= 0) {
                this.recordsDeleted(recordIndex, deleteCount);
            } else {
                this.beginChange();
                try {
                    this.recordsDeleted(recordIndex, deleteCount);
                    this.recordsInserted(recordIndex, insertCount);
                } finally {
                    this.endChange();
                }
            }
        }
    }

    recordsLoaded(recent?: boolean): void {
        // Regenerate the row list. Filter it if filter defined
        // Only get RecordStore records once as getRecords may return different references to records
        const storeRecords = this._recordStore.getRecords();

        const recordCount = storeRecords.length;
        const filterCallback = this._filterCallback;

        const records = this._recordRowMap.records;
        records.length = recordCount;
        const rows = this._recordRowMap.rows;
        rows.length = recordCount;

        if (filterCallback === undefined) {
            for (let i = 0; i < recordCount; i++) {
                const record = storeRecords[i];
                records[i] = record;

                const row: RevRecordRow = {
                    record: record,
                    index: i,
                }
                rows[i] = row;
                RevRecord.bindRow(record, this._recordRowBindingKey, row);
            }
        } else {
            let rowCount = 0;
            for (let i = 0; i < recordCount; i++) {
                const record = storeRecords[i];
                records[i] = record;

                if (filterCallback(record)) {
                    const row: RevRecordRow = {
                        record: record,
                        index: rowCount,
                    }
                    rows[rowCount++] = row;
                    RevRecord.bindRow(record, this._recordRowBindingKey, row);
                } else {
                    RevRecord.unbindRow(record, this._recordRowBindingKey);
                }
            }
            rows.length = rowCount;
        }

        if (this._comparer !== undefined) {
            rows.sort(this._comparer);
            this._recordRowMap.reindexAllRows();
        }

        this._recentChanges.processAllChanged(recent === true);
        this._callbackListener.rowsLoaded();
        this.checkConsistency();
    }

    reset(): void {
        this._recordRowMap.clear();
        this._sortFieldSpecifiers.length = 0;
        this._callbackListener.allRowsDeleted();
    }

    reverseRowIndex(rowIndex: number) {
        return this._rows.length - rowIndex - 1;
    }

    reverseRowIndexIfRowOrderReversed(rowIndex: number) {
        if (this._rowOrderReversed) {
            return this.reverseRowIndex(rowIndex);
        } else {
            return rowIndex;
        }
    }

    clearSort(): boolean {
        const specifierCount = this.sortFieldSpecifierCount;
        if (specifierCount === 0) {
            return true;
        } else {
            return this.sortByMany([]);
        }
    }

    sort(): void {
        if (this._comparer === undefined) {
            // No sorting (list rows by record order). Can we optimise the 'reset order' operation?
            this.repopulateRows();
        } else {
            this.checkConsistency();

            this.beginChange();
            this._recentChanges.processPreReindex();
            this._callbackListener.preReindex();
            try {
                this._recordRowMap.sortRows(this._comparer);
                this.checkConsistency();
            } finally {
                this._callbackListener.postReindex(true);
                this._recentChanges.processPostReindex(true);
                this._callbackListener.invalidateAll();
                this.endChange();
            }
        }
    }

    sortBy(fieldIndex?: number, isAscending?: boolean): boolean {
        if (fieldIndex === undefined) {
            return this.clearSort();
        } else {
            const existingSpecifiers = this.sortFieldSpecifiers;
            if (isAscending === undefined) {
                // Auto-detect sort toggle
                if (existingSpecifiers.length > 0 && existingSpecifiers[0].fieldIndex === fieldIndex) {
                    isAscending = !existingSpecifiers[0].ascending;
                } else {
                    isAscending = true;
                }
            }

            const sortSpecifiers = new Array<RevRecordDataServer.SortFieldSpecifier>(this._maxSortingFieldCount);
            sortSpecifiers[0] = {
                fieldIndex: fieldIndex,
                ascending: isAscending
            };

            let count = 1;

            if (this._maxSortingFieldCount > 1) {
                for (let i = 0; i < existingSpecifiers.length; i++) {
                    const specifier = existingSpecifiers[i];
                    if (specifier.fieldIndex !== fieldIndex) {
                        sortSpecifiers[count++] = specifier;
                    }
                    if (count >= this._maxSortingFieldCount) {
                        break;
                    }
                }
            }

            sortSpecifiers.length = count;

            return this.sortByMany(sortSpecifiers);
        }
    }

    sortByMany(specifiers: readonly RevRecordDataServer.SortFieldSpecifier[]): boolean {
        this.updateSortComparer(specifiers);
        if (this._comparer === undefined) {
            return false;
        } else {
            this.sort();
            return true;
        }
    }

    private handleExpiredRecentChanges(
        expiredCellPositions: RevRecordRecentChanges.ExpiredCellPosition[],
        expiredCellCount: number,
        expiredRowIndexes: RevRecordRecentChanges.ExpiredRowIndex[],
        expiredRowCount: number) {

        const count = expiredCellCount + expiredRowCount;
        let beginChangeActive: boolean;
        if (count > 1) {
            this.beginChange();
            beginChangeActive = true;
        } else {
            beginChangeActive = false;
        }

        for (let i = 0; i < expiredRowCount; i++) {
            this.callbackInvalidateRow(expiredRowIndexes[i]);
        }
        for (let i = 0; i < expiredCellCount; i++) {
            this.callbackInvalidateCell(...expiredCellPositions[i]);
        }

        if (beginChangeActive) {
            this.endChange();
        }
    }

    private processFieldListChangedEvent(typeId: RevListChangedTypeId, index: number, count: number) {
        switch (typeId) {
            case RevListChangedTypeId.Set:
            case RevListChangedTypeId.Clear: {
                this.clearSortFieldSpecifiers();
                break;
            }
            case RevListChangedTypeId.Insert: {
                const specifiers = this._sortFieldSpecifiers.slice();
                const specifierCount = specifiers.length;
                let modified = false;
                for (let i = 0; i < specifierCount; i++) {
                    const specifier = specifiers[i];
                    if (specifier.fieldIndex >= index) {
                        specifier.fieldIndex += count;
                        modified = true;
                    }
                }
                if (modified) {
                    this.updateSortComparer(specifiers);
                }
                break;
            }
            case RevListChangedTypeId.Remove: {
                const specifiers = this._sortFieldSpecifiers.slice();
                const specifierCount = specifiers.length;
                const adjustRangeStartIndex = index + count;
                let modified = false;
                for (let i = specifierCount - 1; i >= 0; i--) {
                    const specifier = specifiers[i];
                    if (specifier.fieldIndex >= adjustRangeStartIndex) {
                        specifier.fieldIndex -= count;
                        modified = true;
                    } else {
                        if (specifier.fieldIndex >= index) {
                            specifiers.splice(i, 1);
                            modified = true;
                        }
                    }
                }
                if (modified) {
                    this.updateSortComparer(specifiers);
                }
                break;
            }
            case RevListChangedTypeId.Move: {
                throw new RevApiError('RRMDS68309', 'Move not implemented');
            }
            default:
                throw new UnreachableCaseError('RRMAPFLCE73390', typeId);
        }
    }

    private repopulateRows(): void {
        this.checkConsistency();

        let allRowsKept = true;
        this.beginChange();
        this._callbackListener.preReindex();
        this._recentChanges.processPreReindex();
        try {
            // Regenerate the row list. Filter it if filter defined
            // Only get DataStore records once as GetRecords may return different references to records
            const records = this._recordRowMap.records;
            const recordCount = records.length;
            const filterCallback = this._filterCallback;

            const rows = this._recordRowMap.rows;
            rows.length = recordCount;

            if (filterCallback === undefined) {
                for (let i = 0; i < recordCount; i++) {
                    const record = records[i];

                    const row: RevRecordRow = {
                        record: record,
                        index: i,
                    }
                    rows[i] = row;
                    RevRecord.bindRow(record, this._recordRowBindingKey, row);
                }
            } else {
                let rowCount = 0;
                for (let i = 0; i < recordCount; i++) {
                    const record = records[i];

                    if (filterCallback(record)) {
                        const row: RevRecordRow = {
                            record: record,
                            index: rowCount,
                        }
                        rows[rowCount++] = row;
                        RevRecord.bindRow(record, this._recordRowBindingKey, row);
                    } else {
                        RevRecord.unbindRow(record, this._recordRowBindingKey);
                    }
                }
                if (rowCount !== rows.length) {
                    allRowsKept = false;
                    rows.length = rowCount;
                }
            }

            if (this._comparer !== undefined) {
                rows.sort(this._comparer);
                this._recordRowMap.reindexAllRows();
            }

            this.checkConsistency();
        } finally {
            this._recentChanges.processPostReindex(allRowsKept);
            this._callbackListener.postReindex(allRowsKept);
            this._callbackListener.invalidateAll();
            this.endChange();
        }
    }

    private updateSortComparer(specifiers: readonly RevRecordDataServer.SortFieldSpecifier[]): void {
        const specifierCount = specifiers.length;

        if (specifiers.length === 0) {
            // No sorting, or sort by a Row Index column
            this._sortFieldSpecifiers.length = 0;
            this._comparer = undefined;
        } else {
            const comparers = Array<RevRecordDataServer.SpecifierComparer>(specifierCount);
            let comparerCount = 0;

            for (let i = 0; i < specifierCount; i++) {
                const specifier = specifiers[i];
                const comparer = this.getComparerFromSpecifier(specifier);
                if (comparer !== undefined) {
                    comparers[comparerCount++] = comparer;
                }
            }

            comparers.length = comparerCount;

            if (comparers.length === 0) {
                // Sorting not supported on any column, ignore it
                this._comparer = undefined;
            } else {
                this._sortFieldSpecifiers.length = specifierCount;
                for (let i = 0; i < specifierCount; i++) {
                    this._sortFieldSpecifiers[i] = specifiers[i];
                }

                if (comparers.length === 1) {
                    this._comparer = (left, right) => comparers[0](left, right);
                } else {
                    const rootComparer = (left: RevRecordRow, right: RevRecordRow) => {
                        for (let i = 0; i < comparers.length; i++) {
                            const result = comparers[i](left, right);
                            if (result !== 0) {
                                return result;
                            }
                        }

                        return 0;
                    };

                    this._comparer = (left, right) => rootComparer(left, right);
                }
            }
        }

        this.updateContinuousSortingOrFilteringActive();
    }

    private getComparerFromSpecifier(specifier: RevRecordDataServer.SortFieldSpecifier): RevRecordDataServer.SpecifierComparer | undefined {
        const field = this._schemaServer.fields[specifier.fieldIndex];
        let comparer: RevRecordDataServer.SpecifierComparer | undefined;

        const compareDefined = field.compare !== undefined;
        const compareDescDefined = field.compareDesc !== undefined;

        // make sure we capture this._fields and specifiers
        if (specifier.ascending) {
            if (compareDefined) {
                comparer = (left, right) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return this._schemaServer.fields[specifier.fieldIndex].compare!(left.record, right.record);
                };
            } else {
                if (compareDescDefined) {
                    comparer = (left, right) => {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        return this._schemaServer.fields[specifier.fieldIndex].compareDesc!(left.record, right.record);
                    };
                    specifier.ascending = false;
                } else {
                    // ignore rest of specifiers
                    comparer = undefined;
                }
            }
        } else {
            if (compareDescDefined) {
                comparer = (left, right) => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    return this._schemaServer.fields[specifier.fieldIndex].compareDesc!(left.record, right.record);
                };
            } else {
                if (compareDefined) {
                    comparer = (left, right) => {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        return this._schemaServer.fields[specifier.fieldIndex].compare!(left.record, right.record);
                    };
                    specifier.ascending = true;
                } else {
                    // ignore rest of specifiers
                    comparer = undefined;
                }
            }
        }

        return comparer;
    }

    /**
     * Handles Row related events and callbackListener function calls but not cell related events or callbacks
     * @param areAnyInvalidatedFieldsSorted - whether of any of the record's invalidated fields are in sort specifiers
     * @returns -1 if row is hidden
    */
    private updateInvalidatedRecordRowIndex(
        recordIndex: RevRecordIndex,
        areAnyInvalidatedFieldsSorted: boolean,
    ): number {
        const record = this._recordRowMap.records[recordIndex];
        const oldRow = RevRecord.getBoundRow(record, this._recordRowBindingKey);

        if (this._filterCallback !== undefined && this._continuousFiltering) {
            const isVisible = this._filterCallback(record);

            if (!isVisible) {
                // Need to hide the row, was it previously visible?
                if (oldRow !== undefined) {
                    const oldRowIndex = oldRow.index;
                    this._recordRowMap.deleteRow(oldRowIndex);
                    this._recentChanges.processRowDeleted(oldRowIndex);
                    this.callbackRowsDeleted(oldRowIndex, 1);
                }

                this.checkConsistency();
                return -1;
            }
        }

        let rowIndex: number;
        if (oldRow === undefined) {
            // The row was previously filtered, and is now being shown. Find the correct location to insert it
            const newRow = this.createRecordRow(record);
            this._recordRowMap.insertRow(newRow);
            rowIndex = newRow.index;
            this._recentChanges.processRowInserted(rowIndex);
            this.callbackRowsInserted(rowIndex, 1);
            this.checkConsistency();
        } else {
            // Row is being updated
            const oldRowIndex = oldRow.index;
            if (this._comparer === undefined || !areAnyInvalidatedFieldsSorted) {
                rowIndex = oldRowIndex;
                this.checkConsistency();
            } else {
                // The entire row has changed, or specifically a field that affects sorting. We may need to move it to maintain the sorting
                rowIndex = RevRecordArrayUtil.binarySearchWithSkip(this._recordRowMap.rows, oldRow, oldRowIndex, this._comparer);

                if (rowIndex < 0) {
                    rowIndex = ~rowIndex;
                }

                if (rowIndex > oldRowIndex) {
                    rowIndex--;
                }

                if (rowIndex !== oldRowIndex) {
                    // The row has moved
                    this._recordRowMap.moveRow(oldRowIndex, rowIndex);
                    this._recentChanges.processRowMoved(oldRowIndex, rowIndex);
                    this.callbackRowMoved(oldRowIndex, rowIndex);
                }
                this.checkConsistency();
            }
        }

        return rowIndex;
    }

    private tryCreateRecordRow(record: RevRecord): RevRecordRow | undefined {
        if (this._filterCallback !== undefined && this._continuousFiltering && !this._filterCallback(record)) {
            // Record filtered out and not displayed
            return undefined;
        } else {
            return this.createRecordRow(record)
        }
    }

    private createRecordRow(record: RevRecord): RevRecordRow {
        let rowIndex: number;

        if (this._comparer !== undefined) {
            // Sorting applied, insert in the appropriate location
            const row: RevRecordRow = { record, index: -1 };
            rowIndex = this._recordRowMap.binarySearchRows(row, this._comparer);

            if (rowIndex < 0) {
                rowIndex = ~rowIndex;
            }
        } else {
            if (this._filterCallback !== undefined) {
                // Find the index nearest to this record, whether filtered or not
                rowIndex = this._recordRowMap.findInsertRowIndex(record.index);
                // const newIndex = this._rowLookup.getNearestRightIndex(recordIndex);

                // if (newIndex === undefined) {
                //     rowIndex = 0;
                // } else {
                //     rowIndex = newIndex;
                // }
            } else {
                // No sorting, and no filtering, so we're one-to-one
                rowIndex = record.index;
            }
        }

        return {
            record,
            index: rowIndex,
        }
    }

    private callbackInvalidateRow(rowIndex: number) {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        this._callbackListener.invalidateRow(rowIndex);
    }

    private callbackInvalidateCell(fieldIndex: RevRecordFieldIndex, rowIndex: number) {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        this._callbackListener.invalidateCell(fieldIndex, rowIndex);
    }

    private callbackInvalidateRowCells(rowIndex: number, invalidatedFieldIndexes: number[]) {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        this._callbackListener.invalidateRowCells(rowIndex, invalidatedFieldIndexes);
    }

    private callbackInvalidateRowColumns(rowIndex: number, fieldIndex: RevRecordFieldIndex, fieldCount: number) {
        if (this._rowOrderReversed) {
            rowIndex = this.reverseRowIndex(rowIndex);
        }
        this._callbackListener.invalidateRowColumns(rowIndex, fieldIndex, fieldCount);
    }

    private callbackRowsDeleted(rowIndex: number, rowCount: number) {
        if (this._rowOrderReversed) {
            // Note that this._rows has already had rows deleted from it
            rowIndex = this._rows.length - rowIndex;
        }
        this._callbackListener.rowsDeleted(rowIndex, rowCount);
    }

    private callbackRowsInserted(rowIndex: number, rowCount: number) {
        if (this._rowOrderReversed) {
            // Note that this._rows has already had rows inserted into it
            rowIndex = this._rows.length - rowIndex - rowCount;
        }
        this._callbackListener.rowsInserted(rowIndex, rowCount);
    }

    private callbackRowMoved(oldRowIndex: number, newRowIndex: number) {
        if (this._rowOrderReversed) {
            oldRowIndex = this.reverseRowIndex(oldRowIndex);
            newRowIndex = this.reverseRowIndex(newRowIndex);
        }
        this._callbackListener.rowsMoved(oldRowIndex, newRowIndex, 1)
    }

    private updateContinuousSortingOrFilteringActive() {
        this._continuousSortingOrFilteringActive =
            this._comparer !== undefined||
            (this._filterCallback !== undefined && this._continuousFiltering);
    }

    private checkConsistency() {
        if (this._beginChangeCount > 0) {
            this._consistencyCheckRequired = true;
        } else {
            this._recentChanges.checkConsistency();
            this._recordRowMap.checkConsistency();

            const storeRecords = this._recordStore.getRecords();

            const recordCount = storeRecords.length;
            const records = this._recordRowMap.records;
            if (records.length !== recordCount) {
                throw new RevRecordAssertError('MRACC32001');
            } else {
                for (let i = 0; i < recordCount; i++) {
                    if (storeRecords[i] !== records[i]) {
                        throw new RevRecordAssertError('MRACC32002');
                    }
                }
            }

            this._consistencyCheckRequired = false;
        }
    }
}

/** @public */
export namespace RevRecordDataServer {
    export type SpecifierComparer = (this: void, left: RevRecordRow, right: RevRecordRow) => number;

    export type RecordFilterCallback = (this: void, record: RevRecord) => boolean;

    export interface SortFieldSpecifier {
        fieldIndex: RevRecordFieldIndex;
        ascending: boolean;
    }
}
