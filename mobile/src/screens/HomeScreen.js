// ================== IMPORTS ==================
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, 
  Alert, StyleSheet, ActivityIndicator, Modal, Platform,
  RefreshControl 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../services/api';

// ================== COMPONENTE PRINCIPAL ==================
export default function HomeScreen({ navigation }) {
  // ================== CONTEXTOS & ESTADOS ==================
  const { user, signOut } = useContext(AuthContext);
  const { cart, addToCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados da Modal de Criação de Peça
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Estados da Modal de Inspeção e Edição
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [updating, setUpdating] = useState(false);

  // Verificação de Perfis
  const isGuest = !user;
  const isAdmin = user?.role === 'admin';
  const isClient = user && !isAdmin;

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ================== EFEITOS ==================
  useEffect(() => {
    fetchProducts();
  }, []);

  // ================== FUNÇÕES AUXILIARES E API ==================
  const fetchProducts = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      notifyUser("Erro", "Não foi possível carregar o catálogo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchProducts(true);
  };

  const notifyUser = (title, message) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogout = () => {
    signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleClearFilter = () => {
    setSearchQuery('');
    setActiveFilter('');
  };

  const handleAddToCart = (product) => {
    if (!isClient) return;

    if (parseInt(product.stock) <= 0) {
      notifyUser("Esgotado", "Esta peça está sem estoque no momento.");
      return;
    }

    addToCart(product);
    notifyUser("Sucesso!", `${product.name} foi adicionado ao seu carrinho.`);
  };

  const handleInspect = (product) => {
    setInspectedProduct(product);
    setEditName(product.name || '');
    setEditPrice(String(product.price || ''));
    setEditStock(String(product.stock || ''));
    setEditCategory(product.category || '');
    setIsEditing(false);
    setInspectModalVisible(true);
  };

  const executeDelete = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      notifyUser("Sucesso", "Produto removido com sucesso.");
      fetchProducts();
    } catch (error) {
      notifyUser("Erro", "Não foi possível excluir o produto.");
    }
  };

  const handleDeleteProduct = (productId, productName) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja realmente excluir a peça "${productName}" do estoque?`)) {
        executeDelete(productId);
      }
    } else {
      Alert.alert(
        "Confirmar Exclusão",
        `Deseja realmente excluir a peça "${productName}" do estoque?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Excluir", style: "destructive", onPress: () => executeDelete(productId) }
        ]
      );
    }
  };

  const handleCreateProduct = async () => {
    if (!newName || !newPrice || !newStock || !newCategory) {
      notifyUser("Atenção", "Preencha todos os campos da peça.");
      return;
    }

    try {
      await api.post('/products', {
        name: newName,
        price: newPrice,
        stock: newStock,
        category: newCategory
      });
      notifyUser("Sucesso", "Nova peça cadastrada com sucesso!");
      setCreateModalVisible(false);
      setNewName(''); setNewPrice(''); setNewStock(''); setNewCategory('');
      fetchProducts();
    } catch (error) {
      notifyUser("Erro", "Não foi possível cadastrar a peça.");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editName || !editPrice || !editStock || !editCategory) {
      notifyUser("Atenção", "Preencha todos os campos para atualizar.");
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/products/${inspectedProduct.id}`, {
        name: editName,
        price: editPrice,
        stock: editStock,
        category: editCategory
      });
      notifyUser("Sucesso", "Produto atualizado com sucesso!");
      setIsEditing(false);
      setInspectModalVisible(false);
      fetchProducts();
    } catch (error) {
      notifyUser("Erro", "Não foi possível atualizar a peça.");
    } finally {
      setUpdating(false);
    }
  };

  const displayedProducts = activeFilter
    ? products.filter(p => 
        p.name.toLowerCase().includes(activeFilter.toLowerCase()) ||
        p.category.toLowerCase().includes(activeFilter.toLowerCase())
      )
    : products;

  // ================== RENDERIZAÇÃO DA TELA ==================
  return (
    <View style={styles.container}>
      {/* Barra de Cabeçalho e Perfil */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.welcomeText}>
            Olá, <Text style={styles.userName}>{user?.name || 'Visitante'}</Text>
          </Text>
          <Text style={styles.roleBadge}>
            {isGuest ? 'Modo Consulta de Catálogo' : isAdmin ? 'Administrador / Vendedor' : 'Cliente TECHTURBO'}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          {isAdmin && (
            <>
              <TouchableOpacity style={styles.dashboardBtn} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.dashboardBtnText}>PAINEL IA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Sair</Text>
              </TouchableOpacity>
            </>
          )}

          {isClient && (
            <>
              <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
                <Text style={styles.cartBtnText}>🛒 CARRINHO ({totalCartItems})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Sair</Text>
              </TouchableOpacity>
            </>
          )}

          {isGuest && (
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginBtnText}>FAZER LOGIN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Seção de Busca e Filtro */}
      <View style={styles.searchSection}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Pesquisar peça ou categoria..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setActiveFilter(text.trim());
          }}
        />
        {activeFilter ? (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilter}>
            <Text style={styles.clearBtnText}>LIMPAR</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Botão de Cadastro Exclusivo Admin */}
      {isAdmin && (
        <TouchableOpacity style={styles.addProductBtn} onPress={() => setCreateModalVisible(true)}>
          <Text style={styles.addProductBtnText}>+ CADASTRAR NOVA PEÇA</Text>
        </TouchableOpacity>
      )}

      {/* Cabeçalho do Catálogo com Botão de Recarregar */}
      <View style={styles.catalogHeaderRow}>
        <Text style={styles.sectionTitle}>Catálogo de Peças</Text>
        <TouchableOpacity 
          style={styles.reloadCatalogBtn} 
          onPress={handleManualRefresh}
          disabled={loading || refreshing}
        >
          <Text style={styles.reloadCatalogBtnText}>🔄 Atualizar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Lista Principal de Produtos com Pull-to-Refresh */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={displayedProducts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} tintColor="#E50914" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyListText}>Nenhuma peça encontrada para sua pesquisa.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productPrice}>R$ {item.price}</Text>
                <Text style={styles.productStock}>Em estoque: {item.stock} un.</Text>
              </View>

              {/* Botão para Cliente Autenticado */}
              {isClient && (
                <TouchableOpacity 
                  style={[styles.buyBtn, parseInt(item.stock) <= 0 && styles.disabledBuyBtn]} 
                  onPress={() => handleAddToCart(item)}
                  disabled={parseInt(item.stock) <= 0}
                >
                  <Text style={styles.buyBtnText}>
                    {parseInt(item.stock) > 0 ? 'COMPRAR' : 'ESGOTADO'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Ações para Administrador */}
              {isAdmin && (
                <View style={styles.adminActionsContainer}>
                  <TouchableOpacity style={styles.inspectBtn} onPress={() => handleInspect(item)}>
                    <Text style={styles.inspectBtnText}>INSPECIONAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item.id, item.name)}>
                    <Text style={styles.deleteBtnText}>EXCLUIR</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Modal de Criação de Peça (Admin) */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cadastrar Peça no Estoque</Text>
            <TextInput style={styles.modalInput} placeholder="Nome do Produto" placeholderTextColor="#777" value={newName} onChangeText={setNewName} />
            <TextInput style={styles.modalInput} placeholder="Preço (ex: 89.90)" placeholderTextColor="#777" value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" />
            <TextInput style={styles.modalInput} placeholder="Estoque Inicial" placeholderTextColor="#777" value={newStock} onChangeText={setNewStock} keyboardType="numeric" />
            <TextInput style={styles.modalInput} placeholder="Categoria (ex: Filtros, Freios)" placeholderTextColor="#777" value={newCategory} onChangeText={setNewCategory} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateProduct}>
                <Text style={styles.saveBtnText}>SALVAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Inspeção e Edição da Peça (Admin) */}
      <Modal visible={inspectModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar Peça' : 'Ficha Técnica do Produto'}
            </Text>
            
            {inspectedProduct && (
              !isEditing ? (
                // Modo Visualização
                <View>
                  <View style={styles.inspectDetails}>
                    <Text style={styles.inspectLabel}>ID Interno: <Text style={styles.inspectValue}>{inspectedProduct.id}</Text></Text>
                    <Text style={styles.inspectLabel}>Nome da Peça: <Text style={styles.inspectValue}>{inspectedProduct.name}</Text></Text>
                    <Text style={styles.inspectLabel}>Categoria: <Text style={styles.inspectValue}>{inspectedProduct.category}</Text></Text>
                    <Text style={styles.inspectLabel}>Preço Unitário: <Text style={styles.inspectValue}>R$ {inspectedProduct.price}</Text></Text>
                    <Text style={styles.inspectLabel}>Estoque Disponível: <Text style={styles.inspectValue}>{inspectedProduct.stock} unidades</Text></Text>
                  </View>

                  {isAdmin && (
                    <TouchableOpacity style={styles.editInspectBtn} onPress={() => setIsEditing(true)}>
                      <Text style={styles.editInspectBtnText}>✏️ EDITAR PRODUTO</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.closeInspectBtn} onPress={() => setInspectModalVisible(false)}>
                    <Text style={styles.closeInspectBtnText}>FECHAR</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Modo Edição
                <View>
                  <Text style={styles.inputLabel}>Nome da Peça</Text>
                  <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} placeholder="Nome" placeholderTextColor="#777" />

                  <Text style={styles.inputLabel}>Categoria</Text>
                  <TextInput style={styles.modalInput} value={editCategory} onChangeText={setEditCategory} placeholder="Categoria" placeholderTextColor="#777" />

                  <Text style={styles.inputLabel}>Preço (R$)</Text>
                  <TextInput style={styles.modalInput} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" placeholder="Preço" placeholderTextColor="#777" />

                  <Text style={styles.inputLabel}>Estoque</Text>
                  <TextInput style={styles.modalInput} value={editStock} onChangeText={setEditStock} keyboardType="numeric" placeholder="Estoque" placeholderTextColor="#777" />

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)} disabled={updating}>
                      <Text style={styles.cancelBtnText}>CANCELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProduct} disabled={updating}>
                      {updating ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.saveBtnText}>SALVAR</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ================== ESTILOS ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  welcomeText: { color: '#FFF', fontSize: 16 },
  userName: { fontWeight: 'bold', color: '#E50914' },
  roleBadge: { color: '#777', fontSize: 12 },
  headerButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  
  cartBtn: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#E50914', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  cartBtnText: { color: '#E50914', fontSize: 11, fontWeight: 'bold' },
  
  dashboardBtn: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#E50914', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  dashboardBtnText: { color: '#E50914', fontSize: 11, fontWeight: 'bold' },
  
  loginBtn: { backgroundColor: '#E50914', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  loginBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  logoutBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  logoutBtnText: { color: '#FFF', fontSize: 11 },
  
  searchSection: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#333', height: 44 },
  clearBtn: { backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8 },
  clearBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },

  addProductBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  addProductBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  catalogHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  reloadCatalogBtn: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  reloadCatalogBtnText: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },

  emptyListText: { color: '#777', textAlign: 'center', marginTop: 30, fontSize: 14 },

  productCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  productName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  productCategory: { color: '#777', fontSize: 12, marginBottom: 6 },
  productPrice: { color: '#E50914', fontSize: 16, fontWeight: 'bold' },
  productStock: { color: '#AAA', fontSize: 12, marginTop: 2 },
  
  buyBtn: { backgroundColor: '#E50914', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  disabledBuyBtn: { backgroundColor: '#444' },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  adminActionsContainer: { flexDirection: 'column', gap: 6 },
  inspectBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  inspectBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#8B0000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  deleteBtnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { backgroundColor: '#121212', color: '#FFF', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, marginBottom: 12 },
  inputLabel: { color: '#AAA', fontSize: 12, marginBottom: 4, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: '#777', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#E50914', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },

  inspectDetails: { gap: 10, marginBottom: 20 },
  inspectLabel: { color: '#888', fontSize: 14 },
  inspectValue: { color: '#FFF', fontWeight: 'bold' },
  editInspectBtn: { backgroundColor: '#FF9800', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  editInspectBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  closeInspectBtn: { backgroundColor: '#E50914', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  closeInspectBtnText: { color: '#FFF', fontWeight: 'bold' }
});