import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user, signOut } = useAuth();
  const isOperator = user?.role === "operator";

  async function handleSignOut() {
    if (Platform.OS === "web") {
      await signOut();
      router.replace("/(auth)/welcome");
      return;
    }
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  }

  const initials = user?.username
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, isOperator && styles.avatarCircleOperator]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.username || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
          <View style={[styles.roleBadge, isOperator && styles.roleBadgeOperator]}>
            <Ionicons
              name={isOperator ? "business" : "person"}
              size={12}
              color={isOperator ? "#F59E0B" : Colors.light.tint}
            />
            <Text style={[styles.roleText, isOperator && styles.roleTextOperator]}>
              {isOperator ? "Operator" : "Customer"}
            </Text>
          </View>
        </View>

        {/* Operator Panel */}
        {isOperator && (
          <Pressable
            style={styles.operatorBanner}
            onPress={() => router.push("/operator")}
          >
            <View style={styles.operatorBannerLeft}>
              <Ionicons name="settings" size={24} color="#F59E0B" />
              <View>
                <Text style={styles.operatorBannerTitle}>Operator Panel</Text>
                <Text style={styles.operatorBannerSub}>Add, edit and delete products & variants</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
          </Pressable>
        )}

        {/* Business Info */}
        {user?.siteName && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Information</Text>
            <InfoRow icon="business-outline" label="Company" value={user.siteName} />
            {user.siteAddress && <InfoRow icon="location-outline" label="Site Address" value={user.siteAddress} />}
            {user.transportAddress && user.transportAddress !== user.siteAddress && (
              <InfoRow icon="navigate-outline" label="Transport Address" value={user.transportAddress} />
            )}
            {user.gstNumber && <InfoRow icon="card-outline" label="GST Number" value={user.gstNumber} />}
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <InfoRow icon="mail-outline" label="Email" value={user?.email || ""} />
          {user?.mobile1 && <InfoRow icon="call-outline" label="Mobile 1" value={user.mobile1} />}
          {user?.mobile2 && <InfoRow icon="call-outline" label="Mobile 2" value={user.mobile2} />}
        </View>

        {/* Requirements / Notes */}
        {user?.appUsage && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Requirements</Text>
            <View style={styles.notesBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.light.tint} />
              <Text style={styles.notesText}>{user.appUsage}</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <ActionRow
            icon="package"
            iconColor={Colors.light.tint}
            iconBg={Colors.light.tintUltraLight}
            label="My Orders"
            onPress={() => router.replace("/(tabs)/orders")}
          />
          <ActionRow
            icon="heart-outline"
            iconColor={Colors.light.error}
            iconBg="#FEF2F2"
            label="Wishlist"
            onPress={() => router.replace("/(tabs)/liked")}
          />
          <ActionRow
            icon="shopping-bag"
            iconColor="#22C55E"
            iconBg="#F0FDF4"
            label="Browse Products"
            onPress={() => router.replace("/(tabs)")}
          />
          {isOperator && (
            <ActionRow
              icon="settings"
              iconColor="#F59E0B"
              iconBg="#FFFBEB"
              label="Manage Products"
              onPress={() => router.push("/operator")}
            />
          )}
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Motto</Text>
            <Text style={styles.appInfoValue}>Technology Is Always Moving Forward</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.signOutBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.light.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={Colors.light.textMuted} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon, iconColor, iconBg, label, onPress
}: { icon: string; iconColor: string; iconBg: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionLeft}>
        <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
          {icon === "package" || icon === "shopping-bag" || icon === "settings" ? (
            <Feather name={icon as any} size={18} color={iconColor} />
          ) : (
            <Ionicons name={icon as any} size={18} color={iconColor} />
          )}
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight,
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  content: { padding: 16, gap: 16 },
  avatarSection: {
    alignItems: "center", paddingVertical: 24, backgroundColor: "#fff",
    borderRadius: 20, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.light.tint, alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  avatarCircleOperator: { backgroundColor: "#F59E0B" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.text },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.light.tintUltraLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 4,
  },
  roleBadgeOperator: { backgroundColor: "#FFFBEB" },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.tintDark },
  roleTextOperator: { color: "#D97706" },
  operatorBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: "#FDE68A",
    shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  operatorBannerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  operatorBannerTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#92400E" },
  operatorBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#B45309", marginTop: 2 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: {
    fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoContent: { flex: 1, gap: 1 },
  infoLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.textMuted,
    textTransform: "uppercase", letterSpacing: 0.3,
  },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text },
  notesBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: Colors.light.tintUltraLight, borderRadius: 10, padding: 12,
  },
  notesText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.text, lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4,
  },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  appInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  appInfoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  appInfoValue: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text,
    flex: 1, textAlign: "right", marginLeft: 20,
  },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FEF2F2", borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: "#FECACA",
  },
  signOutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.light.error },
});
