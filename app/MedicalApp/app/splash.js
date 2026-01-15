import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Always show splash for 2 seconds then go to onboarding
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="medical-bag" size={100} color="#00CEC9" />
      <Text style={styles.title}>MedAssist</Text>
      <Text style={styles.subtitle}>Your Health Companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00CEC9',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#636e72',
    marginTop: 10,
  },
}); 