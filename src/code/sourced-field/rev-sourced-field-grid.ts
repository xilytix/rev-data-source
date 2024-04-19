// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings } from '@xilytix/revgrid';
import { RevRecordGrid } from '../record/internal-api';
import { RevAllowedSourcedField, RevAllowedSourcedFieldsColumnLayoutDefinition, RevSourcedField } from './server/internal-api';

/** @public */
export class RevSourcedFieldGrid<
    RenderValueTypeId,
    RenderAttributeTypeId,
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends RevSourcedField<RenderValueTypeId, RenderAttributeTypeId>
> extends RevRecordGrid<BGS, BCS, SF> {
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly RevAllowedSourcedField<RenderValueTypeId, RenderAttributeTypeId>[]) {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevAllowedSourcedFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId>(definitionColumns, allowedFields, this.settings.fixedColumnCount);
    }
}
