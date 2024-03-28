// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export interface RevRenderValue<TypeId, AttributeTypeId> {
    readonly typeId: TypeId;
    readonly attributes: readonly RevRenderValue.Attribute<AttributeTypeId>[];

    addAttribute(value: RevRenderValue.Attribute<AttributeTypeId>): void;
    setAttributes(value: RevRenderValue.Attribute<AttributeTypeId>[]): void;

    isUndefined(): boolean
}

/** @public */
export namespace RevRenderValue {
    export interface Attribute<TypeId> {
        readonly typeId: TypeId;
    }

    export interface TextFormatter<RenderValueTypeId, RenderAttributeTypeId> {
        formatRenderValue(renderValue: RevRenderValue<RenderValueTypeId, RenderAttributeTypeId>): string;
    }
}
