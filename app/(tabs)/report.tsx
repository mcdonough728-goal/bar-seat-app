const BACKEND_URL = "https://bar-seat-backend.onrender.com";

import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";

export default function ReportScreen() {
  const { name, place_id } = useLocalSearchParams();
  const [seats, setSeats] = useState("");

const submit = async () => {
console.log("SUBMITTING PLACE ID:", place_id);
  if (!seats) return;

  try {
    const res = await fetch(`${BACKEND_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id,
        seats: Number(seats),
      }),
    });

    const data = await res.json();
    alert(`Thanks! Avg seats reported: ${data.average}`);
    setSeats("");
    router.back();
  } catch (e) {
    alert("Failed to submit seats");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <TextInput
        placeholder="Available seats"
        keyboardType="numeric"
        value={seats}
        onChangeText={setSeats}
        style={styles.input}
      />
      <Button title="Submit" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, padding: 12, marginBottom: 20 },
});
