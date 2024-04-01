import { Column, StandardBehavioredColumnSettings } from '@xilytix/revgrid';
import { RevRecordDataServer, RevRecordSchemaServer } from '../..';
import { defaultAppGridSettings } from './default-app-grid-settings';
import { GridField, IntValGridField, RecordIndexGridField, StrValGridField } from './grid-field';
import { InMemoryAppBehavioredGridSettings } from './in-memory-app-behaviored-grid-settings';
import { RecordGrid } from './record-grid';
import { RecordStore } from './record-store';

export class Controls {
    private readonly _currentRecordValueSpanElement: HTMLSpanElement; // value of Integer field
    private readonly _previousRecordValueSpanElement: HTMLSpanElement; // value of Integer field

    private readonly _insertRecordIndexTextboxElement: HTMLInputElement;
    private readonly _insertManyRecordsIndexSpanElement: HTMLSpanElement;
    private readonly _deleteRecordIndexSpanElement: HTMLSpanElement;
    private readonly _deleteRecordsIndexSpanElement: HTMLSpanElement;
    private readonly _modifyValuePosSpanElement: HTMLSpanElement;

    private readonly _randomStuffCheckboxElement: HTMLInputElement;
    private readonly _continuousFilteringCheckboxElement: HTMLInputElement;
    private readonly _filterIntegerTextboxElement: HTMLInputElement;
    private readonly _hideStringFieldCheckboxElement: HTMLInputElement;
    private readonly _fixedColumnTextboxElement: HTMLInputElement;
    private readonly _enableLargeHighlightCheckboxElement: HTMLInputElement;
    private readonly _rowOrderReversedCheckboxElement: HTMLInputElement;
    private readonly _switchNewRectangleSelectionToRowCheckboxElement: HTMLInputElement;
    private readonly _cellPaddingTextboxElement: HTMLInputElement;
    private readonly _rowHeightTextboxElement: HTMLInputElement;
    // private readonly _vertScrollbarWidthTextboxElement: HTMLInputElement;
    // private readonly _vertScrollbarThumbWidthTextboxElement: HTMLInputElement;
    // private readonly _scrollbarMarginTextboxElement: HTMLInputElement;
    // private readonly _scrollbarsCanOverlapGridCheckboxElement: HTMLInputElement;
    private readonly _gridRightAlignedCheckboxElement: HTMLInputElement;

    private readonly _performanceTimeSpanElement: HTMLSpanElement;

    private readonly _activeWidthSpanElement: HTMLSpanElement;
    private readonly _renderCountSpanElement: HTMLSpanElement;

    private _integerFilterValue = 0;
    private _renderCount = 0;

    private _randomStuffIntervalSetTimeoutId: ReturnType<typeof setInterval> | undefined;
    private _scrollbarThumbInactiveOpaqueSetTimeoutId: ReturnType<typeof setInterval> | undefined;
    private _scrollbarThumbInactiveOpaqueExtended = false;

