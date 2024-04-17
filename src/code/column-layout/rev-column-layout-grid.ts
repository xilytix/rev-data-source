// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings, Revgrid, SchemaField } from '@xilytix/revgrid';
import { RevColumnLayoutDefinition } from './server/internal-api';

export class RevColumnLayoutGrid<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends Revgrid<BGS, BCS, SF> {
    get emWidth() { return this.canvas.gc.getEmWidth(); }

    createColumnLayoutDefinition() {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevColumnLayoutDefinition(definitionColumns);
    }

    private createColumnLayoutDefinitionColumns() {
        const activeColumns = this.activeColumns;
        const activeCount = activeColumns.length;
        const definitionColumns = new Array<RevColumnLayoutDefinition.Column>(activeCount);

        for (let i = 0; i < activeCount; i++) {
            const activeColumn = activeColumns[i];
            const autoSizableWidth = activeColumn.autoSizing ? undefined : activeColumn.width;
            const definitionColumn: RevColumnLayoutDefinition.Column = {
                fieldName: activeColumn.field.name,
                visible: true,
                autoSizableWidth,
            };
            definitionColumns[i] = definitionColumn;
        }
        return definitionColumns;
    }
}
