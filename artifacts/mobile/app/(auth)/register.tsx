import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth, SignUpData } from "@/context/AuthContext";

const APP_USAGES = ["Manufacturing", "Construction", "Agriculture", "Mining", "Transport", "Chemical", "Food Processing", "Other"];
const FUEL_TYPES = ["Diesel", "Petrol", "Electric", "CNG", "LPG", "Other"];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { signUp } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [transportAddress, setTransportAddress] = useState("");
  const [copyAddress, setCopyAddress] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [mobile1, setMobile1] = useState("");
  const [mobile2, setMobile2] = useState("");

  // Step 3
  const [appUsage, setAppUsage] = useState("");
  const [fuelType, setFuelType] = useState("");

  function validateStep1() {
    if (!username.trim()) return "Username is required";
    if (!email.trim() || !email.includes("@")) return "Valid email is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  }

  function validateStep2() {
    if (!siteName.trim()) return "Site name is required";
    if (!siteAddress.trim()) return "Site address is required";
    if (!mobile1.trim() || mobile1.length < 10) return "Valid mobile number is required";
    return "";
  }

  function handleNext() {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const data: SignUpData = {
        username: username.trim(),
        email: email.trim(),
        password,
        siteName: siteName.trim(),
        siteAddress: siteAddress.trim(),
        transportAddress: copyAddress ? siteAddress.trim() : transportAddress.trim(),
        gstNumber: gstNumber.trim(),
        mobile1: mobile1.trim(),
        mobile2: mobile2.trim(),
        appUsage: appUsage,
        fuelType: fuelType,
      };
      await signUp(data);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["Personal", "Business", "Optional"];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 8 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>

        <Text style={styles.title}>Create Account</Text>

        {/* Step Indicators */}
        <View style={styles.stepIndicator}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, i + 1 <= step && styles.stepCircleActive]}>
                  {i + 1 < step ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNum, i + 1 <= step && styles.stepNumActive]}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, i + 1 <= step && styles.stepLabelActive]}>{s}</Text>
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.stepLine, i + 1 < step && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <View style={styles.form}>
            <InputField label="Full Name *" icon="person-outline" value={username} onChangeText={setUsername} placeholder="Your full name" />
            <InputField label="Email Address *" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={Colors.light.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.light.textMuted} />
                </Pressable>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verify Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.light.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                />
                <Pressable onPress={() => setShowConfirm((v) => !v)}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.light.textMuted} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <View style={styles.form}>
            <InputField label="Site / Company Name *" icon="business-outline" value={siteName} onChangeText={setSiteName} placeholder="Your business name" />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Site Address *</Text>
              <View style={[styles.inputWrapper, { height: 80, alignItems: "flex-start", paddingVertical: 12 }]}>
                <Ionicons name="location-outline" size={18} color={Colors.light.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Full site address"
                  placeholderTextColor={Colors.light.textMuted}
                  value={siteAddress}
                  onChangeText={(v) => { setSiteAddress(v); if (copyAddress) setTransportAddress(v); }}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Transport Address *</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.copyLabel}>Same as site</Text>
                  <Switch
                    value={copyAddress}
                    onValueChange={(v) => {
                      setCopyAddress(v);
                      if (v) setTransportAddress(siteAddress);
                    }}
                    trackColor={{ false: Colors.light.border, true: Colors.light.tintLight }}
                    thumbColor={copyAddress ? Colors.light.tint : "#fff"}
                  />
                </View>
              </View>
              <View style={[styles.inputWrapper, { height: 80, alignItems: "flex-start", paddingVertical: 12, opacity: copyAddress ? 0.6 : 1 }]}>
                <Ionicons name="navigate-outline" size={18} color={Colors.light.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Transport address"
                  placeholderTextColor={Colors.light.textMuted}
                  value={copyAddress ? siteAddress : transportAddress}
                  onChangeText={setTransportAddress}
                  multiline
                  numberOfLines={3}
                  editable={!copyAddress}
                />
              </View>
            </View>
            <InputField label="GST Number" icon="card-outline" value={gstNumber} onChangeText={setGstNumber} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" />
            <InputField label="Mobile Number 1 *" icon="call-outline" value={mobile1} onChangeText={setMobile1} placeholder="10-digit mobile number" keyboardType="phone-pad" />
            <InputField label="Mobile Number 2 (Optional)" icon="call-outline" value={mobile2} onChangeText={setMobile2} placeholder="Alternate number" keyboardType="phone-pad" />
          </View>
        )}

        {/* Step 3: Optional */}
        {step === 3 && (
          <View style={styles.form}>
            <Text style={styles.sectionNote}>These details help us show relevant products (optional)</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Where do you use it?</Text>
              <View style={styles.chipGrid}>
                {APP_USAGES.map((u) => (
                  <Pressable
                    key={u}
                    style={[styles.chip, appUsage === u && styles.chipActive]}
                    onPress={() => setAppUsage(appUsage === u ? "" : u)}
                  >
                    <Text style={[styles.chipText, appUsage === u && styles.chipTextActive]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>What fuel do you use?</Text>
              <View style={styles.chipGrid}>
                {FUEL_TYPES.map((f) => (
                  <Pressable
                    key={f}
                    style={[styles.chip, fuelType === f && styles.chipActive]}
                    onPress={() => setFuelType(fuelType === f ? "" : f)}
                  >
                    <Text style={[styles.chipText, fuelType === f && styles.chipTextActive]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          {step < 3 ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleNext}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Create Account</Text>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </>
              )}
            </Pressable>
          )}
        </View>

        <Pressable style={styles.switchBtn} onPress={() => router.replace("/(auth)/signin")}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label, icon, value, onChangeText, placeholder,
  keyboardType, autoCapitalize, multiline
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && { height: 80, alignItems: "flex-start", paddingVertical: 12 }]}>
        <Ionicons name={icon as any} size={18} color={Colors.light.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || "words"}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginLeft: -8,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  stepCircleActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint,
  },
  stepNum: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textMuted,
  },
  stepNumActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textMuted,
  },
  stepLabelActive: {
    color: Colors.light.tint,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.border,
    marginBottom: 20,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.light.tint,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  form: {
    gap: 16,
  },
  sectionNote: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    backgroundColor: Colors.light.tintUltraLight,
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tintUltraLight,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: Colors.light.tintDark,
  },
  buttonRow: {
    marginTop: 28,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
  switchBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  switchLink: {
    color: Colors.light.tint,
    fontFamily: "Inter_600SemiBold",
  },
});
