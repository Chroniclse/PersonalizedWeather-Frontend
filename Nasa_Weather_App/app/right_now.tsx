import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const Colors = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  text: "#1F1F1F",
  subtext: "#6B7280",
  border: "#E5E7EB",
  tint: "#1F2937",
  accent: "#EE4444",
  good: "#10B981",
};

export default function RightNow() {
  const [eventText, setEventText] = useState("");

  const handleSubmit = () => {
    if (!eventText.trim()) {
      Alert.alert("Oops!", "Please type your current event before submitting.");
      return;
    }

    // Here you can handle the submission logic, e.g., send to backend or store locally
    Alert.alert("Submitted!", `Your event: "${eventText}" has been submitted.`);
    setEventText(""); // clear input after submission
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>What are you doing right now?</Text>

            <TextInput
              style={styles.input}
              placeholder="Type your current event..."
              value={eventText}
              onChangeText={setEventText}
              multiline
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 20, justifyContent: "center" },
  backBtn: { marginBottom: 24 },
  backText: { color: Colors.tint, fontWeight: "700", fontSize: 16 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.card,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: Colors.tint,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});