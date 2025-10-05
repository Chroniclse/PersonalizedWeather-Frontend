import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { NavigationContainer, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Calendar from "expo-calendar";

// ---------------- Types ----------------
type Profile = {
  name: string;
  age: number;
  gender: string;
  race: string;
  allergies: string;
  skinTone: number; // 0..1
};

type Weather = {
  tempF: number;
  condition: string;
  hourly: number[];
  alerts: string[];
};

// ---------------- Theme ----------------
const Colors = {
  bg: "#FAFAFA",
  text: "#1F1F1F",
  subtext: "#6B7280",
  card: "#FFFFFF",
  accent: "#EE4444",
  tint: "#1F2937",
  border: "#E5E7EB",
  good: "#10B981",
};

// ---------------- Context ----------------
type UserCtx = { profile: Profile; setProfile: React.Dispatch<React.SetStateAction<Profile>> };
const UserContext = createContext<UserCtx | null>(null);
const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserProvider>");
  return ctx;
};

function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>({
    name: "Demo User",
    age: 18,
    gender: "female",
    race: "asian",
    allergies: "pollen, dust",
    skinTone: 0.35,
  });
  const value = useMemo(() => ({ profile, setProfile }), [profile]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ---------------- Mock data / helpers ----------------
async function fetchCurrentWeather(_lat: number, _lon: number): Promise<Weather> {
  return {
    tempF: 78,
    condition: "Clear",
    hourly: [54, 61, 66, 70, 73, 74, 75, 77, 79, 78, 72, 68],
    alerts: [],
  };
}

function pickBestHourForEvent(hourly: number[], preferredF = 72) {
  let idx = 0;
  let min = Number.POSITIVE_INFINITY;
  hourly.forEach((t, i) => {
    const d = Math.abs(t - preferredF);
    if (d < min) { min = d; idx = i; }
  });
  return { hourIndex: idx, tempF: hourly[idx] };
}

// ---------------- Screens ----------------
function DashboardScreen() {
  const { profile } = useUser();
  const [wx, setWx] = useState<Weather | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setWx(await fetchCurrentWeather(pos.coords.latitude, pos.coords.longitude));
    })();
  }, []);

  const advice = useMemo(() => {
    if (!wx) return "";
    const out: string[] = [];
    out.push(wx.tempF >= 75 ? "T-shirt" : wx.tempF >= 60 ? "Light jacket" : "Warm layers");
    if (profile.allergies.toLowerCase().includes("pollen")) out.push("Allergy med");
    if (wx.condition.toLowerCase().includes("clear") && profile.skinTone < 0.5) out.push("SPF");
    return out.join(" · ");
  }, [wx, profile]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <View style={[styles.card, { alignItems: "center" }]}>
        <Text style={styles.bigTemp}>{wx ? wx.tempF : "--"}</Text>
        <Text style={styles.condition}>{wx ? wx.condition : "—"}</Text>
        <Text style={styles.subtitle}>Swipe for the forecast</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today’s advice</Text>
        <Text style={styles.body}>{advice || "We’ll advise when weather loads."}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test Lightning Alert</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={sendTestNotification}>
          <Text style={styles.primaryBtnText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        <Text style={styles.mono}>
          {coords ? `lat ${coords.lat.toFixed(4)}, lon ${coords.lon.toFixed(4)}` : "Location not granted"}
        </Text>
      </View>
    </ScrollView>
  );
}

function ProfileScreen() {
  const { profile, setProfile } = useUser();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>

        <LabeledInput label="Name" value={profile.name}
          onChangeText={(v) => setProfile({ ...profile, name: v })} />

        <LabeledInput label="Age" keyboardType="numeric" value={String(profile.age)}
          onChangeText={(v) => setProfile({ ...profile, age: Number(v || 0) })} />

        <LabeledInput label="Gender" value={profile.gender}
          onChangeText={(v) => setProfile({ ...profile, gender: v })} />

        <LabeledInput label="Race" value={profile.race}
          onChangeText={(v) => setProfile({ ...profile, race: v })} />

        <LabeledInput label="Allergies" value={profile.allergies}
          onChangeText={(v) => setProfile({ ...profile, allergies: v })} />

        <Text style={[styles.label, { marginTop: 16 }]}>Skin tone</Text>
        <SkinToneSlider value={profile.skinTone}
          onChange={(val) => setProfile({ ...profile, skinTone: val })} />
      </View>

      <CalendarBox />
    </ScrollView>
  );
}

