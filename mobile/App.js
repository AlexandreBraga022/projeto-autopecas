import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CartScreen from './src/screens/CartScreen';

const Stack = createNativeStackNavigator();

function HeaderTitle() {
  return (
    <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 }}>
      TECH<Text style={{ color: '#E50914' }}>TURBO</Text>
    </Text>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerStyle: { backgroundColor: '#1E1E1E' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: 'bold' },
              contentStyle: { backgroundColor: '#121212' }
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerTitle: () => <HeaderTitle /> }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerTitle: () => <HeaderTitle />, headerBackVisible: false }} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Painel do Estoque' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Meu Carrinho' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}