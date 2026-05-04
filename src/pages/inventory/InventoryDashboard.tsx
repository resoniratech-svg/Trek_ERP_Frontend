import React, { useState, useMemo } from "react";
import { Package, ShoppingCart, Truck, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useDivision } from "../../context/DivisionContext";

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    badge?: { text: string; color: string };
    subtext?: string;
    variant?: "default" | "success" | "danger";
    path?: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ title, value, icon, badge, subtext, variant = "default", path }) => {
    const navigate = useNavigate();
    const variantStyles = {
        default: "border-gray-100",
        success: "border-emerald-200 bg-emerald-50/20",
        danger: "border-rose-200 bg-rose-50/20 shadow-lg shadow-rose-500/10"
    };

    return (
        <div 
            onClick={() => path && navigate(path)}
            className={`bg-white p-5 rounded-lg border ${variantStyles[variant]} flex items-center gap-5 transition-all hover:shadow-md ${path ? 'cursor-pointer active:scale-95' : ''}`}
        >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                variant === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                variant === 'danger' ? 'bg-rose-100 text-rose-600' : 
                'bg-slate-100 text-slate-500'
            }`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-400 capitalize">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-gray-900">{value}</h3>
                    {variant === 'success' && <span className="text-sm font-bold text-gray-900 ml-1">QAR</span>}
                </div>
                {badge && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${badge.color}`}>
                        {badge.text}
                    </span>
                )}
                {subtext && <p className="text-[10px] font-bold text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
};

