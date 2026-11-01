// ================== IMPORTS ==================
import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, ActivityIndicator, 
  TouchableOpacity, RefreshControl 
} from 'react-native';
import api from '../services/api';

// ================== COMPONENTE ==================
export default function DashboardScreen() {
  // ================== ESTADOS ==================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // ================== EFEITOS ==================
  useEffect(() => {
    loadDashboard();
  }, []);

  // ================== FUNÇÕES ==================
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ai/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error("Erro ao carregar o dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Remove caracteres de formatação markdown (**) para exibir texto limpo
  const cleanAiText = (text) => {
    if (!text) return "Nenhuma análise disponível.";
    return text.replace(/\*\*/g, '');
  };

  // ================== RENDERIZAÇÃO ==================
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Calculando métricas e consultando a IA Gemini...</Text>
      </View>
    );
  }

  const metrics = dashboardData?.metrics || {};
  const lowStockProducts = dashboardData?.low_stock_products || [];

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E50914" />
      }
    >
      <Text style={styles.headerTitle}>Painel Analítico de Vendas & Estoque</Text>
      <Text style={styles.headerSubtitle}>Métricas calculadas via Engine & IA Gemini</Text>

      {/* Grade de Métricas Ajustada */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>R$ {metrics.total_revenue?.toFixed(2) || "0.00"}</Text>
          <Text style={styles.metricLabel}>Faturamento Total</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{metrics.total_sales_count || 0}</Text>
          <Text style={styles.metricLabel}>Vendas Concluídas</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.total_stock_units || 0}</Text>
          <Text style={styles.metricLabel}>Peças em Estoque</Text>
        </View>

        <View style={[styles.metricCard, metrics.low_stock_count > 0 && styles.warningCard]}>
          <Text style={[styles.metricValue, { color: metrics.low_stock_count > 0 ? '#FF5252' : '#FFF' }]}>
            {metrics.low_stock_count || 0}
          </Text>
          <Text style={styles.metricLabel}>Alertas de Reposição</Text>
        </View>
      </View>

      {/* Card Vermelho de Alerta */}
      {lowStockProducts.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertBoxTitle}>⚠️ Produtos que precisam de compra urgente:</Text>
          {lowStockProducts.map((p) => (
            <Text key={p.id} style={styles.alertBoxItem}>
              • {p.name} — Apenas <Text style={{ fontWeight: 'bold', color: '#FF5252' }}>{p.stock} un.</Text> em estoque (R$ {p.price})
            </Text>
          ))}
        </View>
      )}

      {/* Card Verde da IA Gemini */}
      <View style={styles.aiContainer}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiBadge}>RELATÓRIO EXECUTIVO GEMINI IA</Text>
          <TouchableOpacity onPress={loadDashboard} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>🔄 Atualizar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.aiText}>
          {cleanAiText(dashboardData?.ai_analysis)}
        </Text>
      </View>
    </ScrollView>
  );
}

// ================== ESTILOS ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#AAA', marginTop: 16, fontSize: 14, textAlign: 'center' },

  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#777', fontSize: 13, marginBottom: 16 },

  // Layout responsivo em 2 colunas com altura automática
  metricsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    rowGap: 12, 
    marginBottom: 20 
  },
  metricCard: { 
    width: '48%', 
    backgroundColor: '#1E1E1E', 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    minHeight: 90
  },
  warningCard: { borderColor: '#B71C1C', backgroundColor: '#1F1212' },
  metricValue: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  metricLabel: { color: '#888', fontSize: 12, fontWeight: '600' },

  // Bloco de alerta em destaque
  alertBox: { backgroundColor: '#2C1414', borderWidth: 1, borderColor: '#D32F2F', borderRadius: 10, padding: 14, marginBottom: 20 },
  alertBoxTitle: { color: '#FF8A80', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  alertBoxItem: { color: '#FFCDD2', fontSize: 13, marginBottom: 4 },

  // Bloco do relatório executivo da IA
  aiContainer: { backgroundColor: '#181E1C', borderRadius: 12, borderWidth: 1, borderColor: '#2E7D32', padding: 16, marginTop: 4 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  aiBadge: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12, letterSpacing: 0.5, flexShrink: 1 },
  refreshBtn: { paddingVertical: 2, paddingHorizontal: 6, backgroundColor: '#1B3322', borderRadius: 4 },
  refreshBtnText: { color: '#81C784', fontSize: 11, fontWeight: 'bold' },
  aiText: { color: '#ECEFF1', fontSize: 14, lineHeight: 22 }
});