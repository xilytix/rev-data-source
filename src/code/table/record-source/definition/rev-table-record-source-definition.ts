/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { JsonElement } from '@xilytix/sysutils';
import { RevAllowedField, RevField, RevFieldCustomHeadingsService } from '../../../field/internal-api';
import { RevGridLayoutDefinition } from '../../../grid-layout/internal-api';
import { RevTableFieldSourceDefinitionCachingFactoryService } from '../../field-source/internal-api';

/** @public */
export abstract class RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
    constructor(
        private readonly _customHeadingsService: RevFieldCustomHeadingsService,
        readonly tableFieldSourceDefinitionCachingFactoryService: RevTableFieldSourceDefinitionCachingFactoryService<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        readonly typeId: TypeId,
        readonly name: string,
        readonly allowedFieldSourceDefinitionTypeIds: readonly TableFieldSourceDefinitionTypeId[],
    ) {
    }

    createAllowedFields(): readonly RevAllowedField<RenderValueTypeId, RenderAttributeTypeId>[] {
        const tableFieldSourceDefinitionCachingFactoryService = this.tableFieldSourceDefinitionCachingFactoryService;
        const customHeadingsService = this._customHeadingsService;
        let result: RevAllowedField<RenderValueTypeId, RenderAttributeTypeId>[] = [];
        for (const allowedFieldSourceDefinitionTypeId of this.allowedFieldSourceDefinitionTypeIds) {
            const fieldSourceDefinition = tableFieldSourceDefinitionCachingFactoryService.get(allowedFieldSourceDefinitionTypeId);
            const fieldCount = fieldSourceDefinition.fieldCount;
            const fieldDefinitions = fieldSourceDefinition.fieldDefinitions;
            const sourceAllowedFields = new Array<RevAllowedField<RenderValueTypeId, RenderAttributeTypeId>>(fieldCount);
            for (let i = 0; i < fieldCount; i++) {
                const fieldDefinition = fieldDefinitions[i];
                const heading = RevField.generateHeading(customHeadingsService, fieldDefinition);

                sourceAllowedFields[i] = new RevAllowedField(
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
