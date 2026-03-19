import { Heart, Star } from "lucide-react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  brand: string;
  discount?: number;
  inStock: boolean;
}

export default function LikedScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchLiked();
    }, [user])
  );

  async function fetchLiked() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/likes?userId=${user.id}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Error fetching likes", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeLike(productId: string) {
    if (!user) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId }),
      });
    } catch (e) {
      console.log("Error removing like", e);
      fetchLiked();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <Text style={styles.headerCount}>{products.length} items</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 60 }} />
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Heart size={52} color={Colors.light.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Tap the heart on any product to save it here</Text>
          <Pressable style={styles.shopBtn} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/product/${item.id}`)}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>{item.brand}</Text>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.cardRating}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>{item.rating} ({item.reviewCount})</Text>
                </View>
                {!item.inStock && (
                  <View style={styles.outOfStockBadge}>
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  </View>
                )}
              </View>
              <Pressable style={styles.removeBtn} onPress={() => removeLike(item.id)}>
                <Heart size={22} color={Colors.light.error} fill={Colors.light.error} />
              </Pressable>
            </Pressable>
          )}
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
  card: {
    backgroundColor: "#fff", borderRadius: 16, flexDirection: "row", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardImage: { width: 110, height: 110 },
  cardInfo: { flex: 1, padding: 12, justifyContent: "center", gap: 4 },
  cardBrand: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.tint, textTransform: "uppercase" },
  cardName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text, lineHeight: 18 },
  cardRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  outOfStockBadge: { backgroundColor: "#FEF2F2", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  outOfStockText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.error },
  removeBtn: { padding: 12, justifyContent: "flex-start", alignItems: "center" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.light.backgroundSecondary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, textAlign: "center" },
  shopBtn: { backgroundColor: Colors.light.tint, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  shopBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
