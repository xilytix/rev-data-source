import { RevListChangedEventer, RevListChangedTypeId, SchemaServer } from '@xilytix/revgrid';
import { RevRecordSchemaError, RevRecordUnexpectedUndefinedError } from './rev-record-error';
import { RevRecordField } from './rev-record-field';
import { RevRecordFieldIndex } from './rev-record-types';

/** @public */
export class RevRecordSchemaServer<SF extends RevRecordField> implements SchemaServer<SF> {
    /** @internal */
    fieldListChangedEventer: RevListChangedEventer | undefined;

    private readonly _fields: SF[] = [];
    private readonly _fieldNameLookup = new Map<string, SF>();
    private readonly _fieldIndexLookup = new Map<SF, RevRecordFieldIndex>();
    private readonly _fieldValueDependsOnRecordIndexFieldIndexes: RevRecordFieldIndex[] = [];
    private readonly _fieldValueDependsOnRowIndexFieldIndexes: RevRecordFieldIndex[] = [];

    private _notificationClient: SchemaServer.NotificationsClient<SF>;

    get schema(): readonly SF[] { return this._fields; }
    get fields(): readonly SF[] { return this._fields; }
    get fieldCount(): number { return this._fields.length; }

    subscribeSchemaNotifications(value: SchemaServer.NotificationsClient<SF>): void {
        this._notificationClient = value;
    }

    addField(field: SF): SF {
        return this.internalAddField(field, false);
    }

    addFields(addFields: readonly SF[]): RevRecordFieldIndex {
        const addCount = addFields.length;
        if (addCount <= 0) {
            throw new RevRecordSchemaError('FSMAF26774', 'No fields provided');
        } else {
            const firstField = addFields[0];
            this.beginChange();
            try {

                for (let index = 0; index < addCount; index++) {
                    const field = addFields[index];
                    this.internalAddField(field, false);
                }

            } finally {
                this.endChange();
            }

            const firstIndex = firstField.index;
            if (this.fieldListChangedEventer !== undefined) {
                this.fieldListChangedEventer(RevListChangedTypeId.Insert, firstIndex, addCount, undefined);
            }

            return firstIndex;
        }
    }

    setFields(fields: readonly SF[]): void {
        const oldCount = this._fields.length;
        let clearNeeded: boolean;
        if (oldCount === 0) {
            clearNeeded = false;
        } else {
            if (this.fieldListChangedEventer !== undefined) {
                this.fieldListChangedEventer(RevListChangedTypeId.Clear, 0, oldCount, undefined);
            }
            clearNeeded = true;
        }

        const newCount = fields.length;
        const addNeeded = newCount > 0;
        const beginEndNeeded = clearNeeded && addNeeded;
        let firstIndex: number;

        if (beginEndNeeded) {
            this.beginChange();
        }
        try {
            if (clearNeeded) {
                this.internalClearFields();
            }
            if (addNeeded) {
                firstIndex = this.addFields(fields);
            } else {
                firstIndex = 0; // make sure initialised
            }
        } finally {
            if (beginEndNeeded) {
                this.endChange();
            }
        }
        if (addNeeded && this.fieldListChangedEventer !== undefined) {
            this.fieldListChangedEventer(RevListChangedTypeId.Insert, firstIndex, fields.length, undefined);
        }
    }

    beginChange(): void {
        this._notificationClient.beginChange();
    }

    endChange(): void {
        this._notificationClient.endChange();
    }

    getActiveSchemaColumns(): readonly SF[] {
        return this._notificationClient.getActiveSchemaFields();
    }

    getColumnCount(): number {
        return this._fields.length;
    }

    getField(fieldIndex: RevRecordFieldIndex): SF {
        if (fieldIndex < 0 || fieldIndex >= this._fields.length) {
            throw new RevRecordSchemaError('FSMGF74330', 'Field Index out of range');
        } else {
            return this._fields[fieldIndex];
        }
    }

    getFieldByName(fieldName: string): SF {
        const field = this._fieldNameLookup.get(fieldName);

        if (field === undefined) {
            throw new RevRecordUnexpectedUndefinedError('FSMGFBN98821');
        } else {
            return field;
        }
    }

    getFieldIndex(field: SF): RevRecordFieldIndex {
        const fieldIndex = this._fieldIndexLookup.get(field);

        if (fieldIndex === undefined) {
            throw new RevRecordSchemaError('FSMGFI03382', 'Field not found');
        }

        return fieldIndex;
    }

    getFieldIndexByName(fieldName: string): RevRecordFieldIndex {
        const field = this._fieldNameLookup.get(fieldName);
        if (field === undefined) {
            throw new RevRecordUnexpectedUndefinedError('DMIGFIF22288');
        } else {
            const index = this._fieldIndexLookup.get(field)
            if (index === undefined) {
                throw new RevRecordUnexpectedUndefinedError('DMIGFII22288');
            } else {
                return index;
            }
        }
    }

    getFieldNames(): string[] {
        return this._fields.map((field) => field.name);
    }

    getFilteredFields(filterCallback: (field: SF) => boolean): SF[] {
        return this._fields.filter((field) => filterCallback(field));
    }

    getFieldValueDependsOnRecordIndexFieldIndexes(): readonly RevRecordFieldIndex[] {
        return this._fieldValueDependsOnRecordIndexFieldIndexes;
    }

    getFields(): readonly SF[] {
        return this._fields;
    }

    hasField(name: string): boolean {
        return this._fieldNameLookup.has(name);
    }

    reset(): void {
        if (this._fields.length > 0) {
            this.internalClearFields();
        }
    }

    private internalClearFields() {
        this._fields.length = 0;
        this._fieldNameLookup.clear();
        this._fieldIndexLookup.clear();
        this._fieldValueDependsOnRecordIndexFieldIndexes.length = 0;
        this._fieldValueDependsOnRowIndexFieldIndexes.length = 0;
        this._fields.length = 0;
        this._notificationClient.allFieldsDeleted();
    }

    private internalAddField(
        field: SF,
        notifyFieldListChange: boolean
    ): SF {
        const fieldIndex = this._fields.length;

        field.index = fieldIndex;
        this._fieldIndexLookup.set(field, fieldIndex);
        this._fieldNameLookup.set(field.name, field);
        this._fields.push(field);

        if (field.valueDependsOnRecordIndex) {
            if (!this._fieldValueDependsOnRecordIndexFieldIndexes.includes(fieldIndex)) {
                this._fieldValueDependsOnRecordIndexFieldIndexes.push(fieldIndex);
            }
        }

        if (field.valueDependsOnRowIndex) {
            if (!this._fieldValueDependsOnRowIndexFieldIndexes.includes(fieldIndex)) {
                this._fieldValueDependsOnRowIndexFieldIndexes.push(fieldIndex);
            }
        }

        this._notificationClient.fieldsInserted(fieldIndex, 1);

        if (notifyFieldListChange && this.fieldListChangedEventer !== undefined) {
            this.fieldListChangedEventer(RevListChangedTypeId.Insert, fieldIndex, 1, undefined);
        }

        return field;
    }
}
