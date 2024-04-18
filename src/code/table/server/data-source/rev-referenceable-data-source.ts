// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { IndexedRecord, LockOpenListItem } from '@xilytix/sysutils';
import { RevReferenceableColumnLayoutsService } from '../../../column-layout/server/internal-api';
import { RevRecordRowOrderDefinition } from '../../../record/server/internal-api';
import { RevTableFieldSourceDefinitionFactory } from '../field-source/internal-api';
import { RevTableRecordSourceFactory } from '../record-source/internal-api';
import { RevReferenceableDataSourceDefinition } from './definition/internal-api';
import { RevDataSource } from './rev-data-source';

/** @public */
export class RevReferenceableDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    extends RevDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    implements
        LockOpenListItem<
            RevReferenceableDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
            RevDataSource.LockErrorIdPlusTryError
        >,
        IndexedRecord {

    readonly name: string;
    readonly upperCaseName: string;

    constructor(
        referenceableColumnLayoutsService: RevReferenceableColumnLayoutsService | undefined,
        tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        tableRecordSourceFactory: RevTableRecordSourceFactory<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        lockedDefinition: RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        index: number,
    ) {
        const id = lockedDefinition.id;
        super(referenceableColumnLayoutsService, tableFieldSourceDefinitionFactory, tableRecordSourceFactory, lockedDefinition, id, id);

        this.name = lockedDefinition.name;
        this.upperCaseName = this.name.toUpperCase();
    }

    override createDefinition(
        rowOrderDefinition: RevRecordRowOrderDefinition
    ): RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        const tableRecordSourceDefinition = this.createTableRecordSourceDefinition();
        const columnLayoutOrReferenceDefinition = this.createColumnLayoutOrReferenceDefinition();

        return new RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
            this.id,
            this.name,
            tableRecordSourceDefinition,
            columnLayoutOrReferenceDefinition,
            rowOrderDefinition,
        );
    }
}
