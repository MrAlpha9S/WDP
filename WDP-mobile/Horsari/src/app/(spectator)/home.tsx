import React from "react";
import { StyleSheet, View, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { mockUpcomingRaces, mockRaceResults } from "@/lib/mockData";
import { Colors } from "@/constants/theme";

export default function SpectatorHomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Spectator 👀</Text>
            <Text style={styles.username}>{user?.username || "Guest"}</Text>
          </View>
          <Text style={styles.headerIcon}>🏇</Text>
        </View>

        {/* Hero Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>🏁 Horse Racing Platform</Text>
          <Text style={styles.bannerSubtext}>
            Track the best races worldwide
          </Text>
        </View>

        {/* Upcoming Races */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Races</Text>
          {mockUpcomingRaces.map((race) => (
            <Card key={race.id} style={styles.raceCard}>
              <View style={styles.raceHeader}>
                <Text style={styles.raceName}>{race.name}</Text>
              </View>
              <View style={styles.raceDetails}>
                <Text style={styles.raceDetail}>
                  📅 {new Date(race.date).toLocaleDateString()}
                </Text>
                <Text style={styles.raceDetail}>🕐 {race.time}</Text>
                <Text style={styles.raceDetail}>📍 {race.location}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Recent Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          {mockRaceResults.map((result) => (
            <Card key={result.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultName}>{result.raceName}</Text>
                <Text style={styles.resultDate}>
                  {new Date(result.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.resultDetails}>
                <View style={styles.podium}>
                  <View style={styles.podiumPosition}>
                    <Text style={styles.podiumMedal}>🥇</Text>
                    <Text style={styles.podiumName}>{result.winner}</Text>
                    <Text style={styles.podiumTime}>{result.winnerTime}</Text>
                  </View>
                  <View style={styles.podiumPosition}>
                    <Text style={styles.podiumMedal}>🥈</Text>
                    <Text style={styles.podiumName}>{result.secondPlace}</Text>
                  </View>
                  <View style={styles.podiumPosition}>
                    <Text style={styles.podiumMedal}>🥉</Text>
                    <Text style={styles.podiumName}>{result.thirdPlace}</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logout}>
          <Button onPress={handleLogout} title="Log Out" variant="primary" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  username: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },
  headerIcon: {
    fontSize: 40,
  },
  banner: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.buttonPrimary,
    borderRadius: 12,
    alignItems: "center",
  },
  bannerText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.buttonTextPrimary,
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 14,
    color: Colors.buttonTextPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  raceCard: {
    marginBottom: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  raceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  raceName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  raceDetails: {
    gap: 6,
  },
  raceDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  resultCard: {
    marginBottom: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.textSecondary,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  resultDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultDetails: {
    gap: 8,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  podiumPosition: {
    alignItems: "center",
    flex: 1,
  },
  podiumMedal: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  podiumTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logout: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});
