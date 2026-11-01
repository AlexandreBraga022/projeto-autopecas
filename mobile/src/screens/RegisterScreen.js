import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import api from '../services/api';

// ================== COMPONENTE ==================
export default function RegisterScreen({ navigation }) {
  // ================== ESTADOS ==================
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [adminTag, setAdminTag] = useState('');
  const [loading, setLoading] = useState(false);

  // ================== FUNÇÕES ==================
  const notifyUser = (title, message, onPressOk) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      if (onPressOk) onPressOk();
    } else {
      Alert.alert(title, message, [{ text: "OK", onPress: onPressOk }]);
    }
  };

  const handleRegister = async () => {
    const cleanedName = name.trim();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();
    const cleanedCpf = cpf.trim();
    const cleanedAddress = address.trim();
    const cleanedAdminTag = adminTag.trim();

    if (!cleanedName || !cleanedEmail || !cleanedPassword || !cleanedCpf || !cleanedAddress) {
      notifyUser("Atenção", "Preencha todos os campos obrigatórios (Nome, E-mail, Senha, CPF e Endereço).");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: cleanedName,
        email: cleanedEmail,
        password: cleanedPassword,
        cpf: cleanedCpf,
        address: cleanedAddress,
        admin_tag: cleanedAdminTag,
      });

      notifyUser("Cadastro Realizado!", "Sua conta foi criada com sucesso. Faça login para continuar.", () => {
        navigation.navigate("Login");
      });
    } catch (error) {
      const errorDetail = error.response?.data?.detail;
      const message = typeof errorDetail === 'string' ? errorDetail : "Não foi possível realizar o cadastro.";
      notifyUser("Erro no Cadastro", message);
    } finally {
      setLoading(false);
    }
  };

  // ================== RENDERIZAÇÃO ==================
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Criar Nova Conta</Text>

          <Text style={styles.inputLabel}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome completo"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>E-mail *</Text>
          <TextInput
            style={styles.input}
            placeholder="seu.email@exemplo.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Senha *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 4 caracteres"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.inputLabel}>CPF *</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={cpf}
            onChangeText={setCpf}
          />

          <Text style={styles.inputLabel}>Endereço de Entrega Completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Rua, Número, Bairro, Cidade - UF"
            placeholderTextColor="#666"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.inputLabel}>Tag de Vendedor (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite caso seja um vendedor"
            placeholderTextColor="#666"
            secureTextEntry
            value={adminTag}
            onChangeText={setAdminTag}
          />

          <TouchableOpacity style={[styles.primaryBtn, loading && styles.disabledBtn]} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>FINALIZAR CADASTRO</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Login")} disabled={loading}>
            <Text style={styles.backBtnText}>Voltar para o Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ================== ESTILOS ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#2A2A2A' },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#AAA', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#121212', color: '#FFF', borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#333333', fontSize: 14 },
  primaryBtn: { backgroundColor: '#E50914', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledBtn: { backgroundColor: '#555555' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  backBtn: { marginTop: 16, alignItems: 'center' },
  backBtnText: { color: '#888', fontSize: 13 },
});