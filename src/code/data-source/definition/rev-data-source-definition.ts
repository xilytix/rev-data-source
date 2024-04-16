// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Err, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevColumnLayoutOrReferenceDefinition } from '../../column-layout/server/internal-api';
import { RevRecordRowOrderDefinition } from '../../record/internal-api';
import { RevTableRecordSourceDefinition, RevTableRecordSourceDefinitionFromJsonFactory } from '../../table/internal-api';

/** @public */
export class RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    constructor(
        public readonly tableRecordSourceDefinition: RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        public columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition | undefined,
        public rowOrderDefinition: RevRecordRowOrderDefinition | undefined,
    ) {
    }

    saveToJson(element: JsonElement) {
        const tableRecordSourceDefinitionElement = element.newElement(RevDataSourceDefinition.JsonName.tableRecordSource);
        this.tableRecordSourceDefinition.saveToJson(tableRecordSourceDefinitionElement);
        if (this.columnLayoutOrReferenceDefinition !== undefined) {
            const columnLayoutOrReferenceElement = element.newElement(RevDataSourceDefinition.JsonName.columnLayoutOrReference);
            this.columnLayoutOrReferenceDefinition.saveToJson(columnLayoutOrReferenceElement);
        }
        if (this.rowOrderDefinition !== undefined) {
            const rowOrderElement = element.newElement(RevDataSourceDefinition.JsonName.rowOrder);
            this.rowOrderDefinition.saveToJson(rowOrderElement);
        }
    }
}

/** @public */
export namespace RevDataSourceDefinition {
    export namespace JsonName {
        export const tableRecordSource = 'revTableRecordSource';
        export const columnLayoutOrReference = 'revColumnLayoutOrReference';
        export const rowOrder = 'revRowOrder';
    }

    export const enum CreateFromJsonErrorId {
        TableRecordSourceElementIsNotDefined,
        TableRecordSourceJsonValueIsNotOfTypeObject,
        TableRecordSourceTryCreate,
    }

    export const enum LayoutCreateFromJsonErrorId {
        ColumnLayoutOrReferenceElementIsNotDefined,
        ColumnLayoutOrReferenceJsonValueIsNotOfTypeObject,
        ColumnLayoutNeitherReferenceOrDefinitionJsonValueIsDefined,
        ColumnLayoutBothReferenceAndDefinitionJsonValuesAreOfWrongType,
        ColumnLayoutOrReferenceDefinitionJsonValueIsNotOfTypeObject,
        ColumnLayoutOrReferenceDefinitionColumnsElementIsNotDefined,
        ColumnLayoutOrReferenceDefinitionColumnsElementIsNotAnArray,
        ColumnLayoutOrReferenceDefinitionColumnElementIsNotAnObject,
        ColumnLayoutOrReferenceDefinitionAllColumnElementsAreInvalid,
    }

    export interface CreateFromJsonErrorIdPlusExtra {
        readonly errorId: CreateFromJsonErrorId;
        readonly extra: string | undefined;
    }

