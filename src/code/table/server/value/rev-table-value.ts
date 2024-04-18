// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevRenderValue } from '../../../render-value/internal-api';

/** @public */
export abstract class RevTableValue<RenderValueTypeId, RenderAttributeTypeId> {
    private _renderValue: RevRenderValue<RenderValueTypeId, RenderAttributeTypeId> | undefined;
    private _renderAttributes: RevRenderValue.Attribute<RenderAttributeTypeId>[] = [];

    get renderValue() {
        if (this._renderValue === undefined) {
            this._renderValue = this.createRenderValue();
            this._renderValue.setAttributes(this._renderAttributes);
        }
        return this._renderValue;
    }

    addRenderAttribute(value: RevRenderValue.Attribute<RenderAttributeTypeId>) {
        this._renderAttributes.push(value);
    }

    clearRendering() {
        this._renderValue = undefined;
    }

    abstract isUndefined(): boolean;

    protected abstract createRenderValue(): RevRenderValue<RenderValueTypeId, RenderAttributeTypeId>;
}

/** @public */
export namespace RevTableValue {
    export type Constructor<RenderValueTypeId, RenderAttributeTypeId> = new() => RevTableValue<RenderValueTypeId, RenderAttributeTypeId>;
}
