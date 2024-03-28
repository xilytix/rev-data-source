// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    AssertInternalError,
    Guid,
    IndexedRecord,
    Integer,
    LockOpenListItem,
    LockOpenManager,
    MapKey,
    MultiEvent,
    Ok,
    Result,
    moveElementInArray,
    moveElementsInArray,
    newGuid
} from '@xilytix/sysutils';
import { RevGridLayoutDefinition } from './definition/internal-api';

/**
 * Provides access to a saved layout for a Grid
 *
 * @public
 */
export class RevGridLayout implements LockOpenListItem<RevGridLayout>, IndexedRecord {
    readonly id: Guid;
    readonly mapKey: MapKey;

    public index: number;

    private readonly _lockOpenManager: LockOpenManager<RevGridLayout>;
    private readonly _columns = new Array<RevGridLayout.Column>(0);

    private _beginChangeCount = 0;
    private _changeInitiator: RevGridLayout.ChangeInitiator | undefined;
    private _changed = false;
    private _widthsChanged = false;

    private _changedMultiEvent = new MultiEvent<RevGridLayout.ChangedEventHandler>();
    private _widthsChangedMultiEvent = new MultiEvent<RevGridLayout.WidthsChangedEventHandler>();

    constructor(
        definition?: RevGridLayoutDefinition,
        id?: Guid,
        mapKey?: MapKey,
    ) {
        this.id = id ?? newGuid();
        this.mapKey = mapKey ?? this.id;

        this._lockOpenManager = new LockOpenManager<RevGridLayout>(
            () => this.tryProcessFirstLock(),
            () => { this.processLastUnlock(); },
            () => { this.processFirstOpen(); },
            () => { this.processLastClose(); },
        );

        if (definition !== undefined) {
            this.applyDefinition(RevGridLayout.forceChangeInitiator, definition);
        }
    }

    get lockCount() { return this._lockOpenManager.lockCount; }
    get lockers(): readonly LockOpenListItem.Locker[] { return this._lockOpenManager.lockers; }
    get openCount() { return this._lockOpenManager.openCount; }
    get openers(): readonly LockOpenListItem.Opener[] { return this._lockOpenManager.openers; }

    get columns(): readonly RevGridLayout.Column[] { return this._columns; }
    get columnCount(): number { return this._columns.length; }

    tryLock(locker: LockOpenListItem.Locker): Promise<Result<void>> {
        return this._lockOpenManager.tryLock(locker);
    }

    unlock(locker: LockOpenListItem.Locker) {
        this._lockOpenManager.unlock(locker);
    }

    openLocked(opener: LockOpenListItem.Opener) {
        this._lockOpenManager.openLocked(opener);
    }

    closeLocked(opener: LockOpenListItem.Opener) {
        this._lockOpenManager.closeLocked(opener);
    }

    isLocked(ignoreOnlyLocker: LockOpenListItem.Locker | undefined) {
        return this._lockOpenManager.isLocked(ignoreOnlyLocker);
    }

    // open(_opener: LockOpenListItem.Opener, fieldNames: string[]) {
    //     const fieldCount = fieldNames.length;
    //     this._fields.length = fieldCount;
    //     for (let i = 0; i < fieldCount; i++) {
    //         const fieldName = fieldNames[i];
    //         const field = new GridLayout.Field(fieldName);
    //         this._fields[i] = field;
    //     }

    //     const maxColumnCount = this._definition.columnCount;
    //     const definitionColumns = this._definition.columns;
    //     let columnCount = 0;
    //     this._columns.length = maxColumnCount;
    //     for (let i = 0; i < maxColumnCount; i++) {
    //         const definitionColumn = definitionColumns[i];
    //         const definitionColumnName = definitionColumn.name;
    //         const foundField = this._fields.find((field) => field.name === definitionColumnName);
    //         if (foundField !== undefined) {
    //             this._columns[columnCount] = {
    //                 index: columnCount,
    //                 field: foundField,
    //                 visible: true
    //             }
    //             columnCount++;
    //         }
    //         this._columns.length = columnCount;
    //     }
    //     this._definitionListChangeSubscriptionId = this._definition.subscribeListChangeEvent(
    //         (listChangeTypeId, index, count) => this.handleDefinitionListChangeEvent(listChangeTypeId, index, count)
    //     );
    // }

