import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [replyMessage, setReplyMessage] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios, authUser } = useContext(AuthContext);

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    // function to get messages for selected user
    const getMessages = async (userId) => {
        setMessages([]); // Clear previous messages immediately
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                console.log("getMessages response:", data.messages.slice(-3)); // Log last 3 messages
                console.log("message seen statuses:", data.messages.map(m => ({ id: m._id, seen: m.seen })));
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    // function to send message to selected user
    const sendMessage = async (messageData) => {
        try {
            if (replyMessage) {
                messageData.replyTo = replyMessage._id;
            }

            if (!selectedUser) return;
            const url = `/api/messages/send/${selectedUser._id}`;

            const { data } = await axios.post(url, messageData);
            if (data.success) {
                setMessages((prev) => [...prev, data.newMessage]);
                setReplyMessage(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // function to delete message
    const deleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/messages/delete/${messageId}`);
            setMessages((prevMessages) => prevMessages.map((msg) =>
                msg._id === messageId ? { ...msg, text: "This message was deleted", image: null, deleted: true } : msg
            ));
        } catch (error) {
            toast.error(error.message);
        }
    };

    // function to react to message
    const reactToMessage = async (messageId, emoji) => {
        try {
            const { data } = await axios.put(`/api/messages/react/${messageId}`, { emoji });
            if (data.success) {
                setMessages((prevMessages) => prevMessages.map((msg) =>
                    msg._id === messageId ? data.message : msg
                ));
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Typing functions
    const sendTyping = () => {
        if (socket && selectedUser) {
            socket.emit("typing", { receiverId: selectedUser._id });
        }
    };

    const sendStopTyping = () => {
        if (socket && selectedUser) {
            socket.emit("stopTyping", { receiverId: selectedUser._id });
        }
    };


    // function to subscribe to messages for selected user
    const subscribeToMessages = () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            console.log("socket newMessage received", newMessage, "seen:", newMessage.seen);
            // ignore messages sent by self
            if (authUser && String(newMessage.senderId) === String(authUser._id)) {
                console.log("ignoring own message");
                return;
            }
            if (selectedUser && (
                String(newMessage.senderId) === String(selectedUser._id) ||
                String(newMessage.receiverId) === String(selectedUser._id)
            )) {
                console.log("adding message to state");
                setMessages((prev) => [...prev, newMessage]);
            }
        });


        socket.on("messageDeleted", (deletedMessage) => {
            if (selectedUser && (
                String(deletedMessage.senderId) === String(selectedUser._id) ||
                String(deletedMessage.receiverId) === String(selectedUser._id)
            )) {
                setMessages((prev) => prev.map((msg) =>
                    msg._id === deletedMessage._id ? deletedMessage : msg
                ));
            }
        });

        socket.on("messageReaction", (updatedMessage) => {
            if (selectedUser && (
                String(updatedMessage.senderId) === String(selectedUser._id) ||
                String(updatedMessage.receiverId) === String(selectedUser._id)
            )) {
                setMessages((prev) => prev.map((msg) =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                ));
            }
        });

        socket.on("typing", ({ senderId }) => {
            if (selectedUser && String(senderId) === String(selectedUser._id)) {
                console.log("typing received from", senderId);
                setIsTyping(true);
            }
        });

        socket.on("stopTyping", ({ senderId }) => {
            if (selectedUser && String(senderId) === String(selectedUser._id)) {
                console.log("stopTyping received");
                setIsTyping(false);
            }
        });

        socket.on("messagesSeen", ({ messageId }) => {
            console.log("messagesSeen:", messageId);
            if (selectedUser) {
                setMessages((prevMessages) => prevMessages.map((msg) =>
                    msg._id === messageId ? { ...msg, seen: true } : msg
                ));
            }
        });
    };

    // function to Unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("messageDeleted");
            socket.off("messageReaction");
            socket.off("typing");
            socket.off("stopTyping");
            socket.off("messagesSeen");
        }
    }

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser, authUser]);


    const value = {
        messages,
        users,
        selectedUser,
        unseenMessages,
        isTyping,
        replyMessage,
        getUsers,
        getMessages,
        sendMessage,
        deleteMessage,
        reactToMessage,
        sendTyping,
        sendStopTyping,
        setReplyMessage,
        setSelectedUser,
        setUnseenMessages
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
