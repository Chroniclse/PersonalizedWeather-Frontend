import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { plannerStyles as styles } from "../styles";
import { ScorePill } from "../components/ScorePill";
import { Badge } from "../components/Badge";
import { HourDatum } from "../types";

interface WindowEntry {
  i: number;
  h: HourDatum;
  score: number;
}

interface SmartWindowsSectionProps {
  windows: WindowEntry[];
  themeColor: string;
  onSelectWindow: (index: number) => void;
}

export function SmartWindowsSection({ windows, themeColor, onSelectWindow }: SmartWindowsSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Smart Windows (Top picks)</Text>
      <View style={{ gap: 10 }}>
        {windows.map((w) => (
          <TouchableOpacity
            key={w.i}
            onPress={() => onSelectWindow(w.i)}
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
  );
}