    constructor(
        private readonly _grid: RecordGrid,
        private readonly _settings: InMemoryAppBehavioredGridSettings,
        private readonly _recordStore: RecordStore,
        private readonly _schemaServer: RevRecordSchemaServer<GridField>,
        private readonly _mainDataServer: RevRecordDataServer<GridField>,
        private readonly _recordIndexGridField: RecordIndexGridField,
        private readonly _intValGridField: IntValGridField,
        private readonly _strValGridField: StrValGridField,
        private readonly _debugEnabled: boolean,
    ) {
        // Set up UI
        this._currentRecordValueSpanElement = document.querySelector('#currentRecordValueSpan') as HTMLSpanElement;
        if (this._currentRecordValueSpanElement === null) {
            throw new Error('currentRecordValueSpan not found');
        }
        this._previousRecordValueSpanElement = document.querySelector('#previousRecordValueSpan') as HTMLSpanElement;
        if (this._previousRecordValueSpanElement === null) {
            throw new Error('previousRecordValueSpan not found');
        }

        const insertRecordButtonElement = document.querySelector('#insertRecordButton') as HTMLButtonElement;
        if (insertRecordButtonElement === null) {
            throw new Error('insertRecordButton not found');
        }
        insertRecordButtonElement.onclick = (mouseEvent) => this.handleUiInsertRecordAction(mouseEvent)

        this._insertRecordIndexTextboxElement = document.querySelector('#insertRecordIndexTextbox') as HTMLInputElement;
        if (this._insertRecordIndexTextboxElement === null) {
            throw new Error('insertRecordIndexTextbox not found');
        }

        const insertRecordsButtonElement = document.querySelector('#insertRecordsButton') as HTMLButtonElement;
        if (insertRecordsButtonElement === null) {
            throw new Error('insertRecordsButton not found');
        }
        insertRecordsButtonElement.onclick = (mouseEvent) => this.handleUiInsertRecordsAction(mouseEvent)

        const insertManyRecordsButtonElement = document.querySelector('#insertManyRecordsButton') as HTMLButtonElement;
        if (insertManyRecordsButtonElement === null) {
            throw new Error('insertManyRecordsButton not found');
        }
        insertManyRecordsButtonElement.onclick = () => this.handleUiInsertManyRecordsAction()

        this._insertManyRecordsIndexSpanElement = document.querySelector('#insertManyRecordsIndexSpan') as HTMLSpanElement;
        if (this._insertManyRecordsIndexSpanElement === null) {
            throw new Error('insertManyRecordsIndexSpan not found');
        }

        const deleteRecordButtonElement = document.querySelector('#deleteRecordButton') as HTMLButtonElement;
        if (deleteRecordButtonElement === null) {
            throw new Error('deleteRecordButton not found');
        }
        deleteRecordButtonElement.onclick = () => this.handleUiDeleteRecordAction()

        this._deleteRecordIndexSpanElement = document.querySelector('#deleteRecordIndexSpan') as HTMLSpanElement;
        if (this._deleteRecordIndexSpanElement === null) {
            throw new Error('deleteRecordIndexSpan not found');
        }

        const deleteRecordsButtonElement = document.querySelector('#deleteRecordsButton') as HTMLButtonElement;
        if (deleteRecordsButtonElement === null) {
            throw new Error('deleteRecordsButton not found');
        }
        deleteRecordsButtonElement.onclick = () => this.handleUiDeleteRecordsAction()

        this._deleteRecordsIndexSpanElement = document.querySelector('#deleteRecordsIndexSpan') as HTMLSpanElement;
        if (this._deleteRecordsIndexSpanElement === null) {
            throw new Error('deleteRecordsIndexSpan not found');
        }

        const modifyValueButtonElement = document.querySelector('#modifyValueButton') as HTMLButtonElement;
        if (modifyValueButtonElement === null) {
            throw new Error('modifyValueButton not found');
        }
        modifyValueButtonElement.onclick = () => this.handleUiModifyValueAction()

        this._modifyValuePosSpanElement = document.querySelector('#modifyValuePosSpan') as HTMLSpanElement;
        if (this._modifyValuePosSpanElement === null) {
            throw new Error('modifyValuePosSpan not found');
        }

        const modifyValuesButtonElement = document.querySelector('#modifyValuesButton') as HTMLButtonElement;
        if (modifyValuesButtonElement === null) {
            throw new Error('modifyValuesButton not found');
        }
        modifyValuesButtonElement.onclick = () => this.handleUiModifyValuesAction()

        const clearRecordsButtonElement = document.querySelector('#clearRecordsButton') as HTMLButtonElement;
        if (clearRecordsButtonElement === null) {
            throw new Error('clearRecordsButton not found');
        }
        clearRecordsButtonElement.onclick = () => this.handleUiClearRecordsAction()

        this._randomStuffCheckboxElement = document.querySelector('#randomStuffCheckbox') as HTMLInputElement;
        if (this._randomStuffCheckboxElement === null) {
            throw new Error('randomStuffCheckboxElement not found');
        }
        this._randomStuffCheckboxElement.onchange = () => this.handleUiRandomStuffChange()

        this._continuousFilteringCheckboxElement = document.querySelector('#continuousFilteringCheckbox') as HTMLInputElement;
        if (this._continuousFilteringCheckboxElement === null) {
            throw new Error('continuousFilteringCheckbox not found');
        }
        this._continuousFilteringCheckboxElement.onchange = () => this.handleUiContinuousFilteringCheckboxChange()

        this._activeWidthSpanElement = document.querySelector('#activeWidthSpan') as HTMLSpanElement;
        if (this._activeWidthSpanElement === null) {
            throw new Error('activeWidthSpan not found');
        }

        this._renderCountSpanElement = document.querySelector('#renderCountSpan') as HTMLSpanElement;
        if (this._renderCountSpanElement === null) {
            throw new Error('renderCountSpan not found');
        }

        const decrementFilterIntegerButtonElement = document.querySelector('#decrementFilterIntegerButton') as HTMLButtonElement;
        if (decrementFilterIntegerButtonElement === null) {
            throw new Error('decrementFilterIntegerButton not found');
        }
        decrementFilterIntegerButtonElement.onclick = () => this.handleUiDecrementFilterIntegerAction()

        this._filterIntegerTextboxElement = document.querySelector('#filterIntegerTextbox') as HTMLInputElement;
        if (this._filterIntegerTextboxElement === null) {
            throw new Error('filterIntegerTextbox not found');
        }
        this._filterIntegerTextboxElement.onchange = () => this.handleUiFilterIntegerChange()

        const incrementFilterIntegerButtonElement = document.querySelector('#incrementFilterIntegerButton') as HTMLButtonElement;
        if (incrementFilterIntegerButtonElement === null) {
            throw new Error('incrementFilterIntegerButton not found');
        }
        incrementFilterIntegerButtonElement.onclick = () => this.handleUiIncrementFilterIntegerAction()

        this._hideStringFieldCheckboxElement = document.querySelector('#hideStringFieldCheckbox') as HTMLInputElement;
        if (this._hideStringFieldCheckboxElement === null) {
            throw new Error('hideStringFieldCheckboxElement not found');
        }
        this._hideStringFieldCheckboxElement.onchange = () => this.handleUiHideStringFieldChange();

        this._fixedColumnTextboxElement = document.querySelector('#fixedColumnTextbox') as HTMLInputElement;
        if (this._fixedColumnTextboxElement === null) {
            throw new Error('fixedColumnTextbox not found');
        }
        this._fixedColumnTextboxElement.onchange = () => this.handleUiFixedColumnChange();

        this._enableLargeHighlightCheckboxElement = document.querySelector('#enableLargeHighlightCheckbox') as HTMLInputElement;
        if (this._enableLargeHighlightCheckboxElement === null) {
            throw new Error('enableLargeHighlightCheckboxElement not found');
        }
        this._enableLargeHighlightCheckboxElement.onchange = () => this.handleUiEnableLargeHighlightChange();

        this._rowOrderReversedCheckboxElement = document.querySelector('#rowOrderReversedCheckbox') as HTMLInputElement;
        if (this._rowOrderReversedCheckboxElement === null) {
            throw new Error('rowOrderReversedCheckboxElement not found');
        }
        this._rowOrderReversedCheckboxElement.onchange = () => this.handleUiRowOrderReversedChange();

        this._switchNewRectangleSelectionToRowCheckboxElement = document.querySelector('#switchNewRectangleSelectionToRowCheckbox') as HTMLInputElement;
        if (this._switchNewRectangleSelectionToRowCheckboxElement === null) {
            throw new Error('switchNewRectangleSelectionToRowCheckboxElement not found');
        }
        this._switchNewRectangleSelectionToRowCheckboxElement.onchange = () => this.handleUiSwitchNewRectangleSelectionToRowChange();

        const decrementCellPaddingButtonElement = document.querySelector('#decrementCellPaddingButton') as HTMLButtonElement;
        if (decrementCellPaddingButtonElement === null) {
            throw new Error('decrementCellPaddingButton not found');
        }
        decrementCellPaddingButtonElement.onclick = () => this.handleUiDecrementCellPaddingAction()

        this._cellPaddingTextboxElement = document.querySelector('#cellPaddingTextbox') as HTMLInputElement;
        if (this._cellPaddingTextboxElement === null) {
            throw new Error('cellPaddingTextbox not found');
        }
        this._cellPaddingTextboxElement.onchange = () => this.handleUiCellPaddingChange()

        const incrementCellPaddingButtonElement = document.querySelector('#incrementCellPaddingButton') as HTMLButtonElement;
        if (incrementCellPaddingButtonElement === null) {
            throw new Error('incrementCellPaddingButton not found');
        }
        incrementCellPaddingButtonElement.onclick = () => this.handleUiIncrementCellPaddingAction()

        const decrementRowHeightButtonElement = document.querySelector('#decrementRowHeightButton') as HTMLButtonElement;
        if (decrementRowHeightButtonElement === null) {
            throw new Error('decrementRowHeightButton not found');
        }
        decrementRowHeightButtonElement.onclick = () => this.handleUiDecrementRowHeightAction()

        this._rowHeightTextboxElement = document.querySelector('#rowHeightTextbox') as HTMLInputElement;
        if (this._rowHeightTextboxElement === null) {
            throw new Error('rowHeightTextbox not found');
        }
        this._rowHeightTextboxElement.onchange = () => this.handleUiRowHeightChange()

        const incrementRowHeightButtonElement = document.querySelector('#incrementRowHeightButton') as HTMLButtonElement;
        if (incrementRowHeightButtonElement === null) {
            throw new Error('incrementRowHeightButton not found');
        }
        incrementRowHeightButtonElement.onclick = () => this.handleUiIncrementRowHeightAction()

        // this._vertScrollbarWidthTextboxElement = document.querySelector('#vertScrollbarWidthTextbox') as HTMLInputElement;
        // if (this._vertScrollbarWidthTextboxElement === null) {
        //     throw new Error('vertScrollbarWidthTextbox not found');
        // }
        // this._vertScrollbarWidthTextboxElement.onchange = () => this.handleUiVertScrollbarWidthChange()

        // this._vertScrollbarThumbWidthTextboxElement = document.querySelector('#vertScrollbarThumbWidthTextbox') as HTMLInputElement;
        // if (this._vertScrollbarThumbWidthTextboxElement === null) {
        //     throw new Error('vertScrollbarThumbWidthTextbox not found');
        // }
        // this._vertScrollbarThumbWidthTextboxElement.onchange = () => this.handleUiVertScrollbarThumbWidthChange()

        // this._scrollbarMarginTextboxElement = document.querySelector('#scrollbarMarginTextbox') as HTMLInputElement;
        // if (this._scrollbarMarginTextboxElement === null) {
        //     throw new Error('scrollbarMarginTextbox not found');
        // }
        // this._scrollbarMarginTextboxElement.onchange = () => this.handleUiScrollbarMarginChange()

        this._gridRightAlignedCheckboxElement = document.querySelector('#gridRightAlignedCheckbox') as HTMLInputElement;
        if (this._gridRightAlignedCheckboxElement === null) {
            throw new Error('gridRightAlignedCheckboxElement not found');
        }
        this._gridRightAlignedCheckboxElement.onchange = () => this.handleUiGridRightAlignedChange();

        const applySettingsButtonElement = document.querySelector('#applySettingsButton') as HTMLButtonElement;
        if (applySettingsButtonElement === null) {
            throw new Error('applySettingsButton not found');
        }
        applySettingsButtonElement.onclick = () => this.handleUiApplySettings();

        const autoSizeStringButtonElement = document.querySelector('#autoSizeStringButton') as HTMLButtonElement;
        if (autoSizeStringButtonElement === null) {
            throw new Error('autoSizeStringButton not found');
        }
        autoSizeStringButtonElement.onclick = () => this.handleUiAutoSizeStringAction();

        const autoWidenStringButtonElement = document.querySelector('#autoWidenStringButton') as HTMLButtonElement;
        if (autoWidenStringButtonElement === null) {
            throw new Error('autoWidenStringButton not found');
        }
        autoWidenStringButtonElement.onclick = () => this.handleUiAutoWidenStringAction();

        const autoSizeAllButtonElement = document.querySelector('#autoSizeAllButton') as HTMLButtonElement;
        if (autoSizeAllButtonElement === null) {
            throw new Error('autoSizeAllButton not found');
        }
        autoSizeAllButtonElement.onclick = () => this.handleUiAutoSizeAllAction();

        const autoWidenAllButtonElement = document.querySelector('#autoWidenAllButton') as HTMLButtonElement;
        if (autoWidenAllButtonElement === null) {
            throw new Error('autoWidenAllButton not found');
        }
        autoWidenAllButtonElement.onclick = () => this.handleUiAutoWidenAllAction();

        this._performanceTimeSpanElement = document.querySelector('#performanceTimeSpan') as HTMLSpanElement;
        if (this._performanceTimeSpanElement === null) {
            throw new Error('performanceTimeSpan not found');
        }

        const performance30kButtonElement = document.querySelector('#performance30kButton') as HTMLButtonElement;
        if (performance30kButtonElement === null) {
            throw new Error('performance30kButton not found');
        }
        performance30kButtonElement.onclick = () => this.handleUiPerformance30kAction();

        const performance60kButtonElement = document.querySelector('#performance60kButton') as HTMLButtonElement;
        if (performance60kButtonElement === null) {
            throw new Error('performance60kButton not found');
        }
        performance60kButtonElement.onclick = () => this.handleUiPerformance60kAction();

        const performanceAddOneAtStartButtonElement = document.querySelector('#performanceAddOneAtStartButton') as HTMLButtonElement;
        if (performanceAddOneAtStartButtonElement === null) {
            throw new Error('performanceAddOneAtStartButton not found');
        }
        performanceAddOneAtStartButtonElement.onclick = () => this.handleUiPerformanceAddOneAtStartAction();

        const performanceAddOneAtMiddleButtonElement = document.querySelector('#performanceAddOneAtMiddleButton') as HTMLButtonElement;
        if (performanceAddOneAtMiddleButtonElement === null) {
            throw new Error('performanceAddOneAtMiddleButton not found');
        }
        performanceAddOneAtMiddleButtonElement.onclick = () => this.handleUiPerformanceAddOneAtMiddleAction();

        const performanceAddOneAtEndButtonElement = document.querySelector('#performanceAddOneAtEndButton') as HTMLButtonElement;
        if (performanceAddOneAtEndButtonElement === null) {
            throw new Error('performanceAddOneAtEndButton not found');
        }
        performanceAddOneAtEndButtonElement.onclick = () => this.handleUiPerformanceAddOneAtEndAction();

        const performanceDeleteOneAtStartButtonElement = document.querySelector('#performanceDeleteOneAtStartButton') as HTMLButtonElement;
        if (performanceDeleteOneAtStartButtonElement === null) {
            throw new Error('performanceDeleteOneAtStartButton not found');
        }
        performanceDeleteOneAtStartButtonElement.onclick = () => this.handleUiPerformanceDeleteOneAtStartAction();

        const performanceDeleteOneAtMiddleButtonElement = document.querySelector('#performanceDeleteOneAtMiddleButton') as HTMLButtonElement;
        if (performanceDeleteOneAtMiddleButtonElement === null) {
            throw new Error('performanceDeleteOneAtMiddleButton not found');
        }
        performanceDeleteOneAtMiddleButtonElement.onclick = () => this.handleUiPerformanceDeleteOneAtMiddleAction();

        const performanceDeleteOneAtEndButtonElement = document.querySelector('#performanceDeleteOneAtEndButton') as HTMLButtonElement;
        if (performanceDeleteOneAtEndButtonElement === null) {
            throw new Error('performanceDeleteOneAtEndButton not found');
        }
        performanceDeleteOneAtEndButtonElement.onclick = () => this.handleUiPerformanceDeleteOneAtEndAction();

        const performanceModifyRecordsButtonElement = document.querySelector('#performanceModifyRecordsButton') as HTMLButtonElement;
        if (performanceModifyRecordsButtonElement === null) {
            throw new Error('performanceModifyRecordsButton not found');
        }
        performanceModifyRecordsButtonElement.onclick = () => this.handleUiPerformanceModifyRecordsAction();

        const performanceModifyOneRecordButtonElement = document.querySelector('#performanceModifyOneRecordButton') as HTMLButtonElement;
        if (performanceModifyOneRecordButtonElement === null) {
            throw new Error('performanceModifyOneRecordButton not found');
        }
        performanceModifyOneRecordButtonElement.onclick = () => this.handleUiPerformanceModifyOneRecordAction();

        this._randomStuffCheckboxElement.checked = false;
        this._continuousFilteringCheckboxElement.checked = this._mainDataServer.continuousFiltering;
        this._filterIntegerTextboxElement.value = this._integerFilterValue.toString();
        this._hideStringFieldCheckboxElement.checked = false;
        this._fixedColumnTextboxElement.value = this._settings.fixedColumnCount.toString();
        this.handleUiFixedColumnChange();
        this._enableLargeHighlightCheckboxElement.checked = false;
        this._rowOrderReversedCheckboxElement.checked = this._mainDataServer.rowOrderReversed;
        this._switchNewRectangleSelectionToRowCheckboxElement.checked = this._settings.switchNewRectangleSelectionToRowOrColumn === 'row';
        this._cellPaddingTextboxElement.value = this._settings.cellPadding.toString();
        const rowHeight = this._settings.defaultRowHeight;
        this._rowHeightTextboxElement.value = rowHeight === undefined ? '' : rowHeight.toString();
        this._gridRightAlignedCheckboxElement.checked = this._settings.gridRightAligned;

        this._grid.resizedEventer = () => this.handleGridResized();
        this._grid.columnsWidthChangedEventer = (columns) => this.handleColumnsWidthChanged(columns);
        this._grid.renderedEventer = () => this.handleGridRendered();

        // do we need to wait for this? Do we even need it with rightToLeftColumns?
        this._activeWidthSpanElement.textContent = this._grid.calculateActiveColumnsWidth().toString();
        this._renderCountSpanElement.textContent = this._renderCount.toString();

        // const scrollbarVerticalWidth = this._settings.scrollbarVerticalWidth;
        // this._vertScrollbarWidthTextboxElement.value = scrollbarVerticalWidth.toString();
        // const scrollbarVerticalThumbWidth = this._settings.scrollbarVerticalThumbWidth;
        // this._vertScrollbarThumbWidthTextboxElement.value = scrollbarVerticalThumbWidth.toString();
        // const scrollbarMargin = this._settings.scrollbarMargin;
        // this._scrollbarMarginTextboxElement.value = scrollbarMargin.toString();

        // do we need to wait for this? Do we even need it with rightToLeftColumns?
        this._activeWidthSpanElement.textContent = this._grid.calculateActiveColumnsWidth().toString();
        this._renderCountSpanElement.textContent = this._renderCount.toString();
    }

