import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/Cloudinary.js";
import { userSocketMap, io } from "../server.js";

// Get all users expect the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userid = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userid } }).select("-password");

        // Count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userid, seen: false });
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })

        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get all messages for Selected User
export const getMessages = async (req, res) => {
    try {
        const { id: selecteduserId } = req.params;
        const myId = req.user._id;

        // Mark unseen messages as seen FIRST
        const unseenMessages = await Message.find({ 
            senderId: selecteduserId, 
            receiverId: myId, 
            seen: false 
        });

        if (unseenMessages.length > 0) {
            await Message.updateMany(
                { senderId: selecteduserId, receiverId: myId, seen: false },
                { seen: true }
            );

            // Emit messagesSeen events for the sender
            const senderSocketId = userSocketMap[String(selecteduserId)];
            if (senderSocketId) {
                unseenMessages.forEach(msg => {
                    io.to(senderSocketId).emit("messagesSeen", { messageId: msg._id });
                });
                console.log(`marked ${unseenMessages.length} messages as seen for sender=${selecteduserId}`);
            }
        }

        // NOW fetch all messages (already updated with seen: true)
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selecteduserId },
                { senderId: selecteduserId, receiverId: myId }
            ]
        })
            .populate({
                path: 'replyTo',
                populate: { path: 'senderId', select: 'fullName' }
            })
            .lean() // Return plain objects instead of Mongoose documents
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });

    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


// api to mark message as seen using messageid
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.receiverId && message.receiverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updatedMessage = await Message.findByIdAndUpdate(messageId, { seen: true }, { new: true });

        const senderSocketId = userSocketMap[String(message.senderId)];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesSeen", { messageId: message._id });
            console.log(`messagesSeen: markerId=${messageId} senderSocket=${senderSocketId}`);
        }

        res.json({ success: true, message: "Message marked as seen" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image, replyTo } = req.body;
        const senderId = req.user._id;
        const receiverId = req.params.id; // always a one-to-one chat

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            replyTo
        });

        if (replyTo) {
            await newMessage.populate('replyTo');
        }

        // Convert to plain object to ensure seen field and other fields are included
        const plainMessage = JSON.parse(JSON.stringify(newMessage.toObject ? newMessage.toObject() : newMessage));

        // debug: log mapping and socket id
        const rid = String(receiverId);
        const socketId = userSocketMap[rid];
        console.log(`sendMessage: msgId=${plainMessage._id} sender=${senderId} receiver=${rid} seen=${plainMessage.seen} socketId=${socketId}`);

        if (socketId) {
            io.to(socketId).emit("newMessage", plainMessage);
        }

        res.json({ success: true, newMessage: plainMessage });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Delete message
export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            {
                text: "This message was deleted",
                image: null,
                deleted: true
            },
            { new: true }
        );

        if (message.receiverId) {
            const receiverSocketId = userSocketMap[String(message.receiverId)];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", updatedMessage);
            }
        }

        res.json({ success: true, message: updatedMessage });

    } catch (error) {
        console.log("Error in deleteMessage controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// React to message
export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId);

        if (message.receiverId) {
            const receiverSocketId = userSocketMap[message.receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageReaction", updatedMessage);
            }
        }

        res.json({ success: true, message: updatedMessage });

    } catch (error) {
        console.log("Error in reactToMessage controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
