import { Redirect } from "expo-router";

export default function HistoryScreen() {
  // Activity history is now merged into Profile
  return <Redirect href="/(tabs)/profile" />;
}
