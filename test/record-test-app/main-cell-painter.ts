import {
    CellPainter,
    DatalessViewCell,
    Revgrid,
    SelectionAreaTypeId,
    StandardBehavioredColumnSettings,
    StandardCellPainter,
    StandardTextPainter,
} from '@xilytix/revgrid';
import { UnreachableCaseError } from '@xilytix/sysutils';
import {
    RevRecordDataServer,
    RevRecordRecentChangeTypeId,
    RevRecordValueRecentChangeTypeId,
} from '../..';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { GridField } from './grid-field';

export class MainCellPainter
    extends StandardCellPainter<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>
    implements CellPainter<StandardBehavioredColumnSettings, GridField> {

    protected declare readonly _dataServer: RevRecordDataServer<GridField>;

    private readonly _textPainter: StandardTextPainter;

    constructor(
        grid: Revgrid<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>,
        dataServer: RevRecordDataServer<GridField>,
    ) {
        super(grid, dataServer);

        this._textPainter = new StandardTextPainter(this._renderingContext);
    }

    paint(cell: DatalessViewCell<StandardBehavioredColumnSettings, GridField>, prefillColor: string | undefined): number | undefined {
        const grid = this._grid;

        const gridSettings = this._gridSettings;
        const columnSettings = cell.columnSettings;
        this._textPainter.setColumnSettings(columnSettings);

        const gc = this._renderingContext;
        const subgrid = cell.subgrid;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;

        const foreColor = gridSettings.color;

        const field = cell.viewLayoutColumn.column.field;
        const foreText = this._dataServer.getViewValue(field, subgridRowIndex) as string;
        const foreFont = gridSettings.font;
        let internalBorderRowOnly = false;

        const valueRecentChangeTypeId = this._dataServer.getValueRecentChangeTypeId(field, subgridRowIndex);

        const focus = grid.focus;
        let internalBorderColor: string | undefined;
        let focusedCellBorderColor: string | undefined;
        const rowFocused = focus.isMainSubgridRowFocused(subgridRowIndex);
        let cellFocused: boolean;
        if (rowFocused) {
            if (gridSettings.focusedRowBorderColor !== undefined) {
                internalBorderColor = gridSettings.focusedRowBorderColor;
                internalBorderRowOnly = true;
            }

            cellFocused = focus.isCellFocused(cell);
            if (cellFocused) {
                focusedCellBorderColor = gridSettings.focusedCellBorderColor;
            }
        } else {
            cellFocused = false;
        }

        let bkgdColor: string;
        const selectionBackgroundColor = this._gridSettings.selectionBackgroundColor;
        const selection = grid.selection;
        let cellSelectionAreaTypeId: SelectionAreaTypeId | undefined;
        if (
            selectionBackgroundColor !== undefined &&
            (cellSelectionAreaTypeId = selection.getOneCellSelectionAreaTypeId(activeColumnIndex, subgridRowIndex, subgrid)) !== undefined &&
            (!cellFocused || !selection.isSelectedCellTheOnlySelectedCell(activeColumnIndex, subgridRowIndex, subgrid, cellSelectionAreaTypeId))
        ) {
            bkgdColor = selectionBackgroundColor;
        } else {
            if (prefillColor !== undefined) {
                bkgdColor = prefillColor;
            } else {
                bkgdColor = gridSettings.backgroundColor;
            }
        }

        if (valueRecentChangeTypeId !== undefined) {
            switch (valueRecentChangeTypeId) {
                case RevRecordValueRecentChangeTypeId.Update:
                    internalBorderColor = gridSettings.valueRecentlyModifiedBorderColor;
                    break;
                case RevRecordValueRecentChangeTypeId.Increase:
                    internalBorderColor = gridSettings.valueRecentlyModifiedUpBorderColor;
                    break;
                case RevRecordValueRecentChangeTypeId.Decrease:
                    internalBorderColor = gridSettings.valueRecentlyModifiedDownBorderColor;
                    break;
                default:
                    throw new UnreachableCaseError('TCPPRVCTU02775', valueRecentChangeTypeId);
            }
            internalBorderRowOnly = false;
        } else {
            const rowRecentChangeTypeId = this._dataServer.getRecordRecentChangeTypeId(subgridRowIndex);
            if (rowRecentChangeTypeId !== undefined) {
                switch (rowRecentChangeTypeId) {
                    case RevRecordRecentChangeTypeId.Update:
                        internalBorderColor = gridSettings.recordRecentlyUpdatedBorderColor;
                        break;
                    case RevRecordRecentChangeTypeId.Insert:
                        internalBorderColor = gridSettings.recordRecentlyInsertedBorderColor;
                        break;
                    case RevRecordRecentChangeTypeId.Remove:
                        internalBorderColor = undefined;
                        break;
                    default:
                        throw new UnreachableCaseError('TCPPRRCTU02775', rowRecentChangeTypeId);
                }
                internalBorderRowOnly = true;
            }
        }

        let bkgdRenderingRequired: boolean;
        let textProcessingRequired: boolean;
        let internalBorderProcessingRequired: boolean;
        if (prefillColor !== undefined) {
            bkgdRenderingRequired = prefillColor !== bkgdColor;
            textProcessingRequired = true;
            internalBorderProcessingRequired = true;
        } else {
            const fingerprint = cell.paintFingerprint as PaintFingerprint | undefined;
            if (fingerprint === undefined) {
                bkgdRenderingRequired = true;
                textProcessingRequired = true;
                internalBorderProcessingRequired = true;
            } else {
                if (fingerprint.bkgdColor !== bkgdColor) {
                    bkgdRenderingRequired = true;
                    textProcessingRequired = true;
                    internalBorderProcessingRequired = true;
                } else {
                    bkgdRenderingRequired = false;
                    textProcessingRequired = fingerprint.foreColor !== foreColor || fingerprint.foreText !== foreText;
                    internalBorderProcessingRequired =
                        fingerprint.internalBorderColor !== internalBorderColor ||
                        fingerprint.internalBorderRowOnly !== internalBorderRowOnly ||
                        fingerprint.focusedCellBorderColor !== focusedCellBorderColor;
                }
            }
        }

        if (
            !bkgdRenderingRequired &&
            !textProcessingRequired &&
            !internalBorderProcessingRequired
        ) {
            return undefined;
        } else {
            const newFingerprint: PaintFingerprint = {
                bkgdColor,
                foreColor,
                internalBorderColor,
                internalBorderRowOnly,
                focusedCellBorderColor,
                foreText,
            };

            cell.paintFingerprint = newFingerprint;

            const bounds = cell.bounds;
            const x = bounds.x;
            const y = bounds.y;
            const width = bounds.width;
            const height = bounds.height;

            if (bkgdRenderingRequired) {
                gc.cache.fillStyle = bkgdColor;
                gc.fillRect(x, y, width, height);
            }

            if (internalBorderProcessingRequired) {
                if (internalBorderColor !== undefined) {
                    gc.cache.strokeStyle = internalBorderColor;
                    gc.cache.lineWidth = 1;
                    gc.cache.lineDash = [];
                    if (internalBorderRowOnly) {
                        gc.beginPath();
                        gc.moveTo(x, y + 0.5);
                        gc.lineTo(x + width, y + 0.5);
                        gc.stroke();

                        gc.beginPath();
                        gc.moveTo(x, y + height - 0.5);
                        gc.lineTo(x + width, y + height - 0.5);
                        gc.stroke();
                    } else {
                        gc.beginPath();
                        gc.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
                    }
                }

                if (focusedCellBorderColor !== undefined) {
                    gc.cache.strokeStyle = focusedCellBorderColor;
                    gc.cache.lineWidth = 1;
                    gc.cache.lineDash = [2, 1];
                    gc.beginPath();
                    gc.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
                }
            }

            const cellPadding = gridSettings.cellPadding;

            if (textProcessingRequired && foreText === '') {
                return undefined;
            } else {
                gc.cache.fillStyle = foreColor;
                gc.cache.font = foreFont;
                return this._textPainter.renderSingleLineText(bounds, foreText, cellPadding, cellPadding, columnSettings.horizontalAlign);
            }
        }
    }
}

export namespace AppCellPainter {
    export type GetValueRecentChangeTypeIdEventer = (this: void, field: GridField, subgridRowIndex: number) => RevRecordValueRecentChangeTypeId;
    export type GetRecordRecentChangeTypeIdEventer = (this: void, subgridRowIndex: number) => RevRecordRecentChangeTypeId;
}

interface PaintFingerprintInterface {
    bkgdColor: string;
    foreColor: string;
    internalBorderColor: string | undefined;
    internalBorderRowOnly: boolean;
    focusedCellBorderColor: string | undefined;
    foreText: string;
}

type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

type IndexSignatureHack<T> = { [K in keyof T]: IndexSignatureHack<T[K]> };
