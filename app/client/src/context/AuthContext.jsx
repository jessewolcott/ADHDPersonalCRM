import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [providers, setProviders] = useState([]);

    useEffect(() => {
        // Check if user is logged in
        Promise.all([
            api.getCurrentUser(),
            api.getAuthProviders()
        ]).then(([userData, providersList]) => {
            setUser(userData);
            setProviders(providersList);
        }).catch(err => {
            console.error('Auth check failed:', err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const logout = async () => {
        window.location.href = '/auth/logout';
    };

    return (
        <AuthContext.Provider value={{ user, loading, providers, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
