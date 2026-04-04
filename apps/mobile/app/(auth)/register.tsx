import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/v1';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PERSONAL_PROFESSOR' | 'ALUNO'>('ALUNO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar');
      await SecureStore.setItemAsync('ironbody_access', data.accessToken);
      await SecureStore.setItemAsync('ironbody_refresh', data.refreshToken);
      await SecureStore.setItemAsync('ironbody_user', JSON.stringify(data.user));
      if (data.user.role === 'PERSONAL_PROFESSOR') router.replace('/dashboard-personal');
      else router.replace('/dashboard-aluno');
    } catch (e: any) {
      setError(e?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>IronBody</Text>
        <Text style={styles.subtitle}>Crie sua conta</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor="#71717a" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#71717a" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Senha (mín. 6)" placeholderTextColor="#71717a" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.roleBtn, role === 'ALUNO' && styles.roleBtnActive]} onPress={() => setRole('ALUNO')}>
            <Text style={[styles.roleText, role === 'ALUNO' && styles.roleTextActive]}>Aluno</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleBtn, role === 'PERSONAL_PROFESSOR' && styles.roleBtnActive]} onPress={() => setRole('PERSONAL_PROFESSOR')}>
            <Text style={[styles.roleText, role === 'PERSONAL_PROFESSOR' && styles.roleTextActive]}>Personal</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
        </TouchableOpacity>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>Já tem conta? Entrar</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#fafafa', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#a1a1aa', textAlign: 'center', marginBottom: 32 },
  error: { color: '#ef4444', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 14, color: '#fafafa', marginBottom: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#27272a', alignItems: 'center' },
  roleBtnActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)' },
  roleText: { color: '#a1a1aa' },
  roleTextActive: { color: '#3b82f6', fontWeight: '600' },
  btn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#3b82f6', fontSize: 14 },
});
