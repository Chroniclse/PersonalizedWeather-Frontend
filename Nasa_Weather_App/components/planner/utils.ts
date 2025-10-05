import { Alert } from "react-native";

import { HourDatum, HourCondition, Intent } from "./types";

export function toDayKey(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

export function mapWeatherCode(code: number): HourCondition {
  if ([0, 1].includes(code)) return "Clear";
  if ([2, 3, 45, 48].includes(code)) return "Clouds";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Unknown";
}

export function comfortScore(h: HourDatum, intent: Intent) {
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

export function findNearestHourIndex(hours: HourDatum[], ref: Date) {
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

export function addToCalendar({
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