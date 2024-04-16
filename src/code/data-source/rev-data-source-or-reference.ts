// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, Err, Guid, LockOpenListItem, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevReferenceableColumnLayoutsService } from '../column-layout/internal-api';
import { RevRecordRowOrderDefinition } from '../record/internal-api';
import { RevTableFieldSourceDefinitionFactory, RevTableRecordSourceFactory } from '../table/internal-api';
import { RevDataSourceDefinition, RevDataSourceOrReferenceDefinition } from './definition/internal-api';
import { RevDataSource } from './rev-data-source';
import { RevReferenceableDataSource } from './rev-referenceable-data-source';
import { RevReferenceableDataSourcesService } from './rev-referenceable-data-sources-service';

/** @public */
export class RevDataSourceOrReference<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> {
    private readonly _referenceId: Guid | undefined;
    private readonly _dataSourceDefinition: RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> | undefined;

    private _lockedDataSource: RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> | undefined;
    private _lockedReferenceableDataSource: RevReferenceableDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> | undefined;

    constructor(
        private readonly _referenceableColumnLayoutsService: RevReferenceableColumnLayoutsService,
        private readonly _tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        private readonly _tableRecordSourceFactory: RevTableRecordSourceFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
        private readonly _referenceableDataSourcesService: RevReferenceableDataSourcesService<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
        definition: RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    ) {
        if (definition.referenceId !== undefined ) {
            this._referenceId = definition.referenceId;
        } else {
            if (definition.dataSourceDefinition !== undefined ) {
                this._dataSourceDefinition = definition.dataSourceDefinition;
            } else {
                throw new AssertInternalError('GSONRC59923');
            }
        }
    }

    get lockedDataSource() { return this._lockedDataSource;}
    get lockedReferenceableDataSource() { return this._lockedReferenceableDataSource;}

    createDefinition(rowOrderDefinition: RevRecordRowOrderDefinition | undefined) {
        if (this._lockedReferenceableDataSource !== undefined) {
            return new RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(this._lockedReferenceableDataSource.id);
        } else {
            if (this.lockedDataSource !== undefined) {
                const dataSourceDefinition = this.lockedDataSource.createDefinition(rowOrderDefinition);
                return new RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(dataSourceDefinition);
            } else {
                throw new AssertInternalError('GSONRCDU59923');
            }
        }
    }

    async tryLock(locker: LockOpenListItem.Locker): Promise<Result<void, RevDataSourceOrReference.LockErrorIdPlusTryError>> {
        if (this._dataSourceDefinition !== undefined) {
            const dataSource = new RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>(
                this._referenceableColumnLayoutsService,
                this._tableFieldSourceDefinitionFactory,
                this._tableRecordSourceFactory,
                this._dataSourceDefinition
            );
            const dataSourceLockResult = await dataSource.tryLock(locker);
            if (dataSourceLockResult.isErr()) {
                const lockErrorIdPlusTryError = dataSourceLockResult.error;
                const errorId = RevDataSourceOrReference.LockError.fromRevDataSource(lockErrorIdPlusTryError.errorId, false);
                return new Err({ errorId, tryError: lockErrorIdPlusTryError.tryError });
            } else {
                this._lockedDataSource = dataSource;
                this._lockedReferenceableDataSource = undefined;
                return new Ok(undefined);
            }
        } else {
            if (this._referenceId !== undefined) {
                const lockResult = await this._referenceableDataSourcesService.tryLockItemByKey(this._referenceId, locker);
                if (lockResult.isErr()) {
                    const lockErrorIdPlusTryError = lockResult.error;
                    const errorId = RevDataSourceOrReference.LockError.fromRevDataSource(lockErrorIdPlusTryError.errorId, true);
                    return new Err({ errorId, tryError: lockErrorIdPlusTryError.tryError });
                } else {
                    const referenceableDataSource = lockResult.value;
                    if (referenceableDataSource === undefined) {
                        return new Err({ errorId: RevDataSourceOrReference.LockErrorId.ReferenceableNotFound, tryError: undefined});
                    } else {
                        this._lockedReferenceableDataSource = referenceableDataSource;
                        this._lockedDataSource = referenceableDataSource;
                        return new Ok(undefined);
                    }
                }
            } else {
                throw new AssertInternalError('GSDONRTLU24498');
            }
        }
    }

    unlock(locker: LockOpenListItem.Locker) {
        if (this._lockedReferenceableDataSource !== undefined) {
            this._referenceableDataSourcesService.unlockItem(this._lockedReferenceableDataSource, locker);
            this._lockedReferenceableDataSource = undefined;
        } else {
            if (this._lockedDataSource !== undefined) {
                this._lockedDataSource.unlock(locker);
            } else {
                throw new AssertInternalError('GSDONRUU23366');
            }
        }
        this._lockedDataSource = undefined;
    }
}

/** @public */
export namespace RevDataSourceOrReference {
    export const enum LockErrorId {
        TableRecordSourceTry,
        LayoutDefinitionTry,
        LayoutReferenceTry,
        LayoutReferenceNotFound,
        ReferenceableTableRecordSourceTry,
        ReferenceableLayoutDefinitionTry,
        ReferenceableLayoutReferenceTry,
        ReferenceableLayoutReferenceNotFound,
        ReferenceableNotFound
    }

    export namespace LockError {
        export function fromRevDataSource(lockErrorId:  RevDataSource.LockErrorId, referenceable: boolean): LockErrorId {
            switch (lockErrorId) {
                case RevDataSource.LockErrorId.TableRecordSourceTry:
                    return referenceable ? LockErrorId.ReferenceableTableRecordSourceTry : LockErrorId.TableRecordSourceTry;
                case RevDataSource.LockErrorId.LayoutDefinitionTry:
                    return referenceable ? LockErrorId.ReferenceableLayoutDefinitionTry : LockErrorId.LayoutDefinitionTry;
                case RevDataSource.LockErrorId.LayoutReferenceTry:
                    return referenceable ? LockErrorId.ReferenceableLayoutReferenceTry : LockErrorId.LayoutReferenceTry;
                case RevDataSource.LockErrorId.LayoutReferenceNotFound:
                    return referenceable ? LockErrorId.ReferenceableLayoutReferenceNotFound : LockErrorId.LayoutReferenceNotFound;
                default:
                    throw new UnreachableCaseError('RDSORLEFRGLOR66643', lockErrorId);
            }
        }
    }

    export interface LockErrorIdPlusTryError {
        errorId: LockErrorId,
        tryError: string | undefined;
    }
}
