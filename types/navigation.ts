import type { NativeStackScreenProps } from "@react-navigation/native-stack"

export type RootStackParamList = {
  SignIn: undefined
  SignUp: undefined
  Home: undefined
  Chat: undefined
  Dashboard: undefined
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>
