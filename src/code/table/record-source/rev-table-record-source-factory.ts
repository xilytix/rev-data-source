/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { CorrectnessState } from '@xilytix/sysutils';
import { RevTableRecordSourceDefinition } from './definition/internal-api';
import { RevTableRecordSource } from './rev-table-record-source';

/** @public */
export interface RevTableRecordSourceFactory<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness> {
    create(
        definition: RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    ): RevTableRecordSource<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>;

    createCorrectnessState(): CorrectnessState<Badness>;
}
