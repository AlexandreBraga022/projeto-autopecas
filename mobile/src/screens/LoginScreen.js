import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// ================== COMPONENTE ==================
export default function LoginScreen({ navigation }) {
  // ================== ESTADOS ==================
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ================== FUNÇÕES ==================
  const notifyUser = (title, message) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();

    if (!cleanedEmail || !cleanedPassword) {
      notifyUser("Atenção", "Preencha o e-mail e a senha para entrar.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: cleanedEmail,
        password: cleanedPassword,
      });

      signIn(response.data);
      navigation.replace('Home');
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      const message = typeof errorDetail === 'string'
          ? errorDetail
          : "E-mail ou senha incorretos, ou servidor indisponível.";
      notifyUser("Falha no Login", message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    navigation.navigate('Home');
  };

  // ================== RENDERIZAÇÃO ==================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>
            TECH<Text style={styles.brandHighlight}>TURBO</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Sistemas Automotivos & Peças</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acessar Conta</Text>

          <Text style={styles.inputLabel}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu.email@exemplo.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            placeholderTextColor="#666"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={[styles.primaryBtn, loading && styles.disabledBtn]} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuestAccess} disabled={loading}>
            <Text style={styles.guestBtnText}>CONTINUAR COMO VISITANTE</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Não possui uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ================== ESTILOS ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brandContainer: { alignItems: 'center', marginBottom: 30 },
  brandTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  brandHighlight: { color: '#E50914' },
  brandSubtitle: { color: '#888888', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#2A2A2A' },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#AAA', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#121212', color: '#FFF', borderRadius: 8, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#333333', fontSize: 14 },
  primaryBtn: { backgroundColor: '#E50914', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  disabledBtn: { backgroundColor: '#555555' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  guestBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  guestBtnText: { color: '#CCCCCC', fontSize: 12, fontWeight: 'bold' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 6 },
  footerText: { color: '#888888', fontSize: 13 },
  registerLink: { color: '#E50914', fontSize: 13, fontWeight: 'bold' },
});