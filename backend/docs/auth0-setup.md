# Auth0 Setup Guide

## Overview

Stride uses Auth0 for authentication. The mobile app uses Authorization Code Flow + PKCE, and the backend validates access tokens.

## Auth0 Dashboard Configuration

### 1. Create Application

1. Go to Auth0 Dashboard → Applications → Applications
2. Click "Create Application"
3. Name: "Stride Mobile"
4. Type: **Native Application**
5. Click "Create"

### 2. Configure Application

#### Settings Tab

**Application URIs:**
- Allowed Callback URLs:
  ```
  com.stride.app://YOUR_AUTH0_DOMAIN/callback
  ```

- Allowed Logout URLs:
  ```
  com.stride.app://
  ```

- Allowed Web Origins:
  ```
  http://localhost:8081
  ```

**Advanced Settings → Grant Types:**
- Enable: Authorization Code, Refresh Token

**Advanced Settings → Device Authorization:**
- Enable: Token Endpoint Authentication Method = None

### 3. Create API

1. Go to Auth0 Dashboard → Applications → APIs
2. Click "Create API"
3. Name: "Stride API"
4. Identifier: `https://api.stride.app`
5. Signing Algorithm: RS256
6. Click "Create"

### 4. Configure API Scopes

In the Stride API → Permissions tab, create:

| Permission | Description |
|------------|-------------|
| `read:profile` | Read user profile |
| `write:profile` | Update user profile |
| `read:runs` | Read run data |
| `write:runs` | Create/update runs |
| `read:stats` | Read statistics |
| `read:contributions` | Read contribution graph |

### 5. Enable Authorizations

1. In Stride API → Authorizations tab
2. Authorize "Stride Mobile" application
3. Select all permissions

## Environment Variables

### Mobile App (.env)
```
EXPO_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
EXPO_PUBLIC_AUTH0_CLIENT_ID=your_client_id
EXPO_PUBLIC_AUTH0_AUDIENCE=https://api.stride.app
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Backend (.env)
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://api.stride.app
DATABASE_URL=postgres://postgres:postgres@localhost:5432/stride
```

## Mobile Integration

### Install Auth0 SDK

```bash
npm install react-native-auth0
```

### Configure Auth0Provider

```tsx
import { Auth0Provider } from "react-native-auth0";

const config = {
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN!,
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!,
};

export default function App() {
  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <Navigation />
    </Auth0Provider>
  );
}
```

### Login Flow

```tsx
import { useAuth0 } from "react-native-auth0";

function LoginScreen() {
  const { authorize, hasValidCredentials } = useAuth0();

  const onLogin = async () => {
    try {
      await authorize({
        scope: "openid profile email read:profile write:profile read:runs write:runs",
        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      });
      // User is now authenticated
    } catch (error) {
      console.error(error);
    }
  };

  return <Button onPress={onLogin} title="Log In" />;
}
```

### Get Access Token

```tsx
import { useAuth0 } from "react-native-auth0";

function ApiClient() {
  const { getCredentials } = useAuth0();

  const callApi = async () => {
    const credentials = await getCredentials();
    if (credentials?.accessToken) {
      // Use credentials.accessToken for API calls
      const response = await fetch("/api/v1/runs", {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      });
    }
  };
}
```

### Logout Flow

```tsx
import { useAuth0 } from "react-native-auth0";

function LogoutScreen() {
  const { clearSession } = useAuth0();

  const onLogout = async () => {
    await clearSession();
    // User is logged out
  };

  return <Button onPress={onLogout} title="Log Out" />;
}
```

## Backend Token Verification

The backend uses `jose` library to verify Auth0 access tokens:

1. Extract token from `Authorization: Bearer <token>` header
2. Fetch JWKS from `https://YOUR_AUTH0_DOMAIN/.well-known/jwks.json`
3. Verify JWT signature, issuer, audience, expiry
4. Extract `sub` claim (Auth0 user ID)
5. Get or create Stride user by `auth0_user_id`

## Testing

### Test Token

1. Use Auth0 Playground or call `/oauth/token` endpoint
2. Verify token contains expected claims:
   - `sub`: "auth0|..."
   - `iss`: "https://your-tenant.auth0.com/"
   - `aud`: "https://api.stride.app"
   - `exp`: future timestamp

### Common Issues

**Invalid token:**
- Check AUTH0_DOMAIN matches tenant
- Check AUTH0_AUDIENCE matches API identifier
- Check token is not expired

**CORS errors:**
- Ensure mobile app origin is in Auth0 allowed origins
- Ensure backend CORS configuration allows mobile app

**No user created:**
- Check Auth0 token contains `sub` claim
- Check backend logs for provisioning errors
