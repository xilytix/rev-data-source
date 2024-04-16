// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Err, Guid, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevColumnLayoutOrReferenceDefinition } from '../../column-layout/internal-api';
import { RevRecordRowOrderDefinition } from '../../record/internal-api';
import {
    RevTableRecordSourceDefinition,
    RevTableRecordSourceDefinitionFromJsonFactory
} from "../../table/internal-api";
import { RevDataSourceDefinition } from './rev-data-source-definition';

/** @public */
export class RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    extends RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {

    constructor(
        readonly id: Guid,
        readonly name: string,
        tableRecordSourceDefinition: RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        columnLayoutDefinitionOrReference: RevColumnLayoutOrReferenceDefinition | undefined,
        rowOrderDefinition: RevRecordRowOrderDefinition | undefined,
    ) {
        super(tableRecordSourceDefinition, columnLayoutDefinitionOrReference, rowOrderDefinition);
    }

    override saveToJson(element: JsonElement): void {
        super.saveToJson(element);
        element.setString(RevReferenceableDataSourceDefinition.ReferenceableJsonName.id, this.id);
        element.setString(RevReferenceableDataSourceDefinition.ReferenceableJsonName.name, this.name);
    }
}

/** @public */
export namespace RevReferenceableDataSourceDefinition {
    export namespace ReferenceableJsonName {
        export const id = 'revId';
        export const name = 'revName';
    }

    export const enum CreateReferenceableFromJsonErrorId {
        IdJsonValueIsNotDefined,
        IdJsonValueIsNotOfTypeString,
        NameJsonValueIsNotDefined,
        NameJsonValueIsNotOfTypeString,
        TableRecordSourceElementIsNotDefined,
        TableRecordSourceJsonValueIsNotOfTypeObject,
        TableRecordSourceTryCreate,
    }

    export interface CreateReferenceableFromJsonErrorIdPlusExtra<ErrorId extends CreateReferenceableFromJsonErrorId> {
        readonly errorId: ErrorId;
        readonly extra: string | undefined;
    }

    export interface WithLayoutError<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        definition: RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
        layoutCreateFromJsonErrorId: RevDataSourceDefinition.LayoutCreateFromJsonErrorId | undefined;
    }

    export function tryCreateReferenceableFromJson<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
        tableRecordSourceDefinitionFactory: RevTableRecordSourceDefinitionFromJsonFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        element: JsonElement,
    ): Result<
        WithLayoutError<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        CreateReferenceableFromJsonErrorIdPlusExtra<CreateReferenceableFromJsonErrorId>
    > {
        const idResult = element.tryGetString(ReferenceableJsonName.id);
        if (idResult.isErr()) {
            const idErrorId = idResult.error;
            let errorId: CreateReferenceableFromJsonErrorId;
            switch (idErrorId) {
                case JsonElement.ErrorId.JsonValueIsNotDefined:
                    errorId = CreateReferenceableFromJsonErrorId.IdJsonValueIsNotDefined;
                    break;
                case JsonElement.ErrorId.JsonValueIsNotOfTypeString:
                    errorId = CreateReferenceableFromJsonErrorId.IdJsonValueIsNotOfTypeString;
                    break;
                default:
                    throw new UnreachableCaseError('RRDSDTCRFJI60872', idErrorId);
            }
            return new Err({ errorId, extra: undefined });
        } else {
            const nameResult = element.tryGetString(ReferenceableJsonName.name);
            if (nameResult.isErr()) {
                const nameErrorId = nameResult.error;
                let errorId: CreateReferenceableFromJsonErrorId;
                switch (nameErrorId) {
                    case JsonElement.ErrorId.JsonValueIsNotDefined:
                        errorId = CreateReferenceableFromJsonErrorId.NameJsonValueIsNotDefined;
                        break;
                    case JsonElement.ErrorId.JsonValueIsNotOfTypeString:
                        errorId = CreateReferenceableFromJsonErrorId.NameJsonValueIsNotOfTypeString;
                        break;
                    default:
                        throw new UnreachableCaseError('RRDSDTCRFJN60872', nameErrorId);
                }
                return new Err({ errorId, extra: undefined });
            } else {
                const tableRecordSourceDefinitionResult = RevDataSourceDefinition.tryCreateTableRecordSourceDefinitionFromJson(
                    tableRecordSourceDefinitionFactory,
                    element,
                );
                if (tableRecordSourceDefinitionResult.isErr()) {
                    const tableRecordSourceErrorIdPlusExtra = tableRecordSourceDefinitionResult.error;
                    const tableRecordSourceErrorId = tableRecordSourceErrorIdPlusExtra.errorId;
                    let errorId: CreateReferenceableFromJsonErrorId;
                    switch (tableRecordSourceErrorId) {
                        case RevDataSourceDefinition.CreateFromJsonErrorId.TableRecordSourceElementIsNotDefined:
                            errorId = CreateReferenceableFromJsonErrorId.TableRecordSourceElementIsNotDefined;
                            break;
                        case RevDataSourceDefinition.CreateFromJsonErrorId.TableRecordSourceJsonValueIsNotOfTypeObject:
                            errorId = CreateReferenceableFromJsonErrorId.TableRecordSourceJsonValueIsNotOfTypeObject;
                            break;
                        case RevDataSourceDefinition.CreateFromJsonErrorId.TableRecordSourceTryCreate:
                            errorId = CreateReferenceableFromJsonErrorId.TableRecordSourceTryCreate;
                            break;
                        default:
                            throw new UnreachableCaseError('RRDSDTCRFJT60872', tableRecordSourceErrorId);
                    }
                    return new Err({ errorId, extra: undefined });
                } else {
                    let columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition | undefined;
                    let layoutCreateFromJsonErrorId: RevDataSourceDefinition.LayoutCreateFromJsonErrorId | undefined;
                    const columnLayoutDefinitionOrReferenceDefinitionResult = RevDataSourceDefinition.tryCreateColumnLayoutOrReferenceDefinitionFromJson(element);
                    if (columnLayoutDefinitionOrReferenceDefinitionResult.isErr()) {
                        layoutCreateFromJsonErrorId = columnLayoutDefinitionOrReferenceDefinitionResult.error;
                    } else {
                        columnLayoutOrReferenceDefinition = columnLayoutDefinitionOrReferenceDefinitionResult.value;
                    }

                    const rowOrderDefinition = RevDataSourceDefinition.tryGetRowOrderFromJson(element);

                    const definition = new RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
                        idResult.value,
                        nameResult.value,
                        tableRecordSourceDefinitionResult.value,
                        columnLayoutOrReferenceDefinition,
                        rowOrderDefinition,
                    );
                    return new Ok({ definition, layoutCreateFromJsonErrorId });
                }
            }
        }
    }

    export function is<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
        definition: RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    ): definition is RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        return definition instanceof RevReferenceableDataSourceDefinition;
    }
}
