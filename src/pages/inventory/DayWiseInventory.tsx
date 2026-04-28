import { useMemo } from "react";
import { useInventory } from "../../hooks/useInventory";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";



function DayWiseInventory() {
  const { movements } = useInventory();

  const dayWiseData = useMemo(() => {
    const groups: Record<string, { date: string, incoming: number, outgoing: number, adjustments: number, total: number }> = {};

    movements.forEach((m) => {
      const dbDate = m.date;
      const date = (dbDate && dayjs(dbDate).isValid()) ? dayjs(dbDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
      if (!groups[date]) {
        groups[date] = { date, incoming: 0, outgoing: 0, adjustments: 0, total: 0 };
      }
      if (m.type === "IN") groups[date].incoming += m.quantity;
      else if (m.type === "OUT") groups[date].outgoing += m.quantity;
      else if (m.type === "ADJUSTMENT") groups[date].adjustments += 1;
      groups[date].total += 1;
    });

    return Object.values(groups).sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()).map((group) => ({
      ...group,
      "Date": dayjs(group.date).format("MMM DD, YYYY"),
      "Incoming Qty": <span className="text-emerald-600 font-bold">+{group.incoming}</span>,
      "Outgoing Qty": <span className="text-rose-600 font-bold">-{group.outgoing}</span>,
      "Manual Adj": <span className="text-blue-600 font-bold">{group.adjustments}</span>,
      "Total Activities": <span className="font-black">{group.total}</span>
    }));
  }, [movements]);

  const columns = ["Date", "Incoming Qty", "Outgoing Qty", "Manual Adj", "Total Activities"];

  return (
    <div className="p-6">
      <PageHeader showBack 
        title="Day-wise Inventory" 
        subtitle="Daily summary of stock activities and movements"
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm mt-8 overflow-hidden">
        {dayWiseData.length > 0 ? (
          <DataTable columns={columns} data={dayWiseData} hideSearch={true} />
        ) : (
          <div className="p-20 text-center text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">No historical data found</p>
            <p className="text-sm">Daily summaries will appear here as stock movements are recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DayWiseInventory;
