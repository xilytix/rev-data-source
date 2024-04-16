// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, Err, Guid, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from './rev-column-layout-definition';

/** @public */
export class RevColumnLayoutOrReferenceDefinition {
    readonly referenceId: Guid | undefined;
    readonly columnLayoutDefinition: RevColumnLayoutDefinition | undefined;

    constructor(definitionOrReferenceId: RevColumnLayoutDefinition | Guid) {
        if (typeof definitionOrReferenceId === 'string') {
            this.referenceId = definitionOrReferenceId;
        } else {
            this.columnLayoutDefinition = definitionOrReferenceId;
        }
    }

    saveToJson(element: JsonElement) {
        if (this.referenceId !== undefined) {
            element.setString(RevColumnLayoutOrReferenceDefinition.JsonName.referenceId, this.referenceId);
        } else {
            if (this.columnLayoutDefinition !== undefined) {
                const columnLayoutDefinitionElement = element.newElement(RevColumnLayoutOrReferenceDefinition.JsonName.columnLayoutDefinition);
                this.columnLayoutDefinition.saveToJson(columnLayoutDefinitionElement);
            } else {
                throw new AssertInternalError('GLDONRSTJ34445');
            }
        }
    }
}

/** @public */
export namespace RevColumnLayoutOrReferenceDefinition {
    export namespace JsonName {
        export const referenceId = 'revReferenceId';
        export const columnLayoutDefinition = 'revColumnLayoutDefinition';
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

    export function tryCreateFromJson(element: JsonElement): Result<RevColumnLayoutOrReferenceDefinition, CreateFromJsonErrorId> {
        const referenceIdResult = element.tryGetString(JsonName.referenceId);
        if (referenceIdResult.isOk()) {
            const referenceId = referenceIdResult.value;
            const columnLayoutOrReferenceDefinition = new RevColumnLayoutOrReferenceDefinition(referenceId);
            return new Ok(columnLayoutOrReferenceDefinition);
        } else {
            const definitionElementResult = element.tryGetElement(JsonName.columnLayoutDefinition);
            if (definitionElementResult.isOk()) {
                const definitionElement = definitionElementResult.value;
                const definitionResult = RevColumnLayoutDefinition.tryCreateFromJson(definitionElement);
                if (definitionResult.isOk()) {
                    const columnLayoutOrReferenceDefinition = new RevColumnLayoutOrReferenceDefinition(definitionResult.value);
                    return new Ok(columnLayoutOrReferenceDefinition);
                } else {
                    const definitionErrorId = definitionResult.error;
                    let createFromJsonErrorId: CreateFromJsonErrorId;
                    switch (definitionErrorId) {
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotDefined:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionColumnsElementIsNotDefined;
                            break;
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotAnArray:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionColumnsElementIsNotAnArray;
                            break;
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.ColumnElementIsNotAnObject:
                            createFromJsonErrorId = CreateFromJsonErrorId.DefinitionColumnElementIsNotAnObject;
                            break;
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.AllColumnElementsAreInvalid:
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
