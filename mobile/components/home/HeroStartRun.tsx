import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Play, ArrowRight } from "lucide-react-native";
import { triggerHaptic } from "@/lib/haptics";

export function HeroStartRun() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    triggerHaptic("medium");
    router.push("/run");
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel="Start Running Now"
        accessibilityHint="Opens full screen live GPS run tracker"
      >
        <View style={styles.leftContent}>
          <View style={styles.playIconBox}>
            <Play size={22} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.headline}>START RUN</Text>
            <Text style={styles.subheadline}>Tap to record live GPS activity</Text>
          </View>
        </View>

        <View style={styles.arrowIconWrap}>
          <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#C2410C",
    borderWidth: 2,
    borderColor: "#EA580C",
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: "#C2410C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    gap: 3,
  },
  headline: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  subheadline: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  arrowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
});
