import { type Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (_level, message, containsPii) => {
        if (containsPii) return;
        if (_level === LogLevel.Error) console.error('[MSAL]', message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};
