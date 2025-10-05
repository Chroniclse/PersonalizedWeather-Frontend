import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import Slider from "@react-native-community/slider";
// If you use Expo Router, keep this import; otherwise delete it.
import { router } from "expo-router";

type HourDatum = { hourLabel: string; tempF: number; condition: "Clear" | "Clouds" | "Rain" | "Snow" | "Thunder" };

const Colors = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  text: "#1F1F1F",
  subtext: "#6B7280",
  border: "#E5E7EB",
  tint: "#1F2937",     // dark charcoal for big numbers
  accent: "#EE4444",   // red orb accent
  good: "#10B981",
};

const HOURLY: HourDatum[] = [
  { hourLabel: "Now", tempF: 74, condition: "Clear" },
  { hourLabel: "1h", tempF: 75, condition: "Clear" },
  { hourLabel: "2h", tempF: 77, condition: "Clear" },
  { hourLabel: "3h", tempF: 79, condition: "Clear" },
  { hourLabel: "4h", tempF: 78, condition: "Clouds" },
  { hourLabel: "5h", tempF: 73, condition: "Clouds" },
  { hourLabel: "6h", tempF: 68, condition: "Rain" },
];

export default function Landing() {
  const [idx, setIdx] = useState(0);

  const hour = HOURLY[idx];
  const orbColor = useMemo(() => {
    switch (hour.condition) {
      case "Clear": return Colors.accent;          // red/orange
      case "Clouds": return "#9CA3AF";             // gray
      case "Rain": return "#3B82F6";               // blue
      case "Snow": return "#93C5FD";
      case "Thunder": return "#A855F7";
    }
  }, [hour]);

  return (
    <SafeAreaView style={styles.root}>
      {/* top row: profile */}
      <TouchableOpacity
        accessibilityLabel="Open profile"
        style={styles.profileBtn}
        onPress={() => router.push?.("/profile")}
      >
        <View style={styles.profileCircle}>
          <Text style={{ color: Colors.text, fontWeight: "700" }}>🙂</Text>
        </View>
        <Text style={styles.profileText}>profile</Text>
      </TouchableOpacity>

      {/* time slider */}
      <View style={styles.sliderCard}>
        <Text style={styles.sliderLabel}>Time</Text>
        <Slider
          value={idx}
          minimumValue={0}
          maximumValue={HOURLY.length - 1}
          step={1}
          minimumTrackTintColor={Colors.tint}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.tint}
          onValueChange={(v) => setIdx(v as number)}
        />
        <View style={styles.sliderFooter}>
          <Text style={styles.sliderTick}>{HOURLY[0].hourLabel}</Text>
          <Text style={styles.sliderTick}>{HOURLY[Math.floor((HOURLY.length - 1) / 2)].hourLabel}</Text>
          <Text style={styles.sliderTick}>{HOURLY[HOURLY.length - 1].hourLabel}</Text>
        </View>
      </View>

      {/* big circle / weather image placeholder */}
      <View style={[styles.orbWrap]}>
        <View style={[styles.orb, { backgroundColor: orbColor }]} />
        <Text style={styles.bigTemp}>{hour.tempF}</Text>
        <Text style={styles.condition}>{hour.condition}</Text>
      </View>

      {/* plan button */}
      <TouchableOpacity
        style={styles.planBtn}
        onPress={() => router.push?.("/planner")}
        activeOpacity={0.9}
      >
        <Text style={styles.planText}>Plan an Event</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 8, android: 24 }),
  },

  // profile
  profileBtn: {
    alignSelf: "flex-end",
    alignItems: "center",
  },
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

  // slider
  sliderCard: {
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  sliderLabel: { color: Colors.subtext, fontSize: 13, marginBottom: 6 },
  sliderFooter: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderTick: { color: Colors.subtext, fontSize: 12 },

  // orb + readouts
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
  condition: { fontSize: 22, fontWeight: "700", color: Colors.text, marginTop: -6 },

  // plan button
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
});
