// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Err, Guid, Integer, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevGridLayoutDefinition } from './rev-grid-layout-definition';

/** @public */
export class RevReferenceableGridLayoutDefinition extends RevGridLayoutDefinition {
    constructor(
        public id: Guid,
        public name: string,
        initialColumns: RevGridLayoutDefinition.Column[],
        columnCreateErrorCount: Integer,
    ) {
        super(initialColumns, columnCreateErrorCount);
    }

    override saveToJson(element: JsonElement) {
        super.saveToJson(element);
        element.setGuid(RevReferenceableGridLayoutDefinition.ReferenceableJsonName.id, this.id);
        element.setString(RevReferenceableGridLayoutDefinition.ReferenceableJsonName.name, this.name);
    }
}

/** @public */
export namespace RevReferenceableGridLayoutDefinition {
    export namespace ReferenceableJsonName {
        export const id = 'revId';
        export const name = 'revName';
    }

    export const enum CreateReferenceableFromJsonErrorId {
        IdJsonValueIsNotDefined,
        IdJsonValueIsNotOfTypeString,
        NameJsonValueIsNotDefined,
        NameJsonValueIsNotOfTypeString,
        ColumnsElementIsNotDefined,
        ColumnsElementIsNotAnArray,
        ColumnElementIsNotAnObject,
        AllColumnElementsAreInvalid,
    }

    export function tryCreateReferenceableFromJson(element: JsonElement): Result<RevReferenceableGridLayoutDefinition, CreateReferenceableFromJsonErrorId> {
        const idResult = element.tryGetGuid(ReferenceableJsonName.id);
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
                    throw new UnreachableCaseError('RRGLDTCRFJI60872', idErrorId);
            }
            return new Err(errorId);
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
                        throw new UnreachableCaseError('RRGLDTCRFJI60872', nameErrorId);
                }
                return new Err(errorId);
            } else {
                const columnsResult = RevGridLayoutDefinition.tryCreateColumnsFromJson(element);
                if (columnsResult.isErr()) {
                    const columnsErrorId = columnsResult.error;
                    let errorId: CreateReferenceableFromJsonErrorId;
                    switch (columnsErrorId) {
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotDefined:
                            errorId = CreateReferenceableFromJsonErrorId.ColumnsElementIsNotDefined;
                            break;
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotAnArray:
                            errorId = CreateReferenceableFromJsonErrorId.ColumnsElementIsNotAnArray;
                            break;
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.ColumnElementIsNotAnObject:
                            errorId = CreateReferenceableFromJsonErrorId.ColumnElementIsNotAnObject;
                            break;
                        case RevGridLayoutDefinition.CreateFromJsonErrorId.AllColumnElementsAreInvalid:
                            errorId = CreateReferenceableFromJsonErrorId.AllColumnElementsAreInvalid;
                            break;
                            default:
                                throw new UnreachableCaseError('RRGLDTCRFJC60872', columnsErrorId);
                    }
                    return new Err(errorId);
                } else {
                    const columnsCreatedFromJson = columnsResult.value;
                    const definition = new RevReferenceableGridLayoutDefinition(idResult.value, nameResult.value, columnsCreatedFromJson.columns, columnsCreatedFromJson.columnCreateErrorCount);
                    return new Ok(definition);
                }
            }
        }
    }

    export function is(definition: RevGridLayoutDefinition): definition is RevReferenceableGridLayoutDefinition {
        return 'name' in definition;
    }
}
