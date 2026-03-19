import {
  Building2,
  MapPin,
  Navigation,
  CreditCard,
  Mail,
  Phone,
} from "lucide-react-native";
import { router } from "expo-router";
import React from "react";
import {
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
  const { user } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 40 },
        ]}
      >
        {user?.siteName && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Information</Text>
            <InfoRow Icon={Building2} label="NAME" value="Gelasha Engineers" />
            {user.siteAddress && (
              <InfoRow
                Icon={MapPin}
                label="Address"
                value="115/1 , MAHADEV ASTATE , RAMOL POLICE CHOKI , RAMOL , AHMEDABAD"
              />
            )}
            {user.transportAddress &&
              user.transportAddress !== user.siteAddress && (
                <InfoRow
                  Icon={Navigation}
                  label="Transport Address"
                  value="115/1 , MAHADEV ASTATE , RAMOL POLICE CHOKI , RAMOL , AHMEDABAD"
                />
              )}
            {user.gstNumber && (
              <InfoRow
                Icon={CreditCard}
                label="GST Number"
                value="24AJFPP8025Q1ZO"
              />
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <InfoRow
            Icon={Mail}
            label="Email ID"
            value="gelashaengineers@yahoo.co.in"
          />
          {user?.mobile1 && (
            <InfoRow Icon={Phone} label="Mobile NUMBER" value="9426368359" />
          )}
          {user?.mobile2 && (
            <InfoRow
              Icon={Phone}
              label="Optional Mobile NUMBER"
              value="9879818915"
            />
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.browseButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.browseButtonText}>Return To Main Page</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<any>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon size={16} color={Colors.light.textMuted} />
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
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoContent: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  browseButton: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
