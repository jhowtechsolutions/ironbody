import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/v1';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('ironbody_access');
      const userStr = await SecureStore.getItemAsync('ironbody_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'PERSONAL_PROFESSOR') router.replace('/dashboard-personal');
          else router.replace('/dashboard-aluno');
          return;
        } catch {}
      }
      router.replace('/login');
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={{ color: '#a1a1aa', marginTop: 16 }}>Carregando...</Text>
    </View>
  );
}
