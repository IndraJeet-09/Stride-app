import { Platform } from "react-native";
import Constants from "expo-constants";

const AUTH0_DOMAIN = Constants.expoConfig?.extra?.auth0Domain || process.env.EXPO_PUBLIC_AUTH0_DOMAIN || "";

// Pick the right Client ID based on platform
const AUTH0_CLIENT_ID = Platform.OS === "web"
  ? (process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID_WEB || "")
  : (Constants.expoConfig?.extra?.auth0ClientId || process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID_NATIVE || "");

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export const auth0Config = {
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  apiAudience: "https://api.stride.app",
  scopes: ["openid", "profile", "email", "offline_access"],
  apiUrl: API_URL,
};

export const auth0Discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  endSessionEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};
