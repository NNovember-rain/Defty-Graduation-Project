import React from 'react';
import type {GetProp, TableColumnsType, TableProps, TransferProps} from 'antd';
import {Table, Transfer} from 'antd';

type TransferItem = GetProp<TransferProps, 'dataSource'>[number];
type TableRowSelection<T extends object> = TableProps<T>['rowSelection'];

export interface DataType {
    key: string;
    title: string;
    description: string;
    tag: string;
}

interface TableTransferProps extends TransferProps<TransferItem> {
    dataSource: DataType[];
    leftColumns: TableColumnsType<DataType>;
    rightColumns: TableColumnsType<DataType>;
}

const TableTransfer: React.FC<TableTransferProps> = ({
                                                         leftColumns,
                                                         rightColumns,
                                                         ...restProps
                                                     }) => (
    <Transfer style={{ width: '100%' }} {...restProps}>
        {({
              direction,
              filteredItems,
              onItemSelect,
              onItemSelectAll,
              selectedKeys,
              disabled,
          }) => {
            const columns = direction === 'left' ? leftColumns : rightColumns;
            const rowSelection: TableRowSelection<TransferItem> = {
                getCheckboxProps: () => ({ disabled }),
                onChange: (selectedRowKeys) => onItemSelectAll(selectedRowKeys, 'replace'),
                selectedRowKeys: selectedKeys,
                selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
            };

            return (
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={filteredItems}
                    size="small"
                    style={{ pointerEvents: disabled ? 'none' : undefined }}
                    onRow={({ key, disabled: itemDisabled }) => ({
                        onClick: () => {
                            if (!itemDisabled && !disabled) {
                                onItemSelect(key, !selectedKeys.includes(key));
                            }
                        },
                    })}
                />
            );
        }}
    </Transfer>
);

export default TableTransfer;