    export function tryCreateTableRecordSourceDefinitionFromJson<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
        tableRecordSourceDefinitionFromJsonFactory: RevTableRecordSourceDefinitionFromJsonFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        element: JsonElement
    ): Result<
        RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        CreateFromJsonErrorIdPlusExtra
    > {
        const getElementResult = element.tryGetElement(JsonName.tableRecordSource);
        if (getElementResult.isErr()) {
            const getElementErrorId = getElementResult.error;
            let errorId: CreateFromJsonErrorId;
            switch (getElementErrorId) {
                case JsonElement.ErrorId.ElementIsNotDefined:
                    errorId = CreateFromJsonErrorId.TableRecordSourceElementIsNotDefined;
                    break;
                case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                    errorId = CreateFromJsonErrorId.TableRecordSourceJsonValueIsNotOfTypeObject;
                    break;
                default:
                    throw new UnreachableCaseError('RDSDTCTRSDFJT3344', getElementErrorId);
            }
            return new Err({ errorId, extra: undefined });
        } else {
            const tableRecordSourceDefinitionElement = getElementResult.value;
            const createFromJsonResult = tableRecordSourceDefinitionFromJsonFactory.tryCreateFromJson(tableRecordSourceDefinitionElement);
            if (createFromJsonResult.isErr()) {
                return new Err({ errorId: CreateFromJsonErrorId.TableRecordSourceTryCreate, extra: createFromJsonResult.error });
            } else {
                const tableRecordSourceDefinition = createFromJsonResult.value;
                return new Ok(tableRecordSourceDefinition);
            }
        }
    }

    export function tryCreateColumnLayoutOrReferenceDefinitionFromJson(element: JsonElement): Result<RevColumnLayoutOrReferenceDefinition, LayoutCreateFromJsonErrorId> {
        const getElementResult = element.tryGetElement(JsonName.columnLayoutOrReference);
        if (getElementResult.isErr()) {
            const getElementErrorId = getElementResult.error;
            let errorId: LayoutCreateFromJsonErrorId;
            switch (getElementErrorId) {
                case JsonElement.ErrorId.ElementIsNotDefined:
                    errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceElementIsNotDefined;
                    break;
                case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                    errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceJsonValueIsNotOfTypeObject;
                    break;
                default:
                    throw new UnreachableCaseError('RDSDTCTRSDFJL43344', getElementErrorId);
            }
            return new Err(errorId);
        } else {
            const columnLayoutOrReferenceDefinitionElement = getElementResult.value;
            const createFromJsonResult = RevColumnLayoutOrReferenceDefinition.tryCreateFromJson(
                columnLayoutOrReferenceDefinitionElement
            );
            if (createFromJsonResult.isErr()) {
                const createFromJsonErrorId = createFromJsonResult.error;
                let errorId: LayoutCreateFromJsonErrorId;
                switch (createFromJsonErrorId) {
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.NeitherReferenceOrDefinitionJsonValueIsDefined:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutNeitherReferenceOrDefinitionJsonValueIsDefined;
                        break;
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.BothReferenceAndDefinitionJsonValuesAreOfWrongType:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutBothReferenceAndDefinitionJsonValuesAreOfWrongType;
                        break;
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionJsonValueIsNotOfTypeObject:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceDefinitionJsonValueIsNotOfTypeObject;
                        break;
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionColumnsElementIsNotDefined:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceDefinitionColumnsElementIsNotDefined;
                        break;
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionColumnsElementIsNotAnArray:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceDefinitionColumnsElementIsNotAnArray;
                        break;
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionColumnElementIsNotAnObject:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceDefinitionColumnElementIsNotAnObject;
                        break;
                    case RevColumnLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionAllColumnElementsAreInvalid:
                        errorId = LayoutCreateFromJsonErrorId.ColumnLayoutOrReferenceDefinitionAllColumnElementsAreInvalid;
                        break;
                    default:
                        throw new UnreachableCaseError('RDSDTCTRSDFJC43344', createFromJsonErrorId);
                }
                return new Err(errorId);
            } else {
                const columnLayoutOrReferenceDefinition = createFromJsonResult.value;
                return new Ok(columnLayoutOrReferenceDefinition);
            }
        }
    }

    export function tryGetRowOrderFromJson(element: JsonElement): RevRecordRowOrderDefinition | undefined {
        const rowOrderDefinitionElementResult = element.tryGetElement(JsonName.rowOrder);
        if (rowOrderDefinitionElementResult.isErr()) {
            return undefined;
        } else {
            const rowOrderDefinitionElement = rowOrderDefinitionElementResult.value;
            return RevRecordRowOrderDefinition.createFromJson(rowOrderDefinitionElement);
        }
    }

    export interface WithLayoutError<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        definition: RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
        layoutCreateFromJsonErrorId: LayoutCreateFromJsonErrorId | undefined;
    }

    export function tryCreateFromJson<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
        tableRecordSourceDefinitionFromJsonFactory: RevTableRecordSourceDefinitionFromJsonFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        element: JsonElement
    ): Result<
        WithLayoutError<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        CreateFromJsonErrorIdPlusExtra
    > {
        const tableRecordSourceDefinitionResult = tryCreateTableRecordSourceDefinitionFromJson(
            tableRecordSourceDefinitionFromJsonFactory,
            element,
        );
        if (tableRecordSourceDefinitionResult.isErr()) {
            return tableRecordSourceDefinitionResult.createType();
        } else {
            const tableRecordSourceDefinition = tableRecordSourceDefinitionResult.value;

            let columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition | undefined;
            const columnLayoutOrReferenceDefinitionResult = tryCreateColumnLayoutOrReferenceDefinitionFromJson(element);

            let layoutCreateFromJsonErrorId: LayoutCreateFromJsonErrorId | undefined;
            if (columnLayoutOrReferenceDefinitionResult.isErr()) {
                columnLayoutOrReferenceDefinition = undefined;
                layoutCreateFromJsonErrorId = columnLayoutOrReferenceDefinitionResult.error;
            } else {
                columnLayoutOrReferenceDefinition = columnLayoutOrReferenceDefinitionResult.value;
                layoutCreateFromJsonErrorId = undefined;
            }

            const rowOrderDefinition = tryGetRowOrderFromJson(element);

            const definition = new RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
                tableRecordSourceDefinition,
                columnLayoutOrReferenceDefinition,
                rowOrderDefinition,
            );
            return new Ok({ definition, layoutCreateFromJsonErrorId });
        }
    }
}
