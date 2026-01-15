import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../context/AuthContext';
import { View, StatusBar } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const [loaded] = useFonts({
    // We'll load fonts here if needed
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    };

    requestPermissions();
  }, []);

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
          }}>
          <Stack.Screen
            name="splash"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(auth)/login"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="screens/HeartDetails"
            options={{
              title: 'Heart Rate',
              headerTintColor: '#FF6384',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="screens/EnvironmentDetails"
            options={{
              title: 'Environment',
              headerTintColor: '#36A2EB',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="screens/BodyTempDetails"
            options={{
              title: 'Body Temperature',
              headerTintColor: '#FFCE56',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="screens/MovementDetails"
            options={{
              title: 'Movement',
              headerTintColor: '#9966FF',
              headerShown: true,
            }}
          />
          <Stack.Screen 
            name="screens/AccelerationDetails"
            options={{
              title: 'Acceleration',
              headerTintColor: '#4BC0C0',
              headerShown: true,
            }}
          />
        </Stack>
      </View>
    </AuthProvider>
  );
} 