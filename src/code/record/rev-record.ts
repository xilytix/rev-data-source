import { DataServer } from '@xilytix/revgrid';
// eslint-disable-next-line import/no-cycle
import { RevRecordRow } from './rev-record-row';

/** @public */
export interface RevRecord {
    index: number;
    __rows?: RevRecord.BoundRows;
}

/** @public */
export namespace RevRecord {
    /**
     * Rows are bound to Records so that they can easily reference each other.  However records (which can be any object with an
     * interface that includes the property 'index'), may be used in more than one RevRecordMainAdapter at once. Therefore the
     * relationship between records to rows is one to many.  To support this, an object map (BoundRows) is used to bind rows
     * to a record. A symbol is used to identify the RevRecordMainAdapter which a row belongs to.  This symbol is used as the key
     * into the BoundRows object.
     */
    export type BoundRows = Record<symbol, RevRecordRow | undefined>;

    export function getBoundRow(record: RevRecord, rowKey: symbol) {
        const boundRows = record.__rows;
        if (boundRows === undefined) {
            return undefined;
        } else {
            return boundRows[rowKey];
        }
    }

    export function takeBoundRow(record: RevRecord, rowKey: symbol) {
        const boundRows = record.__rows;
        if (boundRows === undefined) {
            return undefined;
        } else {
            const row = boundRows[rowKey];
            boundRows[rowKey] = undefined;
            return row;
        }
    }

    export function bindRow(record: RevRecord, rowKey: symbol, row: RevRecordRow | undefined) {
        let boundRows = record.__rows;
        if (boundRows === undefined) {
            boundRows = {}
            record.__rows = boundRows;
        }
        boundRows[rowKey] = row;
    }

    export function unbindRow(record: RevRecord, rowKey: symbol) {
        // Leave the key in the object and just set its value to undefined. Should be faster.
        const boundRows = record.__rows;
        if (boundRows !== undefined) {
            boundRows[rowKey] = undefined;
        }
    }
}

/** @public */
export interface RevRecordData extends RevRecord {
    data: DataServer.ViewRow;
}
