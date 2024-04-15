// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevGridLayoutDefinition } from "../column-order/internal-api";
import { RevAllowedSourcedField } from './rev-allowed-sourced-field';

/** @public */
export class RevAllowedSourcedFieldsGridLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId> extends RevGridLayoutDefinition {
    // Uses AllowedGridField instead of RevFieldDefinition as heading can be changed at runtime
    constructor(
        columns: readonly RevGridLayoutDefinition.Column[],
        readonly allowedFields: readonly RevAllowedSourcedField<RenderValueTypeId, RenderAttributeTypeId>[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
