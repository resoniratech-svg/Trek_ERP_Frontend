import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { TrendingUp, DollarSign, PieChart, ArrowDownRight } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";

function ProfitReport() {
  const { profitStats, isLoadingProfitStats } = useInventory();
  const { totalRevenue = 0, totalCosts = 0, totalProfit = 0, profitMargin = 0 } = profitStats || {};

  if (isLoadingProfitStats) {
    return <div className="p-20 text-center font-bold text-gray-400 animate-pulse">Loading Profit Report...</div>;
  }

  return (
    <div className="p-6">
      <PageHeader showBack
        title="Profit Report"
        subtitle="Financial breakdown of inventory sales and procurement costs"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <StatCard
          title="Total Revenue"
          value={`QAR ${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="text-blue-600" />}
          trend={{ value: "Gross Sales", positive: true }}
          path="/invoices"
        />
        <StatCard
          title="Total Costs"
          value={`QAR ${totalCosts.toLocaleString()}`}
          icon={<ArrowDownRight className="text-rose-600" />}
          trend={{ value: "Expenditure", positive: false }}
          path="/expenses"
        />
        <StatCard
          title="Net Profit"
          value={`QAR ${totalProfit.toLocaleString()}`}
          icon={<TrendingUp className="text-emerald-600" />}
          trend={{ value: `${profitMargin.toFixed(1)}% Margin`, positive: totalProfit > 0 }}
          path="/profit-loss"
        />
      </div>

      <div className="mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
          <PieChart size={64} className="mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-bold text-gray-900">Profit Breakdown</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mt-2">
            Detailed visual reports and category-wise profit analysis will be available here as more sales data is recorded.
          </p>
      </div>
    </div>
  );
}

export default ProfitReport;