    // UI Handlers
    private handleUiInsertRecordAction(mouseEvent: MouseEvent) {
        const recordIndex = parseInt(this._insertRecordIndexTextboxElement.value);
        if (mouseEvent.shiftKey || isNaN(recordIndex)) {
            this.insertRandomRecord();
        } else {
            const dataRec = this.getRandomRecordData();
            this._recordStore.insertRecord(recordIndex, dataRec, true, true);
            this._insertRecordIndexTextboxElement.value = recordIndex.toString();
        }
    }

    private handleUiInsertRecordsAction(_mouseEvent: MouseEvent) {
        this.insertFewRandomRecords();
    }

    private handleUiInsertManyRecordsAction() {
        this.insertManyRandomRecords();
    }

    private handleUiDeleteRecordAction() {
        this.deleteRandomRecord();
    }

    private handleUiDeleteRecordsAction() {
        this.deleteRandomRecords();
    }

    private handleUiModifyValueAction() {
        this.modifyRandomValue();
    }

    private handleUiModifyValuesAction() {
        this.modifyRandomValues();
    }

    private handleUiClearRecordsAction() {
        this._recordStore.clearRecords();
    }

    private handleUiRandomStuffChange(): void {
        const checked = this._randomStuffCheckboxElement.checked;
        if ((this._randomStuffIntervalSetTimeoutId !== undefined) !== checked) {
            if (checked) {
                this._randomStuffIntervalSetTimeoutId = setInterval(() => this.exerciseRandomStuff(), 300);
            } else {
                if (this._randomStuffIntervalSetTimeoutId !== undefined) {
                    clearInterval(this._randomStuffIntervalSetTimeoutId);
                    this._randomStuffIntervalSetTimeoutId = undefined;
                }
            }
        }
    }

