import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import ProductionScreen from '../screens/ProductionScreen';
import StockScreen from '../screens/StockScreen';
import PackingScreen from '../screens/PackingScreen';
import DispatchScreen from '../screens/DispatchScreen';
import EBScreen from '../screens/EBScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: Colors.bgSidebar,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTintColor: Colors.textHeading,
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  contentStyle: {
    backgroundColor: Colors.bg,
  },
};

const TAB_ICONS = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Production: { focused: 'build', unfocused: 'build-outline' },
  Stock: { focused: 'cube', unfocused: 'cube-outline' },
  Packing: { focused: 'gift', unfocused: 'gift-outline' },
  More: { focused: 'apps', unfocused: 'apps-outline' },
};

// === More Menu Screen ===
function MoreMenuScreen({ navigation }) {
  const items = [
    { title: 'Dispatch Entry', sub: 'Record material dispatches to parties', icon: 'send-outline', color: Colors.amber, screen: 'DispatchEntry' },
    { title: 'EB Entry', sub: 'Monthly electricity meter readings', icon: 'flash-outline', color: Colors.cyan, screen: 'EBEntry' },
  ];

  return (
    <View style={moreStyles.container}>
      <Text style={moreStyles.heading}>Additional Entries</Text>
      <Text style={moreStyles.desc}>Dispatch and energy entries for production tracking</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.screen}
          style={moreStyles.card}
          onPress={() => navigation.navigate(item.screen)}
          activeOpacity={0.7}
        >
          <View style={[moreStyles.iconBox, { backgroundColor: item.color + '22' }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>
          <View style={moreStyles.cardText}>
            <Text style={moreStyles.cardTitle}>{item.title}</Text>
            <Text style={moreStyles.cardSub}>{item.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const moreStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.xl },
  heading: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textHeading, marginBottom: Spacing.xs },
  desc: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xxl },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.lg,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textHeading },
  cardSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },
});

// === More Stack Navigator ===
function MoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />
      <Stack.Screen name="DispatchEntry" component={DispatchScreen} options={{ title: 'Dispatch Entry' }} />
      <Stack.Screen name="EBEntry" component={EBScreen} options={{ title: 'EB Entry' }} />
    </Stack.Navigator>
  );
}

// === Main Tab Navigator ===
export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] || TAB_ICONS.More;
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={22} color={color} />;
        },
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bgSidebar,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Production" component={ProductionScreen} options={{ title: 'Production' }} />
      <Tab.Screen name="Stock" component={StockScreen} options={{ title: 'Stock' }} />
      <Tab.Screen name="Packing" component={PackingScreen} options={{ title: 'Packing' }} />
      <Tab.Screen name="More" component={MoreStack} options={{ headerShown: false, title: 'More' }} />
    </Tab.Navigator>
  );
}
