/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { RevTableFieldSourceDefinition } from './rev-table-field-source-definition';

/** @public */
export interface RevTableFieldSourceDefinitionFactory<TypeId, RenderValueTypeId, RenderAttributeTypeId> {
    create(typeId: TypeId): RevTableFieldSourceDefinition<TypeId, RenderValueTypeId, RenderAttributeTypeId>;
    tryNameToId(name: string): TypeId | undefined;
}
