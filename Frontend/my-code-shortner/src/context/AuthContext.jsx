import { createContext, useContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated: false, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};
