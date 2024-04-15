// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevReferenceableGridLayoutDefinition } from './definition/internal-api';
import { RevGridLayout } from './rev-grid-layout';

/** @public */
export class RevReferenceableGridLayout extends RevGridLayout {
    readonly name: string;
    readonly upperCaseName: string;

    constructor(
        definition: RevReferenceableGridLayoutDefinition,
        index: Integer,
    ) {
        const id = definition.id;
        super(definition, id, id);

        this.name = definition.name;
        this.upperCaseName = this.name.toUpperCase();
        this.index = index;
    }

    override createDefinition(): RevReferenceableGridLayoutDefinition {
        const definitionColumns = this.createDefinitionColumns();
        return new RevReferenceableGridLayoutDefinition(this.id, this.name, definitionColumns, 0);
    }
}