    start(): void {
        // no code needed
    }

    private handleGridResized(): void {
        this._activeWidthSpanElement.textContent = this._grid.calculateActiveColumnsWidth().toString();
    }

    private handleColumnsWidthChanged(_columns: Column<StandardBehavioredColumnSettings, GridField>[]): void {
        this._activeWidthSpanElement.textContent = this._grid.calculateActiveColumnsWidth().toString();
    }

    private handleGridRendered(/*event: GridCustomEvent*/): void {
        this._renderCount++;
        this._renderCountSpanElement.textContent = this._renderCount.toString();
    }

    private handleUiContinuousFilteringCheckboxChange() {
        this._mainDataServer.continuousFiltering = this._continuousFilteringCheckboxElement.checked;

        if (this._mainDataServer.continuousFiltering) {
            this._mainDataServer.filterCallback = this.createFilterCallbackClosure();
        } else {
            this._mainDataServer.filterCallback = undefined;
        }
    }

    private handleUiDecrementFilterIntegerAction(): void {
        this._integerFilterValue--;
        this._filterIntegerTextboxElement.value = this._integerFilterValue.toString();

        if (this._mainDataServer.continuousFiltering) {
            this._mainDataServer.filterCallback = this.createFilterCallbackClosure();
        }
    }

    private handleUiFilterIntegerChange(): void {
        const value = this._filterIntegerTextboxElement.value;
        this._integerFilterValue = Number.parseInt(value, 10);

        if (this._mainDataServer.continuousFiltering) {
            this._mainDataServer.filterCallback = this.createFilterCallbackClosure();
        }
    }

