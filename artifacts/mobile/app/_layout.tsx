import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  addNotificationResponseReceivedListener,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationHandler,
  type EventSubscription,
} from "expo-notifications";
import { Platform } from "react-native";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

SplashScreen.preventAutoHideAsync();

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const LAST_ORDER_KEY = "operator_last_order_ts";
const POLL_INTERVAL_MS = 30000;

async function requestLocalPermission() {
  if (Platform.OS === "web") return false;
  const { status: existing } = await getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await requestPermissionsAsync();
  return status === "granted";
}

async function checkForNewOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders/all`);
    if (!res.ok) return;
    const orders: { createdAt: string }[] = await res.json();
    if (orders.length === 0) return;

    const latestTs = orders[0].createdAt;
    const storedTs = await AsyncStorage.getItem(LAST_ORDER_KEY);

    if (!storedTs) {
      await AsyncStorage.setItem(LAST_ORDER_KEY, latestTs);
      return;
    }

    if (new Date(latestTs) > new Date(storedTs)) {
      await AsyncStorage.setItem(LAST_ORDER_KEY, latestTs);
      await scheduleNotificationAsync({
        content: {
          title: "New Purchase Order",
          body: "You received a new purchase order.",
          data: { screen: "operator/orders" },
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (e) {
    console.log("Order poll error", e);
  }
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/(auth)/welcome");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user || user.role !== "operator") return;

    requestLocalPermission().then((granted) => {
      if (!granted) return;
      checkForNewOrders();
      pollRef.current = setInterval(checkForNewOrders, POLL_INTERVAL_MS);
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user]);

  useEffect(() => {
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string };
      if (data?.screen === "operator/orders") {
        router.push("/operator/orders");
      }
    });
    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="operator" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
