// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { CorrectnessState } from '@xilytix/sysutils';
import { RevTableRecordSourceDefinition } from './definition/internal-api';
import { RevTableRecordSource } from './rev-table-record-source';

/** @public */
export interface RevTableRecordSourceFactory<Badness, TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    create(
        definition: RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    ): RevTableRecordSource<Badness, TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>;

    createCorrectnessState(): CorrectnessState<Badness>;
}
