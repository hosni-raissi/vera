import { useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { StatusBar } from "expo-status-bar"
import { LanguageProvider } from "./utils/LanguageContext"

import LoadingScreen from "./screens/LoadingScreen"
import SignInScreen from "./screens/auth/SignInScreen"
import SignUpScreen from "./screens/auth/SignUpScreen"
import HomeScreen from "./screens/home/HomeScreen"
import ChatScreen from "./screens/chat/ChatScreen"
import DashboardScreen from "./screens/dashboard/DashboardScreen"
import SettingsScreen from "./screens/settings/SettingsScreen"
import InteractionScreen from "./screens/interaction/InteractionScreen"

const Stack = createNativeStackNavigator()

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [botVariant, setBotVariant] = useState<"bot" | "planet">("bot")

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          {isLoading ? (
            // Show loading screen while checking internet connection
            <LoadingScreen onLoadComplete={() => setIsLoading(false)} />
          ) : (
            <NavigationContainer>
              <StatusBar style="light" translucent />
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#0f172a" },
                }}
              >
              {!isSignedIn ? (
                <>
                  <Stack.Screen name="SignIn" options={{ animation: "none" }}>
                    {(props) => <SignInScreen {...props} onSignIn={() => setIsSignedIn(true)} />}
                  </Stack.Screen>
                  <Stack.Screen name="SignUp" component={SignUpScreen} options={{ animation: "none" }} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Home">
                    {(props) => <HomeScreen {...props} botVariant={botVariant} />}
                  </Stack.Screen>
                  <Stack.Screen name="Chat" component={ChatScreen} />
                  <Stack.Screen name="Dashboard" component={DashboardScreen} />
                  <Stack.Screen name="Interaction" component={InteractionScreen} />
                  <Stack.Screen name="Settings">
                    {(props) => (
                      <SettingsScreen
                        {...props}
                        onLogout={() => setIsSignedIn(false)}
                        botVariant={botVariant}
                        setBotVariant={setBotVariant}
                      />
                    )}
                  </Stack.Screen>
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
          )}
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
