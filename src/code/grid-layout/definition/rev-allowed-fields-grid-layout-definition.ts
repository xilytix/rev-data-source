// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevAllowedField } from '../../field/internal-api';
import { RevGridLayoutDefinition } from './rev-grid-layout-definition';

/** @public */
export class RevAllowedFieldsGridLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId> extends RevGridLayoutDefinition {
    // Uses AllowedGridField instead of RevFieldDefinition as heading can be changed at runtime
    constructor(
        columns: readonly RevGridLayoutDefinition.Column[],
        readonly allowedFields: readonly RevAllowedField<RenderValueTypeId, RenderAttributeTypeId>[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
