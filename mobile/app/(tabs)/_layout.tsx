import React from "react";
import { Tabs } from "expo-router";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null, // Hide separate history tab, merged into Profile
        }}
      />
    </Tabs>
  );
}