function PlannerScreen() {
  const { profile } = useUser();
  const [wx, setWx] = useState<Weather | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      setWx(await fetchCurrentWeather(pos.coords.latitude, pos.coords.longitude));
    })();
  }, []);

  const best = wx ? pickBestHourForEvent(wx.hourly, 72) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plan an event (AI-ready stub)</Text>
        <Text style={styles.body}>User: {profile.name} · Prefers ~72°F · Allergies: {profile.allergies || "none"}</Text>
        <View style={{ height: 8 }} />
        <Text style={styles.mono}>{wx ? `Hourly: ${wx.hourly.join(", ")}` : "Loading hourly forecast..."}</Text>
        <View style={{ height: 8 }} />
        <Text style={styles.good}>
          {best ? `Best hour ≈ index ${best.hourIndex} (temp ${best.tempF}°F)` : "Finding best time..."}
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------- Components ----------------
type InputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
};
function LabeledInput({ label, value, onChangeText, placeholder, keyboardType = "default" }: InputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.subtext}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function SkinToneSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ height: 32, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border }}>
        <View style={{ flex: 1, backgroundColor: "#FCE7D6" }} />
        <View style={{ position: "absolute", inset: 0, backgroundColor: "transparent" }} />
        <View style={{ position: "absolute", top: 0, bottom: 0, left: `${value * 100}%`, width: 2, backgroundColor: Colors.accent }} />
      </View>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <TouchableOpacity style={styles.pill} onPress={() => onChange(Math.max(0, +(value - 0.05).toFixed(2)))}>
          <Text style={styles.pillText}>–</Text>
        </TouchableOpacity>
        <Text style={styles.mono}>value: {value.toFixed(2)}</Text>
        <TouchableOpacity style={styles.pill} onPress={() => onChange(Math.min(1, +(value + 0.05).toFixed(2)))}>
          <Text style={styles.pillText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CalendarBox() {
  const [hasPerm, setHasPerm] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === "granted") {
        setHasPerm(true);
        const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        setCount(cals.length);
      }
    })();
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Calendar</Text>
      {!hasPerm && <Text style={styles.body}>Grant calendar permission to analyze your schedule.</Text>}
      {hasPerm && (
        <>
          <Text style={styles.body}>Found {count} calendars on device.</Text>
          <Text style={styles.subtle}>
            Google Calendar OAuth: use expo-auth-session → get tokens → call Calendar REST on backend and blend with forecast.
          </Text>
        </>
      )}
    </View>
  );
}

// ---------------- Notifications ----------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});
async function sendTestNotification() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") { alert("Enable notifications."); return; }
  await Notifications.scheduleNotificationAsync({
    content: { title: "⚡ Lightning detected", body: "Head indoors now. We’ll ping you when it’s safe." },
    trigger: null,
  });
}

// ---------------- Navigation root ----------------
const Tab = createBottomTabNavigator();

const navTheme: Theme = {
  dark: false,
  colors: {
    primary: Colors.tint,
    background: Colors.bg,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent,
  },
};

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.tint }}>
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="Planner" component={PlannerScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  bigTemp: { fontSize: 120, fontWeight: "800", color: Colors.tint, letterSpacing: -4 },
  condition: { fontSize: 28, fontWeight: "800", color: Colors.text, marginTop: -6, marginBottom: 8, textAlign: "center" },
  subtitle: { color: Colors.subtext, fontSize: 14 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  label: { fontSize: 14, color: Colors.subtext, marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 12, android: 8 }), color: Colors.text,
  },
  primaryBtn: { backgroundColor: Colors.accent, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  good: { color: Colors.good, fontWeight: "700" },
  subtle: { color: Colors.subtext, fontSize: 13, marginTop: 4 },
  body: { color: Colors.text, fontSize: 15 },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) as any, color: Colors.text },
  pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  pillText: { fontSize: 18, color: Colors.text, fontWeight: "700" },
});
