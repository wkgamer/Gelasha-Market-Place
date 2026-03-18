import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { user } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 40 },
        ]}
      >
        {/* Business Information */}
        {user?.siteName && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>COMPANY Information</Text>

            <InfoRow
              icon="business-outline"
              label="NAME"
              value="Gelasha Engineers"
            />

            {user.siteAddress && (
              <InfoRow
                icon="location-outline"
                label="Address"
                value="115/1 , MAHADEV ASTATE , RAMOL POLICE CHOKI , RAMOL , AHMEDABAD"
              />
            )}

            {user.gstNumber && (
              <InfoRow
                icon="card-outline"
                label="GST Number"
                value="24AJFPP8025Q1ZO"
              />
            )}
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <InfoRow
            icon="mail-outline"
            label="Email ID"
            value="gelashaengineers@yahoo.co.in"
          />

          {user?.mobile1 && (
            <InfoRow
              icon="call-outline"
              label="Mobile NUMBER"
              value="9426368359 , 9879818915"
            />
          )}
          <InfoRow
            icon="globe-outline"
            label="WEBSITE PAGE"
            value="gelashaengineers.com"
          />
        </View>

        {/* Browse Products */}
        <View style={styles.card}>
          <Pressable
            style={styles.actionRow}
            onPress={() => router.replace("/(tabs)")}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIcon}>
                <Feather name="shopping-bag" size={18} color="#c52240" />
              </View>
              <Text style={styles.actionLabel}>Return To Main Page</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.light.textMuted}
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  infoContent: {
    flex: 1,
    gap: 2,
  },

  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textMuted,
    textTransform: "uppercase",
  },

  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fdf0f2",
    alignItems: "center",
    justifyContent: "center",
  },

  actionLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
});
