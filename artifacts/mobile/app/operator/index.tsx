import {
  ArrowLeft, Bell, Plus, PackageCheck, ChevronRight,
  Pencil, Trash2, Folder, ImageOff, X, PlusCircle, Image as ImageIcon,
} from "lucide-react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

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
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  images: string[];
  brand: string;
  inStock: boolean;
  discount?: number;
  variants: ProductVariant[];
  description: string;
}

const EMPTY_FORM = {
  name: "", description: "", price: "", originalPrice: "",
  category: "", imageUrl: "", brand: "", inStock: true,
};

export default function OperatorPanel() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [categories, setCategories] = useState<string[]>([]);
  const [newOrderCount, setNewOrderCount] = useState(0);

  const [form, setForm] = useState(EMPTY_FORM);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({ name: "", price: "", image: "", group: "" });
  const [previewUrl, setPreviewUrl] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      fetchOrderCount();
    }, [])
  );

  async function fetchAll() {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/products/categories`),
      ]);
      const prods = await prodRes.json();
      const cats = await catRes.json();
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.log("Error fetching", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchOrderCount() {
    try {
      const res = await fetch(`${API_BASE}/orders/all`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const last24h = data.filter((o) => {
          const d = new Date(o.createdAt);
          return Date.now() - d.getTime() < 24 * 60 * 60 * 1000;
        });
        setNewOrderCount(last24h.length);
      }
    } catch (e) {}
  }

  function openAddModal() {
    setForm(EMPTY_FORM);
    setVariants([]);
    setNewVariant({ name: "", price: "", image: "", group: "" });
    setPreviewUrl("");
    setImagePreviewError(false);
    setEditProduct(null);
    setModalVisible(true);
  }

  function openEditModal(product: Product) {
    setForm({
      name: product.name, description: product.description,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      category: product.category, imageUrl: product.imageUrl,
      brand: product.brand, inStock: product.inStock,
    });
    setVariants(product.variants || []);
    setNewVariant({ name: "", price: "", image: "", group: "" });
    setPreviewUrl(product.imageUrl || "");
    setImagePreviewError(false);
    setEditProduct(product);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price || !form.category.trim() || !form.imageUrl.trim() || !form.brand.trim() || !form.description.trim()) {
      Alert.alert("Missing Fields", "Please fill in Name, Description, Price, Category, Image URL, and Brand.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), description: form.description.trim(),
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        category: form.category.trim(), imageUrl: form.imageUrl.trim(),
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        brand: form.brand.trim(), inStock: form.inStock, variants,
      };
      let res: Response;
      if (editProduct) {
        res = await fetch(`${API_BASE}/products/${editProduct.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API_BASE}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      if (res.ok) {
        setModalVisible(false);
        await fetchAll();
      } else {
        const err = await res.json();
        Alert.alert("Error", err.error || "Failed to save product");
      }
    } catch (e) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (Platform.OS === "web") {
      const ok = confirm(`Delete "${product.name}"?`);
      if (!ok) return;
      await doDelete(product.id);
      return;
    }
    Alert.alert("Delete Product", `Are you sure you want to delete "${product.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => doDelete(product.id) },
    ]);
  }

  async function doDelete(id: string) {
    try {
      await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      Alert.alert("Error", "Failed to delete product");
    }
  }

  function addVariant() {
    if (!newVariant.name.trim() || !newVariant.price) return;
    const v: ProductVariant = {
      id: Date.now().toString(),
      name: newVariant.name.trim(),
      price: parseFloat(newVariant.price),
      image: newVariant.image.trim() || undefined,
      group: newVariant.group.trim() || undefined,
    };
    setVariants((prev) => [...prev, v]);
    setNewVariant({ name: "", price: "", image: "", group: "" });
  }

  function removeVariant(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function formatPrice(price: number) {
    return `₹${price.toLocaleString("en-IN")}`;
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Operator Panel</Text>
          <Text style={styles.headerSub}>{products.length} products</Text>
        </View>
        <Pressable style={styles.ordersIconBtn} onPress={() => router.push("/operator/orders")}>
          <Bell size={22} color={Colors.light.tint} />
          {newOrderCount > 0 && (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeText}>{newOrderCount > 9 ? "9+" : newOrderCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Plus size={22} color="#fff" />
        </Pressable>
      </View>

      <Pressable style={styles.ordersBanner} onPress={() => router.push("/operator/orders")}>
        <PackageCheck size={22} color={Colors.light.tint} />
        <View style={styles.ordersBannerText}>
          <Text style={styles.ordersBannerTitle}>View All Purchase Orders</Text>
          <Text style={styles.ordersBannerSub}>See client details, order history & contact info</Text>
        </View>
        {newOrderCount > 0 && (
          <View style={styles.ordersBannerBadge}>
            <Text style={styles.ordersBannerBadgeText}>{newOrderCount} new</Text>
          </View>
        )}
        <ChevronRight size={16} color={Colors.light.tint} />
      </Pressable>

      <View style={styles.tabBar}>
        <Pressable style={[styles.tabBtn, tab === "products" && styles.tabBtnActive]} onPress={() => setTab("products")}>
          <Text style={[styles.tabText, tab === "products" && styles.tabTextActive]}>Products</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === "categories" && styles.tabBtnActive]} onPress={() => setTab("categories")}>
          <Text style={[styles.tabText, tab === "categories" && styles.tabTextActive]}>Categories</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 60 }} />
      ) : tab === "products" ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); fetchAll(); }}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={styles.productRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.productThumb} contentFit="cover" />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productMeta}>{item.category} · {item.brand}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  {!item.inStock && (
                    <View style={styles.outOfStockBadge}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                  {item.variants?.length > 0 && (
                    <View style={styles.variantBadge}>
                      <Text style={styles.variantBadgeText}>{item.variants.length} variants</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actionBtns}>
                <Pressable style={styles.editBtn} onPress={() => openEditModal(item)}>
                  <Pencil size={16} color={Colors.light.tint} />
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Trash2 size={16} color={Colors.light.error} />
                </Pressable>
              </View>
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}>
          <View style={styles.catHeader}>
            <Text style={styles.catTitle}>Product Categories</Text>
            <Text style={styles.catSub}>Categories are created automatically when you add products with a new category name.</Text>
          </View>
          {categories.filter((c) => c !== "All").map((cat) => (
            <View key={cat} style={styles.catRow}>
              <Folder size={18} color={Colors.light.tint} />
              <Text style={styles.catName}>{cat}</Text>
              <Text style={styles.catCount}>{products.filter((p) => p.category === cat).length} items</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === "ios" ? 16 : 20 }]}>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={24} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.modalTitle}>{editProduct ? "Edit Product" : "Add New Product"}</Text>
            <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.formSection}>Basic Info</Text>
            <FormField label="Product Name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Industrial Hydraulic Pump 5HP" />
            <FormField label="Brand *" value={form.brand} onChange={(v) => setForm((f) => ({ ...f, brand: v }))} placeholder="e.g. Gelasha Engineering" />
            <FormField label="Category *" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} placeholder="e.g. Pumps & Motors" />
            <FormField label="Description *" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Product details and features..." multiline />

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Product Image URL *</Text>
              <View style={styles.imageInputRow}>
                <TextInput
                  style={[styles.formInput, { flex: 1 }]}
                  value={form.imageUrl}
                  onChangeText={(v) => { setForm((f) => ({ ...f, imageUrl: v })); setImagePreviewError(false); }}
                  placeholder="https://..."
                  placeholderTextColor={Colors.light.textMuted}
                  autoCapitalize="none"
                  onSubmitEditing={() => setPreviewUrl(form.imageUrl)}
                  onBlur={() => setPreviewUrl(form.imageUrl)}
                  returnKeyType="done"
                />
                {form.imageUrl ? (
                  <Pressable style={styles.clearImageBtn} onPress={() => { setForm((f) => ({ ...f, imageUrl: "" })); setPreviewUrl(""); setImagePreviewError(false); }}>
                    <X size={20} color={Colors.light.error} />
                  </Pressable>
                ) : null}
              </View>
              {(previewUrl || form.imageUrl) ? (
                <View style={styles.imagePreviewContainer}>
                  {imagePreviewError ? (
                    <View style={styles.imagePreviewError}>
                      <ImageOff size={28} color={Colors.light.textMuted} />
                      <Text style={styles.imagePreviewErrorText}>Could not load image preview</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: previewUrl || form.imageUrl }}
                      style={styles.imagePreview}
                      contentFit="cover"
                      onError={() => setImagePreviewError(true)}
                    />
                  )}
                </View>
              ) : null}
            </View>

            <Text style={styles.formSection}>Pricing</Text>
            <FormField label="Selling Price ₹ *" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} placeholder="e.g. 45999" keyboardType="decimal-pad" />
            <FormField label="Original Price ₹ (Optional)" value={form.originalPrice} onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))} placeholder="e.g. 52000 (for discount display)" keyboardType="decimal-pad" />

            <View style={styles.stockToggleRow}>
              <Text style={styles.stockToggleLabel}>In Stock</Text>
              <Pressable
                style={[styles.toggleBtn, form.inStock && styles.toggleBtnActive]}
                onPress={() => setForm((f) => ({ ...f, inStock: !f.inStock }))}
              >
                <Text style={[styles.toggleText, form.inStock && styles.toggleTextActive]}>{form.inStock ? "Yes" : "No"}</Text>
              </Pressable>
            </View>

            <Text style={styles.formSection}>Variants (Amazon-style)</Text>
            <Text style={styles.formHint}>Add variants like Pack Size, Grade, HP, etc. Group name groups related variants together (e.g. "Pack Size" groups 1L, 5L, 20L).</Text>

            {variants.length > 0 && (
              <View style={styles.variantList}>
                {variants.map((v) => (
                  <View key={v.id} style={styles.variantRow}>
                    {v.image ? (
                      <Image source={{ uri: v.image }} style={styles.variantThumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.variantThumb, styles.variantThumbPlaceholder]}>
                        <ImageIcon size={16} color={Colors.light.textMuted} />
                      </View>
                    )}
                    <View style={styles.variantRowInfo}>
                      {v.group ? <Text style={styles.variantRowGroup}>{v.group}</Text> : null}
                      <Text style={styles.variantRowName}>{v.name}</Text>
                      <Text style={styles.variantRowPrice}>{formatPrice(v.price)}</Text>
                    </View>
                    <Pressable style={styles.removeVariantBtn} onPress={() => removeVariant(v.id)}>
                      <X size={20} color={Colors.light.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.addVariantSection}>
              <Text style={styles.addVariantTitle}>Add Variant</Text>
              <FormField label="Group Name (Optional)" value={newVariant.group} onChange={(v) => setNewVariant((n) => ({ ...n, group: v }))} placeholder="e.g. Pack Size, Grade, HP Rating" />
              <FormField label="Variant Name *" value={newVariant.name} onChange={(v) => setNewVariant((n) => ({ ...n, name: v }))} placeholder="e.g. 5 Litre, Standard, 2HP" />
              <FormField label="Variant Price ₹ *" value={newVariant.price} onChange={(v) => setNewVariant((n) => ({ ...n, price: v }))} placeholder="e.g. 2500" keyboardType="decimal-pad" />
              <FormField label="Variant Image URL (Optional)" value={newVariant.image} onChange={(v) => setNewVariant((n) => ({ ...n, image: v }))} placeholder="https://... (tapping variant shows this image)" autoCapitalize="none" />
              <Pressable
                style={[styles.addVariantBtn, (!newVariant.name.trim() || !newVariant.price) && { opacity: 0.5 }]}
                onPress={addVariant}
                disabled={!newVariant.name.trim() || !newVariant.price}
              >
                <PlusCircle size={18} color={Colors.light.tint} />
                <Text style={styles.addVariantBtnText}>Add This Variant</Text>
              </Pressable>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function FormField({ label, value, onChange, placeholder, multiline, keyboardType, autoCapitalize }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  multiline?: boolean; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || "sentences"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  ordersIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.light.tintUltraLight, alignItems: "center", justifyContent: "center", position: "relative" },
  badgeDot: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, backgroundColor: Colors.light.error, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#fff" },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.light.tint, alignItems: "center", justifyContent: "center" },
  ordersBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.light.tintUltraLight, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.light.tintLight },
  ordersBannerText: { flex: 1 },
  ordersBannerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.tintDark },
  ordersBannerSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.tint, marginTop: 1 },
  ordersBannerBadge: { backgroundColor: Colors.light.error, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  ordersBannerBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, paddingTop: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.light.backgroundSecondary, borderWidth: 1.5, borderColor: Colors.light.border },
  tabBtnActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  tabTextActive: { color: "#fff" },
  listContent: { padding: 16, gap: 10 },
  productRow: { backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", alignItems: "center", padding: 12, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  productThumb: { width: 70, height: 70, borderRadius: 10, backgroundColor: Colors.light.backgroundSecondary },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  productMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.light.text },
  outOfStockBadge: { backgroundColor: "#FEF2F2", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  outOfStockText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.light.error },
  variantBadge: { backgroundColor: Colors.light.tintUltraLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  variantBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.light.tintDark },
  actionBtns: { gap: 8, alignItems: "center" },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.light.tintUltraLight, alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center" },
  catHeader: { marginBottom: 8, gap: 6 },
  catTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text },
  catSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 20 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  catName: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  catCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight, backgroundColor: "#fff" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text },
  saveBtn: { backgroundColor: Colors.light.tint, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8, minWidth: 60, alignItems: "center" },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalBody: { backgroundColor: "#fff", padding: 20 },
  formSection: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 20, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  formHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginBottom: 14, lineHeight: 18 },
  formField: { marginBottom: 14, gap: 6 },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  formInput: { borderWidth: 1.5, borderColor: Colors.light.border, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.text, backgroundColor: Colors.light.backgroundSecondary },
  formInputMulti: { height: 90, paddingTop: 12, textAlignVertical: "top" },
  imageInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  clearImageBtn: { padding: 4 },
  imagePreviewContainer: { marginTop: 8, borderRadius: 10, overflow: "hidden", borderWidth: 1.5, borderColor: Colors.light.border, height: 160, backgroundColor: Colors.light.backgroundSecondary },
  imagePreview: { width: "100%", height: "100%" },
  imagePreviewError: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  imagePreviewErrorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  stockToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  stockToggleLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.light.border, backgroundColor: Colors.light.backgroundSecondary },
  toggleBtnActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  toggleText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  toggleTextActive: { color: "#fff" },
  variantList: { gap: 8, marginBottom: 16 },
  variantRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.light.backgroundSecondary, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.light.borderLight },
  variantThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.light.border },
  variantThumbPlaceholder: { alignItems: "center", justifyContent: "center" },
  variantRowInfo: { flex: 1 },
  variantRowGroup: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.light.tint, textTransform: "uppercase", letterSpacing: 0.4 },
  variantRowName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  variantRowPrice: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  removeVariantBtn: { padding: 4 },
  addVariantSection: { backgroundColor: Colors.light.tintUltraLight, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.light.tintLight, gap: 4 },
  addVariantTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.tintDark, marginBottom: 8 },
  addVariantBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: Colors.light.tint, borderRadius: 10, paddingVertical: 10, marginTop: 4, backgroundColor: "#fff" },
  addVariantBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.tint },
});
