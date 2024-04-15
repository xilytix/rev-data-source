// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, JsonElement } from '@xilytix/sysutils';
import { RevRecordDefinition } from './rev-record-definition';
import { RevRecordSortDefinition } from './rev-record-sort-definition';

/** @public */
export class RevRecordRowOrderDefinition {
    constructor(
        readonly sortFields: RevRecordSortDefinition.Field[] | undefined,
        readonly recordDefinitions: RevRecordDefinition[] | undefined,
    ) {
        if (recordDefinitions !== undefined) {
            throw new AssertInternalError('GRODC45552'); // currently not supported
        }
    }

    saveToJson(element: JsonElement) {
        if (this.sortFields !== undefined) {
            RevRecordRowOrderDefinition.saveSortFieldsToJson(this.sortFields, element);
        }
    }
}

/** @public */
export namespace RevRecordRowOrderDefinition {
    export namespace JsonName {
        export const sortFields = 'revSortFields';
    }

    export function tryCreateSortFieldsFromJson(element: JsonElement): RevRecordSortDefinition.Field[] | undefined {
        const sortFieldElementsResult = element.tryGetElementArray(JsonName.sortFields);
        if (sortFieldElementsResult.isErr()) {
            return undefined;
        } else {
            const sortFieldElements = sortFieldElementsResult.value;
            const maxCount = sortFieldElements.length;
            const sortFields = new Array<RevRecordSortDefinition.Field>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const sortFieldElement = sortFieldElements[i];
                const sortField = RevRecordSortDefinition.Field.tryCreateFromJson(sortFieldElement);
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

    export function saveSortFieldsToJson(sortFields: RevRecordSortDefinition.Field[], element: JsonElement) {
        const count = sortFields.length;
        const sortFieldElements = new Array<JsonElement>(count);
        for (let i = 0; i < count; i++) {
            const sortField = sortFields[i];
            const sortFieldElement = new JsonElement();
            RevRecordSortDefinition.Field.saveToJson(sortField, sortFieldElement);
            sortFieldElements[i] = sortFieldElement;
        }
        element.setElementArray(JsonName.sortFields, sortFieldElements);
    }

    export function createFromJson(element: JsonElement): RevRecordRowOrderDefinition {
        const sortFields = tryCreateSortFieldsFromJson(element);
        return new RevRecordRowOrderDefinition(sortFields, undefined);
    }
}
