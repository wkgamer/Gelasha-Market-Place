import {
  ArrowLeft, RefreshCw, PackageCheck, ChevronRight, X,
  User, Mail, Phone, Building2, MapPin, Truck, CreditCard, FileText,
} from "lucide-react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: "#22C55E", bg: "#F0FDF4", label: "Confirmed" },
  processing: { color: "#F59E0B", bg: "#FFFBEB", label: "Processing" },
  shipped: { color: "#0EA5E9", bg: "#F0F9FF", label: "Shipped" },
  delivered: { color: "#8B5CF6", bg: "#F5F3FF", label: "Delivered" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2", label: "Cancelled" },
};

interface OrderVariant {
  id: string;
  name: string;
  price: number;
  group?: string;
}

interface ClientInfo {
  id: string;
  username: string;
  email: string;
  siteName?: string;
  siteAddress?: string;
  transportAddress?: string;
  gstNumber?: string;
  mobile1?: string;
  mobile2?: string;
  appUsage?: string;
}

interface Order {
  id: string;
  product: { id: string; name: string; imageUrl: string; brand: string; price: number; category: string } | null;
  client: ClientInfo | null;
  quantity: number;
  totalPrice: number;
  status: string;
  variants: OrderVariant[];
  createdAt: string;
  isNew?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  account: User,
  "email-outline": Mail,
  phone: Phone,
  "phone-outline": Phone,
  "office-building": Building2,
  "map-marker": MapPin,
  truck: Truck,
  "card-text": CreditCard,
  "text-box-outline": FileText,
};