    private handleUiIncrementFilterIntegerAction() {
        this._integerFilterValue++;
        this._filterIntegerTextboxElement.value = this._integerFilterValue.toString();

        if (this._mainDataServer.continuousFiltering) {
            this._mainDataServer.filterCallback = this.createFilterCallbackClosure();
        }
    }

    private handleUiFixedColumnChange() {
        const value = this._fixedColumnTextboxElement.value;
        this._settings.fixedColumnCount = Number.parseInt(value, 10);
    }

    private handleUiEnableLargeHighlightChange() {
        this._recordStore.invalidateAll();
    }

    private handleUiRowOrderReversedChange() {
        this._mainDataServer.rowOrderReversed = this._rowOrderReversedCheckboxElement.checked;
    }

    private handleUiSwitchNewRectangleSelectionToRowChange() {
        this._settings.switchNewRectangleSelectionToRowOrColumn = this._switchNewRectangleSelectionToRowCheckboxElement.checked ? 'row' : undefined;
    }

    private handleUiDecrementCellPaddingAction() {
        if (this._settings.cellPadding > 0) {
            this._settings.cellPadding--;
        }
    }

    private handleUiCellPaddingChange() {
        const value = this._cellPaddingTextboxElement.value;
        this._settings.cellPadding = Number(value);
    }

