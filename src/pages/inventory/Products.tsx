import { useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Eye, Edit, Loader2, Download } from "lucide-react";
import { inventoryService } from "../../services/inventoryService";
import api from "../../services/api";
import { exportToCSV } from "../../utils/exportUtils";
import type { InventoryProduct } from "../../types/inventory";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

function Products() {
  const { user } = useAuth();
  const canManageProducts = user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTS";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<InventoryProduct[]>({
    queryKey: ["products"],
    queryFn: inventoryService.getProducts
  });

  const handleDelete = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setDeletingId(String(id));
    try {
      await api.delete(`/inventory/products/${id}`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    } catch (error: any) {
      alert(`Failed to delete: ${error?.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formattedData = products.map((product) => ({
    ...product,
    "Product": product.name,
    "Category": product.category || "General",
    "Sector": product.division || "N/A",
    "Purchase Price": `QAR ${Number(product.purchasePrice || 0).toLocaleString()}`,
    "Selling Price": `QAR ${Number(product.sellingPrice || 0).toLocaleString()}`,
    "Stock": (
      <span className={`font-medium ${product.stockQuantity <= product.minStock ? 'text-red-600' : 'text-green-600'}`}>
        {product.stockQuantity}
      </span>
    ),
    "Actions": ""
  }));

  const baseColumns = ["Product", "Category", "Sector", "Purchase Price", "Selling Price", "Stock", "Actions"];
  const columns = canManageProducts ? baseColumns : ["Product", "Category", "Sector", "Selling Price", "Stock", "Actions"];

  return (
    <div className="p-6">
      <PageHeader showBack
        title="Products"
        subtitle="Manage inventory items and stock levels"
        action={
          <div className="flex gap-3">
            <button
              onClick={() => exportToCSV(products, 'inventory_products.csv')}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm font-semibold"
            >
              <Download size={16} />
              Export
            </button>
            {canManageProducts && (
              <Link to="/create-product">
                <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm font-semibold">
                  <Plus size={16} />
                  Add Product
                </button>
              </Link>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 size={40} className="animate-spin text-brand-600" />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={formattedData}
            hideSearch={true}
            renderActions={(row: any) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/inventory/edit-product/${row.id}`)}
                  className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                {canManageProducts && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/inventory/edit-product/${row.id}`)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      disabled={deletingId === String(row.id)}
                      title="Delete Product"
                    >
                      {deletingId === String(row.id) ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

export default Products;