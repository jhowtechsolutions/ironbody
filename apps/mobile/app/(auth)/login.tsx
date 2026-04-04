import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/v1';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao entrar');
      await SecureStore.setItemAsync('ironbody_access', data.accessToken);
      await SecureStore.setItemAsync('ironbody_refresh', data.refreshToken);
      await SecureStore.setItemAsync('ironbody_user', JSON.stringify(data.user));
      if (data.user.role === 'PERSONAL_PROFESSOR') router.replace('/dashboard-personal');
      else router.replace('/dashboard-aluno');
    } catch (e: any) {
      setError(e?.message || 'E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Text style={styles.title}>IronBody</Text>
      <Text style={styles.subtitle}>Entre na sua conta</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#71717a" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#71717a" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>
      <Link href="/register" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Não tem conta? Cadastrar</Text>
        </TouchableOpacity>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fafafa', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#a1a1aa', textAlign: 'center', marginBottom: 32 },
  error: { color: '#ef4444', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 14, color: '#fafafa', marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#3b82f6', fontSize: 14 },
});
