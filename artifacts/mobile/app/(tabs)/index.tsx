import { Ionicons, Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const BANNERS = [
  { id: "1", title: "Industrial Grade", subtitle: "Pumps & Motors", color: "#0EA5E9", accent: "#BAE6FD", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=80" },
  { id: "2", title: "Safety First", subtitle: "Certified Equipment", color: "#F59E0B", accent: "#FDE68A", image: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80" },
  { id: "3", title: "Best Prices", subtitle: "Up to 30% off", color: "#22C55E", accent: "#BBF7D0", image: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600&q=80" },
];

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

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<FlatList>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
    startAutoSlide();
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, []);

  function startAutoSlide() {
    autoSlideRef.current = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
  }

  async function fetchData() {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/products/categories`),
      ]);
      const prods = await prodsRes.json();
      const cats = await catsRes.json();
      setProducts(prods);
      setFilteredProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.log("Error fetching", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let filtered = products;
    if (activeCategory !== "All") {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(filtered);
  }, [search, activeCategory, products]);

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.username?.split(" ")[0] || "User"}</Text>
          <Text style={styles.headerTitle}>Gelasha Market Place</Text>
        </View>
        <Pressable style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.light.text} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={Colors.light.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor={Colors.light.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banners */}
        <View style={styles.bannerSection}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
              setBannerIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={[styles.banner, { backgroundColor: item.color }]}>
                <View style={styles.bannerContent}>
                  <View style={[styles.bannerBadge, { backgroundColor: item.accent }]}>
                    <Text style={[styles.bannerBadgeText, { color: item.color }]}>GELASHA PICKS</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                </View>
                <Image source={{ uri: item.image }} style={styles.bannerImage} contentFit="cover" />
              </View>
            )}
          />
          <View style={styles.dotContainer}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeCategory === "All" ? "All Products" : activeCategory}
            </Text>
            <Text style={styles.productCount}>{filteredProducts.length} items</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 40 }} />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or category</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onPress={() => router.push(`/product/${product.id}`)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      onPress={onPress}
      style={styles.productCardWrapper}
    >
      <Animated.View style={[styles.productCard, animatedStyle]}>
        <View style={styles.productImageContainer}>
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} contentFit="cover" />
          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockOverlayText}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{product.rating} ({product.reviewCount})</Text>
          </View>
          <Text style={styles.tapToView}>Tap to view details</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const cardWidth = (SCREEN_WIDTH - 48) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bannerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  banner: {
    width: SCREEN_WIDTH - 32,
    height: 160,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    marginRight: 0,
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 6,
  },
  bannerBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  bannerBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    lineHeight: 28,
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
  },
  bannerImage: {
    width: 130,
    height: 160,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
  },
  dotActive: {
    backgroundColor: Colors.light.tint,
    width: 18,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 12,
  },
  productCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryContent: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCardWrapper: {
    width: cardWidth,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 150,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.light.error,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  productInfo: {
    padding: 10,
    gap: 3,
  },
  productBrand: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  outOfStockOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 4,
    alignItems: "center",
  },
  outOfStockOverlayText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  tapToView: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.tint,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
});
