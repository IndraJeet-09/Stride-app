import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "stride_access_token";
const REFRESH_TOKEN_KEY = "stride_refresh_token";
const USER_INFO_KEY = "stride_user_info";

export interface StoredUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

function isWeb(): boolean {
  return Platform.OS === "web" && typeof localStorage !== "undefined";
}

export async function getAccessToken(): Promise<string | null> {
  try {
    if (isWeb()) return localStorage.getItem(ACCESS_TOKEN_KEY);
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    if (isWeb()) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to store access token:", error);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (isWeb()) return localStorage.getItem(REFRESH_TOKEN_KEY);
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    if (isWeb()) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to store refresh token:", error);
  }
}

export async function getUserInfo(): Promise<StoredUserInfo | null> {
  try {
    let raw: string | null;
    if (isWeb()) {
      raw = localStorage.getItem(USER_INFO_KEY);
    } else {
      raw = await SecureStore.getItemAsync(USER_INFO_KEY);
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setUserInfo(info: StoredUserInfo): Promise<void> {
  try {
    const value = JSON.stringify(info);
    if (isWeb()) {
      localStorage.setItem(USER_INFO_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(USER_INFO_KEY, value);
  } catch (error) {
    console.error("Failed to store user info:", error);
  }
}

export async function clearAllAuth(): Promise<void> {
  try {
    if (isWeb()) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_INFO_KEY);
      return;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_INFO_KEY),
    ]);
  } catch (error) {
    console.error("Failed to clear auth data:", error);
  }
}
