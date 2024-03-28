// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Guid, IndexedRecord } from '@xilytix/sysutils';

/** @public */
export class RevFavouriteReferenceableGridLayoutDefinition implements IndexedRecord {
    name: string;
    id: Guid;
    index: number;
}
