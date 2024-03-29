import {
    CellEditor,
    DatalessSubgrid,
    DatalessViewCell,
    InMemoryStandardBehavioredColumnSettings,
    Point,
    Revgrid,
    SingleHeadingDataServer,
    StandardBehavioredColumnSettings,
    StandardHeaderTextCellPainter,
    Subgrid,
    ViewCell,
    readonlyDefaultStandardBehavioredColumnSettings
} from '@xilytix/revgrid';
import {
    RevRecordDataServer,
    RevRecordSchemaServer,
} from '../..';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { AppGridSettings } from './app-grid-settings';
import { Controls } from './controls';
import { defaultAppGridSettings } from './default-app-grid-settings';
import {
    DateValGridField,
    GridField, HiddenStrValGridField, IntValGridField, NumberValGridField, RecordIndexGridField, StatusIdValGridField, StrValGridField
} from './grid-field';
import { InMemoryAppBehavioredGridSettings } from './in-memory-app-behaviored-grid-settings';
import { MainCellPainter } from './main-cell-painter';
import { RecordGrid } from './record-grid';
import { RecordStore } from './record-store';

export class Main {
    private readonly _gridHostElement: HTMLElement;

    // private readonly _fieldAdapter = new RevRecordFieldAdapter();
    // private readonly _headerRecordAdapter = new RevRecordHeaderAdapter();
    // private readonly _mainRecordAdapter: RevRecordMainAdapter;

    private readonly _recordStore: RecordStore;
    private readonly _schemaServer: RevRecordSchemaServer<GridField>;
    private readonly _headerDataServer: SingleHeadingDataServer<GridField>;
    private readonly _mainDataServer: RevRecordDataServer<GridField>;

    private readonly _mainCellPainter: MainCellPainter;
    private readonly _headerCellPainter: StandardHeaderTextCellPainter<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>;

    private readonly _recordIndexGridField = new RecordIndexGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _hiddenStrValGridField = new HiddenStrValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _intValGridField = new IntValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _strValGridField = new StrValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _numberValGridField = new NumberValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _dateValGridField = new DateValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _statusIdValGridField = new StatusIdValGridField(readonlyDefaultStandardBehavioredColumnSettings);

    private readonly _grid: RecordGrid;
    private readonly _gridSettings: InMemoryAppBehavioredGridSettings = new InMemoryAppBehavioredGridSettings();
    private readonly _debugEnabled = true;

    private readonly _controls: Controls;

    // private readonly _ctrlKeyMousemoveListener = (event: MouseEvent) => this.handleHypegridCtrlKeyMousemoveEvent(event.ctrlKey);

