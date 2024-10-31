import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login" }} />{" "}
      {/* Login screen */}
      <Stack.Screen name="home" options={{ title: "Home" }} />{" "}
      {/* Home screen */}
      <Stack.Screen
        name="create-account"
        options={{ title: "Register" }}
      />{" "}
      {/* Registering a new user */}
    </Stack>
  );
}
