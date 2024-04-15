// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { JsonElement } from '@xilytix/sysutils';
import { RevGridLayoutDefinition } from '../../../column-order/internal-api';
import { RevAllowedSourcedField, RevSourcedField, RevSourcedFieldCustomHeadingsService } from '../../../sourced-field/internal-api';
import { RevTableFieldSourceDefinitionCachingFactoryService } from '../../field-source/internal-api';

/** @public */
export abstract class RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    constructor(
        private readonly _customHeadingsService: RevSourcedFieldCustomHeadingsService,
        readonly tableFieldSourceDefinitionCachingFactoryService: RevTableFieldSourceDefinitionCachingFactoryService<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        readonly typeId: TypeId,
        readonly name: string,
        readonly allowedFieldSourceDefinitionTypeIds: readonly TableFieldSourceDefinitionTypeId[],
    ) {
    }

    createAllowedFields(): readonly RevAllowedSourcedField<RenderValueTypeId, RenderAttributeTypeId>[] {
        const tableFieldSourceDefinitionCachingFactoryService = this.tableFieldSourceDefinitionCachingFactoryService;
        const customHeadingsService = this._customHeadingsService;
        let result: RevAllowedSourcedField<RenderValueTypeId, RenderAttributeTypeId>[] = [];
        for (const allowedFieldSourceDefinitionTypeId of this.allowedFieldSourceDefinitionTypeIds) {
            const fieldSourceDefinition = tableFieldSourceDefinitionCachingFactoryService.get(allowedFieldSourceDefinitionTypeId);
            const fieldCount = fieldSourceDefinition.fieldCount;
            const fieldDefinitions = fieldSourceDefinition.fieldDefinitions;
            const sourceAllowedFields = new Array<RevAllowedSourcedField<RenderValueTypeId, RenderAttributeTypeId>>(fieldCount);
            for (let i = 0; i < fieldCount; i++) {
                const fieldDefinition = fieldDefinitions[i];
                const heading = RevSourcedField.generateHeading(customHeadingsService, fieldDefinition);

                sourceAllowedFields[i] = new RevAllowedSourcedField(
                    fieldDefinition,
                    heading,
                );
            }
            result = [...result, ...sourceAllowedFields];
        }
        return result;
    }

    // createLayoutDefinition(fieldIds: TableFieldSourceDefinition.FieldId[]): GridLayoutDefinition {
    //     const fieldSourceDefinitionRegistryService = this.fieldSourceDefinitionRegistryService;
    //     const count = fieldIds.length;
    //     const fieldNames = new Array<string>(count);
    //     for (let i = 0; i < count; i++) {
    //         const fieldId = fieldIds[i];
    //         const fieldSourceDefinition = fieldSourceDefinitionRegistryService.get(fieldId.sourceTypeId);
    //         const fieldName = fieldSourceDefinition.getFieldNameById(fieldId.id);
    //         fieldNames[i] = fieldName;
    //     }

    //     return GridLayoutDefinition.createFromFieldNames(fieldNames);
    // }


    saveToJson(element: JsonElement) { // virtual;
        element.setString(RevTableRecordSourceDefinition.jsonTag_TypeId, this.name);
    }

    abstract createDefaultLayoutDefinition(): RevGridLayoutDefinition;
}

/** @public */
export namespace RevTableRecordSourceDefinition {
    export const jsonTag_TypeId = 'recordSourceDefinitionTypeId';

    export function tryGetTypeIdNameFromJson(element: JsonElement) {
        return element.tryGetString(jsonTag_TypeId);
    }
}
