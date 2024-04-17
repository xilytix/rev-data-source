// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevRecordDefinition } from '../../record/server/record/internal-api';

/** @public */
export interface RevTableRecordDefinition<TableFieldSourceDefinitionTypeId> extends RevRecordDefinition {
    readonly typeId: TableFieldSourceDefinitionTypeId;
}

/** @public */
export namespace RevTableRecordDefinition {
    export function same<TableFieldSourceDefinitionTypeId>(left: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>, right: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>) {
        return left.typeId === right.typeId && left.mapKey === right.mapKey;
    }
}
