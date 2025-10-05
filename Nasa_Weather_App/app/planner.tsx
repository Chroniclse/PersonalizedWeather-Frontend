// app/planner.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  Switch,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchOpenMeteo } from "@/lib/openMeteo";

type HourCondition = "Clear" | "Clouds" | "Rain" | "Snow" | "Thunder" | "Unknown";
type HourDatum = { iso: string; hourLabel: string; tempF: number; condition: HourCondition };

const Colors = {
  bg: "#F7F7F8",
  card: "#FFFFFF",
  text: "#111827",
  subtext: "#6B7280",
  border: "#E5E7EB",
  tint: "#111827",
  accent: "#F43F5E",
  good: "#10B981",
  warn: "#F59E0B",
  bad: "#EF4444",
};

export const INTENTS = ["Chill", "Workout", "Study Outside", "Picnic", "Sports", "Photography"] as const;
type Intent = string;

export default function Planner() {
  // vibe + custom text
  const [intent, setIntent] = useState<Intent>("Chill");
  const [customEvent, setCustomEvent] = useState<string>("");

  // forecast state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [hourly, setHourly] = useState<HourDatum[]>([]);
  const [idx, setIdx] = useState(12);
  const [notify, setNotify] = useState(true);

  // slider bubble anim
  const [trackW, setTrackW] = useState(0);
  const [bubbleW, setBubbleW] = useState(0);
  const bubbleVal = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const maxIdx = Math.max(hourly.length - 1, 1);

  // fetch 7 days hourly
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission is required.");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const data = await fetchOpenMeteo(loc.coords.latitude, loc.coords.longitude);
        const unit = (((data as any)?.hourly_units?.temperature_2m) ?? "°C").toUpperCase();

        const all: HourDatum[] = data.hourly.time.map((iso: string, i: number) => {
          const raw = data.hourly.temperature_2m[i];
          const tempF = unit.includes("F") ? Math.round(raw) : Math.round((raw * 9) / 5 + 32);
          return {
            iso,
            hourLabel: new Date(iso).toLocaleTimeString([], { hour: "numeric", hour12: true }),
            tempF,
            condition: mapWeatherCode(data.hourly.weathercode[i]),
          };
        });

        const uniqueDays: string[] = [];
        const byDay: Record<string, HourDatum[]> = {};
        for (const h of all) {
          const d = toDayKey(h.iso);
          if (!byDay[d]) {
            byDay[d] = [];
            uniqueDays.push(d);
          }
          byDay[d].push(h);
        }
        const days7 = uniqueDays.slice(0, 7);
        setDays(days7);
        const first = byDay[days7[0]] ?? [];
        setHourly(first);
        setIdx(findNearestHourIndex(first, new Date()));
        setError(null);
      } catch (e: any) {
        setError(`Failed to load forecast: ${e?.message ?? "unknown error"}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // change day
  const changeDay = async (i: number) => {
    setSelectedDayIdx(i);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission is required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const data = await fetchOpenMeteo(loc.coords.latitude, loc.coords.longitude);
      const unit = (((data as any)?.hourly_units?.temperature_2m) ?? "°C").toUpperCase();

      const all: HourDatum[] = data.hourly.time.map((iso: string, k: number) => {
        const raw = data.hourly.temperature_2m[k];
        const tempF = unit.includes("F") ? Math.round(raw) : Math.round((raw * 9) / 5 + 32);
        return {
          iso,
          hourLabel: new Date(iso).toLocaleTimeString([], { hour: "numeric", hour12: true }),
          tempF,
          condition: mapWeatherCode(data.hourly.weathercode[k]),
        };
      });

      const key = days[i];
      const hoursForDay = all.filter((h) => toDayKey(h.iso) === key);
      setHourly(hoursForDay);
      setIdx(findNearestHourIndex(hoursForDay, new Date(key)));
      setError(null);
    } catch (e: any) {
      setError(`Failed to load forecast: ${e?.message ?? "unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // keep bubble synced when idx changes programmatically
  useEffect(() => {
    Animated.timing(bubbleVal, { toValue: idx, duration: 0, useNativeDriver: false }).start();
  }, [idx]);

  // slider handlers
  const onSlide = (v: number) => {
    setIdx(v);
    Animated.timing(bubbleVal, {
      toValue: v,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };
  const onSlidingStart = () =>
    Animated.timing(bubbleOpacity, { toValue: 1, duration: 140, useNativeDriver: false }).start();
  const onSlidingComplete = () =>
    Animated.timing(bubbleOpacity, { toValue: 0, duration: 220, useNativeDriver: false }).start();

  // selections
  const hour = hourly[idx] ?? null;

  // windows + theme color
  const windows = useMemo(() => {
    if (!hourly.length) return [];
    const scored = hourly.map((h, i) => ({ i, h, score: comfortScore(h, intent || customEvent) }));
    const result: typeof scored = [];
    for (const s of scored.sort((a, b) => b.score - a.score)) {
      if (result.length === 0 || Math.abs(s.i - result[result.length - 1].i) >= 2) {
        result.push(s);
      }
      if (result.length === 3) break;
    }
    return result;
  }, [hourly, intent, customEvent]);

  const themeColor = useMemo(() => {
    if (!hour) return Colors.tint;
    switch (hour.condition) {
      case "Clear":
        return Colors.accent;
      case "Clouds":
        return "#64748B";
      case "Rain":
        return "#3B82F6";
      case "Snow":
        return "#60A5FA";
      case "Thunder":
        return "#8B5CF6";
      default:
        return Colors.tint;
    }
  }, [hour]);

  // guards
  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.subtle}>Loading planner…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={[styles.subtle, { color: Colors.bad, fontWeight: "700" }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // safe values for interpolation
  const safeTrack = trackW > 0 ? trackW : 1;
  const safeHalf = Number.isFinite(bubbleW) ? bubbleW / 2 : 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Plan an Event</Text>
        <Text style={styles.subtitle}>Weather-aware, personalized to you.</Text>

        {/* Vibe + custom text */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What’s the vibe?</Text>

          <View style={styles.chipsRow}>
            {INTENTS.map((it) => {
              const isActive = it === intent;
              return (
                <TouchableOpacity
                  key={it}
                  onPress={() => {
                    setIntent(it);
                    setCustomEvent("");
                  }}
                  activeOpacity={0.9}
                  style={[
                    styles.chip,
                    isActive && { backgroundColor: themeColor + "22", borderColor: themeColor },
                  ]}
                >
                  <Text style={[styles.chipText, isActive && { color: themeColor, fontWeight: "700" }]}>{it}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.textInputWrap}>
            <Text style={styles.inputLabel}>Or type your event</Text>
            <TextInput
              value={customEvent}
              onChangeText={setCustomEvent}
              onFocus={() => setIntent("")}
              placeholder="e.g., birthday picnic, sunrise workout, study session…"
              placeholderTextColor="#9CA3AF"
              multiline
              autoCorrect
              autoCapitalize="sentences"
              style={[styles.textInput, { borderColor: themeColor + "55" }]}
            />
          </View>
        </View>

        {/* Day selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pick a day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {days.map((d, i) => {
              const date = new Date(d);
              const label =
                i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString([], { weekday: "short" });
              const active = i === selectedDayIdx;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => changeDay(i)}
                  style={[
                    styles.dayChip,
                    active && { borderColor: themeColor, backgroundColor: themeColor + "12" },
                  ]}
                >
                  <Text style={[styles.dayChipText, active && { color: themeColor }]}>{label}</Text>
                  <Text style={[styles.dayChipSub, active && { color: themeColor }]}>
                    {date.toLocaleDateString([], { month: "short", day: "numeric" })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time slider + bubble */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Time window</Text>
          <View style={styles.sliderWrap} onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}>
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
                          outputRange: [-safeHalf, Math.max(safeTrack - 32 - safeHalf, 0)],
                          extrapolate: "clamp",
                        }),
                      },
                      { translateY: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                      { scale: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) },
                    ],
                  },
                ]}
              >
                <View
                  style={[styles.bubbleInner, { borderColor: themeColor + "66" }]}
                  onLayout={(e: LayoutChangeEvent) => setBubbleW(e.nativeEvent.layout.width)}
                >
                  <Text style={styles.bubbleText}>{hour?.hourLabel ?? "--"}</Text>
                </View>
              </Animated.View>
            )}

            <Slider
              style={{ width: "100%" }}
              value={idx}
              minimumValue={0}
              maximumValue={maxIdx}
              step={1}
              minimumTrackTintColor={themeColor}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={themeColor}
              onValueChange={(v) => onSlide(v as number)}
              onSlidingStart={onSlidingStart}
              onSlidingComplete={onSlidingComplete}
            />
          </View>

          <View style={styles.inline}>
            <Text style={styles.live}>
              {hour?.hourLabel ?? "--"} • {hour?.tempF ?? "--"}°
            </Text>
            <Badge color={themeColor} label={hour?.condition ?? "—"} />
          </View>
        </View>

        {/* Smart windows */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Smart Windows (Top picks)</Text>
          <View style={{ gap: 10 }}>
            {windows.map((w) => (
              <TouchableOpacity
                key={w.i}
                onPress={() => setIdx(w.i)}
                style={[styles.windowCard, { borderColor: themeColor + "55", backgroundColor: themeColor + "0F" }]}
                activeOpacity={0.9}
              >
                <Text style={[styles.windowTime, { color: themeColor }]}>{w.h.hourLabel}</Text>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Badge color={themeColor} label={`${w.h.tempF}°`} />
                  <Badge color={themeColor} label={w.h.condition} />
                  <ScorePill score={w.score} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alerts + Add to calendar */}
        <View style={styles.card}>
          <View style={[styles.inline, { justifyContent: "space-between" }]}>
            <Text style={styles.sectionTitle}>Weather alerts</Text>
            <Switch
              value={notify}
              onValueChange={setNotify}
              trackColor={{ false: "#d1d5db", true: themeColor + "66" }}
              thumbColor={notify ? themeColor : "#f3f4f6"}
            />
          </View>
          <Text style={styles.help}>Get nudges if conditions change before your event.</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: themeColor }]}
            onPress={() => addToCalendar({ intent: intent || customEvent, hour, notify })}
            activeOpacity={0.92}
          >
            <Text style={styles.primaryText}>Add to Google Calendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- helpers ---------- */

function toDayKey(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function mapWeatherCode(code: number): HourCondition {
  if ([0, 1].includes(code)) return "Clear";
  if ([2, 3, 45, 48].includes(code)) return "Clouds";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Unknown";
}

function comfortScore(h: HourDatum, intent: Intent) {
  let score = 100;
  score -= Math.min(40, Math.abs(h.tempF - 72) * 2);
  if (h.condition === "Rain") score -= 25;
  if (h.condition === "Snow") score -= 20;
  if (h.condition === "Thunder") score -= 35;
  if (h.condition === "Clouds") score -= 5;

  const s = (intent || "").toLowerCase();
  if (s.includes("workout")) score -= h.tempF > 85 ? 10 : 0;
  if (s.includes("photo")) score += h.condition === "Clear" ? 6 : 0;
  if (s.includes("study")) score -= h.condition === "Thunder" ? 15 : 0;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function findNearestHourIndex(hours: HourDatum[], ref: Date) {
  if (!hours.length) return 0;
  const targetHour = new Date(ref).getHours();
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < hours.length; i++) {
    const hr = new Date(hours[i].iso).getHours();
    const d = Math.abs(hr - targetHour);
    if (d < bestDiff) {
      best = i;
      bestDiff = d;
    }
  }
  return best;
}

function addToCalendar({
  intent,
  hour,
  notify,
}: {
  intent: Intent;
  hour: HourDatum | null;
  notify: boolean;
}) {
  if (!hour) {
    Alert.alert("Pick a time", "Slide to choose an hour first.");
    return;
  }
  Alert.alert(
    "Calendar",
    `Would add: "${intent || "Custom Event"}" on ${new Date(hour.iso).toLocaleString()}.\nAlerts: ${
      notify ? "on" : "off"
    }.\n\nTODO: integrate Google Calendar / Expo Calendar.`
  );
}

/* ---------- UI bits ---------- */

function Badge({ label, color }: { label: string | number; color: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: color + "1A" }}>
      <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function ScorePill({ score }: { score: number }) {
  const c = score >= 80 ? Colors.good : score >= 60 ? Colors.warn : Colors.bad;
  return (
    <View style={{ borderRadius: 10, backgroundColor: c + "1A", paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: c, fontWeight: "800", fontSize: 12 }}>{score}</Text>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  subtle: { color: Colors.subtext },

  title: { fontSize: 28, fontWeight: "800", color: Colors.text, textAlign: "center", marginTop: 8 },
  subtitle: { textAlign: "center", color: Colors.subtext, marginBottom: 12 },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: { color: Colors.text, fontWeight: "800", marginBottom: 8, fontSize: 16 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF",
  },
  chipText: { color: Colors.text, fontSize: 14, fontWeight: "600" },

  textInputWrap: { marginTop: 16 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: Colors.subtext, marginBottom: 6 },
  textInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    minHeight: 64,
  },

  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    minWidth: 88,
  },
  dayChipText: { color: Colors.text, fontWeight: "700" },
  dayChipSub: { color: Colors.subtext, marginTop: 2 },

  sliderWrap: { marginTop: 6, position: "relative", width: "100%", justifyContent: "center" },
  bubble: { position: "absolute", top: -48, left: 16 },
  bubbleInner: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bubbleText: { color: Colors.text, fontWeight: "800" },

  inline: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  live: { color: Colors.text, fontWeight: "700" },

  windowCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  windowTime: { fontWeight: "800", fontSize: 16 },

  primaryBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "800", fontSize: 16 },
});
