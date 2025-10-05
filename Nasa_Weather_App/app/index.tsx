// app/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from "react-native";
import * as Location from "expo-location";

type Profile = {
  name: string;
  age: number;
  gender: string;
  race: string;
  allergies: string;
  skinTone: number; // 0..1
};

// stub – replace with your real profile context later
const demoProfile: Profile = {
  name: "Demo User",
  age: 18,
  gender: "female",
  race: "asian",
  allergies: "pollen, dust",
  skinTone: 0.35,
};

type Weather = {
  tempF: number;
  condition: string;
  hourly: number[]; // next 12 hours
  alerts: string[];
};

// TODO: swap for real provider (Open-Meteo/WeatherKit/Tomorrow)
async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  // mock so screen renders immediately
  return {
    tempF: 78,
    condition: "Clear",
    hourly: [54, 61, 66, 70, 73, 74, 75, 77, 79, 78, 72, 68],
    alerts: [],
  };
}

const Colors = {
  bg: "#FAFAFA",
  text: "#1F1F1F",
  subtext: "#6B7280",
  card: "#FFFFFF",
  tint: "#1F2937",     // charcoal (numbers)
  accent: "#EE4444",   // red orb accent
  border: "#E5E7EB",
  good: "#10B981",
};

export default function HomeScreen() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [wx, setWx] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCoords({ lat, lon });
      const data = await fetchWeather(lat, lon);
      setWx(data);
      setLoading(false);
    })();
  }, []);

  const advice = useMemo(() => {
    if (!wx) return "";
    const out: string[] = [];
    out.push(wx.tempF >= 75 ? "T-shirt" : wx.tempF >= 60 ? "Light jacket" : "Warm layers");
    if (demoProfile.allergies.toLowerCase().includes("pollen")) out.push("Allergy med");
    if (wx.condition.toLowerCase().includes("clear") && demoProfile.skinTone < 0.5) out.push("SPF");
    return out.join(" · ");
  }, [wx]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <View style={[styles.card, { alignItems: "center", paddingTop: 24 }]}>
        {/* Red orb */}
        <View style={styles.orb} />
        <Text style={styles.bigTemp}>
          {loading ? "" : wx ? `${wx.tempF}` : "--"}
        </Text>
        <Text style={styles.condition}>{wx ? wx.condition : loading ? "" : "—"}</Text>
        <Text style={styles.subtitle}>Swipe for the forecast</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today’s advice</Text>
        {loading ? <ActivityIndicator /> : <Text style={styles.body}>{advice || "We’ll advise once weather loads."}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hourly (next 12h)</Text>
        {wx ? (
          <View style={styles.hourRow}>
            {wx.hourly.map((t, i) => (
              <View key={i} style={styles.hourPill}>
                <Text style={styles.hourText}>{t}°</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.subtle}>Waiting for forecast…</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.mono}>
          {coords ? `lat ${coords.lat.toFixed(4)}, lon ${coords.lon.toFixed(4)}` : "Location not granted"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  orb: {
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: Colors.accent,
    marginBottom: 12,
    shadowColor: Colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  bigTemp: {
    fontSize: 120,
    fontWeight: "800",
    color: Colors.tint,
    letterSpacing: -4,
    lineHeight: 120,
  },
  condition: { fontSize: 28, fontWeight: "800", color: Colors.text, marginTop: -6, marginBottom: 8, textAlign: "center" },
  subtitle: { color: Colors.subtext, fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  body: { color: Colors.text, fontSize: 15 },
  subtle: { color: Colors.subtext, fontSize: 13 },
  hourRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hourPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  hourText: { color: Colors.text, fontWeight: "600" },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) as any, color: Colors.text },
});
