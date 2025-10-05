
New
+36
-0

import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";

import { plannerStyles as styles } from "../styles";

interface AlertsSectionProps {
  notify: boolean;
  themeColor: string;
  onToggleNotify: (value: boolean) => void;
  onAddToCalendar: () => void;
}

export function AlertsSection({ notify, themeColor, onToggleNotify, onAddToCalendar }: AlertsSectionProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.inline, { justifyContent: "space-between" }]}>
        <Text style={styles.sectionTitle}>Weather alerts</Text>
        <Switch
          value={notify}
          onValueChange={onToggleNotify}
          trackColor={{ false: "#d1d5db", true: themeColor + "66" }}
          thumbColor={notify ? themeColor : "#f3f4f6"}
        />
      </View>
      <Text style={styles.help}>Get nudges if conditions change before your event.</Text>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: themeColor }]}
        onPress={onAddToCalendar}
        activeOpacity={0.92}
      >
        <Text style={styles.primaryText}>Add to Google Calendar</Text>
      </TouchableOpacity>
    </View>
  );
}