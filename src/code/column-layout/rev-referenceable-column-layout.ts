// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevReferenceableColumnLayoutDefinition } from './definition/internal-api';
import { RevColumnLayout } from './rev-column-layout';

/** @public */
export class RevReferenceableColumnLayout extends RevColumnLayout {
    readonly name: string;
    readonly upperCaseName: string;

    constructor(
        definition: RevReferenceableColumnLayoutDefinition,
        index: Integer,
    ) {
        const id = definition.id;
        super(definition, id, id);

        this.name = definition.name;
        this.upperCaseName = this.name.toUpperCase();
        this.index = index;
    }

    override createDefinition(): RevReferenceableColumnLayoutDefinition {
        const definitionColumns = this.createDefinitionColumns();
        return new RevReferenceableColumnLayoutDefinition(this.id, this.name, definitionColumns, 0);
    }
}