    private handleUiIncrementCellPaddingAction() {
        this._settings.cellPadding++;
    }

    private handleUiDecrementRowHeightAction() {
        if (this._settings.defaultRowHeight !== undefined && this._settings.defaultRowHeight > 0) {
            this._settings.defaultRowHeight--;
        }
    }

    private handleUiRowHeightChange() {
        const value = this._rowHeightTextboxElement.value;
        if (value === '') {
            this._settings.defaultRowHeight = defaultAppGridSettings.defaultRowHeight;
        } else {
            this._settings.defaultRowHeight = Number(value);
        }
    }

    private handleUiIncrementRowHeightAction() {
        if (this._settings.defaultRowHeight !== undefined) {
            this._settings.defaultRowHeight++;
        }
    }

    private handleUiHideStringFieldChange() {
        const visible = !this._hideStringFieldCheckboxElement.checked;
        this._grid.showHideColumns(false, this._strValGridField.index, visible ? undefined : -1);
    }

    // private handleUiVertScrollbarWidthChange() {
    //     const value = this._vertScrollbarWidthTextboxElement.value;
    //     this._settings.scrollbarVerticalWidth = Number(value);
    // }

    // private handleUiVertScrollbarThumbWidthChange() {
    //     const value = this._vertScrollbarThumbWidthTextboxElement.value;
    //     this._settings.scrollbarVerticalThumbWidth = Number(value);
    // }

    // private handleUiScrollbarMarginChange() {
    //     const value = this._scrollbarMarginTextboxElement.value;
    //     this._settings.scrollbarMargin = Number(value);
    // }

    // private handleUiScrollbarsCanOverlapGridChange() {
    //     const value = this._scrollbarsCanOverlapGridCheckboxElement.checked;
    //     this._settings.scrollBarsCanOverlapGrid = value;
    // }

    private handleUiGridRightAlignedChange() {
        const value = this._gridRightAlignedCheckboxElement.checked;
        this._settings.gridRightAligned = value;
    }

    private handleUiApplySettings() {

        // const properties = GridSettings.createGridPropertiesFromSettings(this._settings, this._grid.properties);
        // const changedPropertyKeys = Object.keys(properties);
        // if (changedPropertyKeys.length > 0) {
        //     this._grid.addProperties(properties);
        // }

        // this.updateScrollbar();
    }

    private handleUiAutoSizeStringAction() {
        this._grid.autoSizeFieldColumnWidth(this._strValGridField.index, false);
    }

    private handleUiAutoWidenStringAction() {
        // this._grid.autoIncreaseColumnWidth(2);
    }

    private handleUiAutoSizeAllAction() {
        this._grid.autoSizeActiveColumnWidths(false);
    }

    private handleUiAutoWidenAllAction() {
        this._grid.autoSizeActiveColumnWidths(true);
    }

    private handleUiPerformance30kAction() {
        this._performanceTimeSpanElement.textContent = 'profiling...';

        setTimeout(() => {
            // Clear existing records
            this._recordStore.clearRecords();

            // Create records
            const Count = 30000;
            for (let index = 0; index <= Count - 1; index++) {
                this._recordStore.addRecordData(this.getRandomRecordData());
            }

            // Insert Records
            this._recordStore.beginChange();
            try {
                const idx = 0;
                this.profileInsertOperation(idx, Count);
            } finally {
                this._recordStore.endChange();
            }
        }, 10);
    }

