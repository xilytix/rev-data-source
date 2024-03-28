// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { DataServer, RevRecordField } from '@xilytix/revgrid';
import {
    AssertInternalError,
    IndexedRecord,
    Integer
} from '@xilytix/sysutils';
import { RevRenderValue } from '../render-value/internal-api';
import { RevFieldCustomHeadingsService } from './rev-field-custom-headings-service';
import { RevFieldDefinition } from './rev-field-definition';

/** @public */
export abstract class RevField<RenderValueTypeId, RenderAttributeTypeId> implements RevRecordField {
    readonly name: string;
    index: Integer;
    heading: string;

    getEditValueEventer: RevField.GetEditValueEventer | undefined;
    setEditValueEventer: RevField.SetEditValueEventer | undefined;

    constructor(readonly definition: RevFieldDefinition, heading?: string) {
        this.name = definition.name;
        this.heading = heading ?? definition.defaultHeading;
    }

    getEditValue(record: IndexedRecord): DataServer.EditValue {
        if (this.getEditValueEventer === undefined) {
            throw new AssertInternalError('GFGEV20814');
        } else {
            return this.getEditValueEventer(record);
        }
    }

    setEditValue(record: IndexedRecord, value: DataServer.EditValue) {
        if (this.setEditValueEventer === undefined) {
            throw new AssertInternalError('GFSEV20814');
        } else {
            this.setEditValueEventer(record, value);
        }
    }

    abstract getViewValue(record: IndexedRecord): RevRenderValue<RenderValueTypeId, RenderAttributeTypeId>;
}

/** @public */
export namespace RevField {
    export type GetEditValueEventer = (this: void, record: IndexedRecord) => DataServer.EditValue;
    export type SetEditValueEventer = (this: void, record: IndexedRecord, value: DataServer.EditValue) => void;

    export function generateHeading(customHeadingsService: RevFieldCustomHeadingsService, fieldDefinition: RevFieldDefinition) {
        const customHeading = customHeadingsService.tryGetFieldHeading(fieldDefinition.name, fieldDefinition.sourcelessName);
        if (customHeading !== undefined) {
            return customHeading;
        } else {
            return fieldDefinition.defaultHeading;
        }
    }
}
