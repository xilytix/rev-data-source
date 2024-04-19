// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { MapKey } from '@xilytix/sysutils';

/** @public */
export interface RevRecordDefinition {
    readonly mapKey: MapKey;
}

/** @public */
export namespace RevTableRecordDefinition {
    export function same(left: RevRecordDefinition, right: RevRecordDefinition) {
        return left.mapKey === right.mapKey;
    }
}
