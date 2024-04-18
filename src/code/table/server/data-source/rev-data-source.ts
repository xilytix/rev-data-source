// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, Err, Guid, IndexedRecord, LockOpenListItem, LockOpenManager, MapKey, MultiEvent, Ok, Result, UnreachableCaseError, newGuid } from '@xilytix/sysutils';
import {
    RevColumnLayout,
    RevColumnLayoutOrReference,
    RevColumnLayoutOrReferenceDefinition,
    RevReferenceableColumnLayout,
    RevReferenceableColumnLayoutsService
} from "../../../column-layout/server/internal-api";
import { RevRecordRowOrderDefinition, RevSourcedFieldDefinition } from '../../../record/server/internal-api';
import { RevTableFieldSourceDefinitionFactory } from '../field-source/internal-api';
import { RevTableRecordSource, RevTableRecordSourceDefinition, RevTableRecordSourceFactory } from '../record-source/internal-api';
import { RevTable } from '../table/internal-api';
import { RevDataSourceDefinition } from './definition/internal-api';

/** @public */
export class RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>
    implements
        LockOpenListItem<
            RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
            RevDataSource.LockErrorIdPlusTryError
        >,
        IndexedRecord {

    readonly id: Guid;
    readonly mapKey: MapKey;

    public index: number;

    private readonly _lockOpenManager: LockOpenManager<
        RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
        RevDataSource.LockErrorIdPlusTryError
    >;

    private readonly _tableRecordSourceDefinition: RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>;
    private _columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition | undefined;
    private _initialRowOrderDefinition: RevRecordRowOrderDefinition | undefined;

    private _lockedTableRecordSource: RevTableRecordSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> | undefined;
    private _lockedColumnLayout: RevColumnLayout | undefined;
    private _lockedReferenceableColumnLayout: RevReferenceableColumnLayout | undefined;

    private _table: RevTable<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> | undefined;

    private _columnLayoutSetMultiEvent = new MultiEvent<RevDataSource.GridColumnSetEventHandler>();

    constructor(
        private readonly _referenceableColumnLayoutsService: RevReferenceableColumnLayoutsService,
        private readonly _tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        private readonly _tableRecordSourceFactory: RevTableRecordSourceFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
        definition: RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        id?: Guid,
        mapKey?: MapKey,
    ) {
        this.id = id ?? newGuid();
        this.mapKey = mapKey ?? this.id;

        this._lockOpenManager = new LockOpenManager<
            RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
            RevDataSource.LockErrorIdPlusTryError
        >(
            (locker) => this.tryProcessFirstLock(locker),
            (locker) => { this.processLastUnlock(locker); },
            (opener) => { this.processFirstOpen(opener); },
            (opener) => { this.processLastClose(opener); },
        );

        this._tableRecordSourceDefinition = definition.tableRecordSourceDefinition;
        this._columnLayoutOrReferenceDefinition = definition.columnLayoutOrReferenceDefinition;
        this._initialRowOrderDefinition = definition.rowOrderDefinition;
    }

    get lockCount() { return this._lockOpenManager.lockCount; }
    get lockers(): readonly LockOpenListItem.Locker[] { return this._lockOpenManager.lockers; }
    get openCount() { return this._lockOpenManager.openCount; }
    get openers(): readonly LockOpenListItem.Opener[] { return this._lockOpenManager.openers; }

    get lockedTableRecordSource() { return this._lockedTableRecordSource; }
    get lockedColumnLayout() { return this._lockedColumnLayout; }
    get lockedReferenceableColumnLayout() { return this._lockedReferenceableColumnLayout; }
    get initialRowOrderDefinition() { return this._initialRowOrderDefinition; }

    get table() { return this._table; }

    tryLock(locker: LockOpenListItem.Locker): Promise<Result<void, RevDataSource.LockErrorIdPlusTryError>> {
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

    equals(other: RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>): boolean {
        return this.mapKey === other.mapKey;
    }

    createDefinition(
        rowOrderDefinition: RevRecordRowOrderDefinition | undefined
    ): RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        const tableRecordSourceDefinition = this.createTableRecordSourceDefinition();
        const columnLayoutOrReferenceDefinition = this.createColumnLayoutOrReferenceDefinition();

        return new RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
            tableRecordSourceDefinition,
            columnLayoutOrReferenceDefinition,
            rowOrderDefinition,
        );
    }

    createTableRecordSourceDefinition(): RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        if (this._lockedTableRecordSource === undefined) {
            throw new AssertInternalError('GSCDTR23008');
        } else {
            return this._lockedTableRecordSource.createDefinition();
        }
    }

    createColumnLayoutOrReferenceDefinition(): RevColumnLayoutOrReferenceDefinition {
        if (this._lockedReferenceableColumnLayout !== undefined) {
            return new RevColumnLayoutOrReferenceDefinition(this._lockedReferenceableColumnLayout.id);
        } else {
            if (this._lockedColumnLayout !== undefined) {
                const columnLayoutDefinition = this._lockedColumnLayout.createDefinition();
                return new RevColumnLayoutOrReferenceDefinition(columnLayoutDefinition);
            } else {
                throw new AssertInternalError('GSCGLONRD23008');
            }
        }
    }

    /** Can only call if a DataSource is already opened */
    async tryOpenColumnLayoutOrReferenceDefinition(
        definition: RevColumnLayoutOrReferenceDefinition,
        opener: LockOpenListItem.Opener
    ): Promise<Result<void, RevColumnLayoutOrReference.LockErrorIdPlusTryError>> {
        const lockResult = await this.tryCreateAndLockColumnLayoutFromDefinition(definition, opener);
        if (lockResult.isErr()) {
            return new Err(lockResult.error);
        } else {
            this.closeLockedColumnLayout(opener);
            this.unlockColumnLayout(opener);

            this._columnLayoutOrReferenceDefinition = definition;

            const lockedLayouts = lockResult.value;
            const layout = lockedLayouts.columnLayout;
            this._lockedColumnLayout = layout;
            this._lockedReferenceableColumnLayout = lockedLayouts.referenceableColumnLayout;

            this.openLockedColumnLayout(opener);

            if (this._table === undefined) {
                throw new AssertInternalError('GSOGLDLT23008')
            } else {
                const tableFieldSourceDefinitionTypeIds = this.getTableFieldSourceDefinitionTypeIdsFromLayout(layout);
                this._table.setActiveFieldSources(tableFieldSourceDefinitionTypeIds, true);
                this.notifyColumnLayoutSet();
                return new Ok(undefined);
            }
        }
    }

    subscribeColumnLayoutSetEvent(handler: RevDataSource.GridColumnSetEventHandler) {
        return this._columnLayoutSetMultiEvent.subscribe(handler);
    }

    unsubscribeColumnLayoutSetEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._columnLayoutSetMultiEvent.unsubscribe(subscriptionId);
    }

    private notifyColumnLayoutSet() {
        const handlers = this._columnLayoutSetMultiEvent.copyHandlers();
        for (let i = 0; i < handlers.length; i++) {
            handlers[i]();
        }
    }

    private async tryLockColumnLayout(locker: LockOpenListItem.Locker): Promise<Result<RevDataSource.LockedColumnLayouts, RevColumnLayoutOrReference.LockErrorIdPlusTryError>> {
        let columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition;
        if (this._columnLayoutOrReferenceDefinition !== undefined) {
            columnLayoutOrReferenceDefinition = this._columnLayoutOrReferenceDefinition;
        } else {
            const columnLayoutDefinition = this._tableRecordSourceDefinition.createDefaultLayoutDefinition();
            columnLayoutOrReferenceDefinition = new RevColumnLayoutOrReferenceDefinition(columnLayoutDefinition);
        }
        const result = await this.tryCreateAndLockColumnLayoutFromDefinition(columnLayoutOrReferenceDefinition, locker);
        return result;
    }

    private async tryCreateAndLockColumnLayoutFromDefinition(
        columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition,
        locker: LockOpenListItem.Locker
    ): Promise<Result<RevDataSource.LockedColumnLayouts, RevColumnLayoutOrReference.LockErrorIdPlusTryError>> {
        const columnLayoutOrReference = new RevColumnLayoutOrReference(
            this._referenceableColumnLayoutsService,
            columnLayoutOrReferenceDefinition
        );
        const columnLayoutOrReferenceLockResult = await columnLayoutOrReference.tryLock(locker);
        if (columnLayoutOrReferenceLockResult.isErr()) {
            return columnLayoutOrReferenceLockResult.createType();
        } else {
            const columnLayout = columnLayoutOrReference.lockedColumnLayout;
            if (columnLayout === undefined) {
                throw new AssertInternalError('GSTLGL23008');
            } else {
                const referenceableColumnLayout = columnLayoutOrReference.lockedReferenceableColumnLayout;
                const layouts: RevDataSource.LockedColumnLayouts = {
                    columnLayout,
                    referenceableColumnLayout,
                }
                return new Ok(layouts);
            }
        }
    }

    private async tryProcessFirstLock(locker: LockOpenListItem.Locker): Promise<Result<void, RevDataSource.LockErrorIdPlusTryError>> {
        const tableRecordSource = this._tableRecordSourceFactory.create(this._tableRecordSourceDefinition);
        const tableRecordSourceLockResult = await tableRecordSource.tryLock(locker);
        if (tableRecordSourceLockResult.isErr()) {
            const error: RevDataSource.LockErrorIdPlusTryError = {
                errorId: RevDataSource.LockErrorId.TableRecordSourceTry,
                tryError: tableRecordSourceLockResult.error,
            }
            return new Err(error);
        } else {
            this._lockedTableRecordSource = tableRecordSource;
            const lockColumnLayoutResult = await this.tryLockColumnLayout(locker);
            if (lockColumnLayoutResult.isErr()) {
                this._lockedTableRecordSource.unlock(locker);
                this._lockedTableRecordSource = undefined;
                const lockErrorIdPlusTryError = lockColumnLayoutResult.error;
                const errorId = RevDataSource.LockError.fromRevColumnLayoutOrReference(lockErrorIdPlusTryError.errorId);
                return new Err({ errorId, tryError: lockErrorIdPlusTryError.tryError });
            } else {
                const lockedLayouts = lockColumnLayoutResult.value;
                this._lockedColumnLayout = lockedLayouts.columnLayout;
                this._lockedReferenceableColumnLayout = lockedLayouts.referenceableColumnLayout;
                return new Ok(undefined)
            }
        }
    }

    private processLastUnlock(locker: LockOpenListItem.Locker) {
        if (this._lockedTableRecordSource === undefined) {
            throw new AssertInternalError('GSUT23008');
        } else {
            this._lockedTableRecordSource.unlock(locker);
            this._lockedTableRecordSource.finalise();
            this._lockedTableRecordSource = undefined;

            if (this._lockedColumnLayout === undefined) {
                throw new AssertInternalError('GSUL23008');
            } else {
                this.unlockColumnLayout(locker);
            }
        }
    }

    private processFirstOpen(opener: LockOpenListItem.Opener) {
        this.openLockedColumnLayout(opener);

        if (this._lockedTableRecordSource === undefined || this._lockedColumnLayout === undefined) {
            throw new AssertInternalError('GSOLT23008');
        } else {
            const tableFieldSourceDefinitionTypeIds = this.getTableFieldSourceDefinitionTypeIdsFromLayout(this._lockedColumnLayout);
            this._table = new RevTable<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>(
                this._lockedTableRecordSource,
                this._tableRecordSourceFactory.createCorrectnessState(),
                tableFieldSourceDefinitionTypeIds
            );
            this._table.open(opener);
        }
    }

    private processLastClose(opener: LockOpenListItem.Opener) {
        if (this._table === undefined) {
            throw new AssertInternalError('GSCLT23008');
        } else {
            this._table.close(opener);
            this._table = undefined;
            this.closeLockedColumnLayout(opener);
        }
    }

    private unlockColumnLayout(locker: LockOpenListItem.Locker) {
        if (this._lockedColumnLayout === undefined) {
            throw new AssertInternalError('GSUGL23008')
        } else {
            this._lockedColumnLayout.unlock(locker);
            this._lockedColumnLayout = undefined;
            this._lockedReferenceableColumnLayout = undefined;
        }
    }

    private openLockedColumnLayout(opener: LockOpenListItem.Opener) {
        if (this._lockedColumnLayout === undefined) {
            throw new AssertInternalError('GSOLGL23008');
        } else {
            this._lockedColumnLayout.openLocked(opener);
        }
    }

    private closeLockedColumnLayout(opener: LockOpenListItem.Opener) {
        if (this._lockedColumnLayout === undefined) {
            throw new AssertInternalError('GSCLGL23008');
        } else {
            this._lockedColumnLayout.closeLocked(opener);
        }
    }

    private getTableFieldSourceDefinitionTypeIdsFromLayout(layout: RevColumnLayout) {
        const columns = layout.columns;
        const typeIds = new Array<TableFieldSourceDefinitionTypeId>();
        for (const column of columns) {
            const fieldName = column.fieldName;

            const decomposeResult = RevSourcedFieldDefinition.Name.tryDecompose(fieldName);
            if (decomposeResult.isOk()) {
                const decomposedFieldName = decomposeResult.value;
                const sourceName = decomposedFieldName[0];
                const sourceTypeId = this._tableFieldSourceDefinitionFactory.tryNameToId(sourceName);
                if (sourceTypeId !== undefined) {
                    if (!typeIds.includes(sourceTypeId)) {
                        typeIds.push(sourceTypeId);
                    }
                }
            }
        }
        return typeIds;
    }

}

