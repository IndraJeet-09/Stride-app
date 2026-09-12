import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Home, User, Play } from "lucide-react-native";
import { triggerHaptic } from "@/lib/haptics";

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Floating CTA Scale Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const handleStartRun = () => {
    triggerHaptic("medium");
    router.push("/run");
  };

  const tabRoutes = [
    { name: "index", label: "Home", icon: Home },
    { name: "profile", label: "Profile", icon: User },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {/* Symmetrical 2-Tab Navigation Bar */}
      <View style={styles.bar}>
        {tabRoutes.map((tab, idx) => {
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
            <React.Fragment key={tab.name}>
              <TouchableOpacity
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

              {/* Center spacer slot for floating Start Run button */}
              {idx === 0 && <View style={styles.centerSpacer} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* Floating Center Action Button — Mathematically Centered */}
      <View style={styles.centerButtonAnchor} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleStartRun}
            style={styles.floatingButton}
            accessibilityRole="button"
            accessibilityLabel="Start Run Action"
            accessibilityHint="Navigates to the full screen live running tracker"
          >
            <View style={styles.buttonInner}>
              <Play size={26} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        </Animated.View>
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
    justifyContent: "space-between",
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
  centerSpacer: {
    width: 84,
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
  centerButtonAnchor: {
    position: "absolute",
    top: -24,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#C2410C",
    borderWidth: 2,
    borderColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C2410C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonInner: {
    alignItems: "center",
    justifyContent: "center",
  },
});
