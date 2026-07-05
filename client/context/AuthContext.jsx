import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        }
        catch (error) {
            toast.error(error.message);
            setAuthUser(null);
        } finally {
            setIsCheckingAuth(false);
        }
    }

    // Login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                // setAuthUser(data.userData);
                // connectSocket(data.userData);
                // axios.defaults.headers.common['token'] = data.token;
                // setToken(data.token);
                // localStorage.setItem("token", data.token);
                // toast.success(data.message);
                setAuthUser(data.data.userData);
                connectSocket(data.data.userData);

                axios.defaults.headers.common['token'] = data.data.token;
                setToken(data.data.token);
                localStorage.setItem("token", data.data.token);

                toast.success(data.data.message);
            }
            else {
                toast.error(data.message);
            }
        }
        catch (error) {
            toast.error(error.message);
        }
    }

    // Logout function to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common['token'] = null;
        toast.success("Logged out successfully");
        socket?.disconnect();
    }


    // update Pofile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated Succesfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Connect Socket function to handle socket connection and Online user updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        })
    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['token'] = token;
            checkAuth();
        } else {
            setAuthUser(null);
            setIsCheckingAuth(false);
        }
    }, [token]);


    const value = {
        axios,
        // token,
        // setToken,
        authUser,
        // setAuthUser,
        onlineUsers,
        // setOnlineUsers,
        socket,
        // setSocket
        login,
        logout,
        updateProfile,
        isCheckingAuth
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

