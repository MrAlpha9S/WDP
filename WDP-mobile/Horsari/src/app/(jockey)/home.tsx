import React from "react";
import { StyleSheet, View, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { mockUpcomingRaces, mockAssignedRaces } from "@/lib/mockData";
import { Colors } from "@/constants/theme";

export default function JockeyHomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Jockey 🏇</Text>
            <Text style={styles.username}>{user?.username || "Guest"}</Text>
          </View>
          <Text style={styles.headerIcon}>🐎</Text>
        </View>

        {/* Certificate Status */}
        <View style={styles.certificateStatus}>
          <Text style={styles.certificateIcon}>✅</Text>
          <View style={styles.certificateContent}>
            <Text style={styles.certificateTitle}>Racing Certificate</Text>
            <Text style={styles.certificateText}>Verified and Active</Text>
          </View>
        </View>

        {/* Assigned Races */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Assigned Races</Text>
          {mockAssignedRaces.length > 0 ? (
            mockAssignedRaces.map((race) => (
              <Card key={race.id} style={styles.raceCard}>
                <View style={styles.raceHeader}>
                  <View>
                    <Text style={styles.raceName}>{race.name}</Text>
                    <Text style={styles.raceStatus}>🟢 Ready to Race</Text>
                  </View>
                  <Text style={styles.actionButton}>🎯</Text>
                </View>
                <View style={styles.raceDetails}>
                  <Text style={styles.raceDetail}>
                    📅 {new Date(race.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.raceDetail}>🕐 {race.time}</Text>
                  <Text style={styles.raceDetail}>📍 {race.location}</Text>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <Text style={styles.noData}>No races assigned yet</Text>
            </Card>
          )}
        </View>

        {/* Upcoming Races */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Races</Text>
          {mockUpcomingRaces.slice(0, 2).map((race) => (
            <Card key={race.id} style={styles.raceCard}>
              <View style={styles.raceHeader}>
                <Text style={styles.raceName}>{race.name}</Text>
                <Text style={styles.raceStatus}>🟡 Open</Text>
              </View>
              <View style={styles.raceDetails}>
                <Text style={styles.raceDetail}>
                  📅 {new Date(race.date).toLocaleDateString()}
                </Text>
                <Text style={styles.raceDetail}>🕐 {race.time}</Text>
                <Text style={styles.raceDetail}>📍 {race.location}</Text>
              </View>
              <Button
                onPress={() => {}}
                title="Request Participation"
                variant="secondary"
                style={styles.participateButton}
              />
            </Card>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Races Completed</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>25%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </Card>
          </View>
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
    borderBottomWidth: 1,
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
  certificateStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  certificateIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  certificateContent: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  certificateText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: "500",
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  raceName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  raceStatus: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    color: Colors.textSecondary,
  },
  actionButton: {
    fontSize: 24,
  },
  raceDetails: {
    gap: 6,
    marginBottom: 12,
  },
  raceDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  participateButton: {
    marginTop: 8,
  },
  noData: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.buttonPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  logout: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
});
