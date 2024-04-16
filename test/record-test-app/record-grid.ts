import {
    Column,
    LinedHoverCell,
    Point,
    RevListChangedTypeId,
    Revgrid,
    StandardBehavioredColumnSettings,
    ViewCell
} from '@xilytix/revgrid';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import {
    GridField
} from './grid-field';

export class RecordGrid extends Revgrid<
        AppBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        GridField
    > {
    columnSortEventer: RecordGrid.ColumnSortEventer | undefined;
    columnsWidthChangedEventer: RecordGrid.ColumnsWidthChangedEventer | undefined;
    cellFocusChangedEventer: RecordGrid.CellFocusChangedEventer | undefined;
    cellClickEventer: RecordGrid.CellClickEventer | undefined;
    cellDblClickEventer: RecordGrid.CellDblClickEventer | undefined;
    resizedEventer: RecordGrid.ResizedEventer | undefined;
    fieldColumnListChanged: RecordGrid.FieldColumnListChanged | undefined;
    columnsViewWidthsChangedEventer: RecordGrid.ColumnsViewWidthsChangedEventer | undefined;
    renderedEventer: RecordGrid.RenderedEventer | undefined;

    // constructor(
    //     gridElement: HTMLElement,
    //     recordStore: RevRecordStore,
    //     mainCellPainter: CellPainter,
    //     gridSettings: GridSettings,
    // ) {
    //     super(gridElement, definition, settings)
    // }

    get columnCount(): number { return this.activeColumnCount; }

    protected override descendantProcessColumnsWidthChanged(columns: Column<StandardBehavioredColumnSettings, GridField>[]) {
        if (this.columnsWidthChangedEventer !== undefined) {
            this.columnsWidthChangedEventer(columns);
        }
    }

    protected override descendantProcessColumnSort(_event: MouseEvent, headerOrFixedRowCell: ViewCell<StandardBehavioredColumnSettings, GridField>) {
        if (this.columnSortEventer !== undefined) {
            this.columnSortEventer(headerOrFixedRowCell);
        }
    }

    protected override descendantProcessClick(event: MouseEvent, hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, GridField> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
        }

        if (hoverCell !== undefined) {
            if (!LinedHoverCell.isMouseOverLine(hoverCell) && this.cellClickEventer !== undefined) {
                const viewCell = hoverCell.viewCell;
                this.cellClickEventer(viewCell);
            }
        }
    }

    protected override descendantProcessDblClick(event: MouseEvent, hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, GridField> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
        }

        if (hoverCell !== undefined) {
            if (!LinedHoverCell.isMouseOverLine(hoverCell) && this.cellDblClickEventer !== undefined) {
                const viewCell = hoverCell.viewCell;
                this.cellDblClickEventer(viewCell);
            }
        }
    }

    protected override descendantProcessCellFocusChanged(newPoint: Point | undefined, oldPoint: Point | undefined) {
        if (this.cellFocusChangedEventer !== undefined) {
            this.cellFocusChangedEventer(newPoint, oldPoint);
        }
    }

    protected override descendantProcessResized() {
        if (this.resizedEventer !== undefined) {
            this.resizedEventer();
        }
    }

    protected override descendantProcessColumnsViewWidthsChanged() {
        if (this.columnsViewWidthsChangedEventer !== undefined) {
            this.columnsViewWidthsChangedEventer();
        }
    }

    protected override descendantProcessRendered() {
        if (this.renderedEventer !== undefined) {
            this.renderedEventer();
        }
    }

    // private createGridPropertiesFromSettings(settings: Partial<RecordGridSettings>): Partial<GridSettings> {
    //     const properties: Partial<GridSettings> = {};

    //     if (settings.fontFamily !== undefined) {
    //         if (settings.fontSize !== undefined) {
    //             const font = settings.fontSize + ' ' + settings.fontFamily;
    //             properties.font = font;
    //             properties.foregroundSelectionFont = font;
    //         }

    //         if (settings.columnHeaderFontSize !== undefined) {
    //             const font = settings.columnHeaderFontSize + ' ' + settings.fontFamily;
    //             properties.columnHeaderFont = font;
    //             properties.columnHeaderForegroundSelectionFont = font;
    //             properties.filterFont = font;
    //         }
    //     }

    //     if (settings.defaultRowHeight !== undefined) {
    //         properties.defaultRowHeight = settings.defaultRowHeight;
    //     }

    //     if (settings.cellPadding !== undefined) {
    //         properties.cellPadding = settings.cellPadding;
    //     }
    //     if (settings.fixedColumnCount !== undefined) {
    //         properties.fixedColumnCount = settings.fixedColumnCount;
    //     }
    //     if (settings.visibleColumnWidthAdjust !== undefined) {
    //         properties.visibleColumnWidthAdjust = settings.visibleColumnWidthAdjust;
    //     }
    //     if (settings.gridRightAligned !== undefined) {
    //         properties.gridRightAligned = settings.gridRightAligned;
    //     }

    //     if (settings.gridLinesH !== undefined) {
    //         properties.gridLinesH = settings.gridLinesH;
    //     }
    //     if (settings.gridLinesHWidth !== undefined) {
    //         properties.gridLinesHWidth = settings.gridLinesHWidth;
    //     }
    //     if (settings.gridLinesV !== undefined) {
    //         properties.gridLinesV = settings.gridLinesV;
    //     }
    //     if (settings.gridLinesVWidth !== undefined) {
    //         properties.gridLinesVWidth = settings.gridLinesVWidth;
    //     }

    //     if (settings.scrollHorizontallySmoothly !== undefined) {
    //         properties.scrollHorizontallySmoothly = settings.scrollHorizontallySmoothly;
    //     }

    //     const colorMap = settings.colorMap;
    //     if (colorMap !== undefined) {
    //         properties.backgroundColor = colorMap.backgroundColor;
    //         properties.color = colorMap.color;
    //         properties.columnHeaderBackgroundColor = colorMap.columnHeaderBackgroundColor;
    //         properties.columnHeaderColor = colorMap.columnHeaderColor;
    //         properties.backgroundSelectionColor = colorMap.backgroundSelectionColor;
    //         properties.foregroundSelectionColor = colorMap.foregroundSelectionColor;
    //         properties.columnHeaderBackgroundSelectionColor = colorMap.columnHeaderBackgroundSelectionColor;
    //         properties.columnHeaderForegroundSelectionColor = colorMap.columnHeaderForegroundSelectionColor;
    //         properties.selectionRegionOutlineColor = colorMap.selectionRegionOutlineColor;
    //         properties.gridLinesHColor = colorMap.gridLinesHColor;
    //         properties.gridLinesVColor = colorMap.gridLinesVColor;
    //         properties.fixedLinesHColor = colorMap.gridLinesHColor;
    //         properties.fixedLinesVColor = colorMap.gridLinesVColor;
    //         // uncomment below when row stripes are working
    //         // properties.rowStripes = [
    //         //     {
    //         //         backgroundColor: colorMap.bkgdBase,
    //         //     },
    //         //     {
    //         //         backgroundColor: colorMap.bkgdBaseAlt,
    //         //     }
    //         // ];
    //     }

    //     return properties;
    // }
}

