import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services/auth.service';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ai_study_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('ai_study_user');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // During app load, verify the session/token with the backend
  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('token') || localStorage.getItem('token');
      if (token) {
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success && profileResponse.data) {
            const userData = {
              id: profileResponse.data._id,
              name: profileResponse.data.name,
              email: profileResponse.data.email,
              avatar: profileResponse.data.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
              joinedAt: new Date(profileResponse.data.createdAt).toLocaleDateString(),
              streak: profileResponse.data.streak || 5,
              points: profileResponse.data.xp || 750,
              badge: 'Scholar Novice'
            };
            setUser(userData);
            localStorage.setItem('ai_study_user', JSON.stringify(userData));
          } else {
            // Token is invalid/expired
            logout();
          }
        } catch (error) {
          console.error('Error fetching profile during init:', error);
          // If we fail due to network error, keep current local cache, but if it is 401, logout
          if (error.status === 401) {
            logout();
          }
        }
      } else {
        // No token
        setUser(null);
        localStorage.removeItem('ai_study_user');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    console.log('[AUTH_CONTEXT] Initiating email/password login API request...');
    try {
      const response = await authService.login({ email, password });
      console.log('[AUTH_CONTEXT] Backend login response received:', response);
      if (response.success && response.token) {
        const tokenExpiry = rememberMe ? 7 : 1;
        console.log(`[JWT] Saving Access Token to localStorage and Cookies (expiry: ${tokenExpiry} days)...`);
        localStorage.setItem('token', response.token);
        Cookies.set('token', response.token, { expires: tokenExpiry });
        
        if (response.refreshToken) {
          console.log('[JWT] Saving Refresh Token to localStorage and Cookies (expiry: 7 days)...');
          localStorage.setItem('refreshToken', response.refreshToken);
          Cookies.set('refreshToken', response.refreshToken, { expires: 7 });
        }
        
        const userData = {
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          avatar: response.data.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
          joinedAt: new Date().toLocaleDateString(),
          streak: response.data.streak || 5,
          points: response.data.xp || 750,
          badge: 'Scholar Novice'
        };

        console.log('[AUTH_CONTEXT] Active user state updated:', userData);
        setUser(userData);
        localStorage.setItem('ai_study_user', JSON.stringify(userData));
        sessionStorage.setItem('show_onboarding', 'true');
        setLoading(false);
        return userData;
      } else {
        console.error('[AUTH_CONTEXT] Login failed: Invalid credentials or missing response token.');
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('[AUTH_CONTEXT] Error inside email/password login flow:', err);
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    console.log('[AUTH_CONTEXT] Initiating registration API request...');
    try {
      const response = await authService.register({ name, email, password });
      console.log('[AUTH_CONTEXT] Backend registration response received:', response);
      if (response.success && response.token) {
        console.log('[JWT] Saving Access Token to localStorage and Cookies (expiry: 1 day)...');
        localStorage.setItem('token', response.token);
        Cookies.set('token', response.token, { expires: 1 });
        
        if (response.refreshToken) {
          console.log('[JWT] Saving Refresh Token to localStorage and Cookies (expiry: 7 days)...');
          localStorage.setItem('refreshToken', response.refreshToken);
          Cookies.set('refreshToken', response.refreshToken, { expires: 7 });
        }
        
        const userData = {
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          avatar: response.data.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
          joinedAt: new Date().toLocaleDateString(),
          streak: response.data.streak || 1,
          points: response.data.xp || 100,
          badge: 'Fresh Initiate'
        };

        console.log('[AUTH_CONTEXT] Active user state updated post-signup:', userData);
        setUser(userData);
        localStorage.setItem('ai_study_user', JSON.stringify(userData));
        sessionStorage.setItem('show_onboarding', 'true');
        setLoading(false);
        return userData;
      } else {
        console.error('[AUTH_CONTEXT] Signup failed: Missing user credentials in payload response.');
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err) {
      console.error('[AUTH_CONTEXT] Error inside user signup flow:', err);
      setLoading(false);
      throw err;
    }
  };

  const googleLogin = async (idToken, rememberMe = false) => {
    setLoading(true);
    console.log('[GOOGLE_AUTH] Initiating googleLogin flow inside AuthContext...');
    try {
      console.log('[AUTH_CONTEXT] Sending Google Firebase ID token payload to backend...');
      const response = await authService.googleLogin(idToken);
      console.log('[AUTH_CONTEXT] Google login backend response received:', response);
      
      if (response.success && response.token) {
        const tokenExpiry = rememberMe ? 7 : 1;
        console.log(`[JWT] Saving Google Access Token to localStorage and Cookies (expiry: ${tokenExpiry} days)...`);
        localStorage.setItem('token', response.token);
        Cookies.set('token', response.token, { expires: tokenExpiry });
        
        if (response.refreshToken) {
          console.log('[JWT] Saving Google Refresh Token to localStorage and Cookies (expiry: 7 days)...');
          localStorage.setItem('refreshToken', response.refreshToken);
          Cookies.set('refreshToken', response.refreshToken, { expires: 7 });
        } else {
          console.warn('[JWT] Warning: No refreshToken returned in google login response');
        }

        const userData = {
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          avatar: response.data.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
          joinedAt: response.data.createdAt ? new Date(response.data.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          streak: response.data.streak !== undefined ? response.data.streak : 0,
          points: response.data.xp !== undefined ? response.data.xp : 0,
          badge: 'Scholar Novice'
        };

        console.log('[AUTH_CONTEXT] Updating active user state inside AuthProvider:', userData);
        setUser(userData);
        localStorage.setItem('ai_study_user', JSON.stringify(userData));
        sessionStorage.setItem('show_onboarding', 'true');
        setLoading(false);
        return userData;
      } else {
        console.error('[AUTH_CONTEXT] Google login failed: Response missing success/token properties.');
        throw new Error(response.message || 'Google login failed');
      }
    } catch (err) {
      console.error('[AUTH_CONTEXT] Error inside AuthContext.googleLogin:', err);
      setLoading(false);
      throw err;
    }
  };

  const loginWithSocial = async (provider) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockUser = {
      id: 'usr_social',
      name: `${provider} Student`,
      email: `${provider.toLowerCase()}@aistudy.com`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop',
      joinedAt: new Date().toLocaleDateString(),
      streak: 3,
      points: 250,
      badge: 'Digital Learner'
    };

    localStorage.setItem('token', 'mock_social_token');
    Cookies.set('token', 'mock_social_token', { expires: 1 });
    localStorage.setItem('refreshToken', 'mock_social_refresh_token');
    Cookies.set('refreshToken', 'mock_social_refresh_token', { expires: 7 });
    setUser(mockUser);
    localStorage.setItem('ai_study_user', JSON.stringify(mockUser));
    sessionStorage.setItem('show_onboarding', 'true');
    setLoading(false);
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ai_study_user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    Cookies.remove('token');
    Cookies.remove('refreshToken');
  };
  const updateUserProfile = (updatedDetails) => {
    setUser(prev => {
      const next = { ...prev, ...updatedDetails };
      localStorage.setItem('ai_study_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, loginWithSocial, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
