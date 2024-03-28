// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { LockItemByKeyList } from '@xilytix/sysutils';
import { RevReferenceableGridLayoutDefinition } from './definition/internal-api';
import { RevReferenceableGridLayout } from './rev-referenceable-grid-layout';

/** @public */
export interface RevReferenceableGridLayoutsService extends LockItemByKeyList<RevReferenceableGridLayout> {
    getOrNew(definition: RevReferenceableGridLayoutDefinition): RevReferenceableGridLayout;
}
