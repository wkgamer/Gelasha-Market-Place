import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad + 24 }]}>
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Gelasha Market Place</Text>
        <Text style={styles.motto}>Technology Is Always Moving Forward</Text>
      </View>

      <View style={styles.illustrationSection}>
        <View style={styles.illustration}>
          <View style={[styles.illustrationCard, { backgroundColor: Colors.light.tintUltraLight, top: 0, left: 20 }]}>
            <View style={styles.illustrationImg} />
            <View style={styles.illustrationLine} />
            <View style={[styles.illustrationLine, { width: "60%", backgroundColor: Colors.light.tintLight }]} />
          </View>
          <View style={[styles.illustrationCard, { backgroundColor: "#FFF7ED", top: 40, right: 20, elevation: 8 }]}>
            <View style={[styles.illustrationImg, { backgroundColor: "#FED7AA" }]} />
            <View style={styles.illustrationLine} />
            <View style={[styles.illustrationLine, { width: "70%", backgroundColor: "#FDBA74" }]} />
          </View>
          <View style={[styles.illustrationCard, { backgroundColor: "#F0FDF4", top: 80, left: 60 }]}>
            <View style={[styles.illustrationImg, { backgroundColor: "#BBF7D0" }]} />
            <View style={styles.illustrationLine} />
            <View style={[styles.illustrationLine, { width: "50%", backgroundColor: "#86EFAC" }]} />
          </View>
        </View>
      </View>

      <View style={styles.tagline}>
        <Text style={styles.taglineText}>Built on 21 Years of</Text>
        <Text style={styles.taglineText}>Pump Manufacturing Experience</Text>
      </View>

      <View style={styles.buttonsSection}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.88 : 1 }]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(auth)/signin")}
        >
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: "center",
    marginTop: 8,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 90,
    height: 90,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    textAlign: "center",
  },
  motto: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.2,
  },
  illustrationSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: 280,
    height: 180,
    position: "relative",
  },
  illustrationCard: {
    position: "absolute",
    width: 120,
    borderRadius: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  illustrationImg: {
    width: "100%",
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.light.tintLight,
    marginBottom: 8,
  },
  illustrationLine: {
    height: 6,
    width: "100%",
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    marginBottom: 4,
  },
  tagline: {
    alignItems: "center",
    marginBottom: 32,
  },
  taglineText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    textAlign: "center",
    lineHeight: 28,
  },
  buttonsSection: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: Colors.light.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  terms: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    marginTop: 4,
  },
});
