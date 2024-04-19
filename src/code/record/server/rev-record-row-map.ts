import { moveElementInArray, moveElementsInArray } from '@xilytix/sysutils';
import { RevRecord } from './rev-record';
import { RevRecordArrayUtil } from './rev-record-array-utils';
import { RevRecordAssertError } from './rev-record-error';
import { RevRecordRow } from './rev-record-row';
import { RevRecordIndex } from './rev-record-types';

export class RevRecordRowMap {
    readonly records = new Array<RevRecord>();
    readonly rows = new Array<RevRecordRow>();

    constructor(private readonly _recordRowBindingKey: symbol) {

    }

    clear() {
        this.records.length = 0;
        this.rows.length = 0;
    }

    getRecordFromRowIndex(rowIndex: number) {
        return this.rows[rowIndex].record;
    }

    getRecordIndexFromRowIndex(rowIndex: number) {
        return this.rows[rowIndex].record.index;
    }

    getRowIndexFromRecordIndex(recordIndex: RevRecordIndex) {
        const record = this.records[recordIndex];
        const row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
        if (row === undefined) {
            return undefined;
        } else {
            return row.index;
        }
    }

    hasRecord(record: RevRecord) {
        const recordIndex = record.index;
        if (recordIndex >= this.records.length) {
            return false;
        } else {
            // got this record if it matches entry at recordIndex
            return this.records[recordIndex] === record;
        }
    }

    insertRecord(record: RevRecord) {
        this.records.splice(record.index, 0, record);
        const row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
        if (row !== undefined) {
            const rowIndex = row.index;
            this.rows.splice(rowIndex, 0, row);
            this.reindexFromRow(rowIndex + 1);
        }
    }

    insertRecordsButNotRows(recordIndex: RevRecordIndex, records: readonly RevRecord[]) {
        this.records.splice(recordIndex, 0, ...records);
    }

    removeRecord(recordIndex: RevRecordIndex) {
        const record = this.records[recordIndex];
        const row = RevRecord.takeBoundRow(record, this._recordRowBindingKey);
        this.records.splice(recordIndex, 1);
        if (row === undefined) {
            return undefined;
        } else {
            const rowIndex = row.index;
            this.rows.splice(rowIndex, 1);
            this.reindexFromRow(rowIndex);
            return rowIndex;
        }
    }

    removeRecordsButNotRows(recordIndex: RevRecordIndex, count: number) {
        this.records.splice(recordIndex, count);
    }

    insertRow(row: RevRecordRow) {
        const rowIndex = row.index;
        this.rows.splice(rowIndex, 0, row);
        RevRecord.bindRow(row.record, this._recordRowBindingKey, row);
        this.reindexFromRow(rowIndex + 1);
    }

    insertRowRangeButIgnoreRecords(rowIndex: number, rows: readonly RevRecordRow[], rangeStartIndex: number, rangeExclusiveEndIndex: number) {
        this.rows.splice(rowIndex, 0, ...rows.slice(rangeStartIndex, rangeExclusiveEndIndex));
        this.reindexFromRow(rowIndex + (rangeExclusiveEndIndex - rangeStartIndex));
    }

    deleteRow(rowIndex: number) {
        const row = this.rows[rowIndex];
        const record = row.record;
        RevRecord.unbindRow(record, this._recordRowBindingKey);
        this.rows.splice(rowIndex, 1);
        this.reindexFromRow(rowIndex);
    }

    deleteRowsButIgnoreRecords(rowIndex: number, count: number) {
        this.rows.splice(rowIndex, count);
        this.reindexFromRow(rowIndex);
    }

    replaceRecord(newRecord: RevRecord) {
        const recordIndex = newRecord.index;
        const oldRecord = this.records[recordIndex];
        this.records[recordIndex] = newRecord;
        const row = RevRecord.takeBoundRow(oldRecord, this._recordRowBindingKey);
        if (row === undefined) {
            return undefined;
        } else {
            row.record = newRecord;
            RevRecord.bindRow(newRecord, this._recordRowBindingKey, row);
            return row.index;
        }
    }

    moveRecordWithRow(fromIndex: number, toIndex: number) {
        // assumes records and rows are indexed equally (no sorting or filtering)
        moveElementInArray(this.records, fromIndex, toIndex);
        this.moveRow(fromIndex, toIndex);
    }

    moveRecordsWithRow(fromIndex: number, toIndex: number, moveCount: number) {
        // assumes records and rows are indexed equally (no sorting or filtering)
        moveElementsInArray(this.records, fromIndex, toIndex, moveCount);
        this.moveRows(fromIndex, toIndex, moveCount);
    }

