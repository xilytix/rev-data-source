// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevGridLayoutDefinition } from '../../../grid-layout/internal-api';
// import { BalancesTableFieldSourceDefinition } from './balances-table-field-source-definition';
// import { BrokerageAccountTableFieldSourceDefinition } from './brokerage-account-table-field-source-definition';
// import { CallPutSecurityDataItemTableFieldSourceDefinition } from './call-put-security-data-item-table-field-source-definition';
// import { CallPutTableFieldSourceDefinition } from './call-put-table-field-source-definition';
// import { FeedTableFieldSourceDefinition } from './feed-table-field-source-definition';
// import { GridFieldTableFieldSourceDefinition } from './grid-field-table-field-source-definition';
// import { HoldingTableFieldSourceDefinition } from './holding-table-field-source-definition';
// import { LitIvemAlternateCodesTableFieldSourceDefinition } from './lit-ivem-alternate-codes-table-field-source-definition';
// import { LitIvemBaseDetailTableFieldSourceDefinition } from './lit-ivem-base-detail-table-field-source-definition';
// import { LitIvemExtendedDetailTableFieldSourceDefinition } from './lit-ivem-extended-detail-table-field-source-definition';
// import { LitIvemIdTableFieldSourceDefinition } from './lit-ivem-id-table-field-source-definition';
// import { MyxLitIvemAttributesTableFieldSourceDefinition } from './myx-lit-ivem-attributes-table-field-source-definition';
// import { OrderTableFieldSourceDefinition } from './order-table-field-source-definition';
// import { RankedLitIvemIdListDirectoryItemTableFieldSourceDefinition } from './ranked-lit-ivem-id-list-directory-item-table-field-source-definition';
// import { RankedLitIvemIdTableFieldSourceDefinition } from './ranked-lit-ivem-id-table-field-source-definition';
// import { ScanTableFieldSourceDefinition } from './scan-table-field-source-definition';
// import { SecurityDataItemTableFieldSourceDefinition } from './security-data-item-table-field-source-definition';
import { RevTableFieldSourceDefinition } from './rev-table-field-source-definition';
import { RevTableFieldSourceDefinitionFactory } from './rev-table-field-source-definition-factory';
// import { TopShareholderTableFieldSourceDefinition } from './top-shareholder-table-field-source-definition';

/** @public */
export class RevTableFieldSourceDefinitionCachingFactoryService<TypeId, RenderValueTypeId, RenderAttributeTypeId> {
    private readonly _definitionsByTypeId = new Map<TypeId, RevTableFieldSourceDefinition<TypeId, RenderValueTypeId, RenderAttributeTypeId>>();
    private readonly _definitionsByName = new Map<string, RevTableFieldSourceDefinition<TypeId, RenderValueTypeId, RenderAttributeTypeId>>();

    constructor(readonly definitionFactory: RevTableFieldSourceDefinitionFactory<TypeId, RenderValueTypeId, RenderAttributeTypeId>) {

    }

    // get feed() {
    //     return this.get(TableFieldSourceDefinition.TypeId.Feed) as FeedTableFieldSourceDefinition;
    // }
    // get litIvemId() {
    //     return this.get(TableFieldSourceDefinition.TypeId.LitIvemId) as LitIvemIdTableFieldSourceDefinition;
    // }
    // get rankedLitIvemId() {
    //     return this.get(TableFieldSourceDefinition.TypeId.RankedLitIvemId) as RankedLitIvemIdTableFieldSourceDefinition;
    // }
    // get litIvemBaseDetail() {
    //     return this.get(TableFieldSourceDefinition.TypeId.LitIvemBaseDetail) as LitIvemBaseDetailTableFieldSourceDefinition;
    // }
    // get litIvemExtendedDetail() {
    //     return this.get(TableFieldSourceDefinition.TypeId.LitIvemExtendedDetail) as LitIvemExtendedDetailTableFieldSourceDefinition;
    // }
    // get litIvemAlternateCodes() {
    //     return this.get(TableFieldSourceDefinition.TypeId.LitIvemAlternateCodes) as LitIvemAlternateCodesTableFieldSourceDefinition;
    // }
    // get myxLitIvemAttributes() {
    //     return this.get(TableFieldSourceDefinition.TypeId.MyxLitIvemAttributes) as MyxLitIvemAttributesTableFieldSourceDefinition;
    // }
    // get securityDataItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.SecurityDataItem) as SecurityDataItemTableFieldSourceDefinition;
    // }
    // get brokerageAccounts() {
    //     return this.get(TableFieldSourceDefinition.TypeId.BrokerageAccount) as BrokerageAccountTableFieldSourceDefinition;
    // }
    // get ordersDataItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.Order) as OrderTableFieldSourceDefinition;
    // }
    // get holdingsDataItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.Holding) as HoldingTableFieldSourceDefinition;
    // }
    // get balances() {
    //     return this.get(TableFieldSourceDefinition.TypeId.Balances) as BalancesTableFieldSourceDefinition;
    // }
    // get callPut() {
    //     return this.get(TableFieldSourceDefinition.TypeId.CallPut) as CallPutTableFieldSourceDefinition;
    // }
    // get callSecurityDataItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.CallSecurityDataItem) as CallPutSecurityDataItemTableFieldSourceDefinition;
    // }
    // get putSecurityDataItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.PutSecurityDataItem) as CallPutSecurityDataItemTableFieldSourceDefinition;
    // }
    // get topShareholdersDataItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.TopShareholder) as TopShareholderTableFieldSourceDefinition;
    // }
    // get scan() {
    //     return this.get(TableFieldSourceDefinition.TypeId.Scan) as ScanTableFieldSourceDefinition;
    // }
    // get rankedLitIvemIdListDirectoryItem() {
    //     return this.get(TableFieldSourceDefinition.TypeId.RankedLitIvemIdListDirectoryItem) as RankedLitIvemIdListDirectoryItemTableFieldSourceDefinition;
    // }
    // get gridField() {
    //     return this.get(TableFieldSourceDefinition.TypeId.GridField) as GridFieldTableFieldSourceDefinition;
    // }

    get(typeId: TypeId): RevTableFieldSourceDefinition<TypeId, RenderValueTypeId, RenderAttributeTypeId> {
        let definition = this._definitionsByTypeId.get(typeId);
        if (definition === undefined) {
            definition = this.definitionFactory.create(typeId);
            this._definitionsByTypeId.set(typeId, definition);
        }
        return definition;
    }

    createLayoutDefinition(fieldIds: RevTableFieldSourceDefinition.FieldId<TypeId>[]): RevGridLayoutDefinition {
        const count = fieldIds.length;
        const fieldNames = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            const fieldId = fieldIds[i];
            const fieldName = this.get(fieldId.sourceTypeId).getFieldNameById(fieldId.id);
            fieldNames[i] = fieldName;
        }

        return RevGridLayoutDefinition.createFromFieldNames(fieldNames);
    }
}
