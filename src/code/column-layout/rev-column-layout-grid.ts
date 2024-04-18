// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings, Column, ColumnsManager, RevListChangedTypeId, Revgrid, SchemaField } from '@xilytix/revgrid';
import { AssertInternalError, MultiEvent, UnreachableCaseError } from '@xilytix/sysutils';
import { RevColumnLayout, RevColumnLayoutDefinition } from './server/internal-api';

/** @public */
export class RevColumnLayoutGrid<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends Revgrid<BGS, BCS, SF> {
    private _columnLayout: RevColumnLayout | undefined;
    private _columnLayoutChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _columnLayoutWidthsChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _activeColumnsAndWidthSetting = false;

    get columnLayout() { return this._columnLayout; }
    get emWidth() { return this.canvas.gc.getEmWidth(); }

    createColumnLayoutDefinition() {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevColumnLayoutDefinition(definitionColumns);
    }

    createColumnLayoutDefinitionColumns() {
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

    updateColumnLayout(value: RevColumnLayout) {
        if (value !== this._columnLayout) {
            if (this._columnLayout !== undefined) {
                this._columnLayout.unsubscribeChangedEvent(this._columnLayoutChangedSubscriptionId);
                this._columnLayoutChangedSubscriptionId = undefined;
                this._columnLayout.unsubscribeWidthsChangedEvent(this._columnLayoutWidthsChangedSubscriptionId);
                this._columnLayoutChangedSubscriptionId = undefined;
            }

            this._columnLayout = value;
            this._columnLayoutChangedSubscriptionId = this._columnLayout.subscribeChangedEvent(
                (initiator) => {
                    if (!this._activeColumnsAndWidthSetting) {
                        this.processColumnLayoutChangedEvent(initiator);
                    }
                }
            );
            this._columnLayoutWidthsChangedSubscriptionId = this._columnLayout.subscribeWidthsChangedEvent(
                (initiator) => { this.processColumnLayoutWidthsChangedEvent(initiator); }
            );

            this.processColumnLayoutChangedEvent(RevColumnLayout.forceChangeInitiator);
        }
    }

    applyColumnLayoutDefinition(value: RevColumnLayoutDefinition) {
        if (this._columnLayout === undefined) {
            throw new AssertInternalError('RCLGACLD34488');
        } else {
            this._columnLayout.applyDefinition(RevColumnLayout.forceChangeInitiator, value);
        }
    }

    protected areFieldsAllowed() {
        return true;
    }

    protected isFieldNameAllowed(fieldName: string) {
        return true;
    }

    protected setActiveColumnsAndWidths() {
        const columnLayout = this._columnLayout;
        if (columnLayout !== undefined) {
            const layoutColumnCount = columnLayout.columnCount;
            const layoutColumns = columnLayout.columns;
            const nameAndWidths = new Array<ColumnsManager.FieldNameAndAutoSizableWidth>(layoutColumnCount);
            let count = 0;
            for (let i = 0; i < layoutColumnCount; i++) {
                const column = layoutColumns[i];
                const visible = column.visible;
                if (visible === undefined || visible) {
                    const fieldName = column.fieldName;
                    const fieldAllowed = this.isFieldNameAllowed(fieldName);
                    if (fieldAllowed) {
                        nameAndWidths[count++] = {
                            name: fieldName,
                            autoSizableWidth: column.autoSizableWidth,
                        };
                    }
                }
            }
            nameAndWidths.length = count;
            this._activeColumnsAndWidthSetting = true;
            try {
                this.setActiveColumnsAndWidthsByFieldName(nameAndWidths);
            } finally {
                this._activeColumnsAndWidthSetting = false;
            }
        }
    }

    protected override descendantProcessActiveColumnListChanged(
        typeId: RevListChangedTypeId,
        index: number,
        count: number,
        targetIndex: number | undefined,
        ui: boolean,
    ) {
        if (ui) {
            if (this._columnLayout === undefined) {
                throw new AssertInternalError('RRGDPACLC56678');
            } else {
                switch (typeId) {
                    case RevListChangedTypeId.Move: {
                        if (targetIndex === undefined) {
                            throw new AssertInternalError('RRGDPACCLCM44430');
                        } else {
                            this._columnLayout.moveColumns(this, index, count, targetIndex);
                            break;
                        }
                    }
                    case RevListChangedTypeId.Clear: {
                        this._columnLayout.clearColumns(this);
                        break;
                    }
                    case RevListChangedTypeId.Insert:
                    case RevListChangedTypeId.Remove:
                    case RevListChangedTypeId.Set: {
                        const definition = this.createColumnLayoutDefinition();
                        this._columnLayout.applyDefinition(this, definition);
                        break;
                    }
                    default:
                        throw new UnreachableCaseError('RCLGDPACCLCU44430', typeId);
                }
            }
        }
    }

    protected override descendantProcessColumnsWidthChanged(columns: Column<BCS, SF>[], ui: boolean) {
        if (ui) {
            if (this._columnLayout === undefined) {
                throw new AssertInternalError('RGPCWC56678');
            } else {
                this._columnLayout.beginChange(this);
                for (const column of columns) {
                    this._columnLayout.setColumnWidth(this, column.field.name, column.width);
                }
                this._columnLayout.endChange();
            }
        }
    }

    private processColumnLayoutChangedEvent(initiator: RevColumnLayout.ChangeInitiator) {
        if (initiator !== this) {
            if (this.areFieldsAllowed()) {
                this.setActiveColumnsAndWidths();
            }
        }
    }

    private processColumnLayoutWidthsChangedEvent(initiator: RevColumnLayout.ChangeInitiator) {
        if (initiator !== this) {
            const columnNameWidths = this.createColumnNameWidths();
            this.setColumnWidthsByName(columnNameWidths);
        }
    }

    private createColumnNameWidths() {
        if (this._columnLayout === undefined) {
            throw new AssertInternalError('RGCCNW56678');
        } else {
            const fields = this.schemaServer.getFields();
            const schemaFieldNames = fields.map((field) => field.name);
            const columns = this._columnLayout.columns;
            const maxCount = columns.length;
            const columnNameWidths = new Array<ColumnsManager.FieldNameAndAutoSizableWidth>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const column = columns[i];
                const fieldName = column.fieldName;
                if (schemaFieldNames.includes(fieldName)) {
                    const columnNameWidth: ColumnsManager.FieldNameAndAutoSizableWidth = {
                        name: fieldName,
                        autoSizableWidth: column.autoSizableWidth,
                    };
                    columnNameWidths[count++] = columnNameWidth;
                }
            }
            columnNameWidths.length = count;
            return columnNameWidths;
        }
    }
}
