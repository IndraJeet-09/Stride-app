import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth/context";

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    setNavReady(true);
  }, []);

  useEffect(() => {
    if (!navReady || isLoading) return;

    const inLoginScreen = segments[0] === "login";

    if (!isAuthenticated && !inLoginScreen) {
      router.replace("/login" as any);
    } else if (isAuthenticated && inLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, navReady]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#090909", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#090909" },
        animation: "default",
      }}
    >
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen
        name="runs/[id]"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#090909" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
