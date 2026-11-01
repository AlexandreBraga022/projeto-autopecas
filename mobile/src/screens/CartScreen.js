import React, { useContext, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, Alert, 
  StyleSheet, ActivityIndicator, Platform 
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// ================== COMPONENTE ==================
export default function CartScreen({ navigation }) {
  // ================== CONTEXTOS & ESTADOS ==================
  const { cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [purchasing, setPurchasing] = useState(false);

  // Redireciona caso um visitante tente acessar o carrinho diretamente
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Acesso restrito para clientes cadastrados.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.backBtnText}>IR PARA LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ================== CÁLCULOS & AUXILIARES ==================
  const totalValue = cart.reduce((acc, item) => {
    const priceNum = parseFloat(item.price.toString().replace(',', '.')) || 0;
    return acc + priceNum * item.quantity;
  }, 0);

  const notifyUser = (title, message, onPressOk) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
      if (onPressOk) onPressOk();
    } else {
      Alert.alert(title, message, [{ text: "OK", onPress: onPressOk }]);
    }
  };

  // ================== PROCESSAMENTO DE CHECKOUT ==================
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setPurchasing(true);
    try {
      const checkoutPayload = {
        user_id: String(user.id),
        user_name: user.name,
        address: user.address || "Endereço não cadastrado",
        items: cart.map(item => ({
          id: String(item.id),
          name: item.name,
          price: item.price.toString(),
          quantity: item.quantity
        })),
        total_price: totalValue
      };

      await api.post('/checkout', checkoutPayload);

      const confirmationMessage = `Valor Total: R$ ${totalValue.toFixed(2)}\n\n📍 Pedido será entregue em:\n${user.address}`;

      notifyUser(
        "Compra Finalizada com Sucesso!",
        confirmationMessage,
        () => {
          clearCart();
          navigation.navigate("Home");
        }
      );
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Falha ao processar o pagamento.";
      notifyUser("Erro no Checkout", errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  // ================== RENDERIZAÇÃO ==================
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Itens no Carrinho</Text>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
            <Text style={styles.backBtnText}>VER CATÁLOGO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.addressBox}>
            <Text style={styles.addressBoxTitle}>📍 Endereço de Entrega:</Text>
            <Text style={styles.addressBoxText}>{user.address}</Text>
          </View>

          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>R$ {item.price}</Text>
                </View>

                <View style={styles.qtyContainer}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.id)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.summaryCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total do Pedido:</Text>
              <Text style={styles.totalValue}>R$ {totalValue.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutBtn, purchasing && styles.disabledBtn]} 
              onPress={handleCheckout} 
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.checkoutBtnText}>FINALIZAR COMPRA</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ================== ESTILOS ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#777', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: '#E50914', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },

  addressBox: { backgroundColor: '#1E1E1E', borderColor: '#333', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 14 },
  addressBoxTitle: { color: '#E50914', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  addressBoxText: { color: '#DDD', fontSize: 13 },
  
  itemCard: { backgroundColor: '#1E1E1E', padding: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  itemName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  itemPrice: { color: '#E50914', marginTop: 4, fontWeight: 'bold' },
  
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderRadius: 6, marginHorizontal: 12 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { color: '#E50914', fontSize: 16, fontWeight: 'bold' },
  qtyText: { color: '#FFF', fontWeight: 'bold', paddingHorizontal: 6 },

  removeBtn: { padding: 8 },
  removeBtnText: { color: '#888', fontSize: 16, fontWeight: 'bold' },

  summaryCard: { backgroundColor: '#1E1E1E', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { color: '#AAA', fontSize: 16 },
  totalValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  checkoutBtn: { backgroundColor: '#E50914', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#555' },
  checkoutBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 }
});