// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, Err, Guid, LockOpenListItem, Ok, Result } from '@xilytix/sysutils';
import {
    RevGridLayoutDefinition,
    RevGridLayoutOrReferenceDefinition
} from './definition/internal-api';
import { RevGridLayout } from './rev-grid-layout';
import { RevReferenceableGridLayout } from './rev-referenceable-grid-layout';
import { RevReferenceableGridLayoutsService } from './rev-referenceable-grid-layouts-service';

/** @public */
export class RevGridLayoutOrReference {
    private readonly _referenceId: Guid | undefined;
    private readonly _gridLayoutDefinition: RevGridLayoutDefinition | undefined;

    private _lockedGridLayout: RevGridLayout | undefined;
    private _lockedReferenceableGridLayout: RevReferenceableGridLayout | undefined;

    constructor(
        private readonly _referenceableGridLayoutsService: RevReferenceableGridLayoutsService,
        definition: RevGridLayoutOrReferenceDefinition,
    ) {
        if (definition.referenceId !== undefined) {
            this._referenceId = definition.referenceId;
        } else {
            if (definition.gridLayoutDefinition !== undefined ) {
                this._gridLayoutDefinition = definition.gridLayoutDefinition;
            } else {
                throw new AssertInternalError('GLONRC59923');
            }
        }
    }

    get lockedGridLayout() { return this._lockedGridLayout; }
    get lockedReferenceableGridLayout() { return this._lockedReferenceableGridLayout; }

    createDefinition() {
        if (this._lockedReferenceableGridLayout !== undefined) {
            return new RevGridLayoutOrReferenceDefinition(this._lockedReferenceableGridLayout.id);
        } else {
            if (this.lockedGridLayout !== undefined) {
                const dataSourceDefinition = this.lockedGridLayout.createDefinition();
                return new RevGridLayoutOrReferenceDefinition(dataSourceDefinition);
            } else {
                throw new AssertInternalError('GLONRCDU59923');
            }
        }
    }

    tryLock(locker: LockOpenListItem.Locker): Promise<Result<void, RevGridLayoutOrReference.LockErrorIdPlusTryError>> {
        // Replace with Promise.withResolvers when available in TypeScript (ES2023)
        let resolve: (value: Result<void, RevGridLayoutOrReference.LockErrorIdPlusTryError>) => void;
        const resultPromise = new Promise<Result<void, RevGridLayoutOrReference.LockErrorIdPlusTryError>>((res) => {
            resolve = res;
        });

        if (this._gridLayoutDefinition !== undefined) {
            const gridLayout = new RevGridLayout(this._gridLayoutDefinition);
            const lockPromise = gridLayout.tryLock(locker);
            lockPromise.then(
                (lockResult) => {
                    if (lockResult.isErr()) {
                        const err = new Err({ errorId: RevGridLayoutOrReference.LockErrorId.DefinitionTry, tryError: lockResult.error });
                        resolve(err);
                    } else {
                        this._lockedGridLayout = gridLayout;
                        this._lockedReferenceableGridLayout = undefined;
                        resolve(new Ok(undefined));
                    }
                },
                (reason) => { throw AssertInternalError.createIfNotError(reason, 'RGLORTL54441'); }
            );
        } else {
            if (this._referenceId !== undefined) {
                const lockPromise = this._referenceableGridLayoutsService.tryLockItemByKey(this._referenceId, locker);
                lockPromise.then(
                    (lockResult) => {
                        if (lockResult.isErr()) {
                            const err = new Err({ errorId: RevGridLayoutOrReference.LockErrorId.ReferenceTry, tryError: lockResult.error });
                            resolve(err);
                        } else {
                            const referenceableGridLayout = lockResult.value;
                            if (referenceableGridLayout === undefined) {
                                const err = new Err({ errorId: RevGridLayoutOrReference.LockErrorId.ReferenceNotFound, tryError: undefined });
                                resolve(err);
                            } else {
                                this._lockedReferenceableGridLayout = referenceableGridLayout;
                                this._lockedGridLayout = referenceableGridLayout;
                                resolve(new Ok(undefined));
                            }
                        }
                    },
                    (reason) => { throw AssertInternalError.createIfNotError(reason, 'RGLORTL54441'); }
                );
            } else {
                throw new AssertInternalError('GLDONRTLU24498');
            }
        }

        return resultPromise;
    }

    unlock(locker: LockOpenListItem.Locker) {
        if (this._lockedGridLayout === undefined) {
            throw new AssertInternalError('GLDONRUU23366');
        } else {
            this._lockedGridLayout = undefined;
            if (this._lockedReferenceableGridLayout !== undefined) {
                this._referenceableGridLayoutsService.unlockItem(this._lockedReferenceableGridLayout, locker);
                this._lockedReferenceableGridLayout = undefined;
            }
        }
    }
}

/** @public */
export namespace RevGridLayoutOrReference {
    export const enum LockErrorId {
        DefinitionTry,
        ReferenceTry,
        ReferenceNotFound,
    }

    export interface LockErrorIdPlusTryError {
        errorId: LockErrorId,
        tryError: string | undefined;
    }
}