/** @public */
export namespace RevDataSource {
    export type GridColumnSetEventHandler = (this: void) => void;

    export interface LockedColumnLayouts {
        readonly columnLayout: RevColumnLayout;
        readonly referenceableColumnLayout: RevReferenceableColumnLayout | undefined;
    }

    export const enum LockErrorId {
        TableRecordSourceTry,
        LayoutDefinitionTry,
        LayoutReferenceTry,
        LayoutReferenceNotFound,
    }

    export namespace LockError {
        export function fromRevColumnLayoutOrReference(lockErrorId:  RevColumnLayoutOrReference.LockErrorId): LockErrorId {
            switch (lockErrorId) {
                case RevColumnLayoutOrReference.LockErrorId.DefinitionTry: return LockErrorId.LayoutDefinitionTry;
                case RevColumnLayoutOrReference.LockErrorId.ReferenceTry: return LockErrorId.LayoutReferenceTry;
                case RevColumnLayoutOrReference.LockErrorId.ReferenceNotFound: return LockErrorId.LayoutReferenceNotFound;
                default:
                    throw new UnreachableCaseError('RDSLEFRGLOR66643', lockErrorId);
            }
        }
    }

    export interface LockErrorIdPlusTryError {
        errorId: LockErrorId,
        tryError: string | undefined;
    }
}