    private handleUiPerformance60kAction() {
        this._performanceTimeSpanElement.textContent = 'profiling...';

        setTimeout(() => {
            // Clear existing records
            this._recordStore.clearRecords();

            // Create records
            const Count = 60000;
            for (let index = 0; index <= Count - 1; index++) {
                this._recordStore.addRecordData(this.getRandomRecordData());
            }

            // Insert Records
            this._recordStore.beginChange();
            try {
                const idx = 0;
                this.profileInsertOperation(idx, Count);
            } finally {
                this._recordStore.endChange();
            }
        }, 10);
    }

    private handleUiPerformanceAddOneAtStartAction() {
        this._performanceTimeSpanElement.textContent = 'profiling...';

        setTimeout(() => {
            const idx = 0;
            const Count = 1;
            this._recordStore.insertRecord(idx, this.getRandomRecordData(), false, false)
            this.profileInsertOperation(idx, Count);
        }, 10);
    }

    private handleUiPerformanceAddOneAtMiddleAction() {
        this._performanceTimeSpanElement.textContent = 'profiling...';

        setTimeout(() => {
            const idx = Math.floor(this._recordStore.recordCount / 2);
            const Count = 1;
            this._recordStore.insertRecord(idx, this.getRandomRecordData(), false, false)
            this.profileInsertOperation(idx, Count);
        }, 10);
    }

    private handleUiPerformanceAddOneAtEndAction() {
        this._performanceTimeSpanElement.textContent = 'profiling...';

        setTimeout(() => {
            const idx = this._recordStore.recordCount;
            const Count = 1;
            this._recordStore.addRecordData(this.getRandomRecordData());
            this.profileInsertOperation(idx, Count);
        }, 10);
    }

    private profileInsertOperation(idx: number, count: number) {
        this.profileAction(() => {
            this._recordStore.eventifyRecordsInserted(idx, count, false);
        });
    }

    private handleUiPerformanceDeleteOneAtStartAction() {
        const idx = 0;
        this._recordStore.deleteRecord(idx, false);

        this.profileAction(() => {
            this._recordStore.eventifyRecordDeleted(idx);
        });
    }

    private handleUiPerformanceDeleteOneAtMiddleAction() {
        const idx = Math.floor(this._recordStore.recordCount / 2);
        this._recordStore.deleteRecord(idx, false);

        this.profileAction(() => {
            this._recordStore.eventifyRecordDeleted(idx);
        });
    }

    private handleUiPerformanceDeleteOneAtEndAction() {
        const idx = this._recordStore.recordCount - 1;
        this._recordStore.deleteRecord(idx, false);

        this.profileAction(() => {
            this._recordStore.eventifyRecordDeleted(idx);
        });
    }

    private handleUiPerformanceModifyRecordsAction() {
        for (let index = 0; index < this._recordStore.recordCount; index++) {
            const element = this._recordStore.getRecord(index);
            const data = this.getRandomRecordData();
            element.data = data;
        }
        this.profileAction(() => {
            this._recordStore.invalidateAll();
        });
    }

    private handleUiPerformanceModifyOneRecordAction() {
        const recordsToModify = 1;

        const indices: number[] = [];

        for (let index = 0; index < recordsToModify; index++) {
            const randomIndex = Math.floor(Math.random() * this._recordStore.recordCount); // mutate index
            const element = this._recordStore.getRecord(randomIndex);
            const data = this.getRandomRecordData();
            element.data = data;
            indices.push(randomIndex);
        }

        this.profileAction(() => {
            this._recordStore.beginChange();
            try {
                for (const index of indices) {
                    this._recordStore.invalidateRecord(index);
                }
            } finally {
                this._recordStore.endChange();
            }

        });
    }

    private insertRandomRecord() {
        const idx = Math.floor(Math.random() * (this._recordStore.recordCount + 1)); // insert index
        if (this._debugEnabled) {
            console.debug(`InsertRecord: ${idx}, ${this._recordStore.recordCount}`);
        }
        const dataRec = this.getRandomRecordData();
        this._recordStore.insertRecord(idx, dataRec, true, true);
        this._insertRecordIndexTextboxElement.value = idx.toString();
    }

    private insertRandomRecords(count: number) {
        const idx = Math.floor(Math.random() * (this._recordStore.recordCount + 1)); // insert index
        if (this._debugEnabled) {
            console.debug(`InsertRecords: ${idx}, ${count}, ${this._recordStore.recordCount}`);
        }
        const recordDatas = new Array<RecordStore.Record.Data>(count);
        for (let i = 0; i < count; i++) {
            recordDatas[i] = this.getRandomRecordData();
        }
        this._recordStore.insertRecords(idx, recordDatas, true);

        return idx;
    }

    private insertFewRandomRecords() {
        const count = Math.floor(Math.random() * 5) + 1;
        const idx = this.insertRandomRecords(count)
        this._insertRecordIndexTextboxElement.value = `${idx}, ${count}`;
    }

    private insertManyRandomRecords() {
        const count = 200;
        const idx = this.insertRandomRecords(count)
        this._insertManyRecordsIndexSpanElement.textContent = `${idx}, ${count}`;
    }

