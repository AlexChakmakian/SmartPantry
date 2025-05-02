import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Login",
            headerShown: false,
          }}
        />
        <Stack.Screen name="home" options={{ title: "Home" }} />
        <Stack.Screen name="create-account" options={{ title: "Register" }} />
      </Stack>
    </ThemeProvider>
  );
}
