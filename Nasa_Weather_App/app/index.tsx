import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
} from "react-native";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { fetchOpenMeteo } from "@/lib/openMeteo";
import { SafeAreaView } from "react-native-safe-area-context";

type HourDatum = {
  hourLabel: string;
  tempF: number;
  condition: "Clear" | "Clouds" | "Rain" | "Snow" | "Thunder" | "Unknown";
};

const Colors = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  text: "#1F1F1F",
  subtext: "#6B7280",
  border: "#E5E7EB",
  tint: "#1F2937",
  accent: "#EE4444",
  good: "#10B981",
};

export default function Landing() {
  const [idx, setIdx] = useState(0);
  const [hourlyData, setHourlyData] = useState<HourDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackW, setTrackW] = useState(0);
  const [bubbleW, setBubbleW] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const bubbleVal = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const maxIdx = Math.max(hourlyData.length - 1, 1);

  const onSlide = (v: number) => {
    setIdx(v);
    Animated.timing(bubbleVal, {
      toValue: v,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const onSlidingStart = () => {
    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };

  const onSlidingComplete = (v?: number) => {
    if (typeof v === "number") setIdx(v);
    Animated.timing(bubbleOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  // --- Fetch data ---
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission is required to load weather.");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const data = await fetchOpenMeteo(loc.coords.latitude, loc.coords.longitude);

        // hourly_units isn't part of the strict OpenMeteoResponse type here; cast to any for safety
        const unit = (((data as any)?.hourly_units?.temperature_2m) ?? "°C").toUpperCase();

        const hours: HourDatum[] = data.hourly.time
          .slice(0, 24)
          .map((iso: string, i: number) => {
            const raw = data.hourly.temperature_2m[i];
            const tempF = unit.includes("F") ? Math.round(raw) : Math.round((raw * 9) / 5 + 32);
            const label = new Date(iso).toLocaleTimeString([], { hour: "numeric", hour12: true });
            const condition = mapWeatherCode(data.hourly.weathercode[i]);
            return { hourLabel: label, tempF, condition };
          });

        if (!hours.length) {
          setError("No hourly data returned.");
          return;
        }
        setHourlyData(hours);
        setIdx(0);
      } catch (e: any) {
        setError(`Failed to fetch weather: ${e?.message ?? "unknown error"}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Animate bubble position when idx changes programmatically ---
  useEffect(() => {
    Animated.timing(bubbleVal, { toValue: idx, duration: 0, useNativeDriver: false }).start();
  }, [idx]);

  const hour = hourlyData[idx];

  const orbColor = useMemo(() => {
    if (!hour) return Colors.tint;
    switch (hour.condition) {
      case "Clear":
        return Colors.accent;
      case "Clouds":
        return "#9CA3AF";
      case "Rain":
        return "#3B82F6";
      case "Snow":
        return "#93C5FD";
      case "Thunder":
        return "#A855F7";
      default:
        return Colors.tint;
    }
  }, [hour]);

  // --- Guards ---
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.subtle}>Loading weather…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || hourlyData.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? "No data."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace?.(((router as any).asPath ?? "/") as any)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* profile */}
      <TouchableOpacity accessibilityLabel="Open profile" style={styles.profileBtn} onPress={() => router.push?.(("/profile" as any))}>
        <View style={styles.profileCircle}>
          <Text style={{ color: Colors.text, fontWeight: "700" }}>🙂</Text>
        </View>
        <Text style={styles.profileText}>profile</Text>
      </TouchableOpacity>

      {/* --- Time Slider --- */}
      <View style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>Time</Text>

        <View style={styles.sliderTrackWrap} onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}>
          {/* Animated tooltip above thumb */}
          {trackW > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bubble,
                {
                  opacity: bubbleOpacity,
                  transform: [
                    {
                      translateX: bubbleVal.interpolate({
                        inputRange: [0, maxIdx],
                        outputRange: [-(bubbleW / 2), Math.max(trackW - 32 - bubbleW / 2, 0)],
                        extrapolate: "clamp",
                      }),
                    },
                    // pop up a bit more when appearing
                    { translateY: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                    // slightly overscale for a noticeable pop
                    { scale: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) },
                  ],
                },
              ]}
            >
              <View style={styles.bubbleInner} onLayout={(e: LayoutChangeEvent) => setBubbleW(e.nativeEvent.layout.width)}>
                <Text style={styles.bubbleTime}>{hourlyData[idx]?.hourLabel ?? "--"}</Text>
              </View>
            </Animated.View>
          )}

          <Slider
            style={{ width: "100%" }}
            value={idx}
            minimumValue={0}
            maximumValue={maxIdx}
            step={1}
            minimumTrackTintColor={Colors.tint}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.tint}
            onValueChange={(v) => onSlide(v as number)}
            onSlidingStart={onSlidingStart}
            onSlidingComplete={(v) => onSlidingComplete(v as number)}
          />
        </View>
      </View>

      {/* --- Orb and Weather Info --- */}
      <View style={[styles.orbWrap]}>
        <View style={[styles.orb, { backgroundColor: orbColor }]} />
        <Text style={styles.bigTemp}>{hour.tempF}</Text>
        <Text style={styles.condition}>{hour.condition}</Text>
      </View>
      {/* --- Plan button --- */}
          <TouchableOpacity
            style={styles.planBtn}
            activeOpacity={0.9}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.planText}>Plan an Event</Text>
          </TouchableOpacity>

          {/* --- Popup Modal --- */}
          <Modal
            transparent
            animationType="fade"
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setModalVisible(false)}
            >
    <View style={styles.choiceMenu}>
      <TouchableOpacity
        style={styles.choiceBtn}
        onPress={() => {
          setModalVisible(false);
          router.push("/planner");
        }}
      >
        <Text style={styles.choiceText}>Future Event</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.choiceBtn}
        onPress={() => {
          setModalVisible(false);
          router.push("/right_now");
        }}
      >
        <Text style={styles.choiceText}>Right Now</Text>
      </TouchableOpacity>
    </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// --- Helper ---
function mapWeatherCode(code: number): HourDatum["condition"] {
  if ([0, 1].includes(code)) return "Clear";
  if ([2, 3].includes(code)) return "Clouds";
  if ([45, 48].includes(code)) return "Clouds";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Unknown";
}

// --- Styles ---
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 8, android: 24 }),
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  subtle: { color: Colors.subtext, marginTop: 8 },
  error: {
    color: Colors.accent,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.tint,
    backgroundColor: Colors.card,
  },
  retryText: { color: Colors.tint, fontWeight: "700" },

  // Profile
  profileBtn: { alignSelf: "flex-end", alignItems: "center" },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { color: Colors.subtext, fontSize: 12, marginTop: 4 },

  // Slider
  sliderCard: {
    marginTop: 8,
    width: "80%",
    alignSelf: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  sliderLabel: { color: Colors.subtext, fontSize: 13, marginBottom: 6 },
  sliderTrackWrap: {
    position: "relative",
    width: "100%",
    justifyContent: "center",
  },

  // Bubble (Time Only)
  bubble: {
    position: "absolute",
    top: -64,
    left: 16,
  },
  bubbleInner: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleTime: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "700",
    textAlign: "center",
  },

  // Orb + Info
  orbWrap: { alignItems: "center", marginTop: 28, marginBottom: 24 },
  orb: {
    width: 260,
    height: 260,
    borderRadius: 130,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    marginBottom: 10,
  },
  bigTemp: {
    fontSize: 120,
    fontWeight: "800",
    color: Colors.tint,
    letterSpacing: -4,
    lineHeight: 118,
  },
  condition: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginTop: -6,
  },
 planBtn: {
    marginTop: "auto",
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.tint,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
  },
  planText: { color: Colors.tint, fontSize: 20, fontWeight: "800", letterSpacing: 0.3 },

  // --- Modal / Choice Menu ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  choiceMenu: {
    width: 250,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceBtn: {
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  choiceText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.tint,
  },
});