import { Ionicons, Feather } from "@expo/vector-icons";
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
  const [quantity, setQuantity] = useState(1);
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
    } catch (e) {
      console.log("Error fetching likes", e);
    }
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
        body: JSON.stringify({ userId: user.id, productId: product.id, quantity }),
      });
      if (res.ok) {
        setPurchased(true);
        if (Platform.OS !== "web") {
          Alert.alert(
            "Order Placed!",
            `Your order for ${product.name} (Qty: ${quantity}) has been confirmed.`,
            [{ text: "View Orders", onPress: () => { router.dismiss(); router.replace("/(tabs)/orders"); } }, { text: "Continue Shopping", onPress: () => router.dismiss() }]
          );
        }
      }
    } catch (e) {
      console.log("Error placing order", e);
    } finally {
      setPurchasing(false);
    }
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
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

  const allImages = product.images.length > 0 ? product.images : [product.imageUrl];
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad + 120 }}>
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

          {/* Top Controls */}
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

          {/* Image Dots */}
          {allImages.length > 1 && (
            <View style={styles.imageDots}>
              {allImages.map((_, i) => (
                <View key={i} style={[styles.imageDot, i === activeImage && styles.imageDotActive]} />
              ))}
            </View>
          )}

          {/* Discount Badge */}
          {product.discount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}% OFF</Text>
            </View>
          ) : null}
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

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
            {savings > 0 && (
              <View style={styles.savingsBadge}>
                <Ionicons name="pricetag" size={11} color="#22C55E" />
                <Text style={styles.savingsText}>Save {formatPrice(savings)}</Text>
              </View>
            )}
          </View>

          {/* Stock Status */}
          <View style={[styles.stockRow, { backgroundColor: product.inStock ? "#F0FDF4" : "#FEF2F2" }]}>
            <Ionicons
              name={product.inStock ? "checkmark-circle" : "close-circle"}
              size={16}
              color={product.inStock ? "#22C55E" : Colors.light.error}
            />
            <Text style={[styles.stockText, { color: product.inStock ? "#22C55E" : Colors.light.error }]}>
              {product.inStock ? "In Stock - Ready to Ship" : "Currently Out of Stock"}
            </Text>
          </View>

          {/* Quantity */}
          {product.inStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <Pressable
                  style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={18} color={quantity <= 1 ? Colors.light.textMuted : Colors.light.text} />
                </Pressable>
                <Text style={styles.qtyNum}>{quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Ionicons name="add" size={18} color={Colors.light.text} />
                </Pressable>
                <Text style={styles.totalCalc}>
                  = {formatPrice(product.price * quantity)}
                </Text>
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Highlights */}
          <View style={styles.highlightsSection}>
            <Text style={styles.sectionTitle}>Why Choose This?</Text>
            <View style={styles.highlights}>
              <HighlightItem icon="shield-checkmark" text="ISI / BIS Certified Quality" />
              <HighlightItem icon="refresh" text="Easy Return Policy" />
              <HighlightItem icon="car" text="Fast Pan-India Delivery" />
              <HighlightItem icon="headset" text="24/7 Technical Support" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buy Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad + 16 }]}>
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
                <Ionicons name="bag-add" size={20} color="#fff" />
                <Text style={styles.purchaseBtnText}>
                  {product.inStock ? `Purchase Now • ${formatPrice(product.price * quantity)}` : "Out of Stock"}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function HighlightItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.highlightItem}>
      <View style={styles.highlightIcon}>
        <Ionicons name={icon as any} size={16} color={Colors.light.tint} />
      </View>
      <Text style={styles.highlightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  imageSection: {
    position: "relative",
    height: 380,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: 380,
  },
  imageControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  controlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  imageDotActive: {
    backgroundColor: "#fff",
    width: 18,
  },
  discountBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: Colors.light.error,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  contentSection: {
    padding: 20,
    gap: 12,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryTag: {
    backgroundColor: Colors.light.tintUltraLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tintDark,
  },
  brandText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
  },
  productName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    lineHeight: 30,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 1,
  },
  ratingNum: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#F59E0B",
  },
  reviewCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  originalPrice: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    textDecorationLine: "line-through",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#22C55E",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stockText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  quantitySection: {
    gap: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyNum: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    minWidth: 30,
    textAlign: "center",
  },
  totalCalc: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.tintDark,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 4,
  },
  descSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  highlightsSection: {
    gap: 12,
  },
  highlights: {
    gap: 10,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.tintUltraLight,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  purchaseBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  purchaseBtnDisabled: {
    backgroundColor: Colors.light.textMuted,
    shadowOpacity: 0,
  },
  purchaseBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  purchasedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
  },
  purchasedText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#22C55E",
  },
});
