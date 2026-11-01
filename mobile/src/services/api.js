import axios from 'axios';
import Constants from 'expo-constants';

// ================== FUNÇÕES DE CONFIGURAÇÃO ==================
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8000`;
  }
  return 'http://localhost:8000';
};

// ================== INSTÂNCIA AXIOS =================
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;