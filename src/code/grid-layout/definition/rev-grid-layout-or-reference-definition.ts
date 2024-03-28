// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, Err, Guid, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevGridLayoutDefinition } from './rev-grid-layout-definition';

/** @public */
export class RevGridLayoutOrReferenceDefinition {
    readonly referenceId: Guid | undefined;
    readonly gridLayoutDefinition: RevGridLayoutDefinition | undefined;

    constructor(definitionOrReferenceId: RevGridLayoutDefinition | Guid) {
        if (typeof definitionOrReferenceId === 'string') {
            this.referenceId = definitionOrReferenceId;
        } else {
            this.gridLayoutDefinition = definitionOrReferenceId;
        }
    }

    saveToJson(element: JsonElement) {
        if (this.referenceId !== undefined) {
            element.setString(RevGridLayoutOrReferenceDefinition.JsonName.referenceId, this.referenceId);
        } else {
            if (this.gridLayoutDefinition !== undefined) {
                const gridLayoutDefinitionElement = element.newElement(RevGridLayoutOrReferenceDefinition.JsonName.gridLayoutDefinition);
                this.gridLayoutDefinition.saveToJson(gridLayoutDefinitionElement);
            } else {
                throw new AssertInternalError('GLDONRSTJ34445');
            }
        }
    }
}

/** @public */
export namespace RevGridLayoutOrReferenceDefinition {
    export namespace JsonName {
        export const referenceId = 'revReferenceId';
        export const gridLayoutDefinition = 'revGridLayoutDefinition';
    }

    export const enum CreateFromJsonErrorId {
        NeitherReferenceOrDefinitionJsonValueIsDefined,
        BothReferenceAndDefinitionJsonValuesAreOfWrongType,
        DefinitionJsonValueIsNotOfTypeObject,
        DefinitionColumnsElementIsNotDefined,
        DefinitionColumnsElementIsNotAnArray,
        DefinitionColumnElementIsNotAnObject,
        DefinitionAllColumnElementsAreInvalid,
    }

    export function tryCreateFromJson(element: JsonElement): Result<RevGridLayoutOrReferenceDefinition, CreateFromJsonErrorId> {
        const referenceIdResult = element.tryGetString(JsonName.referenceId);
        if (referenceIdResult.isOk()) {
            const referenceId = referenceIdResult.value;
            const gridLayoutOrReferenceDefinition = new RevGridLayoutOrReferenceDefinition(referenceId);
            return new Ok(gridLayoutOrReferenceDefinition);
        } else {
            const definitionElementResult = element.tryGetElement(JsonName.gridLayoutDefinition);
            if (definitionElementResult.isOk()) {
                const definitionElement = definitionElementResult.value;
                const definitionResult = RevGridLayoutDefinition.tryCreateFromJson(definitionElement);
                if (definitionResult.isOk()) {
                    const gridLayoutOrReferenceDefinition = new RevGridLayoutOrReferenceDefinition(definitionResult.value);
                    return new Ok(gridLayoutOrReferenceDefinition);
                } else {
                    const definitionErrorId = definitionResult.error;
                    let createFromJsonErrorId: CreateFromJsonErrorId;
                    switch (definitionErrorId) {
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotDefined:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionColumnsElementIsNotDefined;
                            break;
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotAnArray:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionColumnsElementIsNotAnArray;
                            break;
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.ColumnElementIsNotAnObject:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionColumnElementIsNotAnObject;
                            break;
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.AllColumnElementsAreInvalid:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionAllColumnElementsAreInvalid;
                            break;
                        default:
                            throw new UnreachableCaseError('RGLORDTCFDJD67112', definitionErrorId);
                    }
                    return new Err(createFromJsonErrorId);
                }
            } else {
                const referenceIdErrorId = referenceIdResult.error;
                const definitionElementErrorId = definitionElementResult.error;
                let createFromJsonErrorId: CreateFromJsonErrorId;
                switch (referenceIdErrorId) {
                    case JsonElement.ErrorId.JsonValueIsNotDefined:
                        switch (definitionElementErrorId) {
                            case JsonElement.ErrorId.ElementIsNotDefined:
                                createFromJsonErrorId = CreateFromJsonErrorId.NeitherReferenceOrDefinitionJsonValueIsDefined;
                                break;
                            case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                                createFromJsonErrorId = CreateFromJsonErrorId.DefinitionJsonValueIsNotOfTypeObject;
                                break;
                            default:
                                throw new UnreachableCaseError('RGLORDTCFDJRDD67112', definitionElementErrorId);
                        }
                        break;
                    case JsonElement.ErrorId.JsonValueIsNotOfTypeString:
                        switch (definitionElementErrorId) {
                            case JsonElement.ErrorId.ElementIsNotDefined:
                                createFromJsonErrorId = CreateFromJsonErrorId.NeitherReferenceOrDefinitionJsonValueIsDefined;
                                break;
                            case JsonElement.ErrorId.JsonValueIsNotOfTypeObject:
                                createFromJsonErrorId = CreateFromJsonErrorId.BothReferenceAndDefinitionJsonValuesAreOfWrongType;
                                break;
                            default:
                                throw new UnreachableCaseError('RGLORDTCFDJRDS67112', definitionElementErrorId);
                        }
                        break;
                    default:
                        throw new UnreachableCaseError('RGLORDTCFJR67112', referenceIdErrorId);
                }
                return new Err(createFromJsonErrorId);
            }
        }
    }
}
