/**
 * %license Motif
 * (c) 2021 Paritech Wealth Technology
 * License: motionite.trade/license/motif
 */

import { LockItemByKeyList } from '@xilytix/sysutils';
import { RevReferenceableDataSourceDefinition } from './definition/internal-api';
import { RevReferenceableDataSource } from './rev-referenceable-data-source';
import { RevDataSource } from './rev-data-source';

/** @public */
export interface RevReferenceableDataSourcesService<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>
    extends LockItemByKeyList<
        RevReferenceableDataSource<
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            RenderValueTypeId,
            RenderAttributeTypeId,
            Badness
        >,
        RevDataSource.LockErrorIdPlusTryError
    > {

    // readonly saveModified: boolean;

    getOrNew(
        definition: RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>
    ): RevReferenceableDataSource<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId, Badness>;

    // save(): void;
    // checkSave(onlyIfPeriodicRequired: boolean): void;
    // checkPeriodicSaveRequired(nowTime: SysTick.Time): void;
}
/** @public */
export namespace RevReferenceableDataSourcesService {
    // export type SaveRequiredEvent = (this: void) => void;

    // export const jsonTag_Root = 'Watchlists';
    // export const jsonTag_Watchlists = 'Watchlist';
    // export const periodicSaveCheckInterval = 60.0 * mSecsPerSec;

    // export class Entry2 {
    //     saveRequiredEvent: SaveRequiredEvent;

    //     private _table: Table;
    //     private lockers: Table.Locker[] = [];
    //     private openers: Table.Opener[] = [];

    //     private layoutChangeNotifying: boolean;

    //     constructor(definitionFactory: TableDefinitionFactory) {
    //         this._table = new Table(definitionFactory);
    //         this.table.openEvent = (recordDefinitionList) =>
    //             this.handleOpenEvent(recordDefinitionList);
    //         this.table.openChangeEvent = (opened) =>
    //             this.handleOpenChangeEvent(opened);
    //         this.table.badnessChangedEvent = () =>
    //             this.handlebadnessChangedEvent();
    //         this.table.recordsLoadedEvent = () =>
    //             this.handleTableRecordsLoadedEvent();
    //         this.table.recordsInsertedEvent = (index, count) =>
    //             this.handleTableRecordsInsertedEvent(index, count);
    //         this.table.recordsDeletedEvent = (index, count) =>
    //             this.handleTableRecordsDeletedEvent(index, count);
    //         this.table.allRecordsDeletedEvent = () =>
    //             this.handleTableAllRecordsDeletedEvent();
    //         // this.table.listChangeEvent = (typeId, itemIdx, itemCount) =>
    //         //     this.handleListChangeEvent(typeId, itemIdx, itemCount);
    //         this.table.recordValuesChangedEvent = (recordIdx, invalidatedValues) =>
    //             this.handleRecordValuesChangedEvent(recordIdx, invalidatedValues);
    //         this.table.recordFieldsChangedEvent = (recordIndex, fieldIndex, fieldCount) =>
    //             this.handleRecordFieldsChangedEvent(recordIndex, fieldIndex, fieldCount);
    //         this.table.recordChangedEvent = (recordIdx) =>
    //             this.handleRecordChangeEvent(recordIdx);
    //         this.table.layoutChangedEvent = (opener) =>
    //             this.handleLayoutChangedEvent(opener);
    //         this.table.recordDisplayOrderChangedEvent = (opener) =>
    //             this.handleItemDisplayOrderChangedEvent(opener);
    //         this.table.recordDisplayOrderSetEvent = (itemIndices) =>
    //             this.handleItemDisplayOrderSetEvent(itemIndices);
    //         this.table.firstPreUsableEvent = () =>
    //             this.handleFirstPreUsableEvent();
    //     }

    //     get table() {
    //         return this._table;
    //     }

    //     get lockCount() {
    //         return this.lockers.length;
    //     }

    //     get openCount() {
    //         return this.openers.length;
    //     }

    //     open(opener: Table.Opener) {
    //         this.openers.push(opener);
    //         if (this.openers.length === 1) {
    //             this._table.open();
    //         }
    //     }

    //     close(opener: Table.Opener) {
    //         const idx = this.openers.indexOf(opener);
    //         if (idx < 0) {
    //             Logger.assert(
    //                 false,
    //                 'WatchItemDefinitionListDirectory.close: opener not found'
    //             );
    //         } else {
    //             this.openers.splice(idx, 1);
    //             if (this.openers.length === 0) {
    //                 this._table.close();
    //             }
    //         }
    //     }

    //     lock(locker: Table.Locker) {
    //         this.lockers.push(locker);
    //     }

    //     unlock(locker: Table.Locker) {
    //         const idx = this.lockers.indexOf(locker);
    //         if (idx < 0) {
    //             Logger.assert(
    //                 false,
    //                 'WatchItemDefinitionListDirectory.unlock: locker not found'
    //             );
    //         } else {
    //             this.lockers.splice(idx, 1);
    //         }
    //     }