export namespace RecordGrid {
    export type FieldNameToHeaderMap = Map<string, string | undefined>;

    export type CtrlKeyMouseMoveEventer = (this: void) => void;
    export type CellFocusChangedEventer = (this: void, newFocusPoint: Point | undefined, oldFocusPoint: Point | undefined) => void;
    export type CellClickEventer = (this: void, viewCell: ViewCell<StandardBehavioredColumnSettings, GridField>) => void;
    export type CellDblClickEventer = (this: void, viewCell: ViewCell<StandardBehavioredColumnSettings, GridField>) => void;
    export type ResizedEventer = (this: void) => void;
    export type ColumnsViewWidthsChangedEventer = (this: void) => void;
    export type RenderedEventer = (this: void/*, detail: Hypergrid.GridEventDetail*/) => void;
    export type ColumnSortEventer = (this: void, headerOrFixedRowCell: ViewCell<StandardBehavioredColumnSettings, GridField>) => void;
    export type ColumnsWidthChangedEventer = (this: void, columns: Column<StandardBehavioredColumnSettings, GridField>[]) => void;
    export type FieldColumnListChanged = (typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number) => void;

    // export interface LayoutWithHeadersMap {
    //     layout: ColumnLayout;
    //     headersMap: FieldNameToHeaderMap;
    // }

    export type RenderedCallback = (this: void) => void;
}

