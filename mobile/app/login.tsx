import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Play, ArrowRight } from "lucide-react-native";
import { useAuth } from "@/lib/auth/context";
import { triggerHaptic } from "@/lib/haptics";

export default function LoginScreen() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);



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

  const handleLogin = async () => {
    triggerHaptic("medium");
    setIsLoadingLogin(true);
    try {
      await login();
    } catch {} finally {
      setIsLoadingLogin(false);
    }
  };

  const [isLoadingLogin, setIsLoadingLogin] = React.useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoBox}>
            <Play size={32} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.brandName}>STRIDE</Text>
          <Text style={styles.brandTagline}>Track every step. Own every mile.</Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={isLoadingLogin}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Auth0"
            >
              {isLoadingLogin ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>GET STARTED</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.legal}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  brandSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#C2410C",
    borderWidth: 2,
    borderColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C2410C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 6,
  },
  brandTagline: {
    color: "#71717A",
    fontSize: 15,
    fontFamily: "monospace",
    fontWeight: "600",
    textAlign: "center",
  },
  ctaSection: {
    gap: 16,
    alignItems: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    borderRadius: 16,
    backgroundColor: "#C2410C",
    borderWidth: 2,
    borderColor: "#EA580C",
    gap: 10,
    shadowColor: "#C2410C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    width: "100%",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  legal: {
    color: "#52525B",
    fontSize: 11,
    fontFamily: "monospace",
    textAlign: "center",
    lineHeight: 16,
  },
});