    private getRandomRecordData(): RecordStore.Record.Data {
        const intVal = Math.floor(Math.random() * 200);
        const strVal = 'Ins' + Number(Math.random() * 900);
        const dblVal = Math.random() * (10000.0 / 300.0);
        const dateVal = new Date(2018, 6, Math.floor(Math.random() * 20));
        const enumVal = Math.floor(Math.random() * 5) as RecordStore.TDataItemStatusId;
        return [intVal, strVal, dblVal, dateVal, enumVal];
    }

    private deleteRandomRecord() {
        if (this._recordStore.recordCount > 0) {
            const idx = Math.floor(Math.random() * this._recordStore.recordCount); // delete index
            if (this._debugEnabled) {
                console.debug(`DeleteRecord: ${idx}, ${this._recordStore.recordCount}`);
            }
            this._recordStore.deleteRecord(idx, true);
            this._deleteRecordIndexSpanElement.textContent = idx.toString();
        }
    }

    private deleteRandomRecords() {
        if (this._recordStore.recordCount > 0) {
            const idx = Math.floor(Math.random() * this._recordStore.recordCount); // delete index
            let count = Math.floor(Math.random() * 5) + 1;
            if ((idx + count) > this._recordStore.recordCount) {
                count = this._recordStore.recordCount - idx;
            }
            if (this._debugEnabled) {
                console.debug(`DeleteRecords: ${idx}, ${count}, ${this._recordStore.recordCount}`);
            }
            this._recordStore.deleteRecords(idx, count);
            this._deleteRecordIndexSpanElement.textContent = `${idx}, ${count}`;
        }
    }

    private modifyRandomValue() {
        const fieldCount = this._schemaServer.fieldCount;
        if (fieldCount > 0 && this._recordStore.recordCount > 0) {
            let fieldIdx = Math.floor(Math.random() * fieldCount);

            let field = this._schemaServer.fields[fieldIdx];

            if (field === this._recordIndexGridField) {
                fieldIdx += 2;
            }

            field = this._schemaServer.fields[fieldIdx];

            // fieldIdx = this._grid.getFieldIndex(DataStore.intValGridField); // for testing

            const recordIndex = Math.floor(Math.random() * this._recordStore.recordCount);
            this.modifyValue(field, recordIndex);

            this._modifyValuePosSpanElement.textContent = `${field.name}, ${recordIndex}`;
        }
    }

    private profileAction(action: () => void): void {
        const time = performance.now();
        action();
        const milliseconds = performance.now() - time;
        console.log('perf:', milliseconds);
        this._performanceTimeSpanElement.textContent = `${milliseconds} ms`;
    }

    private modifyRandomValues() {
        this._recordStore.beginChange();
        const count = Math.floor(Math.random() * 8);
        if (this._debugEnabled) {
            console.debug(`ModifyRandomValues: ${count}, ${this._recordStore.recordCount}`);
        }
        for (let i = 0; i < count; i++) {
            this.modifyRandomValue();
        }
        this._recordStore.endChange();
    }

    private modifyValue(field: GridField, recordIndex: number) {
        if (this._debugEnabled) {
            console.debug(`ModifyValue: ${field.name}, ${recordIndex}, ${this._recordStore.recordCount}`);
        }
        const record = this._recordStore.getRecord(recordIndex);

        const valueRecentChangeTypeId = field.modifyValue(record);

        if (valueRecentChangeTypeId !== undefined) {
            if (field === this._intValGridField) {
                const focusPoint = this._grid.focus.current;
                if (focusPoint !== undefined) {
                    const focusRecordIndex = this._mainDataServer.getRecordIndexFromRowIndex(focusPoint.y);
                    if (recordIndex === focusRecordIndex) {
                        this.updateCaptionValue(recordIndex);
                    }
                }
            }

            this._recordStore.invalidateValue(field.index, recordIndex, valueRecentChangeTypeId);
        }
    }

    private updateCaptionValue(recIdx: number) {
        let captionValue: string;
        if (recIdx >= 0) {
            captionValue = `[Integer: ${this._recordStore.getRecord(recIdx).data[RecordStore.Record.Data.intValIndex]}]`;
        } else {
            captionValue = recIdx.toString();
        }
        this._currentRecordValueSpanElement.textContent = captionValue;
    }

    private exerciseRandomStuff() {
        const ActionKey = Math.random() * 20;
        if (ActionKey < 8) {
            this.modifyRandomValue();
        } else if (ActionKey < 12) {
            this.modifyRandomValues();
        } else if (ActionKey < 15) {
            this.deleteRandomRecord();
        } else if (ActionKey < 16) {
            this.deleteRandomRecords();
        } else if (ActionKey < 19) {
            this.insertRandomRecord();
        } else if (ActionKey < 20) {
            this.insertFewRandomRecords();
        }
    }

    private createFilterCallbackClosure(): RevRecordDataServer.RecordFilterCallback {
        const threshold = this._integerFilterValue; // make sure current value is kept in closure

        return (value) => (value as RecordStore.Record).data[RecordStore.Record.Data.intValIndex] > threshold;
    }

    private numberToPixels(value: number): string {
        return value.toString(10) + 'px';
    }
}
