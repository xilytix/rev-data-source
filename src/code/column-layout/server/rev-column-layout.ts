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
import { RevColumnLayoutDefinition } from './definition/internal-api';

/**
 * Provides access to a saved layout for a Grid
 *
 * @public
 */
export class RevColumnLayout implements LockOpenListItem<RevColumnLayout>, IndexedRecord {
    readonly id: Guid;
    readonly mapKey: MapKey;

    public index: number;

    private readonly _lockOpenManager: LockOpenManager<RevColumnLayout>;
    private readonly _columns = new Array<RevColumnLayout.Column>(0);

    private _beginChangeCount = 0;
    private _changeInitiator: RevColumnLayout.ChangeInitiator | undefined;
    private _changed = false;
    private _widthsChanged = false;

    private _changedMultiEvent = new MultiEvent<RevColumnLayout.ChangedEventHandler>();
    private _widthsChangedMultiEvent = new MultiEvent<RevColumnLayout.WidthsChangedEventHandler>();

    constructor(
        definition?: RevColumnLayoutDefinition,
        id?: Guid,
        mapKey?: MapKey,
    ) {
        this.id = id ?? newGuid();
        this.mapKey = mapKey ?? this.id;

        this._lockOpenManager = new LockOpenManager<RevColumnLayout>(
            () => this.tryProcessFirstLock(),
            () => { this.processLastUnlock(); },
            () => { this.processFirstOpen(); },
            () => { this.processLastClose(); },
        );

        if (definition !== undefined) {
            this.applyDefinition(RevColumnLayout.forceChangeInitiator, definition);
        }
    }

    get lockCount() { return this._lockOpenManager.lockCount; }
    get lockers(): readonly LockOpenListItem.Locker[] { return this._lockOpenManager.lockers; }
    get openCount() { return this._lockOpenManager.openCount; }
    get openers(): readonly LockOpenListItem.Opener[] { return this._lockOpenManager.openers; }

    get columns(): readonly RevColumnLayout.Column[] { return this._columns; }
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

    beginChange(initiator: RevColumnLayout.ChangeInitiator) {
        if (this._beginChangeCount++ === 0) {
            this._changeInitiator = initiator;
        } else {
            if (initiator !== this._changeInitiator) {
                throw new AssertInternalError('GLBC97117');
            }
        }
    }

