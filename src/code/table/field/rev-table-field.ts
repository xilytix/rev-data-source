// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { HorizontalAlign } from '@xilytix/revgrid';
import {
    Integer,
    compareValue
} from '@xilytix/sysutils';
import { RevField, RevFieldDefinition, RevFieldSourceDefinition } from '../../field/internal-api';
import { RevRenderValue } from '../../render-value/internal-api';
import { RevGenericTableValue, RevTableValue, RevTableValuesRecord } from '../value/internal-api';

/** @public */
export abstract class RevTableField<RenderValueTypeId, RenderAttributeTypeId> extends RevField<RenderValueTypeId, RenderAttributeTypeId> {
    private _valueTypeId: RenderValueTypeId;

    constructor(
        protected readonly textFormatter: RevRenderValue.TextFormatter<RenderValueTypeId, RenderAttributeTypeId>,
        definition: RevTableField.Definition<RenderValueTypeId, RenderAttributeTypeId>,
        heading: string,
    ) {
        super(definition, heading);
    }

    get valueTypeId() { return this._valueTypeId; }

    compare(left: RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId>, right: RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId>): number {
        const leftValue = left.values[this.index];
        const rightValue = right.values[this.index];
        if (leftValue === rightValue) {
            return 0;
        } else {
            if (leftValue.isUndefined()) {
                if (rightValue.isUndefined()) {
                    return 0;
                } else {
                    return this.compareUndefinedToDefinedField(rightValue);
                }
            } else {
                if (rightValue.isUndefined()) {
                    return -this.compareUndefinedToDefinedField(leftValue);
                } else {
                    return this.compareDefined(leftValue, rightValue);
                }
            }
        }
    }

    compareDesc(left: RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId>, right: RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId>): number {
        const leftValue = left.values[this.index];
        const rightValue = right.values[this.index];
        if (leftValue === rightValue) {
            return 0;
        } else {
            if (leftValue.isUndefined()) {
                if (rightValue.isUndefined()) {
                    return 0;
                } else {
                    return -this.compareUndefinedToDefinedField(rightValue);
                }
            } else {
                if (rightValue.isUndefined()) {
                    return this.compareUndefinedToDefinedField(leftValue);
                } else {
                    return this.compareDefined(rightValue, leftValue);
                }
            }
        }
    }

    override getViewValue(record: RevTableValuesRecord<RenderValueTypeId, RenderAttributeTypeId>): RevRenderValue<RenderValueTypeId, RenderAttributeTypeId> {
        const tableGridValue = record.values[this.index];
        return tableGridValue.renderValue;
    }

    protected setValueTypeId(value: RenderValueTypeId) {
        this._valueTypeId = value;
    }

    protected compareUndefinedToDefinedField(definedValue: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>) {
        // left is undefined, right is defined (parameter)
        return -1;
    }

    protected abstract compareDefined(left: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>, right: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>): number;
}

/** @public */
export namespace RevTableField {
    export class Definition<RenderValueTypeId, RenderAttributeTypeId> extends RevFieldDefinition {
        constructor(
            source: RevFieldSourceDefinition,
            sourcelessName: string,
            defaultHeading: string,
            defaultTextAlign: HorizontalAlign,
            readonly gridFieldConstructor: RevTableField.Constructor<RenderValueTypeId, RenderAttributeTypeId>,
            readonly gridValueConstructor: RevTableValue.Constructor<RenderValueTypeId, RenderAttributeTypeId>,

        ) {
            super(source, sourcelessName, defaultHeading, defaultTextAlign);
        }
    }

    export type Constructor<RenderValueTypeId, RenderAttributeTypeId> = new(
        textFormatter: RevRenderValue.TextFormatter<RenderValueTypeId, RenderAttributeTypeId>,
        definition: RevTableField.Definition<RenderValueTypeId, RenderAttributeTypeId>,
        heading: string,
        index: Integer,
    ) => RevTableField<RenderValueTypeId, RenderAttributeTypeId>;
}

/** @public */
export class RevGenericTableField<DataType extends number | string, ValueClass extends RevGenericTableValue<DataType, RenderValueTypeId, RenderAttributeTypeId>, RenderValueTypeId, RenderAttributeTypeId>
    extends RevTableField<RenderValueTypeId, RenderAttributeTypeId> {

    protected compareDefined(left: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>, right: RevTableValue<RenderValueTypeId, RenderAttributeTypeId>): number {
        return compareValue<DataType>((left as ValueClass).definedData, (right as ValueClass).definedData);
    }
}
