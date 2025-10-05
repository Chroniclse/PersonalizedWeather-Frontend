import React from "react";
import { Text, View } from "react-native";

import { Colors } from "../constants";

export function ScorePill({ score }: { score: number }) {
  const c = score >= 80 ? Colors.good : score >= 60 ? Colors.warn : Colors.bad;
  return (
    <View style={{ borderRadius: 10, backgroundColor: c + "1A", paddingHorizontal: 10, paddingVertical: 6 }}>
      <Text style={{ color: c, fontWeight: "800", fontSize: 12 }}>{score}</Text>
    </View>
  );
}