    // close(opener: LockOpenListItem.Opener) {
    //     this._definition.unsubscribeListChangeEvent(this._definitionListChangeSubscriptionId);
    //     this._definitionListChangeSubscriptionId = undefined;
    // }

    beginChange(initiator: RevGridLayout.ChangeInitiator) {
        if (this._beginChangeCount++ === 0) {
            this._changeInitiator = initiator;
        } else {
            if (initiator !== this._changeInitiator) {
                throw new AssertInternalError('GLBC97117');
            }
        }
    }

    equals(other: RevGridLayout): boolean {
        return this.mapKey === other.mapKey;
    }

    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._changed) {
                // set _changed, _widthsChanged false and _changeInitiator to undefined before notifying in case another change initiated during notify
                this._changed = false;
                this._widthsChanged = false;
                const initiator = this._changeInitiator;
                if (initiator === undefined) {
                    throw new AssertInternalError('GLECC97117');
                } else {
                    this._changeInitiator = undefined;
                    this.notifyChanged(initiator);
                }
            } else {
                if (this._widthsChanged) {
                    // set _widthsChanged false and _changeInitiator to undefined before notifying in case another change initiated during notify
                    this._widthsChanged = false;
                    const initiator = this._changeInitiator;
                    if (initiator === undefined) {
                        throw new AssertInternalError('GLECW97117');
                    } else {
                        this._changeInitiator = undefined;
                        this.notifyWidthsChanged(initiator);
                    }
                } else {
                    // todo
                }
            }
        }
    }

    createCopy(): RevGridLayout {
        const result = new RevGridLayout();
        result.assign(this);
        return result;
    }

    createDefinition(): RevGridLayoutDefinition {
        const definitionColumns = this.createDefinitionColumns();
        return new RevGridLayoutDefinition(definitionColumns);
    }

    applyDefinition(initiator: RevGridLayout.ChangeInitiator, definition: RevGridLayoutDefinition): void {
        this.setColumns(initiator, definition.columns);
    }

    setColumns(initiator: RevGridLayout.ChangeInitiator, columns: readonly RevGridLayout.Column[]) {
        const newCount = columns.length;
        const newColumns = new Array<RevGridLayout.Column>(newCount);
        for (let i = 0; i < newCount; i++) {
            const column = columns[i];
            newColumns[i] = RevGridLayout.Column.createCopy(column);
        }

        this.beginChange(initiator);
        const oldCount = this._columns.length;
        this._columns.splice(0, oldCount, ...newColumns);
        this._changed = true;
        this.endChange();
    }

    getColumn(columnIndex: number): RevGridLayout.Column {
        return this._columns[columnIndex];
    }

    indexOfColumn(column: RevGridLayout.Column) {
        return this._columns.indexOf(column);
    }

    indexOfColumnByFieldName(fieldName: string) {
        return this._columns.findIndex((column) => column.fieldName === fieldName);
    }

    findColumn(fieldName: string) {
        return this._columns.find((column) => column.fieldName === fieldName);
    }


    addColumn(initiator: RevGridLayout.ChangeInitiator, columnOrName: string | RevGridLayoutDefinition.Column) {
        this.addColumns(initiator, [columnOrName]);
    }

    addColumns(initiator: RevGridLayout.ChangeInitiator, columnsNames: (string | RevGridLayoutDefinition.Column)[]) {
        const index = this._columns.length;
        this.insertColumns(initiator, index, columnsNames);
    }

    insertColumns(initiator: RevGridLayout.ChangeInitiator, index: Integer, columnOrFieldNames: (string | RevGridLayoutDefinition.Column)[]) {
        this.beginChange(initiator);
        const insertCount = columnOrFieldNames.length;
        const insertColumns = new Array<RevGridLayoutDefinition.Column>(insertCount);
        for (let i = 0; i < insertCount; i++) {
            const columnOrFieldName = columnOrFieldNames[i];
            const column: RevGridLayout.Column = (typeof columnOrFieldName === 'string') ?
                { fieldName: columnOrFieldName, visible: undefined, autoSizableWidth: undefined } :
                columnOrFieldName;
            this._columns[i] = column;
        }
        this._columns.splice(index, 0, ...insertColumns);
        this._changed = true;
        this.endChange();
    }

    removeColumn(initiator: RevGridLayout.ChangeInitiator, index: Integer) {
        this.removeColumns(initiator, index, 1);
    }

    removeColumns(initiator: RevGridLayout.ChangeInitiator, index: Integer, count: Integer) {
        this.beginChange(initiator);
        this._columns.splice(index, count);
        this._changed = true;
        this.endChange();
    }

    clearColumns(initiator: RevGridLayout.ChangeInitiator) {
        if (this._columns.length > 0 ) {
            this.beginChange(initiator);
            this._columns.length = 0;
            this._changed = true;
            this.endChange();
        }
    }

    moveColumn(initiator: RevGridLayout.ChangeInitiator, fromColumnIndex: Integer, toColumnIndex: Integer): boolean {
        this.beginChange(initiator);
        let result: boolean;
        if (fromColumnIndex === toColumnIndex) {
            result = false;
        } else {
            moveElementInArray(this._columns, fromColumnIndex, toColumnIndex);
            this._changed = true;
            result = true;
        }
        this.endChange();

        return result;
    }

    moveColumns(initiator: RevGridLayout.ChangeInitiator, fromColumnIndex: Integer, toColumnIndex: Integer, count: Integer): boolean {
        this.beginChange(initiator);
        let result: boolean;
        if (fromColumnIndex === toColumnIndex || count === 0) {
            result = false;
        } else {
            moveElementsInArray(this._columns, fromColumnIndex, toColumnIndex, count);
            this._changed = true;
            result = true;
        }
        this.endChange();

        return result;
    }

    setColumnWidth(initiator: RevGridLayout.ChangeInitiator, fieldName: string, width: Integer | undefined) {
        const column = this.findColumn(fieldName);
        if (column === undefined) {
            throw new AssertInternalError('GLSCW48483', fieldName);
        } else {
            if (width !== column.autoSizableWidth) {
                this.beginChange(initiator);
                column.autoSizableWidth = width;
                this._widthsChanged = true;
                this.endChange();
            }
        }
    }

    // serialise(): GridLayout.SerialisedColumn[] {
    //     return this._Columns.map<GridLayout.SerialisedColumn>((column) => {
    //         const result: GridLayout.SerialisedColumn = {
    //             name: column.field.name, width: column.width, priority: column.sortPriority, ascending: column.sortAscending
    //         };

    //         if (!column.visible) {
    //             result.show = false;
    //         }

    //         return result;
    //     });
    // }

    // setFieldColumnsByFieldNames(fieldNames: string[]): void {
    //     for (let idx = 0; idx < fieldNames.length; idx++) {
    //         const field = this.getFieldByName(fieldNames[idx]);
    //         if (field !== undefined) {
    //             this.moveFieldColumn(field, idx);
    //         }
    //     }
    // }

    // setFieldColumnsByColumnIndices(columnIndices: number[]): void {
    //     for (let idx = 0; idx < columnIndices.length; idx++) {
    //         const columnIdx = columnIndices[idx];
    //         this.moveColumn(columnIdx, idx);
    //     }
    // }

    // setFieldWidthByFieldName(fieldName: string, width?: number): void {
    //     const columnIdx = this.getFieldColumnIndexByFieldName(fieldName);
    //     if (columnIdx !== undefined) {
    //         const column = this._columns[columnIdx];
    //         this.setFieldWidthByColumn(column, width);
    //     }
    // }

    // setFieldsVisible(fieldNames: string[], visible: boolean): void {
    //     for (let idx = 0; idx < fieldNames.length; idx++) {
    //         const columnIdx = this.getFieldColumnIndexByFieldName(fieldNames[idx]);
    //         if (columnIdx !== undefined) {
    //             this._columns[columnIdx].visible = visible;
    //         }
    //     }
    // }

    subscribeChangedEvent(handler: RevGridLayout.ChangedEventHandler): number {
        return this._changedMultiEvent.subscribe(handler);
    }

    unsubscribeChangedEvent(subscriptionId: MultiEvent.SubscriptionId): void {
        this._changedMultiEvent.unsubscribe(subscriptionId);
    }

    subscribeWidthsChangedEvent(handler: RevGridLayout.WidthsChangedEventHandler): number {
        return this._widthsChangedMultiEvent.subscribe(handler);
    }

    unsubscribeWidthsChangedEvent(subscriptionId: MultiEvent.SubscriptionId): void {
        this._widthsChangedMultiEvent.unsubscribe(subscriptionId);
    }

    protected assign(other: RevGridLayout) {
        const columns = other._columns;
        const count = other.columnCount;
        const copiedColumns = new Array<RevGridLayoutDefinition.Column>(count);
        for (let i = 0; i < count; i++) {
            const column = columns[i];
            const copiedColumn = RevGridLayoutDefinition.Column.createCopy(column);
            copiedColumns[i] = copiedColumn;
        }

        const definition = new RevGridLayoutDefinition(copiedColumns);
        this.applyDefinition(RevGridLayout.forceChangeInitiator, definition);
    }

    protected createDefinitionColumns(): RevGridLayoutDefinition.Column[] {
        const count = this.columnCount;
        const definitionColumns = new Array<RevGridLayoutDefinition.Column>(count);
        for (let i = 0; i < count; i++) {
            const column = this._columns[i];
            const definitionColumn: RevGridLayoutDefinition.Column = {
                fieldName: column.fieldName,
                autoSizableWidth: column.autoSizableWidth,
                visible: column.visible,
            };

            definitionColumns[i] = definitionColumn;
        }

        return definitionColumns;
    }

    private tryProcessFirstLock(): Promise<Result<void>> {
        return Promise.resolve(new Ok(undefined));
    }

    private processLastUnlock(): void {
        // nothing to do
    }

    private processFirstOpen(): void {
        // nothing to do
    }

    private processLastClose(): void {
        // nothing to do
    }

    private notifyChanged(initiator: RevGridLayout.ChangeInitiator) {
        const handlers = this._changedMultiEvent.copyHandlers();
        for (const handler of handlers) {
            handler(initiator);
        }
    }

    private notifyWidthsChanged(initiator: RevGridLayout.ChangeInitiator) {
        const handlers = this._widthsChangedMultiEvent.copyHandlers();
        for (const handler of handlers) {
            handler(initiator);
        }
    }

    private setFieldWidthByColumn(column: RevGridLayout.Column, width?: number): void {
        if (width === undefined) {
            delete column.autoSizableWidth;
        } else {
            column.autoSizableWidth = width;
        }
    }

    // SetFieldVisible(field: TFieldIndex | GridLayout.Field, visible: boolean): void {
    //     this.columns[this.GetFieldColumnIndex(field)].Visible = visible;
    // }

    private setColumnVisibility(columnIndex: number, visible: boolean | undefined): void {
        this._columns[columnIndex].visible = visible;
    }

    // private moveFieldColumn(field: GridLayout.Field, columnIndex: number): void {
    //     const oldColumnIndex = this.getFieldColumnIndexByField(field);

    //     if (oldColumnIndex === undefined) {
    //         throw new GridLayoutError(ErrorCode.GridLayoutFieldDoesNotExist, field.name);
    //     }

    //     this.moveColumn(oldColumnIndex, columnIndex);
    // }

    // private indexOfColumnByFieldName(fieldName: string): number | undefined {
    //     const idx = this._columns.findIndex((column) => column.fieldName === fieldName);
    //     return idx < 0 ? undefined : idx;
    // }

    // /** Gets all visible columns */
    // private getVisibleColumns(): GridLayout.Column[] {
    //     return this._columns.filter(column => column.visible);
    // }

    // private setFieldWidthByField(field: GridLayout.Field, width?: number): void {
    //     const columnIdx = this.getFieldColumnIndexByField(field);
    //     const column = this._columns[columnIdx];
    //     this.setFieldWidthByColumn(column, width);
    // }

    // private setFieldWidthByFieldIndex(fieldIdx: GridRecordFieldIndex, width?: number): void {
    //     const columnIdx = this.getFieldColumnIndexByFieldIndex(fieldIdx);
    //     const column = this._columns[columnIdx];

    //     this.setFieldWidthByColumn(column, width);
    // }
}

/** @public */
export namespace RevGridLayout {
    export type ChangedEventHandler = (this: void, initiator: ChangeInitiator) => void;
    export type WidthsChangedEventHandler = (this: void, initiator: ChangeInitiator) => void;

    export interface Column {
        fieldName: string;
        visible: boolean | undefined; // only use if want to keep position in case want to make visible again in future
        autoSizableWidth: Integer | undefined;
    }

    export namespace Column {
        export function createCopy(column: Column): Column {
            return {
                fieldName: column.fieldName,
                visible: column.visible,
                autoSizableWidth: column.autoSizableWidth,
            };
        }
    }

    export interface ChangeInitiator {
        // just used to mark object initiating a change
    }

    export const forceChangeInitiator: ChangeInitiator = {
    };

    export interface Locker {
        lockerName: string;
    }
}
