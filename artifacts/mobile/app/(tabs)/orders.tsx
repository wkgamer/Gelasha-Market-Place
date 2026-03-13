import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  confirmed: { color: "#22C55E", bg: "#F0FDF4", icon: "checkmark-circle", label: "Confirmed" },
  processing: { color: "#F59E0B", bg: "#FFFBEB", icon: "time", label: "Processing" },
  shipped: { color: "#0EA5E9", bg: "#F0F9FF", icon: "airplane", label: "Shipped" },
  delivered: { color: "#8B5CF6", bg: "#F5F3FF", icon: "checkmark-done", label: "Delivered" },
  cancelled: { color: "#EF4444", bg: "#FEF2F2", icon: "close-circle", label: "Cancelled" },
};

interface Order {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    brand: string;
    price: number;
  } | null;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [user])
  );

  async function fetchOrders() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders?userId=${user.id}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Error fetching orders", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerCount}>{orders.length} orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 60 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="package" size={52} color={Colors.light.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your purchase history will appear here</Text>
          <Pressable style={styles.shopBtn} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchOrders}
          refreshing={loading}
          renderItem={({ item }) => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.confirmed;
            return (
              <Pressable
                style={styles.orderCard}
                onPress={() => item.product && router.push(`/product/${item.product.id}`)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{item.id.slice(-8).toUpperCase()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                </View>

                <View style={styles.orderContent}>
                  {item.product && (
                    <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} contentFit="cover" />
                  )}
                  <View style={styles.orderInfo}>
                    <Text style={styles.productBrand}>{item.product?.brand || "Unknown"}</Text>
                    <Text style={styles.productName} numberOfLines={2}>{item.product?.name || "Product"}</Text>
                    <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  headerCount: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  listContent: { padding: 16, gap: 12 },
  orderCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    gap: 12,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  orderContent: { flexDirection: "row", gap: 12, alignItems: "center" },
  productImage: {
    width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.light.backgroundSecondary,
  },
  orderInfo: { flex: 1, gap: 3 },
  productBrand: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.tint, textTransform: "uppercase" },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text, lineHeight: 20 },
  quantityText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  orderFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.light.borderLight,
  },
  dateText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  totalPrice: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.light.backgroundSecondary, alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, textAlign: "center" },
  shopBtn: {
    backgroundColor: Colors.light.tint, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32, marginTop: 8,
  },
  shopBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
