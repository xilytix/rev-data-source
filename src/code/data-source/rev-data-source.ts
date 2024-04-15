// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, Err, Guid, IndexedRecord, LockOpenListItem, LockOpenManager, MapKey, MultiEvent, Ok, Result, UnreachableCaseError, newGuid } from '@xilytix/sysutils';
import {
    RevGridLayout,
    RevGridLayoutOrReference,
    RevGridLayoutOrReferenceDefinition,
    RevRecordRowOrderDefinition,
    RevReferenceableGridLayout,
    RevReferenceableGridLayoutsService
} from "../column-order/internal-api";
import { RevSourcedFieldDefinition } from '../sourced-field/internal-api';
import { RevTable, RevTableFieldSourceDefinitionFactory, RevTableRecordSource, RevTableRecordSourceDefinition, RevTableRecordSourceFactory } from '../table/internal-api';
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
    private _gridLayoutOrReferenceDefinition: RevGridLayoutOrReferenceDefinition | undefined;
    private _initialRowOrderDefinition: RevRecordRowOrderDefinition | undefined;

    private _lockedTableRecordSource: RevTableRecordSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> | undefined;
    private _lockedGridLayout: RevGridLayout | undefined;
    private _lockedReferenceableGridLayout: RevReferenceableGridLayout | undefined;

    private _table: RevTable<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> | undefined;

    private _gridLayoutSetMultiEvent = new MultiEvent<RevDataSource.GridLayoutSetEventHandler>();

    constructor(
        private readonly _referenceableGridLayoutsService: RevReferenceableGridLayoutsService,
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
        this._gridLayoutOrReferenceDefinition = definition.gridLayoutOrReferenceDefinition;
        this._initialRowOrderDefinition = definition.rowOrderDefinition;
    }

    get lockCount() { return this._lockOpenManager.lockCount; }
    get lockers(): readonly LockOpenListItem.Locker[] { return this._lockOpenManager.lockers; }
    get openCount() { return this._lockOpenManager.openCount; }
    get openers(): readonly LockOpenListItem.Opener[] { return this._lockOpenManager.openers; }

    get lockedTableRecordSource() { return this._lockedTableRecordSource; }
    get lockedGridLayout() { return this._lockedGridLayout; }
    get lockedReferenceableGridLayout() { return this._lockedReferenceableGridLayout; }
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
        const gridLayoutOrReferenceDefinition = this.createGridLayoutOrReferenceDefinition();

        return new RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
            tableRecordSourceDefinition,
            gridLayoutOrReferenceDefinition,
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

    createGridLayoutOrReferenceDefinition(): RevGridLayoutOrReferenceDefinition {
        if (this._lockedReferenceableGridLayout !== undefined) {
            return new RevGridLayoutOrReferenceDefinition(this._lockedReferenceableGridLayout.id);
        } else {
            if (this._lockedGridLayout !== undefined) {
                const gridLayoutDefinition = this._lockedGridLayout.createDefinition();
                return new RevGridLayoutOrReferenceDefinition(gridLayoutDefinition);
            } else {
                throw new AssertInternalError('GSCGLONRD23008');
            }
        }
    }

    /** Can only call if a DataSource is already opened */
    async tryOpenGridLayoutOrReferenceDefinition(
        definition: RevGridLayoutOrReferenceDefinition,
        opener: LockOpenListItem.Opener
    ): Promise<Result<void, RevGridLayoutOrReference.LockErrorIdPlusTryError>> {
        const lockResult = await this.tryCreateAndLockGridLayoutFromDefinition(definition, opener);
        if (lockResult.isErr()) {
            return new Err(lockResult.error);
        } else {
            this.closeLockedGridLayout(opener);
            this.unlockGridLayout(opener);

            this._gridLayoutOrReferenceDefinition = definition;

            const lockedLayouts = lockResult.value;
            const layout = lockedLayouts.gridLayout;
            this._lockedGridLayout = layout;
            this._lockedReferenceableGridLayout = lockedLayouts.referenceableGridLayout;

            this.openLockedGridLayout(opener);

            if (this._table === undefined) {
                throw new AssertInternalError('GSOGLDLT23008')
            } else {
                const tableFieldSourceDefinitionTypeIds = this.getTableFieldSourceDefinitionTypeIdsFromLayout(layout);
                this._table.setActiveFieldSources(tableFieldSourceDefinitionTypeIds, true);
                this.notifyGridLayoutSet();
                return new Ok(undefined);
            }
        }
    }

    subscribeGridLayoutSetEvent(handler: RevDataSource.GridLayoutSetEventHandler) {
        return this._gridLayoutSetMultiEvent.subscribe(handler);
    }

    unsubscribeGridLayoutSetEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._gridLayoutSetMultiEvent.unsubscribe(subscriptionId);
    }

    private notifyGridLayoutSet() {
        const handlers = this._gridLayoutSetMultiEvent.copyHandlers();
        for (let i = 0; i < handlers.length; i++) {
            handlers[i]();
        }
    }

    private async tryLockGridLayout(locker: LockOpenListItem.Locker): Promise<Result<RevDataSource.LockedGridLayouts, RevGridLayoutOrReference.LockErrorIdPlusTryError>> {
        let gridLayoutOrReferenceDefinition: RevGridLayoutOrReferenceDefinition;
        if (this._gridLayoutOrReferenceDefinition !== undefined) {
            gridLayoutOrReferenceDefinition = this._gridLayoutOrReferenceDefinition;
        } else {
            const gridLayoutDefinition = this._tableRecordSourceDefinition.createDefaultLayoutDefinition();
            gridLayoutOrReferenceDefinition = new RevGridLayoutOrReferenceDefinition(gridLayoutDefinition);
        }
        const result = await this.tryCreateAndLockGridLayoutFromDefinition(gridLayoutOrReferenceDefinition, locker);
        return result;
    }

    private async tryCreateAndLockGridLayoutFromDefinition(
        gridLayoutOrReferenceDefinition: RevGridLayoutOrReferenceDefinition,
        locker: LockOpenListItem.Locker
    ): Promise<Result<RevDataSource.LockedGridLayouts, RevGridLayoutOrReference.LockErrorIdPlusTryError>> {
        const gridLayoutOrReference = new RevGridLayoutOrReference(
            this._referenceableGridLayoutsService,
            gridLayoutOrReferenceDefinition
        );
        const gridLayoutOrReferenceLockResult = await gridLayoutOrReference.tryLock(locker);
        if (gridLayoutOrReferenceLockResult.isErr()) {
            return gridLayoutOrReferenceLockResult.createType();
        } else {
            const gridLayout = gridLayoutOrReference.lockedGridLayout;
            if (gridLayout === undefined) {
                throw new AssertInternalError('GSTLGL23008');
            } else {
                const referenceableGridLayout = gridLayoutOrReference.lockedReferenceableGridLayout;
                const layouts: RevDataSource.LockedGridLayouts = {
                    gridLayout,
                    referenceableGridLayout,
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
            const lockGridLayoutResult = await this.tryLockGridLayout(locker);
            if (lockGridLayoutResult.isErr()) {
                this._lockedTableRecordSource.unlock(locker);
                this._lockedTableRecordSource = undefined;
                const lockErrorIdPlusTryError = lockGridLayoutResult.error;
                const errorId = RevDataSource.LockError.fromRevGridLayoutOrReference(lockErrorIdPlusTryError.errorId);
                return new Err({ errorId, tryError: lockErrorIdPlusTryError.tryError });
            } else {
                const lockedLayouts = lockGridLayoutResult.value;
                this._lockedGridLayout = lockedLayouts.gridLayout;
                this._lockedReferenceableGridLayout = lockedLayouts.referenceableGridLayout;
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

            if (this._lockedGridLayout === undefined) {
                throw new AssertInternalError('GSUL23008');
            } else {
                this.unlockGridLayout(locker);
            }
        }
    }

    private processFirstOpen(opener: LockOpenListItem.Opener) {
        this.openLockedGridLayout(opener);

        if (this._lockedTableRecordSource === undefined || this._lockedGridLayout === undefined) {
            throw new AssertInternalError('GSOLT23008');
        } else {
            const tableFieldSourceDefinitionTypeIds = this.getTableFieldSourceDefinitionTypeIdsFromLayout(this._lockedGridLayout);
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
            this.closeLockedGridLayout(opener);
        }
    }

    private unlockGridLayout(locker: LockOpenListItem.Locker) {
        if (this._lockedGridLayout === undefined) {
            throw new AssertInternalError('GSUGL23008')
        } else {
            this._lockedGridLayout.unlock(locker);
            this._lockedGridLayout = undefined;
            this._lockedReferenceableGridLayout = undefined;
        }
    }

    private openLockedGridLayout(opener: LockOpenListItem.Opener) {
        if (this._lockedGridLayout === undefined) {
            throw new AssertInternalError('GSOLGL23008');
        } else {
            this._lockedGridLayout.openLocked(opener);
        }
    }

    private closeLockedGridLayout(opener: LockOpenListItem.Opener) {
        if (this._lockedGridLayout === undefined) {
            throw new AssertInternalError('GSCLGL23008');
        } else {
            this._lockedGridLayout.closeLocked(opener);
        }
    }

    private getTableFieldSourceDefinitionTypeIdsFromLayout(layout: RevGridLayout) {
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
    export type GridLayoutSetEventHandler = (this: void) => void;

    export interface LockedGridLayouts {
        readonly gridLayout: RevGridLayout;
        readonly referenceableGridLayout: RevReferenceableGridLayout | undefined;
    }

    export const enum LockErrorId {
        TableRecordSourceTry,
        LayoutDefinitionTry,
        LayoutReferenceTry,
        LayoutReferenceNotFound,
    }

    export namespace LockError {
        export function fromRevGridLayoutOrReference(lockErrorId:  RevGridLayoutOrReference.LockErrorId): LockErrorId {
            switch (lockErrorId) {
                case RevGridLayoutOrReference.LockErrorId.DefinitionTry: return LockErrorId.LayoutDefinitionTry;
                case RevGridLayoutOrReference.LockErrorId.ReferenceTry: return LockErrorId.LayoutReferenceTry;
                case RevGridLayoutOrReference.LockErrorId.ReferenceNotFound: return LockErrorId.LayoutReferenceNotFound;
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