export default function OperatorOrdersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/all`);
      const data: Order[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Error fetching all orders", e);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  function formatDateTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>All Purchase Orders</Text>
          <Text style={styles.headerSub}>{orders.length} total orders</Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={fetchOrders}>
          <RefreshCw size={22} color={Colors.light.tint} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 60 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <PackageCheck size={60} color={Colors.light.textMuted} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Purchase orders from clients will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 40 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchOrders}
          refreshing={loading}
          renderItem={({ item }) => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.confirmed;
            const variantList = item.variants || [];
            return (
              <Pressable style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
                <View style={styles.orderTop}>
                  <View style={styles.orderIdRow}>
                    <Text style={styles.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
                      <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDate}>{formatDateTime(item.createdAt)}</Text>
                </View>

                <View style={styles.orderBody}>
                  {item.product && (
                    <Image source={{ uri: item.product.imageUrl }} style={styles.productImg} contentFit="cover" />
                  )}
                  <View style={styles.orderMid}>
                    <Text style={styles.productName} numberOfLines={1}>{item.product?.name || "Unknown Product"}</Text>
                    <Text style={styles.productMeta}>{item.product?.category} · Qty: {item.quantity}</Text>
                    {variantList.length > 0 && (
                      <Text style={styles.variantSummary}>
                        {variantList.map((v) => v.name).join(" · ")}
                      </Text>
                    )}
                    <Text style={styles.clientName}>{item.client?.username || "Unknown Client"}</Text>
                    {item.client?.siteName && <Text style={styles.clientSite}>{item.client.siteName}</Text>}
                  </View>
                  <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
                </View>

                <View style={styles.viewDetails}>
                  <Text style={styles.viewDetailsText}>Tap to see full client & order details</Text>
                  <ChevronRight size={14} color={Colors.light.tint} />
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <View style={[styles.detailModal, { paddingTop: Platform.OS === "ios" ? 16 : 24 }]}>
            <View style={styles.detailHeader}>
              <Pressable onPress={() => setSelectedOrder(null)}>
                <X size={24} color={Colors.light.text} />
              </Pressable>
              <Text style={styles.detailTitle}>Order Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.detailBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Order Information</Text>
                <DetailRow label="Order ID" value={`#${selectedOrder.id.slice(-8).toUpperCase()}`} />
                <DetailRow label="Date & Time" value={formatDateTime(selectedOrder.createdAt)} />
                <DetailRow label="Status" value={STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status} />
                <DetailRow label="Quantity" value={String(selectedOrder.quantity)} />
                <DetailRow label="Total Amount" value={formatPrice(selectedOrder.totalPrice)} />
              </View>

              {(selectedOrder.variants || []).length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Selected Variants</Text>
                  <View style={styles.variantChips}>
                    {selectedOrder.variants.map((v, i) => (
                      <View key={i} style={styles.variantChip}>
                        <Text style={styles.variantChipText}>
                          {v.group ? `${v.group}: ` : ""}{v.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedOrder.product && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Product Ordered</Text>
                  <View style={styles.productDetailRow}>
                    <Image source={{ uri: selectedOrder.product.imageUrl }} style={styles.productDetailImg} contentFit="cover" />
                    <View style={styles.productDetailInfo}>
                      <Text style={styles.productDetailName}>{selectedOrder.product.name}</Text>
                      <Text style={styles.productDetailMeta}>{selectedOrder.product.brand}</Text>
                      <Text style={styles.productDetailMeta}>{selectedOrder.product.category}</Text>
                      <Text style={styles.productDetailPrice}>{formatPrice(selectedOrder.product.price)} per unit</Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedOrder.client && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Client Information</Text>
                  <DetailRow icon="account" label="Name" value={selectedOrder.client.username} />
                  <DetailRow icon="email-outline" label="Email" value={selectedOrder.client.email} />
                  {selectedOrder.client.mobile1 && <DetailRow icon="phone" label="Mobile 1" value={selectedOrder.client.mobile1} />}
                  {selectedOrder.client.mobile2 && <DetailRow icon="phone-outline" label="Mobile 2" value={selectedOrder.client.mobile2} />}
                  {selectedOrder.client.siteName && <DetailRow icon="office-building" label="Company" value={selectedOrder.client.siteName} />}
                  {selectedOrder.client.siteAddress && <DetailRow icon="map-marker" label="Site Address" value={selectedOrder.client.siteAddress} />}
                  {selectedOrder.client.transportAddress && selectedOrder.client.transportAddress !== selectedOrder.client.siteAddress && (
                    <DetailRow icon="truck" label="Transport Address" value={selectedOrder.client.transportAddress} />
                  )}
                  {selectedOrder.client.gstNumber && <DetailRow icon="card-text" label="GST Number" value={selectedOrder.client.gstNumber} />}
                  {selectedOrder.client.appUsage && (
                    <View style={styles.notesRow}>
                      <FileText size={16} color={Colors.light.textMuted} />
                      <View style={styles.notesContent}>
                        <Text style={styles.detailLabel}>Requirements / Notes</Text>
                        <Text style={styles.notesValue}>{selectedOrder.client.appUsage}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const IconComp = icon ? ICON_MAP[icon] : null;
  return (
    <View style={styles.detailRow}>
      {IconComp ? <IconComp size={16} color={Colors.light.textMuted} /> : <View style={{ width: 16 }} />}
      <View style={styles.detailRowContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.tintUltraLight, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 12 },
  orderCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, gap: 10 },
  orderTop: { gap: 2 },
  orderIdRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderId: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text },
  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  orderDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  orderBody: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  productImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: Colors.light.backgroundSecondary },
  orderMid: { flex: 1, gap: 2 },
  productName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  productMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  variantSummary: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.tintDark, marginTop: 2 },
  clientName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.tint, marginTop: 4 },
  clientSite: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  totalPrice: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.text },
  viewDetails: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.light.borderLight },
  viewDetailsText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.light.tint },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, textAlign: "center" },
  detailModal: { flex: 1, backgroundColor: "#fff" },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  detailTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text },
  detailBody: { padding: 20, gap: 20 },
  detailSection: { gap: 12 },
  detailSectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailRowContent: { flex: 1, gap: 1 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.textMuted, textTransform: "uppercase" },
  detailValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text },
  notesRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  notesContent: { flex: 1, gap: 4 },
  notesValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.text, lineHeight: 20, backgroundColor: Colors.light.tintUltraLight, borderRadius: 8, padding: 10 },
  variantChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  variantChip: { backgroundColor: Colors.light.tintUltraLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.light.tintLight },
  variantChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.tintDark },
  productDetailRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  productDetailImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.light.backgroundSecondary },
  productDetailInfo: { flex: 1, gap: 3 },
  productDetailName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.light.text },
  productDetailMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  productDetailPrice: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.tint, marginTop: 4 },
});
