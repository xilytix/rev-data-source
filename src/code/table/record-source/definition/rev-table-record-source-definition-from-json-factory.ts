/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { JsonElement, Result } from '@xilytix/sysutils';
import { RevTableRecordSourceDefinition } from './rev-table-record-source-definition';

/** @public */
export interface RevTableRecordSourceDefinitionFromJsonFactory<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    tryCreateFromJson(element: JsonElement): Result<RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>>;
}
