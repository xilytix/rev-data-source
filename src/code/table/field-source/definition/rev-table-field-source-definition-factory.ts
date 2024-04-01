// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevTableFieldSourceDefinition } from './rev-table-field-source-definition';

/** @public */
export interface RevTableFieldSourceDefinitionFactory<TypeId, RenderValueTypeId, RenderAttributeTypeId> {
    create(typeId: TypeId): RevTableFieldSourceDefinition<TypeId, RenderValueTypeId, RenderAttributeTypeId>;
    tryNameToId(name: string): TypeId | undefined;
}
