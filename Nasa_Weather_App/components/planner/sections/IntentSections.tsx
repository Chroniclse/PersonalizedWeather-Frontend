import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { INTENTS } from "../constants";
import { plannerStyles as styles } from "../styles";
import { Intent } from "../types";

interface IntentSectionProps {
  intent: Intent;
  customEvent: string;
  themeColor: string;
  onSelectIntent: (intent: Intent) => void;
  onCustomEventChange: (value: string) => void;
}

export function IntentSection({
  intent,
  customEvent,
  themeColor,
  onSelectIntent,
  onCustomEventChange,
}: IntentSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>What’s the vibe?</Text>

      <View style={styles.chipsRow}>
        {INTENTS.map((it) => {
          const isActive = it === intent;
          return (
            <TouchableOpacity
              key={it}
              onPress={() => {
                onSelectIntent(it);
                onCustomEventChange("");
              }}
              activeOpacity={0.9}
              style={[
                styles.chip,
                isActive && { backgroundColor: themeColor + "22", borderColor: themeColor },
              ]}
            >
              <Text style={[styles.chipText, isActive && { color: themeColor, fontWeight: "700" }]}>
                {it}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.textInputWrap}>
        <Text style={styles.inputLabel}>Or type your event</Text>
        <TextInput
          value={customEvent}
          onChangeText={onCustomEventChange}
          onFocus={() => onSelectIntent("")}
          placeholder="e.g., birthday picnic, sunrise workout, study session…"
          placeholderTextColor="#9CA3AF"
          multiline
          autoCorrect
          autoCapitalize="sentences"
          style={[styles.textInput, { borderColor: themeColor + "55" }]}
        />
      </View>
    </View>
  );
}