import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axiosInstance from 'axios';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);

    // Group States
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupTypingUsers, setGroupTypingUsers] = useState({});

    // Call Signaling State
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCallPeerId, setActiveCallPeerId] = useState(null);

    // Status / Stories State
    const [statuses, setStatuses] = useState([]);

    const { socket, axios, authUser } = useContext(AuthContext);
    const [streamToken, setStreamToken] = useState("");

    // Function to get all users for sidebar
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

    // Function to get all groups for user
    const getUserGroups = async () => {
        try {
            const { data } = await axios.get("/api/groups");
            if (data.success) {
                setGroups(data.groups);
                if (socket) {
                    data.groups.forEach((g) => {
                        socket.emit("joinGroup", { groupId: g._id });
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching user groups:", error.message);
        }
    };

    // Status Story API handlers
    const getStatuses = async () => {
        try {
            const { data } = await axios.get("/api/status/list");
            if (data.success) {
                setStatuses(data.statuses);
            }
        } catch (error) {
            console.error("Error fetching status stories:", error.message);
        }
    };

    const createStatus = async (statusData) => {
        try {
            const { data } = await axios.post("/api/status/create", statusData);
            if (data.success) {
                toast.success("Status story posted!");
                getStatuses();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const viewStatus = async (statusId) => {
        try {
            const { data } = await axios.post(`/api/status/view/${statusId}`);
            if (data.success) {
                getStatuses();
            }
        } catch (error) {
            console.error("Error recording status view:", error.message);
        }
    };

    // Block / Unblock User
    const blockUser = async (targetUserId) => {
        try {
            const { data } = await axios.put(`/api/auth/block/${targetUserId}`);
            if (data.success) {
                toast.success(data.isBlocked ? "User blocked" : "User unblocked");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to create a group
    const createGroup = async (groupData) => {
        try {
            const { data } = await axios.post("/api/groups", groupData);
            if (data.success) {
                setGroups((prev) => [data.group, ...prev]);
                if (socket) {
                    socket.emit("joinGroup", { groupId: data.group._id });
                }
                toast.success("Group created successfully!");
                return data.group;
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to get messages for selected 1-on-1 user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to get messages for selected group
    const getGroupMessages = async (groupId) => {
        try {
            const { data } = await axios.get(`/api/groups/${groupId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to send message (handles DM or Group)
    const sendMessage = async (messageData) => {
        try {
            const payload = {
                ...messageData,
                replyTo: replyingTo ? replyingTo._id : null
            };

            if (selectedGroup) {
                const { data } = await axios.post(`/api/groups/send/${selectedGroup._id}`, payload);
                if (data.success) {
                    setMessages((prevMessages) => [...prevMessages, data.newMessage]);
                    setReplyingTo(null);
                } else {
                    toast.error(data.message);
                }
            } else if (selectedUser) {
                const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, payload);
                if (data.success) {
                    setMessages((prevMessages) => [...prevMessages, data.newMessage]);
                    setReplyingTo(null);
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to react to a message
    const reactToMessage = async (messageId, emoji) => {
        try {
            const { data } = await axios.post(`/api/messages/react/${messageId}`, { emoji });
            if (data.success) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId ? { ...msg, reactions: data.message.reactions } : msg
                    )
                );
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Add member to group
    const addMemberToGroup = async (groupId, memberId) => {
        try {
            const { data } = await axios.put(`/api/groups/add-member/${groupId}`, { memberId });
            if (data.success) {
                setSelectedGroup(data.group);
                setGroups((prev) => prev.map((g) => (g._id === groupId ? data.group : g)));
                toast.success("Member added successfully!");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Remove member from group
    const removeMemberFromGroup = async (groupId, memberId) => {
        try {
            const { data } = await axios.put(`/api/groups/remove-member/${groupId}`, { memberId });
            if (data.success) {
                setSelectedGroup(data.group);
                setGroups((prev) => prev.map((g) => (g._id === groupId ? data.group : g)));
                toast.success("Member removed");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Emit typing status socket events
    const sendTypingStatus = (isTyping) => {
        if (!socket) return;
        if (selectedGroup) {
            if (isTyping) {
                socket.emit("groupTyping", { groupId: selectedGroup._id });
            } else {
                socket.emit("groupStopTyping", { groupId: selectedGroup._id });
            }
        } else if (selectedUser) {
            if (isTyping) {
                socket.emit("typing", { to: selectedUser._id });
            } else {
                socket.emit("stopTyping", { to: selectedUser._id });
            }
        }
    };

    // Call Signaling Methods
    const initiateCall = (toUserId, callId, isVideo = true) => {
        if (!socket || !authUser) return;
        setActiveCallPeerId(toUserId);
        socket.emit("startCall", {
            to: toUserId,
            callId,
            isVideo,
            callerName: authUser.fullName,
            callerPic: authUser.profilePic
        });
    };

    const acceptCall = () => {
        if (!socket || !incomingCall) return;
        setActiveCallPeerId(incomingCall.from);
        socket.emit("acceptCall", {
            to: incomingCall.from,
            callId: incomingCall.callId
        });
        setIncomingCall(null);
    };

    const rejectCall = () => {
        if (!socket || !incomingCall) return;
        socket.emit("rejectCall", {
            to: incomingCall.from,
            callId: incomingCall.callId
        });
        setIncomingCall(null);
    };

    const endCall = (toUserId, callId) => {
        if (!socket) return;
        const targetPeerId = toUserId || activeCallPeerId || selectedUser?._id;
        socket.emit("endCall", {
            to: targetPeerId,
            callId
        });
        setActiveCallPeerId(null);
    };

    // Select User (clears selectedGroup)
    const selectUserChat = (user) => {
        setSelectedGroup(null);
        setSelectedUser(user);
    };

    // Select Group (clears selectedUser)
    const selectGroupChat = (group) => {
        setSelectedUser(null);
        setSelectedGroup(group);
    };

    // Subscribe to socket events
    const subscribeToMessages = () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                newMessage.delivered = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
                        ? prevUnseenMessages[newMessage.senderId] + 1
                        : 1
                }));
            }
        });

        socket.on("newGroupMessage", (newMessage) => {
            if (selectedGroup && newMessage.groupId === selectedGroup._id) {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
        });

        socket.on("groupUpdated", (updatedGroup) => {
            setGroups((prev) => prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)));
            if (selectedGroup && selectedGroup._id === updatedGroup._id) {
                setSelectedGroup(updatedGroup);
            }
        });

        socket.on("addedToGroup", (newGroup) => {
            setGroups((prev) => {
                if (prev.some((g) => g._id === newGroup._id)) return prev;
                return [newGroup, ...prev];
            });
            toast.success(`You were added to group "${newGroup.name}"!`, { duration: 4000 });
        });

        socket.on("removedFromGroup", ({ groupId }) => {
            setGroups((prev) => prev.filter((g) => g._id !== groupId));
            setSelectedGroup((currentSelected) => {
                if (currentSelected && currentSelected._id === groupId) {
                    return null;
                }
                return currentSelected;
            });
            toast("You were removed from the group", { icon: "ℹ️" });
        });

        socket.on("messageReaction", ({ messageId, reactions }) => {
            setMessages((prev) =>
                prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
            );
        });

        socket.on("messageSeen", ({ messageId }) => {
            setMessages((prev) =>
                prev.map((msg) => (msg._id === messageId ? { ...msg, seen: true, delivered: true } : msg))
            );
        });

        socket.on("userTyping", ({ from }) => {
            setTypingUsers((prev) => ({ ...prev, [from]: true }));
        });

        socket.on("userStopTyping", ({ from }) => {
            setTypingUsers((prev) => ({ ...prev, [from]: false }));
        });

        socket.on("userGroupTyping", ({ groupId, userId }) => {
            setGroupTypingUsers((prev) => ({ ...prev, [groupId]: userId }));
        });

        socket.on("userGroupStopTyping", ({ groupId }) => {
            setGroupTypingUsers((prev) => ({ ...prev, [groupId]: null }));
        });

        // Call Socket Events
        socket.on("incomingCall", (data) => {
            setIncomingCall(data);
        });

        socket.on("callRejected", () => {
            toast.error("Call was declined");
        });

        socket.on("callAccepted", () => {
            toast.success("Call accepted");
        });

        socket.on("callEnded", () => {
            setActiveCallPeerId(null);
            setIncomingCall(null);
            toast("Call ended", { icon: "📞" });
            if (window.location.pathname.startsWith("/call")) {
                window.location.href = "/";
            }
        });
    };

    // Unsubscribe from socket events
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("newGroupMessage");
            socket.off("groupUpdated");
            socket.off("addedToGroup");
            socket.off("removedFromGroup");
            socket.off("messageReaction");
            socket.off("messageSeen");
            socket.off("userTyping");
            socket.off("userStopTyping");
            socket.off("userGroupTyping");
            socket.off("userGroupStopTyping");
            socket.off("incomingCall");
            socket.off("callRejected");
            socket.off("callAccepted");
            socket.off("callEnded");
        }
    };

    // Function to get stream token
    const getStreamToken = async () => {
        try {
            const { data } = await axiosInstance.get("/api/messages/users/token");
            if (data.success) {
                setStreamToken(data.streamToken);
            }
        } catch (error) {
            toast.error("Could not get stream token", error);
        }
    };

    useEffect(() => {
        if (socket) {
            getUserGroups();
            getStatuses();
        }
    }, [socket]);

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser, selectedGroup]);

    const value = {
        messages,
        users,
        selectedUser,
        setSelectedUser: selectUserChat,
        getUsers,
        getMessages,
        sendMessage,
        unseenMessages,
        setUnseenMessages,
        typingUsers,
        sendTypingStatus,
        replyingTo,
        setReplyingTo,
        reactToMessage,
        // Group Exports
        groups,
        selectedGroup,
        setSelectedGroup: selectGroupChat,
        getUserGroups,
        createGroup,
        getGroupMessages,
        addMemberToGroup,
        removeMemberFromGroup,
        groupTypingUsers,
        // Call Signaling Exports
        incomingCall,
        activeCallPeerId,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        // Status / Stories & Privacy Exports
        statuses,
        getStatuses,
        createStatus,
        viewStatus,
        blockUser
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};