    constructor() {
        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        if (gridHostElement === null) {
            throw new Error('gridHost not found');
        }
        this._gridHostElement = gridHostElement;

        const initialSettings: AppGridSettings = {
            ...defaultAppGridSettings,
            horizontalGridLinesWidth: 0,
            fixedColumnCount: 1,

            font: 'Tahoma, Geneva, sans-serif 13px',
            columnHeaderFont: 'Tahoma, Geneva, sans-serif 12px',

            backgroundColor: backgroundColor,
            color: foregroundColor,
            rowStripeBackgroundColor: '#2b2b2b',

            columnHeaderBackgroundColor: columnHeaderBackgroundColor,
            columnHeaderForegroundColor: columnHeaderForegroundColor,
            selectionBackgroundColor: 'DarkSlateBlue',
            // selectionRegionOutlineColor: '#D3D3D1',
            verticalGridLinesColor: '#595959',
            horizontalGridLinesColor: '#595959',
            grayedOutForegroundColor: '#595959',
            focusedRowBorderColor: '#C8B900',
            focusedCellBorderColor: 'magenta',
            scrollerThumbColor: '#858585',

            valueRecentlyModifiedBorderColor: '#8C5F46',
            valueRecentlyModifiedUpBorderColor: '#4646FF',
            valueRecentlyModifiedDownBorderColor: '#64FA64',
            recordRecentlyUpdatedBorderColor: 'orange',
            recordRecentlyInsertedBorderColor: 'pink',
        };
        this._gridSettings.merge(initialSettings);

        this._recordStore = new RecordStore();

        this._schemaServer = new RevRecordSchemaServer<GridField>();
        this._mainDataServer = new RevRecordDataServer<GridField>(this._schemaServer, this._recordStore);
        this._headerDataServer = new SingleHeadingDataServer();


        const definition: Revgrid.Definition<StandardBehavioredColumnSettings, GridField> = {
            schemaServer: this._schemaServer,
            subgrids: [
                {
                    role: DatalessSubgrid.RoleEnum.header,
                    dataServer: this._headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: DatalessSubgrid.RoleEnum.main,
                    dataServer: this._mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        const options: Revgrid.Options<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField> = {
            externalParent: this,
            canvasRenderingContext2DSettings: {
                alpha: false,
            }
        }

        this._grid = new RecordGrid(
            this._gridHostElement,
            definition,
            this._gridSettings,
            () => new InMemoryStandardBehavioredColumnSettings(this._gridSettings),
            options,
        );

        const grid = this._grid;

        this._mainCellPainter = new MainCellPainter(grid, this._mainDataServer);
        this._headerCellPainter = new StandardHeaderTextCellPainter<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>(grid, this._headerDataServer);

        grid.cellFocusChangedEventer = (newPoint, oldPoint) => this.handleCellFocusChanged(newPoint, oldPoint)
        grid.cellClickEventer = (cell) => this.handleCellFocusClick(cell);
        grid.cellDblClickEventer = (cell) => this.handleRecordFocusDblClick(cell);
        grid.columnSortEventer = (headerOrFixedRowCell) => this.handleColumnSort(headerOrFixedRowCell);

        this._controls = new Controls(
            grid,
            this._gridSettings,
            this._recordStore,
            this._schemaServer,
            this._mainDataServer,
            this._recordIndexGridField,
            this._intValGridField,
            this._strValGridField,
            this._debugEnabled
        );

        grid.activate();

        this._schemaServer.addFields([
            this._recordIndexGridField,
            this._hiddenStrValGridField,
            this._intValGridField,
            this._strValGridField,
            this._numberValGridField,
            this._dateValGridField,
            this._statusIdValGridField,
        ]);
    }

    start(): void {
        // no code needed
    }
    private getMainCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, GridField>) {
        return this._mainCellPainter;
    }

    private getHeaderCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, GridField>) {
        return this._headerCellPainter;
    }

    private getCellEditor(
        field: GridField,
        _subgridRowIndex: number,
        _subgrid: Subgrid<StandardBehavioredColumnSettings, GridField>,
        readonly: boolean,
        _viewCell: ViewCell<StandardBehavioredColumnSettings, GridField> | undefined
    ): CellEditor<StandardBehavioredColumnSettings, GridField> | undefined {
        return this.tryGetCellEditor(field.name, readonly);
    }

    private tryGetCellEditor(columnName: string, readonly: boolean): CellEditor<StandardBehavioredColumnSettings, GridField> | undefined {
        const editor = this.tryCreateCellEditor(columnName);
        if (editor !== undefined) {
            editor.readonly = readonly;
        }
        return editor;
    }

    private tryCreateCellEditor(columnName: string): CellEditor<StandardBehavioredColumnSettings, GridField> | undefined {
        return undefined;
        // switch (columnName) {
        //     case 'favoriteFood': return this._textInputEditor;
        //     case 'restrictMovement': return this._checkboxEditor;
        //     default: return undefined;
        // }
    }

    private handleCellFocusChanged(newPoint: Point | undefined, oldPoint: Point | undefined): void {
        const newText = newPoint === undefined ? '()' : `(${newPoint.x}, ${newPoint.y})`;
        const oldText = oldPoint === undefined ? '()' : `(${oldPoint.x}, ${oldPoint.y})`;
        console.log(`Focus for Record: New: ${newText} Old: ${oldText}`);
    }

    private handleCellFocusClick(cell: ViewCell<StandardBehavioredColumnSettings, GridField>): void {
        if (cell.isHeader) {
            console.log(`Click for Header in field ${cell.viewLayoutColumn.column.field.name}`);
        } else {
            if (cell.isMain) {
                const recordIndex = this._mainDataServer.getRecordIndexFromRowIndex(cell.viewLayoutRow.subgridRowIndex);
                console.log(`Click for Record ${recordIndex} field ${cell.viewLayoutColumn.column.field.name}`);
            } else {
                throw new Error('Click in unknown subgrid');
            }
        }
    }

    private handleRecordFocusDblClick(cell: ViewCell<StandardBehavioredColumnSettings, GridField>): void {
        if (cell.isHeader) {
            console.log(`Double click for Header in field ${cell.viewLayoutColumn.column.field.name}`);
        } else {
            if (cell.isMain) {
                const recordIndex = this._mainDataServer.getRecordIndexFromRowIndex(cell.viewLayoutRow.subgridRowIndex);
                console.log(`Double click for Record ${recordIndex} field ${cell.viewLayoutColumn.column.field.name}`);
            } else {
                throw new Error('Double click in unknown subgrid');
            }
        }
    }

    private handleColumnSort(headerOrFixedRowCell: ViewCell<StandardBehavioredColumnSettings, GridField>) {
        this._mainDataServer.sortBy(headerOrFixedRowCell.viewLayoutColumn.column.field.index);
    }
}

// namespace CssVar {
//     export const scrollbarThumbColor = '--scrollbar-thumb-color';
//     export const scrollbarThumbInactiveOpacity = '--scrollbar-thumb-inactive-opacity';
//     export const scrollbarVerticalLeft = '--scrollbar-vertical-left';
//     export const scrollbarVerticalRight = '--scrollbar-vertical-right';
//     export const scrollbarVerticalWidth = '--scrollbar-vertical-width';
//     export const scrollbarVerticalThumbWidth = '--scrollbar-vertical-thumb-width';
//     export const scrollbarHorizontalTop = '--scrollbar-horizontal-top';
//     export const scrollbarHorizontalBottom = '--scrollbar-horizontal-bottom';
//     export const scrollbarHorizontalHeight = '--scrollbar-horizontal-height';
//     export const scrollbarHorizontalThumbHeight = '--scrollbar-horizontal-thumb-height';
//     export const scrollbarMargin = '--scrollbar-margin';
// }

// const backgroundColor = '#212121';
// const foregroundColor = '#f9f0f0';
// const columnHeaderBackgroundColor = '#626262';
// const columnHeaderForegroundColor = 'white';

// const colorMap: RecordGridSettings.ColorMap = {
//     // Grid colors
//     backgroundColor: backgroundColor,
//     color: foregroundColor,
//     bkgdBaseAlt: '#2b2b2b',
//     columnHeaderBackgroundColor: columnHeaderBackgroundColor,
//     columnHeaderColor: columnHeaderForegroundColor,
//     backgroundSelectionColor: backgroundColor,
//     foregroundSelectionColor: foregroundColor,
//     columnHeaderBackgroundSelectionColor: columnHeaderBackgroundColor,
//     columnHeaderForegroundSelectionColor: columnHeaderForegroundColor,
//     selectionRegionOutlineColor: '#D3D3D1',
//     gridLinesVColor: '#595959',
//     gridLinesHColor: '#595959',

//     // Extra colors in painter
//     bkgdGreyedOut: backgroundColor,
//     foreGreyedOut: '#595959',
//     bkgdFocusedRow: '#6e6835',
//     bkgdFocusedRowBorder: '#C8B900',
//     foreValueRecentlyModifiedBorder: '#8C5F46',
//     foreValueRecentlyModifiedDownBorder: '#4646FF',
//     foreValueRecentlyModifiedUpBorder: '#64FA64',
//     foreRecordRecentlyUpdatedBorder: 'orange',
//     foreRecordRecentlyInsertedBorder: 'pink',

//     // Scrollbar colors
//     foreScrollbarThumbColor: '#d3d3d3',
//     scrollbarThumbShadowColor: 'black',
// };

// const defaultGridSettings: RecordGridSettings = {
//     fontFamily: 'Tahoma, Geneva, sans-serif',
//     fontSize: '13px',
//     columnHeaderFontSize: '12px',
//     defaultRowHeight: defaultGridProperties.defaultRowHeight,

//     cellPadding: defaultGridProperties.cellPadding,
//     fixedColumnCount: 1,
//     scrollHorizontallySmoothly: defaultGridProperties.scrollHorizontallySmoothly,
//     visibleColumnWidthAdjust: defaultGridProperties.visibleColumnWidthAdjust,
//     gridRightAligned: defaultGridProperties.gridRightAligned,

//     gridLinesH: defaultGridProperties.gridLinesH,
//     gridLinesV: defaultGridProperties.gridLinesV,
//     gridLinesHWidth: defaultGridProperties.gridLinesHWidth,
//     gridLinesVWidth: defaultGridProperties.gridLinesVWidth,

//     scrollbarHorizontalHeight: 11,
//     scrollbarHorizontalThumbHeight: 7,
//     scrollbarVerticalWidth: 11,
//     scrollbarVerticalThumbWidth: 7,
//     scrollbarThumbInactiveOpacity: 0.4,
//     scrollbarMargin: 1,

//     allChangedRecentDuration: 250,
//     recordInsertedRecentDuration: 1000,
//     recordUpdatedRecentDuration: 1000,
//     valueChangedRecentDuration: 1000,

//     colorMap,
// }

const backgroundColor = '#212121';
const foregroundColor = '#f9f0f0';
const columnHeaderBackgroundColor = '#626262';
const columnHeaderForegroundColor = 'white';