    equals(other: RevColumnLayout): boolean {
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

    createCopy(): RevColumnLayout {
        const result = new RevColumnLayout();
        result.assign(this);
        return result;
    }

    createDefinition(): RevColumnLayoutDefinition {
        const definitionColumns = this.createDefinitionColumns();
        return new RevColumnLayoutDefinition(definitionColumns);
    }

    applyDefinition(initiator: RevColumnLayout.ChangeInitiator, definition: RevColumnLayoutDefinition): void {
        this.setColumns(initiator, definition.columns);
    }

    setColumns(initiator: RevColumnLayout.ChangeInitiator, columns: readonly RevColumnLayout.Column[]) {
        const newCount = columns.length;
        const newColumns = new Array<RevColumnLayout.Column>(newCount);
        for (let i = 0; i < newCount; i++) {
            const column = columns[i];
            newColumns[i] = RevColumnLayout.Column.createCopy(column);
        }

        this.beginChange(initiator);
        const oldCount = this._columns.length;
        this._columns.splice(0, oldCount, ...newColumns);
        this._changed = true;
        this.endChange();
    }

    getColumn(columnIndex: number): RevColumnLayout.Column {
        return this._columns[columnIndex];
    }

    indexOfColumn(column: RevColumnLayout.Column) {
        return this._columns.indexOf(column);
    }

    indexOfColumnByFieldName(fieldName: string) {
        return this._columns.findIndex((column) => column.fieldName === fieldName);
    }

    findColumn(fieldName: string) {
        return this._columns.find((column) => column.fieldName === fieldName);
    }


    addColumn(initiator: RevColumnLayout.ChangeInitiator, columnOrName: string | RevColumnLayoutDefinition.Column) {
        this.addColumns(initiator, [columnOrName]);
    }

    addColumns(initiator: RevColumnLayout.ChangeInitiator, columnsNames: (string | RevColumnLayoutDefinition.Column)[]) {
        const index = this._columns.length;
        this.insertColumns(initiator, index, columnsNames);
    }

    insertColumns(initiator: RevColumnLayout.ChangeInitiator, index: Integer, columnOrFieldNames: (string | RevColumnLayoutDefinition.Column)[]) {
        this.beginChange(initiator);
        const insertCount = columnOrFieldNames.length;
        const insertColumns = new Array<RevColumnLayoutDefinition.Column>(insertCount);
        for (let i = 0; i < insertCount; i++) {
            const columnOrFieldName = columnOrFieldNames[i];
            const column: RevColumnLayout.Column = (typeof columnOrFieldName === 'string') ?
                { fieldName: columnOrFieldName, visible: undefined, autoSizableWidth: undefined } :
                columnOrFieldName;
            this._columns[i] = column;
        }
        this._columns.splice(index, 0, ...insertColumns);
        this._changed = true;
        this.endChange();
    }

    removeColumn(initiator: RevColumnLayout.ChangeInitiator, index: Integer) {
        this.removeColumns(initiator, index, 1);
    }

    removeColumns(initiator: RevColumnLayout.ChangeInitiator, index: Integer, count: Integer) {
        this.beginChange(initiator);
        this._columns.splice(index, count);
        this._changed = true;
        this.endChange();
    }

    clearColumns(initiator: RevColumnLayout.ChangeInitiator) {
        if (this._columns.length > 0 ) {
            this.beginChange(initiator);
            this._columns.length = 0;
            this._changed = true;
            this.endChange();
        }
    }

    moveColumn(initiator: RevColumnLayout.ChangeInitiator, fromColumnIndex: Integer, toColumnIndex: Integer): boolean {
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

    moveColumns(initiator: RevColumnLayout.ChangeInitiator, fromColumnIndex: Integer, toColumnIndex: Integer, count: Integer): boolean {
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

    setColumnWidth(initiator: RevColumnLayout.ChangeInitiator, fieldName: string, width: Integer | undefined) {
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

    subscribeChangedEvent(handler: RevColumnLayout.ChangedEventHandler): number {
        return this._changedMultiEvent.subscribe(handler);
    }

    unsubscribeChangedEvent(subscriptionId: MultiEvent.SubscriptionId): void {
        this._changedMultiEvent.unsubscribe(subscriptionId);
    }

    subscribeWidthsChangedEvent(handler: RevColumnLayout.WidthsChangedEventHandler): number {
        return this._widthsChangedMultiEvent.subscribe(handler);
    }

    unsubscribeWidthsChangedEvent(subscriptionId: MultiEvent.SubscriptionId): void {
        this._widthsChangedMultiEvent.unsubscribe(subscriptionId);
    }

    protected assign(other: RevColumnLayout) {
        const columns = other._columns;
        const count = other.columnCount;
        const copiedColumns = new Array<RevColumnLayoutDefinition.Column>(count);
        for (let i = 0; i < count; i++) {
            const column = columns[i];
            const copiedColumn = RevColumnLayoutDefinition.Column.createCopy(column);
            copiedColumns[i] = copiedColumn;
        }

        const definition = new RevColumnLayoutDefinition(copiedColumns);
        this.applyDefinition(RevColumnLayout.forceChangeInitiator, definition);
    }

    protected createDefinitionColumns(): RevColumnLayoutDefinition.Column[] {
        const count = this.columnCount;
        const definitionColumns = new Array<RevColumnLayoutDefinition.Column>(count);
        for (let i = 0; i < count; i++) {
            const column = this._columns[i];
            const definitionColumn: RevColumnLayoutDefinition.Column = {
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

    private notifyChanged(initiator: RevColumnLayout.ChangeInitiator) {
        const handlers = this._changedMultiEvent.copyHandlers();
        for (const handler of handlers) {
            handler(initiator);
        }
    }

    private notifyWidthsChanged(initiator: RevColumnLayout.ChangeInitiator) {
        const handlers = this._widthsChangedMultiEvent.copyHandlers();
        for (const handler of handlers) {
            handler(initiator);
        }
    }

    private setFieldWidthByColumn(column: RevColumnLayout.Column, width?: number): void {
        if (width === undefined) {
            delete column.autoSizableWidth;
        } else {
            column.autoSizableWidth = width;
        }
    }

    private setColumnVisibility(columnIndex: number, visible: boolean | undefined): void {
        this._columns[columnIndex].visible = visible;
    }
}

/** @public */
export namespace RevColumnLayout {
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