function InventoryDashboard() {
  const { products, movements, salesOrders, purchaseOrders, isLoadingProducts } = useInventory();
  const { activeDivision } = useDivision();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStock).length;
    
    const dayMovements = movements.filter((m) => 
        dayjs(m.date).format("YYYY-MM-DD") === selectedDate
    );

    const totalProfit = products.reduce((sum: number, p) => 
        sum + (p.stockQuantity * (p.sellingPrice - p.purchasePrice)), 0);

    return {
        totalProducts,
        lowStockItems,
        purchaseOrdersCount: purchaseOrders.length,
        salesOrdersCount: salesOrders.length,
        totalMovements: movements.length,
        totalProfit,
        filteredMovements: dayMovements
    };
  }, [products, movements, salesOrders, purchaseOrders, selectedDate]);

  const lowStockCount = stats.lowStockItems;

  if (isLoadingProducts) {
    return <div className="p-20 text-center font-bold text-gray-400 animate-pulse">Loading Inventory Engine...</div>;
  }

  return (
    <div className="p-6 space-y-8 font-sans bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-900">Inventory Dashboard</h1>
        <div className="relative group">
            <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="appearance-none bg-white border border-gray-200 px-4 py-2 pr-4 rounded-xl text-sm font-bold text-gray-600 shadow-sm hover:border-brand-500 focus:outline-none transition-all cursor-pointer"
            />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
        <DashboardStatCard 
            title="Total Products"
            value={stats.totalProducts.toLocaleString()}
            icon={<Package size={28} />}
            badge={{ text: "+15 new this month", color: "bg-emerald-100 text-emerald-700" }}
            path="/products"
        />
        <DashboardStatCard 
            title="Purchase Orders"
            value={stats.purchaseOrdersCount}
            icon={<ShoppingCart size={28} />}
            badge={{ text: "12 pending", color: "bg-amber-100 text-amber-700" }}
            path="/inventory/purchase-orders"
        />
        <DashboardStatCard 
            title="Sales Orders"
            value={stats.salesOrdersCount}
            icon={<Truck size={28} />}
            badge={{ text: "24 shipped today", color: "bg-emerald-100 text-emerald-700" }}
            path="/inventory/sales-orders"
        />
        <DashboardStatCard 
            title="Stock Movements"
            value={stats.totalMovements}
            icon={<Activity size={28} />}
            subtext="Last movement: 5 mins ago"
            path="/inventory-movements"
        />
        <DashboardStatCard 
            title="Profit (QAR)"
            value={stats.totalProfit.toLocaleString()}
            icon={<TrendingUp size={28} />}
            variant="success"
            path="/inventory/profit-report"
        />
        <DashboardStatCard 
            title="Low Stock Alerts"
            value={`${lowStockCount} Alerts`}
            icon={<AlertTriangle size={28} />}
            variant={lowStockCount > 0 ? "danger" : "default"}
            path="/inventory/low-stock"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Recent Movements Table */}
          <div className="xl:col-span-3 bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-10 flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900">Recent Inventory Movements</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Quantity</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Date</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {movements.length > 0 ? movements.slice(0, 5).map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-gray-800 text-sm whitespace-nowrap">
                                        {m.type === 'IN' ? 'PO #102' : m.type === 'OUT' ? 'SO #344' : 'Adjustment'}
                                    </td>
                                    <td className="px-8 py-5 font-medium text-gray-600 text-sm">{m.productName}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                                            m.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 
                                            m.type === 'OUT' ? 'bg-rose-50 text-rose-600' : 
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : ''}{m.quantity}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 font-bold text-gray-400 text-sm text-center">
                                        {dayjs(m.date).format("DD/MM/YYYY")}
                                    </td>
                                    <td className="px-8 py-5 font-bold text-gray-800 text-sm">{m.userName || 'System'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 font-bold">No recent movements recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
              {/* Top Selling Chart Placeholder */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-gray-900 mb-6">Top Selling Products</h3>
                  <div className="h-40 flex items-end justify-between gap-1 px-2">
                       <div className="group relative flex flex-col items-center flex-1">
                           <div className="w-full bg-brand-500 rounded-t-lg transition-all group-hover:bg-brand-600" style={{height: '80%'}}></div>
                           <p className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center">PO #102</p>
                       </div>
                       <div className="group relative flex flex-col items-center flex-1">
                           <div className="w-full bg-brand-400 rounded-t-lg transition-all group-hover:bg-brand-600" style={{height: '60%'}}></div>
                           <p className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center">SO #344</p>
                       </div>
                       <div className="group relative flex flex-col items-center flex-1">
                           <div className="w-full bg-brand-300 rounded-t-lg transition-all group-hover:bg-brand-600" style={{height: '45%'}}></div>
                           <p className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center">Produc...</p>
                       </div>
                       <div className="group relative flex flex-col items-center flex-1">
                           <div className="w-full bg-brand-400 rounded-t-lg transition-all group-hover:bg-brand-600" style={{height: '55%'}}></div>
                           <p className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center">SO #344</p>
                       </div>
                       <div className="group relative flex flex-col items-center flex-1">
                           <div className="w-full bg-brand-500 rounded-t-lg transition-all group-hover:bg-brand-600" style={{height: '40%'}}></div>
                           <p className="text-[8px] font-bold text-gray-400 mt-2 truncate w-full text-center">PO #345</p>
                       </div>
                  </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                  <h3 className="text-lg font-black text-gray-900 ml-2">Quick Actions</h3>
                  <div className="space-y-3">
                      <button 
                        onClick={() => navigate("/inventory/create-purchase-order")}
                        className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg p-4 transition-all shadow-lg shadow-blue-500/20 text-center group"
                      >
                          <p className="font-bold text-sm">Create Purchase Order</p>
                          <p className="text-[10px] text-white/70">Source new stock</p>
                      </button>
                      <button 
                        onClick={() => navigate("/inventory/create-sales-order")}
                        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-100 rounded-lg p-3 transition-all font-bold text-sm text-center"
                      >
                          Create Sales Order
                      </button>
                      <button 
                        onClick={() => navigate("/create-product")}
                        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-100 rounded-lg p-3 transition-all font-bold text-sm text-center"
                      >
                          Add New Product
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

export default InventoryDashboard;