import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../services/inventoryService";
import type { InventoryProduct, InventoryMovement, SalesOrder, ProfitStats } from "../types/inventory";

export function useInventory() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery<InventoryProduct[]>({
    queryKey: ["inventory-products"],
    queryFn: inventoryService.getProducts,
  });

  const movementsQuery = useQuery<InventoryMovement[]>({
    queryKey: ["inventory-movements"],
    queryFn: inventoryService.getMovements,
  });

  const salesOrdersQuery = useQuery<SalesOrder[]>({
    queryKey: ["inventory-sales-orders"],
    queryFn: inventoryService.getSalesOrders,
  });

  const profitStatsQuery = useQuery<ProfitStats>({
    queryKey: ["inventory-profit-stats"],
    queryFn: inventoryService.getProfitStats,
  });

  const updateStock = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => 
      inventoryService.updateStock(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    },
  });

  return {
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    movements: movementsQuery.data || [],
    isLoadingMovements: movementsQuery.isLoading,
    salesOrders: salesOrdersQuery.data || [],
    isLoadingSalesOrders: salesOrdersQuery.isLoading,
    profitStats: profitStatsQuery.data || null,
    isLoadingProfitStats: profitStatsQuery.isLoading,
    updateStock,
    refetchProducts: productsQuery.refetch,
  };
}
