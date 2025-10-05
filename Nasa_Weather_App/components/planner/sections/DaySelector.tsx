import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { plannerStyles as styles } from "../styles";

interface DaySelectorProps {
  days: string[];
  selectedDayIdx: number;
  themeColor: string;
  onSelectDay: (index: number) => void;
}

export function DaySelector({ days, selectedDayIdx, themeColor, onSelectDay }: DaySelectorProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Pick a day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {days.map((d, i) => {
          const date = new Date(d);
          const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString([], { weekday: "short" });
          const active = i === selectedDayIdx;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => onSelectDay(i)}
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
  );
}