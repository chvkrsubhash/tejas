import React from 'react';
import { TableData } from '../../types/presentation';

interface TableRendererProps {
  data: TableData;
  editable?: boolean;
  onCellChange?: (row: number, col: number, text: string) => void;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ data, editable, onCellChange }) => {
  return (
    <div className="w-full h-full overflow-hidden">
      <table
        className="w-full h-full border-collapse table-fixed"
        style={{
          borderColor: data.borderColor,
          borderWidth: data.borderWidth,
        }}
      >
        <tbody>
          {data.cells.map((row, ri) => (
            <tr key={ri} style={{ height: data.rowHeights[ri] || 'auto' }}>
              {row.map((cell, ci) => {
                if (cell.mergedInto) return null;
                return (
                  <td
                    key={cell.id}
                    colSpan={cell.colSpan || 1}
                    rowSpan={cell.rowSpan || 1}
                    style={{
                      backgroundColor: cell.bgColor,
                      color: cell.textColor,
                      fontWeight: cell.bold ? 'bold' : 'normal',
                      fontStyle: cell.italic ? 'italic' : 'normal',
                      textAlign: cell.align,
                      borderColor: data.borderColor,
                      borderWidth: data.borderWidth,
                      borderStyle: 'solid',
                      padding: '6px 10px',
                      fontSize: '14px',
                      verticalAlign: 'middle',
                    }}
                  >
                    {editable ? (
                      <input
                        type="text"
                        value={cell.text}
                        onChange={(e) => onCellChange?.(ri, ci, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent outline-none"
                        style={{
                          textAlign: cell.align,
                          fontWeight: cell.bold ? 'bold' : 'normal',
                          color: cell.textColor,
                        }}
                      />
                    ) : (
                      <span>{cell.text}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

