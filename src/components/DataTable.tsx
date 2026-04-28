import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";

interface Props<T> {
  columns: string[];
  data: T[];
  hideSearch?: boolean;
  renderActions?: (row: T, index: number) => ReactNode;
}
function DataTable<T extends Record<string, any>>({ columns, data, hideSearch, renderActions }: Props<T>) {
  const [search, setSearch] = useState("");

  const filteredData = data.filter((row) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return Object.entries(row).some(([key, val]) => {
      if (key === "Actions" || key === "Status" || key === "Stock") return false;
      if (val === null || val === undefined) return false;
      if (typeof val === "string") return val.toLowerCase().includes(searchLower);
      if (typeof val === "number") return String(val).includes(searchLower);
      return false;
    });
  });

  return (
    <div className="card overflow-hidden">
      {/* Search & Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!hideSearch && (
          <div className="flex items-center bg-surface-muted border border-gray-100 px-3 py-2 rounded-lg w-full sm:w-72 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-50 transition-all">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none px-2 text-sm w-full text-gray-700 placeholder:text-gray-400"
            />
          </div>
        )}
        <p className="text-xs text-gray-400 font-medium">
          {filteredData.length} of {data.length} records
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted border-b border-gray-100">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr
                  key={row.id ?? index}
                  className="hover:bg-brand-50/30 transition-colors duration-150"
                >
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className="px-5 py-3.5 text-gray-700 whitespace-nowrap"
                    >
                      {col === "Actions" && renderActions
                        ? renderActions(row, index)
                        : row[col]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-gray-400 text-sm"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;