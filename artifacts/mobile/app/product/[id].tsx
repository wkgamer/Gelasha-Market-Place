import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  image?: string;
  group?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  brand: string;
  discount?: number;
  variants: ProductVariant[];
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  // Multi-variant: one selection per group
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
  const [activeImage, setActiveImage] = useState(0);
  const imageListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchProduct();
    fetchLiked();
  }, [id]);

  async function fetchProduct() {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`);
      const data = await res.json();
      setProduct(data);
    } catch (e) {
      console.log("Error fetching product", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiked() {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/likes?userId=${user.id}`);
      const data: Product[] = await res.json();
      setLiked(data.some((p) => p.id === id));
    } catch (e) {}
  }

  async function toggleLike() {
    if (!user) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: id }),
      });
    } catch (e) {
      setLiked(!newLiked);
    }
  }

  async function handlePurchase() {
    if (!user || !product) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPurchasing(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        setPurchased(true);
        const variantSummary = Object.values(selectedVariants).map((v) => v.name).join(", ");
        if (Platform.OS !== "web") {
          Alert.alert(
            "Order Placed!",
            `Your order for ${product.name}${variantSummary ? ` (${variantSummary})` : ""} has been confirmed.`,
            [
              { text: "View Orders", onPress: () => { router.dismiss(); router.replace("/(tabs)/orders"); } },
              { text: "Continue Shopping", onPress: () => router.dismiss() },
            ]
          );
        }
      }
    } catch (e) {
      console.log("Error placing order", e);
    } finally {
      setPurchasing(false);
    }
  }

  function handleVariantSelect(variant: ProductVariant) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    const groupName = variant.group || "Choose Variant";

    setSelectedVariants((prev) => {
      const alreadySelected = prev[groupName]?.id === variant.id;
      if (alreadySelected) {
        const updated = { ...prev };
        delete updated[groupName];
        return updated;
      }
      return { ...prev, [groupName]: variant };
    });

    // Scroll to variant image
    if (variant.image) {
      const allImgs = getAllImages();
      const idx = allImgs.indexOf(variant.image);
      if (idx >= 0) {
        setActiveImage(idx);
        imageListRef.current?.scrollToIndex({ index: idx, animated: true });
      }
    }
  }

  function getAllImages(): string[] {
    if (!product) return [];
    const base = product.images.length > 0 ? product.images : [product.imageUrl];
    const variantImgs = (product.variants || [])
      .filter((v) => v.image && !base.includes(v.image))
      .map((v) => v.image!);
    return [...base, ...variantImgs];
  }

  function getVariantGroups(): { group: string; variants: ProductVariant[] }[] {
    if (!product?.variants?.length) return [];
    const grouped: Record<string, ProductVariant[]> = {};
    for (const v of product.variants) {
      const g = v.group || "Choose Variant";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(v);
    }
    return Object.entries(grouped).map(([group, variants]) => ({ group, variants }));
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const allImages = getAllImages();
  const variantGroups = getVariantGroups();
  const hasVariants = variantGroups.length > 0;
  const selectedCount = Object.keys(selectedVariants).length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 110 }}>

        {/* Image Slider */}
        <View style={styles.imageSection}>
          <FlatList
            ref={imageListRef}
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(idx);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.productImage} contentFit="cover" />
            )}
          />

          <View style={[styles.imageControls, { top: topPad + 12 }]}>
            <Pressable style={styles.controlBtn} onPress={() => router.dismiss()}>
              <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={toggleLike}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? Colors.light.error : Colors.light.text}
              />
            </Pressable>
          </View>

          {allImages.length > 1 && (
            <View style={styles.imageDots}>
              {allImages.map((_, i) => (
                <View key={i} style={[styles.imageDot, i === activeImage && styles.imageDotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.contentSection}>
          {/* Category & Brand */}
          <View style={styles.tagRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{product.category}</Text>
            </View>
            <Text style={styles.brandText}>{product.brand}</Text>
          </View>

          {/* Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(product.rating) ? "star" : "star-outline"}
                  size={14}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={styles.ratingNum}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
          </View>

          {/* Amazon-style Multi-Variant Groups */}
          {hasVariants && variantGroups.map(({ group, variants }) => {
            const groupSelected = selectedVariants[group];
            return (
              <View key={group} style={styles.variantGroupSection}>
                <View style={styles.variantGroupHeader}>
                  <Text style={styles.variantGroupLabel}>{group}:</Text>
                  {groupSelected && (
                    <Text style={styles.variantSelectedLabel}>{groupSelected.name}</Text>
                  )}
                </View>
                <View style={styles.variantGrid}>
                  {variants.map((variant) => {
                    const isSelected = selectedVariants[group]?.id === variant.id;
                    return (
                      <Pressable
                        key={variant.id}
                        style={[styles.variantBtn, isSelected && styles.variantBtnActive]}
                        onPress={() => handleVariantSelect(variant)}
                      >
                        {variant.image ? (
                          <Image source={{ uri: variant.image }} style={styles.variantBtnImg} contentFit="cover" />
                        ) : null}
                        <Text style={[styles.variantBtnName, isSelected && styles.variantBtnNameActive]}>
                          {variant.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Selected summary */}
          {selectedCount > 0 && (
            <View style={styles.selectionSummary}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.light.tint} />
              <Text style={styles.selectionSummaryText}>
                Selected: {Object.entries(selectedVariants).map(([g, v]) => `${g}: ${v.name}`).join("  •  ")}
              </Text>
            </View>
          )}

          {/* Stock Status */}
          <View style={[styles.stockRow, { backgroundColor: product.inStock ? "#F0FDF4" : "#FEF2F2" }]}>
            <Ionicons
              name={product.inStock ? "checkmark-circle" : "close-circle"}
              size={16}
              color={product.inStock ? "#22C55E" : Colors.light.error}
            />
            <Text style={[styles.stockText, { color: product.inStock ? "#22C55E" : Colors.light.error }]}>
              {product.inStock ? "In Stock — Ready to Ship" : "Currently Out of Stock"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buy Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 14 }]}>
        {purchased ? (
          <View style={styles.purchasedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={styles.purchasedText}>Order Placed Successfully!</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.purchaseBtn,
              !product.inStock && styles.purchaseBtnDisabled,
              { opacity: pressed || purchasing ? 0.85 : 1 },
            ]}
            onPress={handlePurchase}
            disabled={!product.inStock || purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="bag-personal-outline" size={20} color="#fff" />
                <Text style={styles.purchaseBtnText}>
                  {product.inStock ? "Purchase Now" : "Out of Stock"}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },

  imageSection: { position: "relative", height: 340, backgroundColor: Colors.light.backgroundSecondary },
  productImage: { width: SCREEN_WIDTH, height: 340 },
  imageControls: {
    position: "absolute", left: 0, right: 0, flexDirection: "row",
    justifyContent: "space-between", paddingHorizontal: 16, zIndex: 10,
  },
  controlBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  imageDots: {
    position: "absolute", bottom: 10, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 5,
  },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  imageDotActive: { backgroundColor: "#fff", width: 18 },

  contentSection: { padding: 18, gap: 14 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  categoryTag: {
    backgroundColor: Colors.light.tintUltraLight, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.tintDark },
  brandText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  productName: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text, lineHeight: 30 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingStars: { flexDirection: "row", gap: 1 },
  ratingNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#F59E0B" },
  reviewCount: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },

  variantGroupSection: { gap: 10 },
  variantGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  variantGroupLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.light.text },
  variantSelectedLabel: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.tintDark,
    backgroundColor: Colors.light.tintUltraLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  variantGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  variantBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: Colors.light.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#fff",
  },
  variantBtnActive: {
    borderColor: Colors.light.tint, backgroundColor: Colors.light.tintUltraLight, borderWidth: 2,
  },
  variantBtnImg: { width: 28, height: 28, borderRadius: 5, backgroundColor: Colors.light.border },
  variantBtnName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  variantBtnNameActive: { color: Colors.light.tintDark },

  selectionSummary: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.light.tintUltraLight, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.light.tintLight,
  },
  selectionSummaryText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.tintDark, lineHeight: 20,
  },

  stockRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  stockText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  divider: { height: 1, backgroundColor: Colors.light.borderLight },
  descSection: { gap: 8 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 22 },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", paddingHorizontal: 18, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.light.borderLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  purchaseBtn: {
    backgroundColor: Colors.light.tint, borderRadius: 14, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  purchaseBtnDisabled: { backgroundColor: Colors.light.textMuted, shadowOpacity: 0 },
  purchaseBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  purchasedBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#F0FDF4", borderRadius: 14, paddingVertical: 15,
    borderWidth: 1.5, borderColor: "#BBF7D0",
  },
  purchasedText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#22C55E" },
});
