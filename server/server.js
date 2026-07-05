import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRouters.js';
import { Server } from 'socket.io';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);

// Initalize Socket.io server
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Store online users
export const userSocketMap = {};

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch (error) {
        return next(new Error("Authentication error: Invalid token"));
    }
});

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.userId; // Get from authenticated token
    const userIdStr = String(userId); // normalize to string
    console.log("User Connected: ", userIdStr);

    if (userId) userSocketMap[userIdStr] = socket.id;
    console.log("User SocketId: ", socket.id, "Map:", userSocketMap);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected: ", userIdStr);
        delete userSocketMap[userIdStr];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    socket.on("typing", ({ receiverId }) => {
        const rid = String(receiverId);
        const receiverSocketId = userSocketMap[rid];
        console.log(`typing: sender=${userIdStr} receiver=${rid} socket=${receiverSocketId}`);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { senderId: userIdStr });
        }
    });

    socket.on("stopTyping", ({ receiverId }) => {
        const rid = String(receiverId);
        const receiverSocketId = userSocketMap[rid];
        console.log(`stopTyping: sender=${userIdStr} receiver=${rid}`);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", { senderId: userIdStr });
        }
    });

})


// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

app.use("/api/status", (req, res) => res.send("API is working"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Error handling middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB
await connectDB();


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); }); 