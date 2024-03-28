// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Err, Integer, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';

/** @public */
export class RevGridLayoutDefinition {
    constructor(readonly columns: readonly RevGridLayoutDefinition.Column[], readonly columnCreateErrorCount = 0) {
    }

    get columnCount() { return this.columns.length; }

    saveToJson(element: JsonElement) {
        const columnCount = this.columns.length;
        const columnElements = new Array<JsonElement>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const column = this.columns[i];
            const jsonElement = new JsonElement();
            RevGridLayoutDefinition.Column.saveToJson(column, jsonElement);
            columnElements[i] = jsonElement;
        }
        element.setElementArray(RevGridLayoutDefinition.JsonName.columns, columnElements);
    }

    createCopy() {
        const columnCount = this.columns.length;
        const newColumns = new Array<RevGridLayoutDefinition.Column>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const column = this.columns[i];
            const newColumn = RevGridLayoutDefinition.Column.createCopy(column);
            newColumns[i] = newColumn;
        }
        return new RevGridLayoutDefinition(newColumns, this.columnCreateErrorCount);
    }
}

/** @public */
export namespace RevGridLayoutDefinition {
    export namespace JsonName {
        export const columns = 'revColumns';
    }

    export interface Column {
        readonly fieldName: string
        readonly visible: boolean | undefined;
        readonly autoSizableWidth: Integer | undefined;
    }

    export namespace Column {
    }

    export namespace Column {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        export namespace JsonTag {
            // eslint-disable-next-line @typescript-eslint/no-shadow
            export const fieldName = 'fieldName';
            export const name = 'name'; // legacy
            export const visible = 'visible';
            export const show = 'show'; // legacy
            export const width = 'width';
        }

        export function createCopy(column: Column): Column {
            return {
                fieldName: column.fieldName,
                visible: column.visible,
                autoSizableWidth: column.autoSizableWidth,
            }
        }

        export function saveToJson(column: Column, element: JsonElement) {
            element.setString(Column.JsonTag.fieldName, column.fieldName);
            if (column.visible !== undefined) {
                element.setBoolean(Column.JsonTag.visible, column.visible);
            }
            if (column.autoSizableWidth !== undefined) {
                element.setInteger(Column.JsonTag.width, column.autoSizableWidth);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-shadow
        export function tryCreateFromJson(element: JsonElement) {
            let fieldName: string | undefined;
            const fieldNameResult = element.tryGetString(JsonTag.fieldName);
            if (fieldNameResult.isOk()) {
                fieldName = fieldNameResult.value;
            } else {
                // try legacy
                const nameResult = element.tryGetString(JsonTag.name);
                if (nameResult.isErr()) {
                    return undefined;
                } else {
                    fieldName = nameResult.value;
                }
            }
            if (fieldName.length === 0) {
                return undefined;
            } else {
                let visible = element.getBooleanOrUndefined(JsonTag.visible);
                if (visible === undefined) {
                    // try legacy
                    visible = element.getBooleanOrUndefined(JsonTag.show);
                }
                const autoSizableWidth = element.getIntegerOrUndefined(JsonTag.width);

                const column: Column = {
                    fieldName,
                    visible,
                    autoSizableWidth,
                }
                return column;
            }
        }
    }

    export function createColumnsFromFieldNames(fieldNames: readonly string[]): Column[] {
        const count = fieldNames.length;
        const columns = new Array<Column>(count);
        for (let i = 0; i < count; i++) {
            const fieldName = fieldNames[i];
            const column: Column = {
                fieldName,
                visible: undefined,
                autoSizableWidth: undefined,
            };
            columns[i] = column;
        }
        return columns;
    }

    export function createFromFieldNames(fieldNames: readonly string[]): RevGridLayoutDefinition {
        const columns = createColumnsFromFieldNames(fieldNames);
        return new RevGridLayoutDefinition(columns);
    }

    export const enum CreateFromJsonErrorId {
        ColumnsElementIsNotDefined,
        ColumnsElementIsNotAnArray,
        ColumnElementIsNotAnObject,
        AllColumnElementsAreInvalid,
    }

    export interface ColumnsCreatedFromJson {
        readonly columns: RevGridLayoutDefinition.Column[];
        readonly columnCreateErrorCount: Integer;
    }

    export function tryCreateFromJson(element: JsonElement): Result<RevGridLayoutDefinition, CreateFromJsonErrorId> {
        const columnsResult = tryCreateColumnsFromJson(element);
        if (columnsResult.isErr()) {
            return columnsResult.createType();
        } else {
            const columnsCreatedFromJson = columnsResult.value;
            const definition = new RevGridLayoutDefinition(columnsCreatedFromJson.columns, columnsCreatedFromJson.columnCreateErrorCount);
            return new Ok(definition);
        }
    }

    export function tryCreateColumnsFromJson(element: JsonElement): Result<ColumnsCreatedFromJson, CreateFromJsonErrorId> {
        const getElementResult = element.tryGetElementArray(JsonName.columns);
        if (getElementResult.isErr()) {
            const getElementErrorId = getElementResult.error;
            let createFromJsonErrorId: CreateFromJsonErrorId;
            switch (getElementErrorId) {
                case JsonElement.ErrorId.JsonValueIsNotDefined:
                    createFromJsonErrorId = CreateFromJsonErrorId.ColumnsElementIsNotDefined;
                    break;
                case JsonElement.ErrorId.JsonValueIsNotAnArray:
                    createFromJsonErrorId = CreateFromJsonErrorId.ColumnsElementIsNotAnArray;
                    break;
                case JsonElement.ErrorId.JsonValueArrayElementIsNotAnObject:
                    createFromJsonErrorId = CreateFromJsonErrorId.ColumnElementIsNotAnObject;
                    break;
                default:
                    throw new UnreachableCaseError('RGLDTCCFJ82834', getElementErrorId);
            }
            return new Err(createFromJsonErrorId);
        } else {
            const columnElements = getElementResult.value;
            const maxCount = columnElements.length;
            const columns = new Array<RevGridLayoutDefinition.Column>(maxCount);
            let count = 0;
            let columnCreateErrorCount = 0;
            for (let i = 0; i < maxCount; i++ ) {
                const columnElement = columnElements[i];
                const column = RevGridLayoutDefinition.Column.tryCreateFromJson(columnElement);
                if (column === undefined) {
                    columnCreateErrorCount++;
                } else {
                    columns[count++] = column;
                }
            }
            columns.length = count;

            if (count === 0 && columnCreateErrorCount > 0) {
                return new Err(CreateFromJsonErrorId.AllColumnElementsAreInvalid);
            } else {
                return new Ok({ columns, columnCreateErrorCount });
            }
        }
    }
}
