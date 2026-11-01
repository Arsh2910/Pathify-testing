import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App'

const rawClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
const hasGoogleAuth = Boolean(rawClientId && rawClientId !== 'your-google-client-id-here');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {hasGoogleAuth ? (
      <GoogleOAuthProvider clientId={rawClientId!}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
