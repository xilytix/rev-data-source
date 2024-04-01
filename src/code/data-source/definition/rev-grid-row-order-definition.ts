// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, JsonElement } from '@xilytix/sysutils';
import { RevGridSortDefinition } from '../../grid-layout/internal-api';
import { RevTableRecordDefinition } from '../../table/internal-api';

/** @public */
export class RevGridRowOrderDefinition<TableFieldSourceDefinitionTypeId> {
    constructor(
        readonly sortFields: RevGridSortDefinition.Field[] | undefined,
        readonly recordDefinitions: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>[] | undefined,
    ) {
        if (recordDefinitions !== undefined) {
            throw new AssertInternalError('GRODC45552'); // currently not supported
        }
    }

    saveToJson(element: JsonElement) {
        if (this.sortFields !== undefined) {
            RevGridRowOrderDefinition.saveSortFieldsToJson(this.sortFields, element);
        }
    }
}

/** @public */
export namespace RevGridRowOrderDefinition {
    export namespace JsonName {
        export const sortFields = 'revSortFields';
    }

    export function tryCreateSortFieldsFromJson(element: JsonElement): RevGridSortDefinition.Field[] | undefined {
        const sortFieldElementsResult = element.tryGetElementArray(JsonName.sortFields);
        if (sortFieldElementsResult.isErr()) {
            return undefined;
        } else {
            const sortFieldElements = sortFieldElementsResult.value;
            const maxCount = sortFieldElements.length;
            const sortFields = new Array<RevGridSortDefinition.Field>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const sortFieldElement = sortFieldElements[i];
                const sortField = RevGridSortDefinition.Field.tryCreateFromJson(sortFieldElement);
                if (sortField === undefined) {
                    break;
                } else {
                    sortFields[count++] = sortField;
                }
            }

            if (count === 0) {
                return undefined;
            } else {
                sortFields.length = count;
                return sortFields;
            }
        }
    }

    export function saveSortFieldsToJson(sortFields: RevGridSortDefinition.Field[], element: JsonElement) {
        const count = sortFields.length;
        const sortFieldElements = new Array<JsonElement>(count);
        for (let i = 0; i < count; i++) {
            const sortField = sortFields[i];
            const sortFieldElement = new JsonElement();
            RevGridSortDefinition.Field.saveToJson(sortField, sortFieldElement);
            sortFieldElements[i] = sortFieldElement;
        }
        element.setElementArray(JsonName.sortFields, sortFieldElements);
    }

    export function createFromJson<TableFieldSourceDefinitionTypeId>(element: JsonElement): RevGridRowOrderDefinition<TableFieldSourceDefinitionTypeId> {
        const sortFields = tryCreateSortFieldsFromJson(element);
        return new RevGridRowOrderDefinition<TableFieldSourceDefinitionTypeId>(sortFields, undefined);
    }
}
