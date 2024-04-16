// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from "../column-layout/internal-api";
import { RevAllowedSourcedField } from './rev-allowed-sourced-field';

/** @public */
export class RevAllowedSourcedFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId> extends RevColumnLayoutDefinition {
    // Uses AllowedGridField instead of RevFieldDefinition as heading can be changed at runtime
    constructor(
        columns: readonly RevColumnLayoutDefinition.Column[],
        readonly allowedFields: readonly RevAllowedSourcedField<RenderValueTypeId, RenderAttributeTypeId>[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
