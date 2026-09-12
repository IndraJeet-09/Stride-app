import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function CallbackScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // On web, expo-auth-session handles the callback via window messaging.
    // This route just ensures the redirect URI exists.
    if (typeof window !== "undefined") {
      WebBrowser.maybeCompleteAuthSession();
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#090909" }}>
      <ActivityIndicator size="large" color="#EA580C" />
    </View>
  );
}
