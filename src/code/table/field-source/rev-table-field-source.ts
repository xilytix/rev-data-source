/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { Integer } from '@xilytix/sysutils';
import { RevField, RevFieldCustomHeadingsService } from '../../field/internal-api';
import { RevRenderValue } from '../../render-value/internal-api';
import { RevTableField } from '../field/internal-api';
import { RevTableFieldSourceDefinition } from './definition/internal-api';

/** @public */
export class RevTableFieldSource<TypeId, RenderValueTypeId, RenderAttributeTypeId> {
    fieldIndexOffset: Integer;
    nextFieldIndexOffset: Integer;

    constructor(
        private readonly _textFormatter: RevRenderValue.TextFormatter<RenderValueTypeId, RenderAttributeTypeId>,
        private readonly _customHeadingsService: RevFieldCustomHeadingsService,
        public readonly definition: RevTableFieldSourceDefinition<TypeId, RenderValueTypeId, RenderAttributeTypeId>,
        private _headingPrefix: string // This might be for call/put
    ) { }

    get name(): string { return this.definition.name; }
    get fieldCount(): Integer { return this.definition.fieldCount; }

    createTableFields(): RevTableField<RenderValueTypeId, RenderAttributeTypeId>[] {
        const fieldCount = this.definition.fieldCount;
        const fieldIndexOffset = this.fieldIndexOffset;
        const fieldDefinitions = this.definition.fieldDefinitions;
        const result = new Array<RevTableField<RenderValueTypeId, RenderAttributeTypeId>>(fieldCount);
        for (let i = 0; i < fieldCount; i++) {
            const fieldDefinition = fieldDefinitions[i];
            const heading = RevField.generateHeading(this._customHeadingsService, fieldDefinition);

            result[i] = new fieldDefinition.gridFieldConstructor(
                this._textFormatter,
                fieldDefinition,
                heading,
                fieldIndexOffset + i,
            );
        }
        return result;
    }
}
