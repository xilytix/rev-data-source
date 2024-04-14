// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { JsonElement } from '@xilytix/sysutils';

// export type RevRecordSortDefinition = RevRecordSortDefinition.Field[];

/** @public */
export namespace RevRecordSortDefinition {
    export interface Field {
        name: string;
        ascending: boolean;
    }

    /* @public */
    export namespace Field {
        namespace JsonName {
            export const name = 'name';
            export const ascending = 'ascending';
        }

        export function saveToJson(definition: Field, element: JsonElement) {
            element.setString(JsonName.name, definition.name);
            element.setBoolean(JsonName.ascending, definition.ascending);
        }

        export function tryCreateFromJson(element: JsonElement): Field | undefined {
            const nameResult = element.tryGetString(JsonName.name);
            if (nameResult.isErr()) {
                return undefined;
            } else {
                const name = nameResult.value;
                let ascending: boolean;
                const ascendingResult = element.tryGetBoolean(JsonName.ascending);
                if (ascendingResult.isErr()) {
                    ascending = true;
                } else {
                    ascending = ascendingResult.value;
                }

                return {
                    name,
                    ascending
                };
            }
        }
    }
}
