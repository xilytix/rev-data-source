// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { DataServer, HorizontalAlignEnum } from '@xilytix/revgrid';
import {
    AssertInternalError,
    EnumInfoOutOfOrderError,
    IndexedRecord,
    Integer
} from '@xilytix/sysutils';
import { RevRecordField } from '../record/internal-api';
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

    export const enum FieldId {
        Name,
        Heading,
        SourceName,
        DefaultHeading,
        DefaultTextAlign,
        DefaultWidth,
    }

    export namespace Field {
        export type Id = FieldId;

        interface Info {
            readonly id: Id;
            readonly name: string;
            readonly horizontalAlign: HorizontalAlignEnum;
        }

        type InfosObject = { [id in keyof typeof FieldId]: Info };

        const infosObject: InfosObject = {
            Name: {
                id: FieldId.Name,
                name: 'Name',
                horizontalAlign: HorizontalAlignEnum.left,
            },
            Heading: {
                id: FieldId.Heading,
                name: 'Heading',
                horizontalAlign: HorizontalAlignEnum.left,
            },
            SourceName: {
                id: FieldId.SourceName,
                name: 'SourceName',
                horizontalAlign: HorizontalAlignEnum.left,
            },
            DefaultHeading: {
                id: FieldId.DefaultHeading,
                name: 'DefaultHeading',
                horizontalAlign: HorizontalAlignEnum.left,
            },
            DefaultTextAlign: {
                id: FieldId.DefaultTextAlign,
                name: 'DefaultTextAlign',
                horizontalAlign: HorizontalAlignEnum.left,
            },
            DefaultWidth: {
                id: FieldId.DefaultWidth,
                name: 'DefaultWidth',
                horizontalAlign: HorizontalAlignEnum.right,
            },
        } as const;

        const infos = Object.values(infosObject);
        export const idCount = infos.length;

        export function checkOrder() {
            for (let i = 0; i < idCount; i++) {
                const info = infos[i];
                if (info.id !== i as FieldId) {
                    throw new EnumInfoOutOfOrderError('RevField.FieldId', i, idToName(i));
                }
            }
        }

        checkOrder();

        export function idToName(id: Id) {
            return infos[id].name;
        }

        export function idToHorizontalAlign(id: Id) {
            return infos[id].horizontalAlign;
        }
    }

    export function generateHeading(customHeadingsService: RevFieldCustomHeadingsService, fieldDefinition: RevFieldDefinition) {
        const customHeading = customHeadingsService.tryGetFieldHeading(fieldDefinition.name, fieldDefinition.sourcelessName);
        if (customHeading !== undefined) {
            return customHeading;
        } else {
            return fieldDefinition.defaultHeading;
        }
    }
}
