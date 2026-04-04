import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/v1';

export default function DashboardAluno() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const u = await SecureStore.getItemAsync('ironbody_user');
      const token = await SecureStore.getItemAsync('ironbody_access');
      if (u) setUser(JSON.parse(u));
      if (token) {
        fetch(`${API_URL}/workouts`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => (r.ok ? r.json() : []))
          .then(setWorkouts)
          .catch(() => setWorkouts([]));
      }
    })();
  }, []);

  const logout = async () => {
    await SecureStore.deleteItemAsync('ironbody_access');
    await SecureStore.deleteItemAsync('ironbody_refresh');
    await SecureStore.deleteItemAsync('ironbody_user');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>IronBody · Meus Treinos</Text>
        <View style={styles.headerRight}>
          {user ? <Text style={styles.name}>{user.name}</Text> : null}
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.welcome}>Olá{user ? `, ${user.name}` : ''}.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meus treinos</Text>
          {workouts.length === 0 ? <Text style={styles.muted}>Nenhum treino atribuído.</Text> : (
            workouts.slice(0, 10).map((w: any) => (
              <Text key={w.id} style={styles.item}>{w.nome || 'Treino'} · {w.sport?.nome}</Text>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title: { fontSize: 18, fontWeight: '700', color: '#fafafa' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: '#a1a1aa', fontSize: 14 },
  logout: { color: '#3b82f6', fontSize: 14 },
  content: { flex: 1, padding: 24 },
  welcome: { color: '#a1a1aa', marginBottom: 24 },
  card: { backgroundColor: '#141414', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#27272a' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fafafa', marginBottom: 12 },
  muted: { color: '#71717a' },
  item: { color: '#fafafa', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#27272a' },
});
