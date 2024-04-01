// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { MapKey } from '@xilytix/sysutils';

/** @public */
export interface RevTableRecordDefinition<TableFieldSourceDefinitionTypeId> {
    readonly typeId: TableFieldSourceDefinitionTypeId;
    readonly mapKey: MapKey;
}

/** @public */
export namespace RevTableRecordDefinition {
    export function same<TableFieldSourceDefinitionTypeId>(left: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>, right: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>) {
        return left.typeId === right.typeId && left.mapKey === right.mapKey;
    }
}
