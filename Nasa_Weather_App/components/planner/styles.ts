import { StyleSheet } from "react-native";

import { Colors } from "./constants";

export const plannerStyles = StyleSheet.create({
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
  help: { color: Colors.subtext, marginTop: 6 },

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