import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HealthDashboard = () => {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;

  const data = [
    { name: 'Heartbeat', population: 25, color: '#FF6384', legendFontColor: '#7F7F7F' },
    { name: 'Env Temp', population: 20, color: '#36A2EB', legendFontColor: '#7F7F7F' },
    { name: 'Body Temp', population: 20, color: '#FFCE56', legendFontColor: '#7F7F7F' },
    { name: 'Acceleration', population: 15, color: '#4BC0C0', legendFontColor: '#7F7F7F' },
    { name: 'Movement', population: 20, color: '#9966FF', legendFontColor: '#7F7F7F' },
  ];

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const healthCards = [
    { title: 'Heart Rate', icon: 'heart-pulse', color: '#FF6384', route: 'HeartDetails' },
    { title: 'Environment', icon: 'thermometer', color: '#36A2EB', route: 'EnvironmentDetails' },
    { title: 'Body Temperature', icon: 'thermometer-lines', color: '#FFCE56', route: 'BodyTempDetails' },
    { title: 'Movement', icon: 'run', color: '#9966FF', route: 'MovementDetails' },
    { title: 'Acceleration', icon: 'speedometer', color: '#4BC0C0', route: 'AccelerationDetails' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Health Metrics Overview</Text>
        <PieChart
          data={data}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      <View style={styles.cardsContainer}>
        {healthCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: card.color }]}
            onPress={() => navigation.navigate(card.route)}
          >
            <MaterialCommunityIcons name={card.icon} size={32} color="white" />
            <Text style={styles.cardTitle}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    color: 'white',
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HealthDashboard; 