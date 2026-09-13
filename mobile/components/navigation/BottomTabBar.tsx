import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, User } from "lucide-react-native";
import { triggerHaptic } from "@/lib/haptics";

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabRoutes = [
    { name: "index", label: "Home", icon: Home },
    { name: "profile", label: "Profile", icon: User },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.bar}>
        {tabRoutes.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          const isFocused = state.index === routeIndex;
          const Icon = tab.icon;

          const onPress = () => {
            triggerHaptic("selection");
            const event = navigation.emit({
              type: "tabPress",
              target: state.routes[routeIndex]?.key ?? tab.name,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={`${tab.label} Tab`}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  size={24}
                  color={isFocused ? "#EA580C" : "#A1A1AA"}
                  strokeWidth={isFocused ? 2.6 : 2}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? "#EA580C" : "#A1A1AA",
                    fontWeight: isFocused ? "900" : "700",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#090909",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#111111",
    borderTopWidth: 1.5,
    borderTopColor: "#262626",
    height: 68,
    paddingHorizontal: 28,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  iconWrapper: {
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
