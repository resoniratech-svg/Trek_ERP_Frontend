import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../services/inventoryService";
import type { InventoryProduct, InventoryMovement, SalesOrder, ProfitStats } from "../types/inventory";

import { useDivision } from "../context/DivisionContext";

export function useInventory() {
  const queryClient = useQueryClient();
  const { activeDivision } = useDivision();

  const productsQuery = useQuery<InventoryProduct[]>({
    queryKey: ["inventory-products", activeDivision],
    queryFn: () => inventoryService.getProducts(activeDivision),
  });

  const movementsQuery = useQuery<InventoryMovement[]>({
    queryKey: ["inventory-movements", activeDivision],
    queryFn: () => inventoryService.getMovements(activeDivision),
  });

  const salesOrdersQuery = useQuery<SalesOrder[]>({
    queryKey: ["inventory-sales-orders", activeDivision],
    queryFn: () => inventoryService.getSalesOrders(activeDivision),
  });

  const profitStatsQuery = useQuery<ProfitStats>({
    queryKey: ["inventory-profit-stats", activeDivision],
    queryFn: () => inventoryService.getProfitStats(activeDivision),
  });

  const purchaseOrdersQuery = useQuery<any[]>({
    queryKey: ["inventory-purchase-orders", activeDivision],
    queryFn: () => inventoryService.getPurchaseOrders(activeDivision),
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
    purchaseOrders: purchaseOrdersQuery.data || [],
    isLoadingPurchaseOrders: purchaseOrdersQuery.isLoading,
    profitStats: profitStatsQuery.data || null,
    isLoadingProfitStats: profitStatsQuery.isLoading,
    updateStock,
    refetchProducts: productsQuery.refetch,
  };
}
