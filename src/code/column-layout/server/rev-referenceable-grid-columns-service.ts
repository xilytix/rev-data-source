// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { LockItemByKeyList } from '@xilytix/sysutils';
import { RevReferenceableColumnLayoutDefinition } from './definition/internal-api';
import { RevReferenceableColumnLayout } from './rev-referenceable-column-layout';

/** @public */
export interface RevReferenceableColumnLayoutsService extends LockItemByKeyList<RevReferenceableColumnLayout> {
    getOrNew(definition: RevReferenceableColumnLayoutDefinition): RevReferenceableColumnLayout;
}
