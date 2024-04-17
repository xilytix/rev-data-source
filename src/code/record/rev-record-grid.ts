// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings, Column, ColumnsManager, DataServer, LinedHoverCell, RevListChangedTypeId, Revgrid, ViewCell } from '@xilytix/revgrid';
import { AssertInternalError, Integer, MultiEvent, UnreachableCaseError } from '@xilytix/sysutils';
import { RevColumnLayoutGrid } from '../column-layout/internal-api';
import { RevColumnLayout, RevColumnLayoutDefinition } from '../column-layout/server/internal-api';
import { RevRecordDataServer, RevRecordFieldIndex, RevRecordIndex, RevRecordRowOrderDefinition, RevRecordSchemaServer, RevRecordSortDefinition, RevSourcedField } from './server/internal-api';

export class RevRecordGrid<
    RenderValueTypeId,
    RenderAttributeTypeId,
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends RevSourcedField<RenderValueTypeId, RenderAttributeTypeId>
> extends RevColumnLayoutGrid<BGS, BCS, SF> {
    declare schemaServer: RevRecordSchemaServer<SF>;
    declare mainDataServer: RevRecordDataServer<SF>;
    readonly headerDataServer: DataServer<SF> | undefined;

    recordFocusedEventer: RevRecordGrid.RecordFocusEventer | undefined;
    mainClickEventer: RevRecordGrid.MainClickEventer | undefined;
    mainDblClickEventer: RevRecordGrid.MainDblClickEventer | undefined;
    selectionChangedEventer: RevRecordGrid.SelectionChangedEventer | undefined;
    dataServersRowListChangedEventer: RevRecordGrid.DataServersRowListChangedEventer<RenderValueTypeId, RenderAttributeTypeId, SF> | undefined;

    private _columnLayout: RevColumnLayout | undefined;
    private _allowedFields: readonly SF[] | undefined;

    private _beenUsable = false;
    private _usableRendered = false;
    private _firstUsableRenderViewAnchor: RevRecordGrid.ViewAnchor | undefined;

    private _activeColumnsAndWidthSetting = false;

    private _columnLayoutChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _columnLayoutWidthsChangedSubscriptionId: MultiEvent.SubscriptionId;

    constructor(
        gridHostElement: HTMLElement,
        definition: Revgrid.Definition<BCS, SF>,
        settings: BGS,
        customiseSettingsForNewColumnEventer: Revgrid.GetSettingsForNewColumnEventer<BCS, SF>,
        options?: Revgrid.Options<BGS, BCS, SF>,
    ) {
        super(gridHostElement, definition, settings, customiseSettingsForNewColumnEventer, options);

        const subgridsManager = this.subgridsManager;
        const headerSubgrid = subgridsManager.headerSubgrid;
        if (headerSubgrid !== undefined) {
            this.headerDataServer = headerSubgrid.dataServer;
        }
    }

    get fieldCount() { return this.schemaServer.fieldCount; }
    get fieldNames() { return this.schemaServer.getFields(); }

    get beenUsable() { return this._beenUsable; }

    get recordFocused() { return this.focus.current !== undefined; }

    get continuousFiltering(): boolean { return this.mainDataServer.continuousFiltering; }
    set continuousFiltering(value: boolean) {
        const oldContinuousFiltering =
            this.mainDataServer.continuousFiltering;
        if (value !== oldContinuousFiltering) {
            this.mainDataServer.continuousFiltering = value;

            if (value) {
                // Continuous filtering was just turned on, apply if necessary
                this.mainDataServer.recordsLoaded();
            }
        }
    }

    get rowOrderReversed() { return this.mainDataServer.rowOrderReversed; }
    set rowOrderReversed(value: boolean) {
        this.mainDataServer.rowOrderReversed = value;
    }

    get focusedRecordIndex(): RevRecordIndex | undefined {
        const focusedSubgridRowIndex = this.focus.currentY;
        if (focusedSubgridRowIndex === undefined) {
            return undefined;
        } else {
            return this.mainDataServer.getRecordIndexFromRowIndex(focusedSubgridRowIndex);
        }
    }

    set focusedRecordIndex(recordIndex: number | undefined) {
        if (recordIndex === undefined) {
            this.focus.clear();
        } else {
            const rowIndex = this.mainDataServer.getRowIndexFromRecordIndex(recordIndex);
            if (rowIndex === undefined) {
                this.focus.clear();
            } else {
                this.focus.setY(rowIndex, undefined, undefined);
            }
        }
    }

    get mainRowCount(): number { return this.mainDataServer.getRowCount(); }
    get headerRowCount(): number { return this.headerDataServer === undefined ? 0 : this.headerDataServer.getRowCount(); }
    get isFiltered(): boolean { return this.mainDataServer.isFiltered; }
    get gridRightAligned(): boolean { return this.settings.gridRightAligned; }
    get rowHeight(): number { return this.settings.defaultRowHeight; }

    get rowRecIndices(): number[] {
        return [];
        // todo
    }

    override destroy(): void {
        super.destroy();
        this.mainDataServer.destroy();
    }

    resetUsable() {
        this._usableRendered = false;
        this._beenUsable = false;
    }

    initialiseAllowedFields(fields: readonly SF[]) {
        this.resetUsable();
        this.schemaServer.setFields(fields);
        this._allowedFields = fields;
    }

    applyFirstUsable(rowOrderDefinition: RevRecordRowOrderDefinition | undefined, viewAnchor: RevRecordGrid.ViewAnchor | undefined, columnLayout: RevColumnLayout | undefined) {
        this._beenUsable = true;

        this._firstUsableRenderViewAnchor = viewAnchor;

        if (rowOrderDefinition !== undefined) {
            const sortFields = rowOrderDefinition.sortFields;
            if (sortFields !== undefined) {
                this.applySortFields(sortFields);
            }
        }

        if (columnLayout !== undefined) {
            this.updateColumnLayout(columnLayout);
        }
    }

    updateAllowedFields(fields: readonly SF[]) {
        this.schemaServer.setFields(fields);
        this._allowedFields = fields;
        if (this._columnLayout !== undefined) {
            this.setActiveColumnsAndWidths(fields, this._columnLayout);
        }
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
            throw new AssertInternalError('RRGACLD34488');
        } else {
            this._columnLayout.applyDefinition(RevColumnLayout.forceChangeInitiator, value);
        }
    }

    getSortFields(): RevRecordSortDefinition.Field[] | undefined {
        const specifiers = this.mainDataServer.sortFieldSpecifiers;
        const count = specifiers.length;
        if (count === 0) {
            return undefined;
        } else {
            const fieldDefinitions = new Array<RevRecordSortDefinition.Field>(count);
            const fieldCount = this.fieldCount;
            for (let i = 0; i < count; i++) {
                const specifier = specifiers[i];
                const fieldIndex = specifier.fieldIndex;
                if (fieldIndex > fieldCount) {
                    throw new AssertInternalError('RRGGSC81899');
                } else {
                    const field = this.getField(fieldIndex);
                    const fieldDefinition: RevRecordSortDefinition.Field = {
                        name: field.name,
                        ascending: specifier.ascending,
                    };
                    fieldDefinitions[i] = fieldDefinition;
                }
            }
            return fieldDefinitions;
        }
    }

    getViewAnchor(): RevRecordGrid.ViewAnchor | undefined {
        if (this._usableRendered) {
            const viewLayout = this.viewLayout;
            return {
                rowScrollAnchorIndex: viewLayout.rowScrollAnchorIndex,
                columnScrollAnchorIndex: viewLayout.columnScrollAnchorIndex,
                columnScrollAnchorOffset: viewLayout.columnScrollAnchorOffset,
            };
        } else {
            return undefined;
        }
    }

    applyFilter(filter?: RevRecordDataServer.RecordFilterCallback): void {
        this.mainDataServer.filterCallback = filter;
    }

    clearFilter(): void {
        this.applyFilter(undefined);
    }

    clearSort() {
        this.mainDataServer.clearSort();
    }

    getRowOrderDefinition(): RevRecordRowOrderDefinition {
        const sortColumns = this.getSortFields();
        return new RevRecordRowOrderDefinition(sortColumns, undefined);
    }

    getFieldByName(fieldName: string): SF {
        return this.schemaServer.getFieldByName(fieldName);
    }

    getField(fieldIndex: RevRecordFieldIndex): SF {
        return this.schemaServer.getField(fieldIndex);
    }

    getFieldSortPriority(field: RevRecordFieldIndex | SF): number | undefined {
        return this.mainDataServer.getFieldSortPriority(field);
    }

    getFieldSortAscending(field: RevRecordFieldIndex | SF): boolean | undefined {
        return this.mainDataServer.getFieldSortAscending(field);
    }

    getSortSpecifier(index: number): RevRecordDataServer.SortFieldSpecifier {
        return this.mainDataServer.getSortSpecifier(index);
    }

    isHeaderRow(rowIndex: number): boolean {
        return rowIndex > this.headerRowCount;
    }

    override reset(): void {
        this.schemaServer.reset();
        this.mainDataServer.reset();
        this.resetUsable();
        super.reset();
    }

    invalidateAll() {
        this.mainDataServer.invalidateAll();
    }

    recordToRowIndex(recIdx: RevRecordIndex): number {
        const rowIdx =
            this.mainDataServer.getRowIndexFromRecordIndex(recIdx);
        if (rowIdx === undefined) {
            throw new AssertInternalError('RRGRTRI34449');
        } else {
            return rowIdx;
        }
    }

    reorderRecRows(_itemIndices: number[]) {
        // todo
    }

    rowToRecordIndex(rowIdx: number): Integer {
        return this.mainDataServer.getRecordIndexFromRowIndex(rowIdx);
    }

    sortBy(fieldIndex?: number, isAscending?: boolean): boolean {
        return this.mainDataServer.sortBy(fieldIndex, isAscending);
    }

    sortByMany(specifiers: RevRecordDataServer.SortFieldSpecifier[]): boolean {
        return this.mainDataServer.sortByMany(specifiers);
    }

    protected override descendantProcessColumnSort(_event: MouseEvent, headerOrFixedRowCell: ViewCell<BCS, SF>) {
        this.sortBy(headerOrFixedRowCell.viewLayoutColumn.column.field.index);
    }

    protected override descendantProcessClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (this.mainClickEventer !== undefined) {
            if (hoverCell === null) {
                hoverCell = this.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
            if (hoverCell !== undefined && !LinedHoverCell.isMouseOverLine(hoverCell)) { // skip clicks on grid lines
                const cell = hoverCell.viewCell;
                if (!cell.isHeaderOrRowFixed) { // Skip clicks to the column headers
                    const rowIndex = cell.viewLayoutRow.subgridRowIndex;
                    const recordIndex = this.mainDataServer.getRecordIndexFromRowIndex(rowIndex);
                    const fieldIndex = cell.viewLayoutColumn.column.field.index;
                    this.mainClickEventer(fieldIndex, recordIndex);
                }
            }
        }
    }

    protected override descendantProcessDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (this.mainDblClickEventer !== undefined) {
            if (hoverCell === null) {
                hoverCell = this.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
            if (hoverCell !== undefined && !LinedHoverCell.isMouseOverLine(hoverCell)) { // skip clicks on grid lines
                const cell = hoverCell.viewCell;
                if (!cell.isHeaderOrRowFixed) { // Skip clicks to the column headers
                    const rowIndex = cell.viewLayoutRow.subgridRowIndex;
                    const recordIndex = this.mainDataServer.getRecordIndexFromRowIndex(rowIndex);
                    const fieldIndex = cell.viewLayoutColumn.column.field.index;
                    this.mainDblClickEventer(fieldIndex, recordIndex);
                }
            }
        }
    }

    protected override descendantProcessRowFocusChanged(newSubgridRowIndex: number | undefined, oldSubgridRowIndex: number | undefined) {
        let newRecordIndex: Integer | undefined;
        if (newSubgridRowIndex !== undefined) {
            newRecordIndex = this.mainDataServer.getRecordIndexFromRowIndex(newSubgridRowIndex);
        }
        let oldRecordIndex: Integer | undefined;
        if (oldSubgridRowIndex !== undefined) {
            oldRecordIndex = this.mainDataServer.getRecordIndexFromRowIndex(oldSubgridRowIndex);
        }

        if (this.recordFocusedEventer !== undefined) {
            this.recordFocusedEventer(newRecordIndex, oldRecordIndex);
        }
    }

    protected override descendantProcessRendered() {
        if (!this._usableRendered && this._beenUsable) {
            this._usableRendered = true;

            if (this._firstUsableRenderViewAnchor !== undefined) {
                this.viewLayout.setColumnScrollAnchor(
                    this._firstUsableRenderViewAnchor.columnScrollAnchorIndex,
                    this._firstUsableRenderViewAnchor.columnScrollAnchorOffset
                );
                this.viewLayout.setRowScrollAnchor(this._firstUsableRenderViewAnchor.rowScrollAnchorIndex, 0);
                this._firstUsableRenderViewAnchor = undefined;
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
                        throw new UnreachableCaseError('RRGDPACCLCU44430', typeId);
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

    protected override descendantProcessSelectionChanged() {
        if (this.selectionChangedEventer !== undefined) {
            this.selectionChangedEventer();
        }
    }

    protected override descendantProcessDataServersRowListChanged(dataServers: DataServer<SF>[]) {
        if (this.dataServersRowListChangedEventer !== undefined) {
            this.dataServersRowListChangedEventer(dataServers);
        }
    }

    private applySortFields(sortFields: RevRecordSortDefinition.Field[] | undefined) {
        if (sortFields === undefined) {
            this.mainDataServer.clearSort();
        } else {
            const maxCount = sortFields.length;
            if (maxCount === 0) {
                this.mainDataServer.clearSort();
            } else {
                const specifiers = new Array<RevRecordDataServer.SortFieldSpecifier>(maxCount);
                let count = 0;
                for (let i = 0; i < maxCount; i++) {
                    const field = sortFields[i];
                    const fieldIndex = this.schemaServer.getFieldIndexByName(field.name);
                    if (fieldIndex >= 0) {
                        specifiers[count++] = {
                            fieldIndex,
                            ascending: field.ascending,
                        };
                    }
                }
                if (count === 0) {
                    this.mainDataServer.clearSort();
                } else {
                    specifiers.length = count;
                    this.mainDataServer.sortByMany(specifiers);
                }
            }
        }
    }


    private processColumnLayoutChangedEvent(initiator: RevColumnLayout.ChangeInitiator) {
        if (initiator !== this) {
            if (this._allowedFields !== undefined) {
                if (this._columnLayout === undefined) {
                    throw new AssertInternalError('RGPGLCE56678');
                } else {
                    this.setActiveColumnsAndWidths(this._allowedFields, this._columnLayout);
                }
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
            const schemaFieldNames = this.schemaServer.getFieldNames();
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

    private setActiveColumnsAndWidths(allowedFields: readonly SF[], columnLayout: RevColumnLayout) {
        const layoutColumnCount = columnLayout.columnCount;
        const layoutColumns = columnLayout.columns;
        const nameAndWidths = new Array<ColumnsManager.FieldNameAndAutoSizableWidth>(layoutColumnCount);
        let count = 0;
        for (let i = 0; i < layoutColumnCount; i++) {
            const column = layoutColumns[i];
            const visible = column.visible;
            if (visible === undefined || visible) {
                const fieldName = column.fieldName;
                const foundField = allowedFields.find((field) => field.name === fieldName);
                if (foundField !== undefined) {
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

export namespace RevRecordGrid {
    export interface ViewAnchor {
        readonly columnScrollAnchorIndex: Integer;
        readonly columnScrollAnchorOffset: Integer;
        readonly rowScrollAnchorIndex: Integer;
    }

    export type RecordFocusEventer = (this: void, newRecordIndex: RevRecordIndex | undefined, oldRecordIndex: RevRecordIndex | undefined) => void;
    export type MainClickEventer = (this: void, fieldIndex: RevRecordFieldIndex, recordIndex: RevRecordIndex) => void;
    export type MainDblClickEventer = (this: void, fieldIndex: RevRecordFieldIndex, recordIndex: RevRecordIndex) => void;
    export type SelectionChangedEventer = (this: void) => void;
    export type DataServersRowListChangedEventer<
        RenderValueTypeId,
        RenderAttributeTypeId,
        SF extends RevSourcedField<RenderValueTypeId, RenderAttributeTypeId>
    > = (this: void, dataServers: DataServer<SF>[]) => void;
    export type FieldSortedEventer = (this: void) => void;
}
