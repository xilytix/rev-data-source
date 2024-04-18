// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { JsonElement, Result } from '@xilytix/sysutils';
import { RevTableRecordSourceDefinition } from './rev-table-record-source-definition';

/** @public */
export interface RevTableRecordSourceDefinitionFromJsonFactory<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    tryCreateFromJson(element: JsonElement): Result<RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>>;
}
