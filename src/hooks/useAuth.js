'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount (mocking session)
  useEffect(() => {
    const storedUser = localStorage.getItem('gadgetTrustXUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (role, email, password) => {
    const savedUsers = localStorage.getItem('gadgetTrustX_users');
    let allUsers = savedUsers ? JSON.parse(savedUsers) : [];
    
    // Auto-seed new default users if they are missing from an older cache
    if (!allUsers.find(u => u.email === 'admin@gmail.com')) {
      const defaultUsers = [
        { id: 'user_1', email: 'admin@gmail.com', name: 'Admin', role: 'admin', password: 'admin' },
        { id: 'user_2', email: 'buyer@gmail.com', name: 'Test Buyer', role: 'buyer', password: 'buyer' },
        { id: 'user_3', email: 'seller@gmail.com', name: 'Test Seller', role: 'seller', password: 'seller' }
      ];
      defaultUsers.forEach(du => {
         if (!allUsers.find(u => u.email === du.email)) {
             allUsers.push(du);
         }
      });
      localStorage.setItem('gadgetTrustX_users', JSON.stringify(allUsers));
    }
    
    let existingUser = allUsers.find(u => u.email === email && u.role === role);
    
    if (existingUser) {
      if (existingUser.password && existingUser.password !== password) {
        return { success: false, message: 'Invalid password' };
      }
      setUser(existingUser);
      localStorage.setItem('gadgetTrustXUser', JSON.stringify(existingUser));
      return { success: true };
    } else {
      return { success: false, message: 'Account not found. Please register first.' };
    }
  };

  const register = (role, email, password, name) => {
    const savedUsers = localStorage.getItem('gadgetTrustX_users');
    let allUsers = savedUsers ? JSON.parse(savedUsers) : [];
    
    let existingUser = allUsers.find(u => u.email === email && u.role === role);
    if (existingUser) {
      return { success: false, message: 'Account already exists. Please sign in.' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      email,
      password,
      role,
      name: name || email.split('@')[0],
      phone: '',
      address: '',
      isVerified: false
    };
    allUsers.push(newUser);
    localStorage.setItem('gadgetTrustX_users', JSON.stringify(allUsers));
    
    setUser(newUser);
    localStorage.setItem('gadgetTrustXUser', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gadgetTrustXUser');
  };

  const updateProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('gadgetTrustXUser', JSON.stringify(newUser));
    
    const savedUsers = localStorage.getItem('gadgetTrustX_users');
    if (savedUsers) {
      let allUsers = JSON.parse(savedUsers);
      const idx = allUsers.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        allUsers[idx] = newUser;
        localStorage.setItem('gadgetTrustX_users', JSON.stringify(allUsers));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