    moveRow(fromIndex: number, toIndex: number) {
        const rows = this.rows;
        const oldIndexRow = rows[fromIndex];
        if (toIndex > fromIndex) {
            for (let i = fromIndex; i < toIndex; i++) {
                const row = rows[i + 1]
                rows[i] = row;
                row.index = i;
            }
            rows[toIndex] = oldIndexRow;
            oldIndexRow.index = toIndex;
        } else {
            if (toIndex < fromIndex) {
                for (let i = fromIndex; i > toIndex; i--) {
                    const row = rows[i - 1];
                    rows[i] = row;
                    row.index = i;
                }
                rows[toIndex] = oldIndexRow;
                oldIndexRow.index = toIndex;
            }
        }
    }

    moveRows(fromIndex: number, toIndex: number, moveCount: number) {
        const rows = this.rows;
        moveElementsInArray(rows, fromIndex, toIndex, moveCount);
        if (fromIndex < toIndex) {
            this.reindexRowRange(fromIndex, toIndex - fromIndex + moveCount);
        } else {
            this.reindexRowRange(toIndex, fromIndex - toIndex + moveCount);
        }
    }

    findInsertRowIndex(recordIndex: RevRecordIndex) {
        const records = this.records;
        const recordCount = records.length;
        if (recordIndex >= recordCount) {
            return this.rows.length;
        } else {
            let record = records[recordIndex];
            let row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
            if (row !== undefined) {
                return row.index;
            } else {
                // Search for either previous or next record with a row.
                // Search in direction in which there are least number of records
                const midIndex = recordCount / 2.0;
                if (recordIndex >= midIndex) {
                    if (recordCount > 500) {
                        // It is likely that some earlier/lower records have already got rows while those after mid do not
                        // Try a portion of the lower range first
                        const lowerRangeStart = recordIndex -  recordCount / 20.0;
                        for (let i = recordIndex - 1; i > lowerRangeStart; i--) {
                            record = records[i];
                            row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
                            if (row !== undefined) {
                                return row.index + 1;
                            }
                        }
                    }
                    for (let i = recordIndex + 1; i < recordCount; i++) {
                        record = records[i];
                        row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
                        if (row !== undefined) {
                            return row.index;
                        }
                    }
                    return this.rows.length;
                } else {
                    for (let i = recordIndex - 1; i >= 0; i--) {
                        record = records[i];
                        row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
                        if (row !== undefined) {
                            return row.index + 1;
                        }
                    }
                    return 0;
                }
            }
        }
    }

    binarySearchRows(row: RevRecordRow, comparer: RevRecordRow.Comparer) {
        return RevRecordArrayUtil.binarySearch(this.rows, row, comparer)
    }

    sortRows(comparer: RevRecordRow.Comparer) {
        this.rows.sort(comparer);
        this.reindexAllRows();
    }

    reindexAllRows() {
        this.reindexFromRow(0);
    }

    checkConsistency() {
        const rows = this.rows;
        const rowCount = rows.length;
        for (let i = 0; i < rowCount; i++) {
            const row = rows[i];
            if (row.index !== i) {
                throw new RevRecordAssertError('RRMCC31001');
            } else {
                const record = row.record;
                if (record === undefined) {
                    throw new RevRecordAssertError('RRMCC31002');
                } else {
                    const recordRow = RevRecord.getBoundRow(record, this._recordRowBindingKey);
                    if (recordRow !== row) {
                        throw new RevRecordAssertError('RRMCC31003');
                    }
                }
            }
        }

        const records = this.records;
        const recordCount = records.length;
        for (let i = 0; i < recordCount; i++) {
            const record = records[i];
            if (record.index !== i) {
                throw new RevRecordAssertError('RRMCC31005');
            } else {
                const row = RevRecord.getBoundRow(record, this._recordRowBindingKey);
                if (row !== undefined) {
                    if (row.record !== record) {
                        throw new RevRecordAssertError('RRMCC31006');
                    }
                }
            }
        }
    }

    private reindexFromRow(fromIndex: number) {
        const rows = this.rows;
        const count = rows.length;
        for (let i = fromIndex; i < count; i++) {
            rows[i].index = i;
        }
    }

    private reindexRowRange(startRangeIndex: number, afterRangeIndex: number) {
        const rows = this.rows;
        for (let i = startRangeIndex; i < afterRangeIndex; i++) {
            rows[i].index = i;
        }
    }
}

