import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { router } from "expo-router";
import { RefreshControl } from "react-native";


const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
const BACKEND_URL = "https://bar-seat-backend.onrender.com";

export default function HomeScreen() {
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const getSeatColor = (avg: number) => {
  if (avg <= 5) return "#E53935";   // red (low)
  if (avg >= 20) return "#43A047"; // green (high)
  return "#1E88E5";                // blue (medium)
};
const [refreshing, setRefreshing] = useState(false);


const loadBars = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=bar&key=${GOOGLE_API_KEY}`
    );
    const data = await res.json();

    const enriched = await Promise.all(
      (data.results || []).map(async (bar: any) => {
        try {
          const r = await fetch(`${BACKEND_URL}/seats/${bar.place_id}`);
          const j = await r.json();
          return { ...bar, avg: j.average };
        } catch {
          return { ...bar, avg: null };
        }
      })
    );

    setBars(enriched);
  } catch {
    setError("Failed to load bars");
  }
};

useEffect(() => {
    loadBars().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Finding nearby bars…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
<FlatList
  data={bars}
  keyExtractor={(item) => item.place_id}
  contentContainerStyle={styles.list}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await loadBars();
        setRefreshing(false);
      }}
    />
  }
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/report",
          params: {
            name: item.name,
            place_id: item.place_id,
          },
        })
      }
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.address}>{item.vicinity}</Text>

      {typeof item.avg === "number" && (
        <Text
          style={{
            marginTop: 6,
            fontWeight: "600",
            color: getSeatColor(item.avg),
          }}
        >
          Avg seats: {item.avg}
        </Text>
      )}
    </TouchableOpacity>
  )}
/>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  address: {
    color: "#555",
  },
});