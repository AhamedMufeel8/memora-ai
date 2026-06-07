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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        Cookies.set('token', response.token, { expires: 1 }); // 1 day
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
        setUser(userData);
        localStorage.setItem('ai_study_user', JSON.stringify(userData));
        sessionStorage.setItem('show_onboarding', 'true');
        setLoading(false);
        return userData;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        Cookies.set('token', response.token, { expires: 1 }); // 1 day
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
        setUser(userData);
        localStorage.setItem('ai_study_user', JSON.stringify(userData));
        sessionStorage.setItem('show_onboarding', 'true');
        setLoading(false);
        return userData;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err) {
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
    Cookies.remove('token');
  };

  const updateUserProfile = (updatedDetails) => {
    setUser(prev => {
      const next = { ...prev, ...updatedDetails };
      localStorage.setItem('ai_study_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithSocial, logout, updateUserProfile }}>
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
