import React from "react";
import { Text, View } from "react-native";

export function Badge({ label, color }: { label: string | number; color: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: color + "1A" }}>
      <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </View>
  );
}