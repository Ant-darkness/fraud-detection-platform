import React, { createContext, useContext, useState, useEffect } from 'react';

// Tạo Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Angalia kama kuna token iliyohifadhiwa mtumiaji anapofungua mfumo
    useEffect(() => {
        const storedToken = localStorage.getItem('bot_auth_token');
        const storedUser = localStorage.getItem('bot_user_data');

        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Imeshindwa kusoma data za mtumiaji:", error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Hakikisha funguo hizi zinafanana na majina yaliyopo kwenye BaseModel ya Python (mfano: email au username)
                body: JSON.stringify({ 
                    email: username, // Kama backend inatarajia 'email'
                    password: password 
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Imeshindwa kuingia');
            }
    
            const data = await response.json();
            localStorage.setItem('bot_auth_token', data.access_token);
            localStorage.setItem('bot_user_data', JSON.stringify(data.user || data.officer));
            
            setUser(data.user || data.officer);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };
    
    

    // Kitendo cha Logout
    const logout = () => {
        localStorage.removeItem('bot_auth_token');
        localStorage.removeItem('bot_user_data');
        setUser(null);
    };

    // Kuchuja nani anaruhusiwa kuona nini (Role-based access helper)
    const hasRole = (allowedRoles) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook kwa ajili ya kutumia Auth kirahisi kwenye kurasa zingine
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth lazima itumike ndani ya AuthProvider');
    }
    return context;
};
