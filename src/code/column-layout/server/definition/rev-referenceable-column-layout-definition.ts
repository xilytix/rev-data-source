// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Err, Guid, Integer, JsonElement, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from './rev-column-layout-definition';

/** @public */
export class RevReferenceableColumnLayoutDefinition extends RevColumnLayoutDefinition {
    constructor(
        public id: Guid,
        public name: string,
        initialColumns: RevColumnLayoutDefinition.Column[],
        columnCreateErrorCount: Integer,
    ) {
        super(initialColumns, columnCreateErrorCount);
    }

    override saveToJson(element: JsonElement) {
        super.saveToJson(element);
        element.setGuid(RevReferenceableColumnLayoutDefinition.ReferenceableJsonName.id, this.id);
        element.setString(RevReferenceableColumnLayoutDefinition.ReferenceableJsonName.name, this.name);
    }
}

/** @public */
export namespace RevReferenceableColumnLayoutDefinition {
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

    export function tryCreateReferenceableFromJson(element: JsonElement): Result<RevReferenceableColumnLayoutDefinition, CreateReferenceableFromJsonErrorId> {
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
                const columnsResult = RevColumnLayoutDefinition.tryCreateColumnsFromJson(element);
                if (columnsResult.isErr()) {
                    const columnsErrorId = columnsResult.error;
                    let errorId: CreateReferenceableFromJsonErrorId;
                    switch (columnsErrorId) {
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotDefined:
                            errorId = CreateReferenceableFromJsonErrorId.ColumnsElementIsNotDefined;
                            break;
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.ColumnsElementIsNotAnArray:
                            errorId = CreateReferenceableFromJsonErrorId.ColumnsElementIsNotAnArray;
                            break;
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.ColumnElementIsNotAnObject:
                            errorId = CreateReferenceableFromJsonErrorId.ColumnElementIsNotAnObject;
                            break;
                        case RevColumnLayoutDefinition.CreateFromJsonErrorId.AllColumnElementsAreInvalid:
                            errorId = CreateReferenceableFromJsonErrorId.AllColumnElementsAreInvalid;
                            break;
                            default:
                                throw new UnreachableCaseError('RRGLDTCRFJC60872', columnsErrorId);
                    }
                    return new Err(errorId);
                } else {
                    const columnsCreatedFromJson = columnsResult.value;
                    const definition = new RevReferenceableColumnLayoutDefinition(idResult.value, nameResult.value, columnsCreatedFromJson.columns, columnsCreatedFromJson.columnCreateErrorCount);
                    return new Ok(definition);
                }
            }
        }
    }

    export function is(definition: RevColumnLayoutDefinition): definition is RevReferenceableColumnLayoutDefinition {
        return 'name' in definition;
    }
}
