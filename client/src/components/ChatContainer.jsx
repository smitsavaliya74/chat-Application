import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const ChatContainer = () => {

  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    deleteMessage,
    reactToMessage,
    isTyping,
    sendTyping,
    sendStopTyping,
    replyMessage,
    setReplyMessage
  } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const typingTimeoutRef = useRef(null);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
    sendStopTyping();
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!isTyping) {
      sendTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  };


  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const isChatOpen = !!selectedUser;
  const chatName = selectedUser ? selectedUser.fullName : '';
  const chatImage = selectedUser ? (selectedUser.profilePic || assets.avatar_icon) : assets.avatar_icon;
  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);

  return isChatOpen ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>

      {/* ----------- Header ----------- */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img
          src={chatImage}
          alt=""
          className='w-8 aspect-square object-cover rounded-full'
        />

        <div className='flex-1 text-white'>
          <p className='flex items-center gap-2 text-lg'>
            {chatName}
            {isOnline && (
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            )}
          </p>
        </div>

        <img
          onClick={() => { setSelectedUser(null); }}
          src={assets.arrow_icon}
          alt=""
          className='md:hidden max-w-7'
        />

        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>

      {/* ----------- Chat Body ----------- */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg) => {
          // Normalize senderId whether it's populated or just an ID
          const msgSenderId = msg.senderId?._id || msg.senderId;
          const isMe = String(msgSenderId) === String(authUser._id);

          // Determine name and pic safely
          let senderName = "Unknown";
          let senderPic = assets.avatar_icon;

            // In 1-on-1, senderId is likely just ID. Use context (authUser or selectedUser)
            if (isMe) {
              senderName = authUser.fullName;
              senderPic = authUser.profilePic || assets.avatar_icon;
            } else {
              senderName = selectedUser?.fullName || "User";
              senderPic = selectedUser?.profilePic || assets.avatar_icon;
            }

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 justify-end ${!isMe && 'flex-row-reverse'} group relative mb-4`}
            >

              {/* Emoji Picker */}
              {showEmojiPicker === msg._id && (
                <div className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} z-50 bg-[#1c1d25] border border-gray-700 rounded-full p-1 flex gap-1 shadow-lg`}>
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { reactToMessage(msg._id, emoji); setShowEmojiPicker(null); }}
                      className='w-8 h-8 hover:bg-gray-700 rounded-full flex items-center justify-center text-lg transition-colors'
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions (Hover) */}
              {!msg.deleted && (
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mb-8 px-2 ${isMe ? 'order-first' : 'order-last'}`}>
                  {/* Delete Button */}
                  {isMe && (
                    <button
                      onClick={() => { if (confirm("Delete this message?")) deleteMessage(msg._id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                      </svg>
                    </button>
                  )}
                  {/* Reply Button */}
                  <button
                    onClick={() => setReplyMessage(msg)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    title="Reply"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.921 11.9 1.353 8.62a.719.719 0 0 1 0-1.238L5.921 4.1A.716.716 0 0 1 7 4.719V6c1.5 0 6 0 7 8-2.5-4.5-7-4-7-4v1.281c0 .56-.606.898-1.079.62z" />
                    </svg>
                  </button>
                  {/* React Button */}
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                    title="React"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z" />
                    </svg>
                  </button>
                </div>
              )}

              <div className='relative max-w-[80%]'>
  
                {/* Reply Preview inside Message */}
                {msg.replyTo && (
                  <div className={`text-xs p-2 mb-1 rounded bg-black/20 border-l-2 border-blue-500 text-gray-300`}>
                    <p className="font-bold text-[10px] mb-0.5">
                      {/* Safe check for reply sender name */}
                      {(msg.replyTo.senderId?._id === authUser._id || msg.replyTo.senderId === authUser._id)
                        ? "You"
                        : (msg.replyTo.senderId?.fullName || "User")}
                    </p>
                    <p className="truncate">{msg.replyTo.text || "Photo"}</p>
                  </div>
                )}

                {msg.image ? (
                  <img
                    src={msg.image}
                    alt=""
                    className='max-w-full border border-gray-700 rounded-lg overflow-hidden'
                  />
                ) : (
                  <p
                    className={`p-2 md:text-sm font-light rounded-lg break-words bg-violet-500/30 text-white
                          ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} ${msg.deleted ? 'italic text-gray-400 border border-red-500/50' : ''}`}
                  >
                    {msg.text}
                  </p>
                )}

                {/* Reactions Display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`absolute -bottom-2 ${isMe ? 'right-0' : 'left-0'} flex items-center bg-[#1c1d25] border border-gray-700 rounded-full px-1.5 py-0.5 shadow-sm z-10`}>
                    {Array.from(new Set(msg.reactions.map(r => r.emoji))).map((e, idx) => (
                      <span key={idx} className="text-[10px] mr-0.5">{e}</span>
                    ))}
                    {msg.reactions.length > 3 && <span className="text-[9px] text-gray-400 ml-0.5">{msg.reactions.length}</span>}
                  </div>
                )}
              </div>

              <div className='text-center text-xs flex flex-col justify-end gap-1'>
                <img
                  src={
                    isMe
                      ? authUser?.profilePic || assets.avatar_icon
                      : senderPic
                  }
                  alt=""
                  className='w-7 h-7 object-cover rounded-full'
                />
                <p className='text-[10px] text-gray-500'>
                  {formatMessageTime(msg.createdAt)}
                </p>
                {/* Read Receipts */}
                {isMe && (
                  <div className="flex justify-center">
                    {msg.seen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#3b82f6" viewBox="0 0 16 16">
                        <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 1.854 7.146a.5.5 0 1 0-.708.708l3.5 3.5a.5.5 0 0 0 .708 0l7-7zm-4.208 7-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 0 1 .708.708l-7 7a.5.5 0 0 1-.708 0z" />
                        <path d="m5.354 7.146.896.897-.707.707-.897-.896a.5.5 0 1 1 .708-.708z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="gray" viewBox="0 0 16 16">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="absolute bottom-[80px] left-4 text-xs text-gray-400 italic animate-pulse z-10">
          {selectedUser ? `${selectedUser.fullName} is typing...` : 'Someone is typing...'}
        </div>
      )}

      {/* Reply Banner */}
      {replyMessage && (
        <div className="absolute bottom-[70px] left-4 right-4 bg-[#1c1d25] p-2 rounded-t-lg border-t border-x border-gray-700 flex justify-between items-center z-10">
          <div className="pl-2 border-l-2 border-blue-500">
            <p className="text-xs text-blue-500 font-bold">Replying to {replyMessage.senderId === authUser._id ? 'yourself' : (replyMessage.senderId.fullName || "User")}</p>
            <p className="text-xs text-gray-300 truncate max-w-[200px] md:max-w-md">{replyMessage.text || "Photo"}</p>
          </div>
          <button onClick={() => setReplyMessage(null)} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>
      )}

      {/* ----------- Bottom Area ----------- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-opacity-50 backdrop-blur-md'>
        <div className='flex-1 flex items-center bg-gray-100/12 rounded-full relative z-20'>
          <input
            onChange={handleInputChange}
            value={input}
            onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
            type='text'
            placeholder='Send a message'
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent'
          />

          <input
            onChange={handleSendImage}
            type='file'
            id='image'
            accept='image/png, image/jpg, image/jpeg'
            hidden
          />

          <label htmlFor='image'>
            <img
              src={assets.gallery_icon}
              alt=""
              className='w-5 mr-2 cursor-pointer'
            />
          </label>
        </div>

        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer relative z-20"
        />
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16' alt="" />
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
