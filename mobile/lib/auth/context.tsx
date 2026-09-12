import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { auth0Config, auth0Discovery } from "./config";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getUserInfo,
  setUserInfo,
  clearAllAuth,
  type StoredUserInfo,
} from "./storage";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  user: StoredUserInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  user: null,
  login: async () => {},
  logout: async () => {},
  getValidToken: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUserInfo | null>(null);

  const discovery = auth0Discovery;

  const redirectUri = Platform.OS === "web"
    ? AuthSession.makeRedirectUri({ path: "callback" })
    : AuthSession.makeRedirectUri({ scheme: "stride", path: "callback" });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: auth0Config.clientId,
      redirectUri,
      scopes: auth0Config.scopes,
      usePKCE: true,
      extraParams: {
        audience: auth0Config.apiAudience,
      },
    },
    discovery
  );

  const handleTokenReceived = useCallback(async (token: string, refreshToken?: string) => {
    await setAccessToken(token);
    setAccessTokenState(token);

    if (refreshToken) {
      await setRefreshToken(refreshToken);
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userInfo: StoredUserInfo = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.nickname,
        picture: payload.picture,
      };
      await setUserInfo(userInfo);
      setUser(userInfo);
    } catch {}

    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleTokenReceived(authentication.accessToken, authentication.refreshToken || undefined);
      } else if (response.params?.code && request) {
        const codeVerifier = request.codeVerifier;
        fetch(`https://${auth0Config.domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: auth0Config.clientId,
            code: response.params.code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.access_token) {
              handleTokenReceived(data.access_token, data.refresh_token);
            } else {
              setIsLoading(false);
            }
          })
          .catch(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else if (response.type === "error") {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [response, request]);

  const login = useCallback(async () => {
    if (!request) {
      setIsLoading(false);
      return;
    }
    try {
      await promptAsync();
    } catch {
      setIsLoading(false);
    }
  }, [request, promptAsync, redirectUri]);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const token = await getAccessToken();
        const storedUser = await getUserInfo();

        if (token && storedUser) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const expiresAt = payload.exp * 1000;

            if (Date.now() >= expiresAt) {
              const refreshToken = await getRefreshToken();
              if (refreshToken) {
                const refreshed = await refreshAccessToken(refreshToken);
                if (refreshed) {
                  return;
                }
              }
              await clearAllAuth();
              setIsLoading(false);
              return;
            }
          } catch {
            await clearAllAuth();
            setIsLoading(false);
            return;
          }

          setAccessTokenState(token);
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch {} finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const refreshAccessToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://${auth0Config.domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: auth0Config.clientId,
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        await handleTokenReceived(data.access_token, data.refresh_token);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      await clearAllAuth();
      setAccessTokenState(null);
      setUser(null);
      setIsAuthenticated(false);

      const logoutUrl = `https://${auth0Config.domain}/v2/logout?client_id=${auth0Config.clientId}&returnTo=${encodeURIComponent(redirectUri)}`;
      await WebBrowser.openBrowserAsync(logoutUrl);
    } catch {}
  }, [redirectUri]);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000;

      if (Date.now() >= expiresAt * 0.9) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const refreshed = await refreshAccessToken(refreshToken);
          if (refreshed) {
            return await getAccessToken();
          }
        }
        return null;
      }

      return token;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        user,
        login,
        logout,
        getValidToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
