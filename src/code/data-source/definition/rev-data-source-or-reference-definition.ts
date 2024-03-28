/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { AssertInternalError, Err, Guid, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevGridLayoutOrReferenceDefinition } from '../../grid-layout/internal-api';
import { RevTableRecordSourceDefinitionFromJsonFactory } from '../../table/internal-api';
import { RevDataSourceDefinition } from './rev-data-source-definition';

/** @public */
export class RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    readonly referenceId: Guid | undefined;
    readonly dataSourceDefinition: RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> | undefined;

    constructor(dataSourceDefinitionOrReferenceId: RevDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> | Guid) {
        if (typeof dataSourceDefinitionOrReferenceId === 'string') {
            this.referenceId = dataSourceDefinitionOrReferenceId;
        } else {
            this.dataSourceDefinition = dataSourceDefinitionOrReferenceId;
        }
    }

    saveToJson(element: JsonElement) {
        if (this.referenceId !== undefined) {
            element.setString(RevDataSourceOrReferenceDefinition.JsonName.referenceId, this.referenceId);
        } else {
            if (this.dataSourceDefinition !== undefined) {
                const dataSourceDefinitionElement = element.newElement(RevDataSourceOrReferenceDefinition.JsonName.dataSourceDefinition);
                this.dataSourceDefinition.saveToJson(dataSourceDefinitionElement);
            } else {
                throw new AssertInternalError('GSDONRSTJ34445');
            }
        }
    }

    canUpdateGridLayoutDefinitionOrReference(): boolean {
        return this.dataSourceDefinition !== undefined;
    }

    updateGridLayoutDefinitionOrReference(value: RevGridLayoutOrReferenceDefinition) {
        if (this.dataSourceDefinition === undefined) {
            throw new AssertInternalError('GSDONRS45000');
        } else {
            this.dataSourceDefinition.gridLayoutOrReferenceDefinition = value;
        }
    }
}

/** @public */
export namespace RevDataSourceOrReferenceDefinition {
    export namespace JsonName {
        export const referenceId = 'revReferenceId';
        export const dataSourceDefinition = 'revDataSourceDefinition';
    }

    export interface SaveAsDefinition {
        // name undefined => private
        // id defined && name defined => overwrite reference
        // id undefined && name defined => new reference
        readonly id: string | undefined;
        readonly name: string | undefined;
        readonly tableRecordSourceOnly: boolean;
    }

    export const enum CreateFromJsonErrorId {
        NeitherReferenceOrDefinitionJsonValueIsDefined,
        BothReferenceAndDefinitionJsonValuesAreOfWrongType,
        DefinitionJsonValueIsNotOfTypeObject,
        TableRecordSourceElementIsNotDefined,
        TableRecordSourceJsonValueIsNotOfTypeObject,
        TableRecordSourceTryCreate,
    }

    export interface WithLayoutError<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        definition: RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
        layoutCreateFromJsonErrorId: RevDataSourceDefinition.LayoutCreateFromJsonErrorId | undefined;
    }

    export interface CreateFromJsonErrorIdPlusExtra<ErrorId extends CreateFromJsonErrorId> {
        readonly errorId: ErrorId;
        readonly extra: string | undefined;
    }

    export function tryCreateFromJson<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
        tableRecordSourceDefinitionFromJsonFactory: RevTableRecordSourceDefinitionFromJsonFactory<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        element: JsonElement
    ): Result<
        WithLayoutError<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        CreateFromJsonErrorIdPlusExtra<CreateFromJsonErrorId>
    > {
        const referenceIdResult = element.tryGetString(JsonName.referenceId);
        if (referenceIdResult.isOk()) {
            const referenceId = referenceIdResult.value;
            const definition = new RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(referenceId);
            return new Ok({ definition, layoutCreateFromJsonErrorId: undefined });
        } else {
            const definitionElementResult = element.tryGetElement(JsonName.dataSourceDefinition);
            if (definitionElementResult.isOk()) {
                const definitionElement = definitionElementResult.value;
                const definitionResult = RevDataSourceDefinition.tryCreateFromJson(
                    tableRecordSourceDefinitionFromJsonFactory,
                    definitionElement
                );
                if (definitionResult.isOk()) {
                    const definitionWithLayoutError = definitionResult.value;
                    const definition = new RevDataSourceOrReferenceDefinition<
                        TableRecordSourceDefinitionTypeId,
                        TableFieldSourceDefinitionTypeId,
                        RenderValueTypeId,
                        RenderAttributeTypeId
                    >(definitionWithLayoutError.definition);

                    return new Ok({ definition, layoutCreateFromJsonErrorId: definitionWithLayoutError.layoutCreateFromJsonErrorId });
                } else {
                    const definitionErrorIdPlusExtra = definitionResult.error;
                    const definitionErrorId = definitionErrorIdPlusExtra.errorId;
                    let errorId: CreateFromJsonErrorId;
                    switch (definitionErrorId) {
                        case RevDataSourceDefinition.CreateFromJsonErrorId.TableRecordSourceElementIsNotDefined:
                            errorId = CreateFromJsonErrorId.TableRecordSourceElementIsNotDefined;
                            break;
                        case RevDataSourceDefinition.CreateFromJsonErrorId.TableRecordSourceJsonValueIsNotOfTypeObject:
                            errorId = CreateFromJsonErrorId.TableRecordSourceJsonValueIsNotOfTypeObject;
                            break;
                        case RevDataSourceDefinition.CreateFromJsonErrorId.TableRecordSourceTryCreate:
                            errorId = CreateFromJsonErrorId.TableRecordSourceTryCreate;
                            break;
                    }
                    return new Err({ errorId, extra: definitionErrorIdPlusExtra.extra })
                }
            } else {
                const referenceIdErrorId = referenceIdResult.error;
                const definitionElementErrorId = definitionElementResult.error;
                let errorId: CreateFromJsonErrorId;
                switch (referenceIdErrorId) {
                    case JsonElement.ErrorId.JsonValueIsNotDefined:
                        switch (definitionElementErrorId) {
                            case JsonElement.ErrorId.ElementIsNotDefined:
                                errorId = CreateFromJsonErrorId.NeitherReferenceOrDefinitionJsonValueIsDefined;
                                break;
                            case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                                errorId = CreateFromJsonErrorId.DefinitionJsonValueIsNotOfTypeObject;
                                break;
                            default:
                                throw new UnreachableCaseError('RDSORDTCFDJRDD67112', definitionElementErrorId);
                        }
                        break;
                    case JsonElement.ErrorId.JsonValueIsNotOfTypeString:
                        switch (definitionElementErrorId) {
                            case JsonElement.ErrorId.ElementIsNotDefined:
                                errorId = CreateFromJsonErrorId.NeitherReferenceOrDefinitionJsonValueIsDefined;
                                break;
                            case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                                errorId = CreateFromJsonErrorId.BothReferenceAndDefinitionJsonValuesAreOfWrongType;
                                break;
                            default:
                                throw new UnreachableCaseError('RDSORDTCFDJRDS67112', definitionElementErrorId);
                        }
                        break;
                    default:
                        throw new UnreachableCaseError('RDSORDTCFJR67112', referenceIdErrorId);
                }
                return new Err({errorId, extra: undefined });
            }
        }
    }
}
