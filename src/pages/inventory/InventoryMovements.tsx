import { useQuery } from "@tanstack/react-query";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { Activity, ArrowUpRight, ArrowDownLeft, RefreshCcw, Plus, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { inventoryService } from "../../services/inventoryService";
import type { InventoryMovement } from "../../types/inventory";

import { useDivision } from "../../context/DivisionContext";

function InventoryMovements() {
  const navigate = useNavigate();
  const { activeDivision } = useDivision();

  // 1. Fetch Movements
  const { data: movements = [], isLoading } = useQuery<InventoryMovement[]>({
    queryKey: ["inventory-movements", activeDivision],
    queryFn: () => inventoryService.getMovements(activeDivision)
  });

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse text-gray-400">
            <Loader2 size={40} className="animate-spin mb-4"/>
            <p className="font-bold">Tracing Stock History...</p>
        </div>
    );
  }
  
  const formattedData = movements.map((mov) => ({
    ...mov,
    "Date": dayjs(mov.date).format("MMM DD, YYYY HH:mm"),
    "Product": mov.productName,
    "Type": (
        <div className="flex items-center gap-2">
            {mov.type === 'IN' ? <ArrowDownLeft size={14} className="text-emerald-500" /> : 
             mov.type === 'OUT' ? <ArrowUpRight size={14} className="text-rose-500" /> : 
             <RefreshCcw size={14} className="text-blue-500" />}
            <span className={`font-bold text-xs ${
                mov.type === 'IN' ? 'text-emerald-600' : 
                mov.type === 'OUT' ? 'text-rose-600' : 
                'text-blue-600'
            }`}>{mov.type.toUpperCase()}</span>
        </div>
    ),
    "Qty": <span className="font-mono font-bold">{mov.quantity}</span>,
    "Reason": <span className="text-gray-500 italic text-xs">{mov.notes || mov.reference || 'Stock Adjustment'}</span>
  }));

  const columns = ["Date", "Product", "Type", "Qty", "Reason"];

  return (
    <div className="p-6">
      <PageHeader showBack
        title="Inventory Movements"
        subtitle="Historical log of all stock changes and adjustments"
        action={
            <button 
                onClick={() => navigate("/create-stock-movement")}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
                <Plus size={16} />
                Add Movement
            </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6 overflow-hidden">
        {movements.length > 0 ? (
          <DataTable columns={columns} data={formattedData} hideSearch={true} />
        ) : (
          <div className="p-20 text-center text-gray-400">
            <Activity size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">No movements recorded</p>
            <p className="text-sm">Stock updates and manual adjustments will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryMovements;