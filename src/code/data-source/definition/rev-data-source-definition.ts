// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Err, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevGridLayoutOrReferenceDefinition } from '../../grid-layout/internal-api';
import { RevTableRecordSourceDefinition, RevTableRecordSourceDefinitionFromJsonFactory } from '../../table/internal-api';
import { RevGridRowOrderDefinition } from './rev-grid-row-order-definition';

/** @public */
export class RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    constructor(
        public readonly tableRecordSourceDefinition: RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        public gridLayoutOrReferenceDefinition: RevGridLayoutOrReferenceDefinition | undefined,
        public rowOrderDefinition: RevGridRowOrderDefinition<TableFieldSourceDefinitionTypeId> | undefined,
    ) {
    }

    saveToJson(element: JsonElement) {
        const tableRecordSourceDefinitionElement = element.newElement(RevDataSourceDefinition.JsonName.tableRecordSource);
        this.tableRecordSourceDefinition.saveToJson(tableRecordSourceDefinitionElement);
        if (this.gridLayoutOrReferenceDefinition !== undefined) {
            const gridLayoutOrReferenceElement = element.newElement(RevDataSourceDefinition.JsonName.gridLayoutOrReference);
            this.gridLayoutOrReferenceDefinition.saveToJson(gridLayoutOrReferenceElement);
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
        export const gridLayoutOrReference = 'revGridLayoutOrReference';
        export const rowOrder = 'revRowOrder';
    }

    export const enum CreateFromJsonErrorId {
        TableRecordSourceElementIsNotDefined,
        TableRecordSourceJsonValueIsNotOfTypeObject,
        TableRecordSourceTryCreate,
    }

    export const enum LayoutCreateFromJsonErrorId {
        GridLayoutOrReferenceElementIsNotDefined,
        GridLayoutOrReferenceJsonValueIsNotOfTypeObject,
        GridLayoutNeitherReferenceOrDefinitionJsonValueIsDefined,
        GridLayoutBothReferenceAndDefinitionJsonValuesAreOfWrongType,
        GridLayoutOrReferenceDefinitionJsonValueIsNotOfTypeObject,
        GridLayoutOrReferenceDefinitionColumnsElementIsNotDefined,
        GridLayoutOrReferenceDefinitionColumnsElementIsNotAnArray,
        GridLayoutOrReferenceDefinitionColumnElementIsNotAnObject,
        GridLayoutOrReferenceDefinitionAllColumnElementsAreInvalid,
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

    export function tryCreateGridLayoutOrReferenceDefinitionFromJson(element: JsonElement): Result<RevGridLayoutOrReferenceDefinition, LayoutCreateFromJsonErrorId> {
        const getElementResult = element.tryGetElement(JsonName.gridLayoutOrReference);
        if (getElementResult.isErr()) {
            const getElementErrorId = getElementResult.error;
            let errorId: LayoutCreateFromJsonErrorId;
            switch (getElementErrorId) {
                case JsonElement.ErrorId.ElementIsNotDefined:
                    errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceElementIsNotDefined;
                    break;
                case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                    errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceJsonValueIsNotOfTypeObject;
                    break;
                default:
                    throw new UnreachableCaseError('RDSDTCTRSDFJL43344', getElementErrorId);
            }
            return new Err(errorId);
        } else {
            const gridLayoutOrReferenceDefinitionElement = getElementResult.value;
            const createFromJsonResult = RevGridLayoutOrReferenceDefinition.tryCreateFromJson(
                gridLayoutOrReferenceDefinitionElement
            );
            if (createFromJsonResult.isErr()) {
                const createFromJsonErrorId = createFromJsonResult.error;
                let errorId: LayoutCreateFromJsonErrorId;
                switch (createFromJsonErrorId) {
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.NeitherReferenceOrDefinitionJsonValueIsDefined:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutNeitherReferenceOrDefinitionJsonValueIsDefined;
                        break;
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.BothReferenceAndDefinitionJsonValuesAreOfWrongType:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutBothReferenceAndDefinitionJsonValuesAreOfWrongType;
                        break;
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionJsonValueIsNotOfTypeObject:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceDefinitionJsonValueIsNotOfTypeObject;
                        break;
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionColumnsElementIsNotDefined:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceDefinitionColumnsElementIsNotDefined;
                        break;
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionColumnsElementIsNotAnArray:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceDefinitionColumnsElementIsNotAnArray;
                        break;
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionColumnElementIsNotAnObject:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceDefinitionColumnElementIsNotAnObject;
                        break;
                    case RevGridLayoutOrReferenceDefinition.CreateFromJsonErrorId.DefinitionAllColumnElementsAreInvalid:
                        errorId = LayoutCreateFromJsonErrorId.GridLayoutOrReferenceDefinitionAllColumnElementsAreInvalid;
                        break;
                    default:
                        throw new UnreachableCaseError('RDSDTCTRSDFJC43344', createFromJsonErrorId);
                }
                return new Err(errorId);
            } else {
                const gridLayoutOrReferenceDefinition = createFromJsonResult.value;
                return new Ok(gridLayoutOrReferenceDefinition);
            }
        }
    }

    export function tryGetRowOrderFromJson<TableFieldSourceDefinitionTypeId>(element: JsonElement): RevGridRowOrderDefinition<TableFieldSourceDefinitionTypeId> | undefined {
        const rowOrderDefinitionElementResult = element.tryGetElement(JsonName.rowOrder);
        if (rowOrderDefinitionElementResult.isErr()) {
            return undefined;
        } else {
            const rowOrderDefinitionElement = rowOrderDefinitionElementResult.value;
            return RevGridRowOrderDefinition.createFromJson(rowOrderDefinitionElement);
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

            let gridLayoutOrReferenceDefinition: RevGridLayoutOrReferenceDefinition | undefined;
            const gridLayoutOrReferenceDefinitionResult = tryCreateGridLayoutOrReferenceDefinitionFromJson(element);

            let layoutCreateFromJsonErrorId: LayoutCreateFromJsonErrorId | undefined;
            if (gridLayoutOrReferenceDefinitionResult.isErr()) {
                gridLayoutOrReferenceDefinition = undefined;
                layoutCreateFromJsonErrorId = gridLayoutOrReferenceDefinitionResult.error;
            } else {
                gridLayoutOrReferenceDefinition = gridLayoutOrReferenceDefinitionResult.value;
                layoutCreateFromJsonErrorId = undefined;
            }

            const rowOrderDefinition = tryGetRowOrderFromJson<TableFieldSourceDefinitionTypeId>(element);

            const definition = new RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
                tableRecordSourceDefinition,
                gridLayoutOrReferenceDefinition,
                rowOrderDefinition,
            );
            return new Ok({ definition, layoutCreateFromJsonErrorId });
        }
    }
}
