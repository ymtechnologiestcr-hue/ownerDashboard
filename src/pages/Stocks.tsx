import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  MenuItem,
  TextField,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Divider,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AddIcon from "@mui/icons-material/Add";
import UpdateIcon from "@mui/icons-material/SystemUpdateAlt";
import HistoryIcon from "@mui/icons-material/History";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import axios from "../utils/axiosInstance";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type StockSummary = {
  domestic: number;
  commercial: number;
  fiveKg: number;
};

type StockRow = {
  product_id: number;
  category: string;
  opening: number;
  sales: number;
  salesReturn: number;
  purchase: number;
  purchaseReturn: number;
  defective: number;
  emptyCylinders: number;
  systemStock: number;
  closingStock: number;
};

type StockMovement = {
  date: string;
  type: string;
  item: string;
  qty: number;
  by: string;
};

type StockEntry = {
  date: string;
  category: string;
  item: string;
  location: string;
  qty: number;
  price: number | null;
  note: string | null;
};

type StockDashboardResponse = {
  success: boolean;
  summary: StockSummary;
  data: StockRow[];
  movements: StockMovement[];
  recentEntries: StockEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type StockArea = {
  id: number;
  name: string;
  address: string;
  manager_id: number | null;
};

type StockAreasResponse = {
  success: boolean;
  data: StockArea[];
};

type CategoryOption = {
  id: number;
  name: string;
};

type ItemOption = {
  id: number;
  name: string;
  type: "DOMESTIC" | "COMMERCIAL" | null;
  price: number | null;
  categoryId: number;
};

type StockItemContextResponse = {
  success: boolean;
  data: {
    quantity: number | null;
    price: number | null;
    hasExistingData: boolean;
  };
};

type PriceCatalogItem = {
  id: number;
  name: string;
  currentPrice: number | null;
  categoryName: string;
};

type UpdatePriceFormRow = {
  id: number;
  name: string;
  categoryName: string;
  currentPrice: number | null;
  newPrice: string;
};

type Filters = {
  search: string;
  startDate: string;
  endDate: string;
  stockAreaId: string;
};

const fetchStockDashboard = async ({
  pageParam = 1,
  queryKey,
}: {
  pageParam?: number;
  queryKey: [string, Filters];
}): Promise<StockDashboardResponse> => {
  const [, filters] = queryKey;

  const res = await axios.get("/owner/stocks/dashboard", {
    params: {
      page: pageParam,
      limit: 10,
      search: filters.search || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      stockAreaId: filters.stockAreaId || undefined,
    },
  });

  return res.data;
};

const fetchStockAreas = async (): Promise<StockAreasResponse> => {
  const res = await axios.get("/owner/stocks/areas");
  return res.data;
};

const fetchStockCategories = async (
  search: string,
): Promise<CategoryOption[]> => {
  const res = await axios.get("/owner/stocks/categories", {
    params: {
      search: search || undefined,
    },
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const fetchStockItems = async (
  categoryId: number,
  search: string,
): Promise<ItemOption[]> => {
  const res = await axios.get("/owner/stocks/items", {
    params: {
      categoryId,
      search: search || undefined,
    },
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const fetchStockItemContext = async (
  itemId: number,
  stockAreaId: number,
): Promise<StockItemContextResponse["data"]> => {
  const res = await axios.get<StockItemContextResponse>(
    "/owner/stocks/item-details",
    {
      params: {
        itemId,
        stockAreaId,
      },
    },
  );
  return res.data.data;
};

const createCategoryWithItem = async (
  categoryName: string,
  itemName: string,
) => {
  const res = await axios.post("/owner/stocks/categories-with-item", {
    categoryName,
    itemName,
  });
  return res.data;
};

const createItemForCategory = async (categoryId: number, itemName: string) => {
  const res = await axios.post("/owner/stocks/items", {
    categoryId,
    itemName,
  });
  return res.data;
};

const saveStockEntry = async (payload: {
  stockAreaId: number;
  itemId: number;
  quantity: number;
  price: number;
  note: string;
}) => {
  const res = await axios.post("/owner/stocks/entries", payload);
  return res.data;
};

const fetchStockPriceCatalog = async (): Promise<PriceCatalogItem[]> => {
  const res = await axios.get("/owner/stocks/prices");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const updateStockPrices = async (payload: {
  updates: Array<{ productId: number; newPrice: number }>;
  effectiveDate: string;
  reason: string;
}) => {
  const res = await axios.post("/owner/stocks/prices/update", payload);
  return res.data;
};

export default function Stocks() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    startDate: "",
    endDate: "",
    stockAreaId: "",
  });

  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryOption | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [modalStockAreaId, setModalStockAreaId] = useState("");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isCategoryCreatorOpen, setIsCategoryCreatorOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryItemName, setNewCategoryItemName] = useState("");
  const [isItemCreatorOpen, setIsItemCreatorOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [isContextLoading, setIsContextLoading] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);

  const [isUpdatePriceOpen, setIsUpdatePriceOpen] = useState(false);
  const [updatePriceRows, setUpdatePriceRows] = useState<UpdatePriceFormRow[]>(
    [],
  );
  const [isUpdatePriceLoading, setIsUpdatePriceLoading] = useState(false);
  const [isUpdatePriceSaving, setIsUpdatePriceSaving] = useState(false);
  const [updatePriceError, setUpdatePriceError] = useState("");
  const [updatePriceSuccess, setUpdatePriceSuccess] = useState("");
  const [updatePriceEffectiveDate, setUpdatePriceEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [updatePriceReason, setUpdatePriceReason] = useState("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteScroll({
    queryKey: ["stocks-dashboard", filters],
    queryFn: fetchStockDashboard,
  });

  const queryClient = useQueryClient();

  const { data: stockAreasResponse, isLoading: isAreasLoading } = useQuery({
    queryKey: ["stock-areas"],
    queryFn: fetchStockAreas,
  });

  const stockAreas = stockAreasResponse?.data ?? [];
  const summary = data?.pages?.[0]?.summary;

  const resetAddStockModal = () => {
    setSelectedCategory(null);
    setSelectedItem(null);
    setCategorySearch("");
    setItemSearch("");
    setModalQuantity("");
    setModalPrice("");
    setModalNote("");
    setModalError("");
    setModalSuccess("");
    setIsCategoryCreatorOpen(false);
    setNewCategoryName("");
    setNewCategoryItemName("");
    setIsItemCreatorOpen(false);
    setNewItemName("");
  };

  const openAddStockModal = () => {
    resetAddStockModal();
    setModalStockAreaId(
      (prev) =>
        prev ||
        filters.stockAreaId ||
        (stockAreas[0] ? String(stockAreas[0].id) : ""),
    );
    setIsAddStockOpen(true);
  };

  const closeAddStockModal = () => {
    setIsAddStockOpen(false);
    setModalError("");
    setModalSuccess("");
  };

  useEffect(() => {
    if (!isAddStockOpen) return;
    if (modalStockAreaId) return;
    if (filters.stockAreaId) {
      setModalStockAreaId(filters.stockAreaId);
      return;
    }
    if (stockAreas[0]) {
      setModalStockAreaId(String(stockAreas[0].id));
    }
  }, [filters.stockAreaId, isAddStockOpen, modalStockAreaId, stockAreas]);

  useEffect(() => {
    if (!isAddStockOpen) return;

    const timeoutId = setTimeout(() => {
      setIsCategoryLoading(true);
      fetchStockCategories(categorySearch)
        .then((rows) => setCategoryOptions(rows))
        .catch(() => setCategoryOptions([]))
        .finally(() => setIsCategoryLoading(false));
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [categorySearch, isAddStockOpen]);

  useEffect(() => {
    if (!isAddStockOpen || !selectedCategory) {
      setItemOptions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsItemsLoading(true);
      fetchStockItems(selectedCategory.id, itemSearch)
        .then((rows) => setItemOptions(rows))
        .catch(() => setItemOptions([]))
        .finally(() => setIsItemsLoading(false));
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [isAddStockOpen, itemSearch, selectedCategory]);

  useEffect(() => {
    const stockAreaNumericId = Number(modalStockAreaId || 0);
    if (!isAddStockOpen || !selectedItem || !stockAreaNumericId) {
      return;
    }

    setIsContextLoading(true);
    fetchStockItemContext(selectedItem.id, stockAreaNumericId)
      .then((ctx) => {
        setModalQuantity(ctx.quantity == null ? "" : String(ctx.quantity));
        setModalPrice(ctx.price == null ? "" : String(ctx.price));
      })
      .catch(() => {
        setModalQuantity("");
        setModalPrice("");
      })
      .finally(() => setIsContextLoading(false));
  }, [isAddStockOpen, modalStockAreaId, selectedItem]);

  const handleSaveNewCategoryWithItem = async () => {
    const categoryName = newCategoryName.trim();
    const itemName = newCategoryItemName.trim();

    if (!categoryName || !itemName) {
      setModalError("Category name and item name are required.");
      return;
    }

    setIsModalSaving(true);
    setModalError("");
    try {
      const response = await createCategoryWithItem(categoryName, itemName);
      const category: CategoryOption = {
        id: Number(response?.data?.category?.id),
        name: String(response?.data?.category?.name || categoryName),
      };
      const item: ItemOption = {
        id: Number(response?.data?.item?.id),
        name: String(response?.data?.item?.name || itemName),
        type: response?.data?.item?.type || "DOMESTIC",
        price:
          response?.data?.item?.price == null
            ? null
            : Number(response.data.item.price),
        categoryId: Number(response?.data?.item?.categoryId || category.id),
      };

      setSelectedCategory(category);
      setCategorySearch(category.name);
      setSelectedItem(item);
      setItemSearch(item.name);
      setIsCategoryCreatorOpen(false);
      setNewCategoryName("");
      setNewCategoryItemName("");
      setModalSuccess("Category and item saved.");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to save category and item.";
      setModalError(message);
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleSaveNewItem = async () => {
    if (!selectedCategory) {
      setModalError("Select a category first.");
      return;
    }

    const itemName = newItemName.trim();
    if (!itemName) {
      setModalError("Item name is required.");
      return;
    }

    setIsModalSaving(true);
    setModalError("");
    try {
      const response = await createItemForCategory(
        selectedCategory.id,
        itemName,
      );
      const item: ItemOption = {
        id: Number(response?.data?.id),
        name: String(response?.data?.name || itemName),
        type: response?.data?.type || "DOMESTIC",
        price:
          response?.data?.price == null ? null : Number(response.data.price),
        categoryId: Number(response?.data?.categoryId || selectedCategory.id),
      };

      setSelectedItem(item);
      setItemSearch(item.name);
      setIsItemCreatorOpen(false);
      setNewItemName("");
      setModalSuccess("Item saved.");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to save item.";
      setModalError(message);
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleSaveStockEntry = async () => {
    setModalError("");
    setModalSuccess("");

    const stockAreaId = Number(modalStockAreaId || 0);
    const quantity = Number(modalQuantity);
    const price = Number(modalPrice);

    if (!selectedCategory) {
      setModalError("Category is required.");
      return;
    }
    if (!selectedItem) {
      setModalError("Item is required.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      setModalError("Quantity must be a valid non-negative number.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setModalError("Price must be a valid non-negative number.");
      return;
    }

    setIsModalSaving(true);
    try {
      await saveStockEntry({
        stockAreaId,
        itemId: selectedItem.id,
        quantity,
        price,
        note: modalNote,
      });

      closeAddStockModal();
      await queryClient.invalidateQueries({ queryKey: ["stocks-dashboard"] });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to save stock entry.";
      setModalError(message);
    } finally {
      setIsModalSaving(false);
    }
  };

  const stockDetails = useMemo(
    () =>
      data?.pages?.flatMap((page: StockDashboardResponse) => page.data) ?? [],
    [data],
  );

  const rowVirtualizer = useVirtualizer({
    count: stockDetails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 6,
  });

  const stats = [
    {
      label: "Domestic",
      value: summary?.domestic ?? 0,
      icon: "🏠",
      color: "#2463eb1a",
    },
    {
      label: "Commercial",
      value: summary?.commercial ?? 0,
      icon: "🏢",
      color: "#2463eb1a",
    },
  ];

  const progressData = stockDetails.map((item) => {
    const full = Math.max(Number(item.systemStock || 0), 0);
    const empty = Math.max(Number(item.emptyCylinders || 0), 0);
    const cap = Math.max(full + empty, 1);

    return {
      name: item.category,
      value: full,
      capacity: cap,
      empty,
    };
  });

  const movements = data?.pages?.[0]?.movements ?? [];
  const recentEntries: StockEntry[] = data?.pages?.[0]?.recentEntries ?? [];

  const groupedPriceRows = useMemo(() => {
    return updatePriceRows.reduce<Record<string, UpdatePriceFormRow[]>>(
      (acc, row) => {
        const key = row.categoryName || "Uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      },
      {},
    );
  }, [updatePriceRows]);

  const openUpdatePriceModal = async () => {
    setIsUpdatePriceOpen(true);
    setIsUpdatePriceLoading(true);
    setUpdatePriceError("");
    setUpdatePriceSuccess("");

    try {
      const rows = await fetchStockPriceCatalog();
      setUpdatePriceRows(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          categoryName: row.categoryName,
          currentPrice: row.currentPrice,
          newPrice: row.currentPrice == null ? "" : String(row.currentPrice),
        })),
      );
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load price list.";
      setUpdatePriceError(message);
      setUpdatePriceRows([]);
    } finally {
      setIsUpdatePriceLoading(false);
    }
  };

  const closeUpdatePriceModal = () => {
    setIsUpdatePriceOpen(false);
    setUpdatePriceError("");
    setUpdatePriceSuccess("");
  };

  const handleUpdatePriceInputChange = (id: number, value: string) => {
    setUpdatePriceRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, newPrice: value } : row)),
    );
  };

  const handleSaveUpdatedPrices = async () => {
    setUpdatePriceError("");
    setUpdatePriceSuccess("");

    const changed = updatePriceRows
      .map((row) => ({
        productId: row.id,
        currentPrice: row.currentPrice,
        newPrice: Number(row.newPrice),
      }))
      .filter(
        (row) =>
          Number.isFinite(row.newPrice) &&
          row.newPrice >= 0 &&
          Number(row.currentPrice ?? -1) !== Number(row.newPrice),
      );

    if (!changed.length) {
      setUpdatePriceError("No price changes to save.");
      return;
    }

    setIsUpdatePriceSaving(true);
    try {
      await updateStockPrices({
        updates: changed.map((item) => ({
          productId: item.productId,
          newPrice: item.newPrice,
        })),
        effectiveDate: updatePriceEffectiveDate,
        reason: updatePriceReason,
      });

      setUpdatePriceSuccess("Prices updated successfully.");
      closeUpdatePriceModal();
      setFilters((prev) => ({ ...prev }));
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update prices.";
      setUpdatePriceError(message);
    } finally {
      setIsUpdatePriceSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        p={3}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Typography color="error">
          {(error as Error)?.message || "Failed to load stock dashboard"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        fontWeight={600}
        mb={3}
        sx={{ fontSize: "1.125rem", lineHeight: "1.75rem" }}
      >
        Stock Management
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            label="Search Product"
            placeholder="Search product"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            sx={{ minWidth: 220 }}
          />

          <TextField
            select
            size="small"
            label="Stock Area"
            value={filters.stockAreaId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                stockAreaId: e.target.value,
              }))
            }
            sx={{ minWidth: 220 }}
            disabled={isAreasLoading}
          >
            <MenuItem value="">All Stock</MenuItem>
            {stockAreas.map((area) => (
              <MenuItem key={area.id} value={String(area.id)}>
                {area.name}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddStockModal}
            sx={{ borderRadius: 2 }}
          >
            Add Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<UpdateIcon />}
            sx={{ borderRadius: 2 }}
            onClick={openUpdatePriceModal}
          >
            Update Price
          </Button>
          {/* <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            sx={{ borderRadius: 2 }}
          >
            Price History
          </Button> */}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            mt: 2,
            justifyContent: "flex-start",
          }}
        >
          <TextField
            size="small"
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={filters.startDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />

          <TextField
            size="small"
            type="date"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            value={filters.endDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                endDate: e.target.value,
              }))
            }
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {stats.map((item, i) => (
          <Box
            key={i}
            sx={{
              flex: "1 1 300px",
            }}
          >
            <Card sx={{ borderRadius: 3 }}>
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Box sx={{ background: item.color, p: 1.5, borderRadius: 2 }}>
                  <Typography sx={{ fontSize: "1.25rem", lineHeight: 1 }}>
                    {item.icon}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    color="text.secondary"
                    sx={{ fontSize: ".875rem", lineHeight: "1.25rem" }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    fontWeight={600}
                    sx={{ fontSize: "1.5rem", lineHeight: "2rem" }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 16, height: 16 }}
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </Box>
            <Typography
              fontWeight={600}
              sx={{ fontSize: "1rem", lineHeight: "1.5rem" }}
            >
              Stock Details
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              px: 2,
              py: 1.5,
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: "20px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Box flex={1.7}>Category</Box>
            <Box flex={1} textAlign="center">
              Opening
            </Box>
            <Box flex={1} textAlign="center">
              Sales
            </Box>
            <Box flex={1.2} textAlign="center">
              Sales Return
            </Box>
            <Box flex={1} textAlign="center">
              Purchase
            </Box>
            <Box flex={1.4} textAlign="center">
              Purchase Return
            </Box>
            <Box flex={1.2} textAlign="center">
              Defective
            </Box>
            <Box flex={1.2} textAlign="center">
              System Stock
            </Box>
            <Box flex={1.3} textAlign="center">
              Closing Stock
            </Box>
            <Box flex={1.6} textAlign="center">
              Total Empty Cylinder
            </Box>
          </Box>

          <Box
            ref={parentRef}
            sx={{
              height: 320,
              overflow: "auto",
              position: "relative",
            }}
          >
            <Box
              sx={{
                height: rowVirtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = stockDetails[virtualRow.index];
                if (!row) return null;

                if (
                  virtualRow.index >= stockDetails.length - 2 &&
                  hasNextPage &&
                  !isFetchingNextPage
                ) {
                  fetchNextPage();
                }

                return (
                  <Box
                    key={virtualRow.key}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: "flex",
                      px: 2,
                      alignItems: "center",
                      fontSize: "14px",
                      lineHeight: "20px",
                      borderBottom: "1px solid #f1f5f9",
                      bgcolor: "white",
                    }}
                  >
                    <Box flex={1.7} fontWeight={500}>
                      {row.category}
                    </Box>
                    <Box flex={1} textAlign="center">
                      {row.opening}
                    </Box>
                    <Box flex={1} textAlign="center" sx={{ color: "red" }}>
                      {row.sales}
                    </Box>
                    <Box flex={1.2} textAlign="center" sx={{ color: "green" }}>
                      {row.salesReturn}
                    </Box>
                    <Box flex={1} textAlign="center" sx={{ color: "green" }}>
                      {row.purchase}
                    </Box>
                    <Box flex={1.4} textAlign="center" sx={{ color: "red" }}>
                      {row.purchaseReturn}
                    </Box>
                    <Box
                      flex={1.2}
                      textAlign="center"
                      sx={{ color: "#f97316" }}
                    >
                      {row.defective}
                    </Box>
                    <Box flex={1.2} textAlign="center" fontWeight={600}>
                      {row.systemStock}
                    </Box>
                    <Box
                      flex={1.3}
                      textAlign="center"
                      fontWeight={600}
                      sx={{ color: "#2463eb" }}
                    >
                      {row.closingStock}
                    </Box>
                    <Box
                      flex={1.6}
                      textAlign="center"
                      sx={{ color: "#f97316" }}
                    >
                      {row.emptyCylinders}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {isFetchingNextPage && (
            <Box textAlign="center" py={2}>
              <CircularProgress size={22} />
            </Box>
          )}
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          mt: 2,
        }}
      >
        {progressData.map((item, i) => {
          const percent = Math.min((item.value / item.capacity) * 100, 100);

          return (
            <Box key={i} sx={{ flex: "1 1 48%" }}>
              <Card sx={{ p: 2, borderRadius: 3 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Inventory2OutlinedIcon fontSize="small" color="primary" />
                    <Typography fontWeight={500}>{item.name}</Typography>
                  </Box>
                  <Chip
                    label={`${item.value} Full`}
                    color={percent > 70 ? "primary" : "error"}
                    size="small"
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{ mt: 1.5, height: 8, borderRadius: 5 }}
                />

                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption">Empty: {item.empty}</Typography>
                  <Typography variant="caption">Full: {item.value}</Typography>
                </Box>
              </Card>
            </Box>
          );
        })}
      </Box>

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              sx={{ width: 16, height: 16 }}
            >
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="m21 8-4-4-4 4" />
              <path d="M17 4v16" />
            </Box>
            <Typography
              fontWeight={600}
              sx={{ fontSize: "1rem", lineHeight: "1.5rem" }}
            >
              Stock Movement
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              px: 2,
              py: 1.5,
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "14px",
              lineHeight: "20px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Box flex={1.2}>Date</Box>
            <Box flex={1}>Type</Box>
            <Box flex={2}>Item</Box>
            <Box flex={1} textAlign="center">
              Qty
            </Box>
            <Box flex={1.2}>By</Box>
          </Box>

          {movements.map((m: StockMovement, i: number) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                px: 2,
                py: 1.5,
                alignItems: "center",
                fontSize: "14px",
                lineHeight: "20px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <Box flex={1.2}>{new Date(m.date).toLocaleString()}</Box>
              <Box flex={1}>
                <Chip
                  label={m.type}
                  color={m.type === "Purchase" ? "primary" : "default"}
                  size="small"
                />
              </Box>
              <Box flex={2}>{m.item}</Box>
              <Box flex={1} textAlign="center">
                {m.qty}
              </Box>
              <Box flex={1.2}>{m.by}</Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* RECENT STOCK ENTRIES */}
      <Card
        sx={{ borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", mt: 3 }}
      >
        <CardContent>
          <Typography
            fontWeight={600}
            sx={{ fontSize: "1rem", lineHeight: "1.5rem", mb: 2 }}
          >
            Recent Stock Entries
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 780 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: "20px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Box flex={1.3}>Date</Box>
                <Box flex={1.2}>Category</Box>
                <Box flex={1.3}>Item</Box>
                <Box flex={1.1}>Location</Box>
                <Box flex={0.6} textAlign="center">
                  Qty
                </Box>
                <Box flex={0.9} textAlign="right">
                  Price (₹)
                </Box>
                <Box flex={1.6}>Note</Box>
              </Box>

              {recentEntries.length ? (
                recentEntries.map((e: StockEntry, i: number) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      alignItems: "center",
                      fontSize: "14px",
                      lineHeight: "20px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <Box flex={1.3} sx={{ whiteSpace: "nowrap" }}>
                      {new Date(e.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Box>
                    <Box flex={1.2} sx={{ color: "text.secondary" }}>
                      {e.category}
                    </Box>
                    <Box flex={1.3}>{e.item}</Box>
                    <Box flex={1.1}>{e.location}</Box>
                    <Box flex={0.6} textAlign="center">
                      {e.qty}
                    </Box>
                    <Box
                      flex={0.9}
                      textAlign="right"
                      sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      {e.price == null
                        ? "—"
                        : `₹${e.price.toLocaleString("en-IN")}`}
                    </Box>
                    <Box
                      flex={1.6}
                      sx={{ color: "text.secondary", wordBreak: "break-word" }}
                    >
                      {e.note || "—"}
                    </Box>
                  </Box>
                ))
              ) : (
                <Box
                  sx={{
                    px: 2,
                    py: 4,
                    textAlign: "center",
                    color: "text.secondary",
                    fontSize: "14px",
                  }}
                >
                  No stock entries yet. Use “Add Stock” to create one.
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={isUpdatePriceOpen}
        onClose={closeUpdatePriceModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Update Prices</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              maxHeight: 420,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 2,
            }}
          >
            {isUpdatePriceLoading ? (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              Object.entries(groupedPriceRows).map(([category, rows]) => (
                <Box key={category} sx={{ borderBottom: "1px solid #e5e7eb" }}>
                  <Box sx={{ px: 1.5, py: 1, bgcolor: "#f8fafc" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: 0.3,
                      }}
                    >
                      {category.toUpperCase()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.8,
                      display: "grid",
                      gridTemplateColumns: "2.2fr 1fr 1fr",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Item
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      Current
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      New Price (₹)
                    </Typography>
                  </Box>

                  {rows.map((row) => (
                    <Box
                      key={row.id}
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        display: "grid",
                        gridTemplateColumns: "2.2fr 1fr 1fr",
                        gap: 1,
                        alignItems: "center",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.currentPrice == null
                          ? "-"
                          : `₹${row.currentPrice}`}
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={row.newPrice}
                        onChange={(e) =>
                          handleUpdatePriceInputChange(row.id, e.target.value)
                        }
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Effective Date
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={updatePriceEffectiveDate}
                onChange={(e) => setUpdatePriceEffectiveDate(e.target.value)}
                sx={{ mt: 0.4 }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Reason (optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={updatePriceReason}
                onChange={(e) => setUpdatePriceReason(e.target.value)}
                sx={{ mt: 0.4 }}
                placeholder="Govt revision, supplier change, etc."
              />
            </Box>
          </Box>

          {updatePriceError ? (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: "block" }}
            >
              {updatePriceError}
            </Typography>
          ) : null}

          {updatePriceSuccess ? (
            <Typography
              variant="caption"
              color="success.main"
              sx={{ mt: 1, display: "block" }}
            >
              {updatePriceSuccess}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeUpdatePriceModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveUpdatedPrices}
            disabled={isUpdatePriceSaving}
          >
            {isUpdatePriceSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAddStockOpen}
        onClose={closeAddStockModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Add Stock</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mt: 0.5,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Category
              </Typography>
              <Autocomplete
                options={categoryOptions}
                loading={isCategoryLoading}
                value={selectedCategory}
                inputValue={categorySearch}
                onInputChange={(_, value) => {
                  setCategorySearch(value);
                }}
                onChange={(_, value) => {
                  setSelectedCategory(value);
                  setSelectedItem(null);
                  setItemSearch("");
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Search category"
                    sx={{ mt: 0.4 }}
                  />
                )}
              />
              {!isCategoryCreatorOpen ? (
                <Button
                  size="small"
                  sx={{ mt: 0.5, textTransform: "none", px: 0 }}
                  onClick={() => {
                    setIsCategoryCreatorOpen(true);
                    setIsItemCreatorOpen(false);
                    setModalError("");
                  }}
                >
                  + Add new category...
                </Button>
              ) : null}
            </Box>

            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Item
              </Typography>
              <Autocomplete
                options={itemOptions}
                loading={isItemsLoading}
                value={selectedItem}
                inputValue={itemSearch}
                onInputChange={(_, value) => {
                  setItemSearch(value);
                }}
                onChange={(_, value) => {
                  setSelectedItem(value);
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={!selectedCategory}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder={
                      selectedCategory ? "Search item" : "Select category first"
                    }
                    sx={{ mt: 0.4 }}
                  />
                )}
              />
              {selectedCategory && !isItemCreatorOpen ? (
                <Button
                  size="small"
                  sx={{ mt: 0.5, textTransform: "none", px: 0 }}
                  onClick={() => {
                    setIsItemCreatorOpen(true);
                    setIsCategoryCreatorOpen(false);
                    setModalError("");
                  }}
                >
                  + Add new item...
                </Button>
              ) : null}
            </Box>
          </Box>

          {isCategoryCreatorOpen ? (
            <Box
              sx={{
                mt: 1.5,
                p: 1.2,
                border: "1px solid #e5e7eb",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                Create category and first item
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <TextField
                  size="small"
                  placeholder="Item name"
                  value={newCategoryItemName}
                  onChange={(e) => setNewCategoryItemName(e.target.value)}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 1,
                }}
              >
                <Button
                  size="small"
                  onClick={() => {
                    setIsCategoryCreatorOpen(false);
                    setNewCategoryName("");
                    setNewCategoryItemName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveNewCategoryWithItem}
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : null}

          {isItemCreatorOpen ? (
            <Box
              sx={{
                mt: 1.5,
                p: 1.2,
                border: "1px solid #e5e7eb",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                Add item for selected category
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 1,
                }}
              >
                <Button
                  size="small"
                  onClick={() => {
                    setIsItemCreatorOpen(false);
                    setNewItemName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveNewItem}
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : null}

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Location
              </Typography>
              <TextField
                select
                size="small"
                fullWidth
                value={modalStockAreaId}
                onChange={(e) => setModalStockAreaId(e.target.value)}
                sx={{ mt: 0.4 }}
              >
                {stockAreas.map((area) => (
                  <MenuItem key={area.id} value={String(area.id)}>
                    {area.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Quantity
              </Typography>
              <TextField
                size="small"
                type="number"
                fullWidth
                value={modalQuantity}
                onChange={(e) => setModalQuantity(e.target.value)}
                sx={{ mt: 0.4 }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                Price per unit (₹)
              </Typography>
              <TextField
                size="small"
                type="number"
                fullWidth
                value={modalPrice}
                onChange={(e) => setModalPrice(e.target.value)}
                sx={{ mt: 0.4 }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
            >
              Note (optional)
            </Typography>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              sx={{ mt: 0.4 }}
              placeholder="Supplier, invoice no., etc."
            />
          </Box>

          {isContextLoading ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Fetching quantity and price from backend...
            </Typography>
          ) : null}

          {modalError ? (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: "block" }}
            >
              {modalError}
            </Typography>
          ) : null}

          {modalSuccess ? (
            <Typography
              variant="caption"
              color="success.main"
              sx={{ mt: 1, display: "block" }}
            >
              {modalSuccess}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeAddStockModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveStockEntry}
            disabled={isModalSaving}
          >
            {isModalSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
