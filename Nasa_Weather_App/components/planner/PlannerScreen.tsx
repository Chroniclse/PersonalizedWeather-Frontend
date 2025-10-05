import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import { fetchOpenMeteo } from "@/lib/openMeteo";

import { AlertsSection } from "./sections/AlertsSection";
import { DaySelector } from "./sections/DaySelector";
import { IntentSection } from "./sections/IntentSection";
import { SmartWindowsSection } from "./sections/SmartWindowsSection";
import { TimeSelection } from "./sections/TimeSelection";
import { Colors } from "./constants";
import { plannerStyles as styles } from "./styles";
import { HourDatum, Intent } from "./types";
import { addToCalendar, comfortScore, findNearestHourIndex, mapWeatherCode, toDayKey } from "./utils";

function PlannerScreen() {
  const [intent, setIntent] = useState<Intent>("Chill");
  const [customEvent, setCustomEvent] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [hoursByDay, setHoursByDay] = useState<Record<string, HourDatum[]>>({});
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [hourly, setHourly] = useState<HourDatum[]>([]);
  const [idx, setIdx] = useState(12);
  const [notify, setNotify] = useState(true);

  const fetchForecast = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission is required.");
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
      const key = toDayKey(h.iso);
      if (!byDay[key]) {
        byDay[key] = [];
        uniqueDays.push(key);
      }
      byDay[key].push(h);
    }

    return { days: uniqueDays, byDay };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const forecast = await fetchForecast();
        const days7 = forecast.days.slice(0, 7);
        setDays(days7);
        setHoursByDay(forecast.byDay);
        const firstKey = days7[0];
        const firstHours = firstKey ? forecast.byDay[firstKey] ?? [] : [];
        setHourly(firstHours);
        setIdx(findNearestHourIndex(firstHours, new Date()));
        setError(null);
      } catch (e: any) {
        setError(`Failed to load forecast: ${e?.message ?? "unknown error"}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchForecast]);

  const changeDay = useCallback(
    async (index: number) => {
      setSelectedDayIdx(index);
      const key = days[index];
      if (!key) return;

      const cached = hoursByDay[key];
      if (cached) {
        setHourly(cached);
        setIdx(findNearestHourIndex(cached, new Date(key)));
        setError(null);
        return;
      }

      setLoading(true);
      try {
        const forecast = await fetchForecast();
        setHoursByDay((prev) => ({ ...prev, ...forecast.byDay }));
        const hoursForDay = forecast.byDay[key] ?? [];
        setHourly(hoursForDay);
        setIdx(findNearestHourIndex(hoursForDay, new Date(key)));
        if (!days.length) {
          setDays(forecast.days.slice(0, 7));
        }
        setError(null);
      } catch (e: any) {
        setError(`Failed to load forecast: ${e?.message ?? "unknown error"}`);
      } finally {
        setLoading(false);
      }
    },
    [days, hoursByDay, fetchForecast]
  );

  const hour = hourly[idx] ?? null;
  const maxIdx = Math.max(hourly.length - 1, 1);

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

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Plan an Event</Text>
        <Text style={styles.subtitle}>Weather-aware, personalized to you.</Text>

        <IntentSection
          intent={intent}
          customEvent={customEvent}
          themeColor={themeColor}
          onSelectIntent={setIntent}
          onCustomEventChange={setCustomEvent}
        />

        <DaySelector days={days} selectedDayIdx={selectedDayIdx} themeColor={themeColor} onSelectDay={changeDay} />

        <TimeSelection hour={hour} idx={idx} maxIdx={maxIdx} themeColor={themeColor} onChange={setIdx} />

        <SmartWindowsSection windows={windows} themeColor={themeColor} onSelectWindow={setIdx} />

        <AlertsSection
          notify={notify}
          themeColor={themeColor}
          onToggleNotify={setNotify}
          onAddToCalendar={() => addToCalendar({ intent: intent || customEvent, hour, notify })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default PlannerScreen;