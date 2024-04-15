// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { IndexedRecord, LockOpenListItem } from '@xilytix/sysutils';
import { RevReferenceableGridLayoutsService } from '../column-order/internal-api';
import { RevRecordRowOrderDefinition } from '../record/internal-api';
import { RevTableFieldSourceDefinitionFactory, RevTableRecordSourceFactory } from '../table/internal-api';
import { RevReferenceableDataSourceDefinition } from './definition/internal-api';
import { RevDataSource } from './rev-data-source';

/** @public */
export class RevReferenceableDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>
    extends RevDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>
    implements
        LockOpenListItem<
            RevReferenceableDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
            RevDataSource.LockErrorIdPlusTryError
        >,
        IndexedRecord {

    readonly name: string;
    readonly upperCaseName: string;

    constructor(
        referenceableGridLayoutsService: RevReferenceableGridLayoutsService,
        tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        tableRecordSourceFactory: RevTableRecordSourceFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>,
        lockedDefinition: RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        index: number,
    ) {
        const id = lockedDefinition.id;
        super(referenceableGridLayoutsService, tableFieldSourceDefinitionFactory, tableRecordSourceFactory, lockedDefinition, id, id);

        this.name = lockedDefinition.name;
        this.upperCaseName = this.name.toUpperCase();
    }

    override createDefinition(
        rowOrderDefinition: RevRecordRowOrderDefinition
    ): RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        const tableRecordSourceDefinition = this.createTableRecordSourceDefinition();
        const gridLayoutOrReferenceDefinition = this.createGridLayoutOrReferenceDefinition();

        return new RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
            this.id,
            this.name,
            tableRecordSourceDefinition,
            gridLayoutOrReferenceDefinition,
            rowOrderDefinition,
        );
    }
}