    //     isLocked(ignoreLocker: Table.Locker | undefined) {
    //         switch (this.lockCount) {
    //             case 0:
    //                 return false;
    //             case 1:
    //                 return (
    //                     ignoreLocker === undefined ||
    //                     this.lockers[0] !== ignoreLocker
    //                 );
    //             default:
    //                 return true;
    //         }
    //     }

    //     getGridOpenCount(): Integer {
    //         let result = 0;
    //         this.openers.forEach((opener: Table.Opener) => {
    //             if (opener.isTableGrid()) {
    //                 result++;
    //             }
    //         });
    //         return result;
    //     }

    //     getFirstGridOpener(): Table.Opener | undefined {
    //         return this.openers.find((opener: Table.Opener) => opener.isTableGrid());
    //     }

    //     private handleOpenEvent(
    //         recordDefinitionList: TableRecordDefinitionList
    //     ) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableOpen(recordDefinitionList)
    //         );
    //     }

    //     private handlebadnessChangedEvent() {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableBadnessChange()
    //         );
    //     }

    //     private handleOpenChangeEvent(opened: boolean) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableOpenChange(opened)
    //         );
    //     }

    //     private handleTableRecordsLoadedEvent() {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableRecordsLoaded()
    //         );

    //         this.saveRequiredEvent();
    //     }

    //     private handleTableRecordsInsertedEvent(index: Integer, count: Integer) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableRecordsInserted(index, count)
    //         );

    //         this.saveRequiredEvent();
    //     }

    //     private handleTableRecordsDeletedEvent(index: Integer, count: Integer) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableRecordsDeleted(index, count)
    //         );

    //         this.saveRequiredEvent();
    //     }

    //     private handleTableAllRecordsDeletedEvent() {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableAllRecordsDeleted()
    //         );

    //         this.saveRequiredEvent();
    //     }

    //     // private handleListChangeEvent(
    //     //     typeId: UsableListChangeTypeId,
    //     //     itemIdx: Integer,
    //     //     itemCount: Integer
    //     // ) {
    //     //     this.openers.forEach((opener: Opener) =>
    //     //         opener.notifyTableRecordListChange(typeId, itemIdx, itemCount)
    //     //     );

    //     //     this.saveRequiredEvent();
    //     // }

    //     private handleRecordValuesChangedEvent(recordIndex: Integer, invalidatedValues: GridRecordInvalidatedValue[]) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableRecordValuesChanged(recordIndex, invalidatedValues)
    //         );
    //     }

    //     private handleRecordFieldsChangedEvent(recordIndex: Integer, fieldIndex: number, fieldCount: number) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableRecordFieldsChanged(recordIndex, fieldIndex, fieldCount)
    //         );
    //     }

    //     private handleRecordChangeEvent(recordIdx: Integer) {
    //         this.openers.forEach((opener: Table.Opener) =>
    //             opener.notifyTableRecordChanged(recordIdx)
    //         );
    //     }

    //     private handleLayoutChangedEvent(opener: Table.Opener) {
    //         if (!this.layoutChangeNotifying) {
    //             this.layoutChangeNotifying = true;
    //             try {
    //                 const count = this.getGridOpenCount();

    //                 if (count > 1) {
    //                     this.openers.forEach((openerElem: Table.Opener) => {
    //                         if (
    //                             openerElem.isTableGrid() &&
    //                             openerElem !== opener
    //                         ) {
    //                             openerElem.notifyTableLayoutUpdated();
    //                         }
    //                     });
    //                 }
    //             } finally {
    //                 this.layoutChangeNotifying = false;
    //             }

    //             this.saveRequiredEvent();
    //         }
    //     }

    //     private handleItemDisplayOrderChangedEvent(opener: Table.Opener) {
    //         const count = this.getGridOpenCount();

    //         if (count > 1) {
    //             const recIndices = opener.getOrderedGridRecIndices();
    //             this.openers.forEach((openerElem: Table.Opener) => {
    //                 if (openerElem.isTableGrid() && openerElem !== opener) {
    //                     openerElem.notifyTableRecordDisplayOrderChanged(
    //                         recIndices
    //                     );
    //                 }
    //             });
    //         }
    //         this.saveRequiredEvent();
    //     }

    //     private handleItemDisplayOrderSetEvent(itemIndices: Integer[]) {
    //         this.openers.forEach((openerElem: Table.Opener) => {
    //             if (openerElem.isTableGrid()) {
    //                 openerElem.notifyTableRecordDisplayOrderChanged(
    //                     itemIndices
    //                 );
    //             }
    //         });

    //         this.saveRequiredEvent();
    //     }

    //     private handleFirstPreUsableEvent() {
    //         const opener = this.getFirstGridOpener();
    //         if (opener !== undefined) {
    //             opener.notifyTableFirstPreUsable();
    //         }
    //     }
    // }
}
