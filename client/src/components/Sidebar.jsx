import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'

const Sidebar = () => {

    const {
        getUsers,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);
    const [input, setInput] = useState("");
    // no tabs needed anymore
    const navigate = useNavigate();

    const filteredUsers = input ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

    useEffect(() => {
        getUsers();
    }, [onlineUsers]);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setUnseenMessages(prev => ({ ...prev, [user._id]: 0 }));
    };


    return (
        <div className={`backdrop-blur-lg bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ""}`}>
            <div className='pb-5'>
                <div className='flex justify-between items-center'>
                    <img src={assets.logo} alt="logo" className='max-w-40' />

                    <div className='relative py-2 group'>
                        <img
                            src={assets.menu_icon}
                            alt="Menu"
                            className='max-h-5 cursor-pointer'
                        />
                        <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                            <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm mb-2'>Edit Profile</p>
                            <hr className='my-2 border-t border-gray-500' />
                            <p onClick={() => logout()} className='cursor-pointer text-sm'>Logout</p>
                        </div>

                    </div>
                </div>

                <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
                    <img src={assets.search_icon} alt="Search" className='w-3' />
                    <input onChange={(e) => setInput(e.target.value)} type="text" className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' placeholder='Search User...' />
                </div>
            </div>

            <div className='flex flex-col'>
                {filteredUsers.map((user, index) => (
                        <div onClick={() => handleUserClick(user)} key={index} className={`relative flex items-center gap-2 p-2 mb-2 rounded cursor-pointer max-sm:text:sm ${selectedUser?._id === user._id ? 'bg-[#282142]/50' : 'hover:bg-[#282142]/30'}`}>
                            <img src={user?.profilePic || assets.avatar_icon} alt="User Profile" className='w-[40px] aspect-[1/1] rounded-full object-cover' />
                            <div className="flex-1 min-w-0">
                                <p className='truncate font-medium'>{user.fullName}</p>
                                {
                                    onlineUsers.includes(user._id)
                                        ? <span className='text-green-400 text-xs'>Online</span>
                                        : <span className='text-neutral-400 text-xs'>Offline</span>
                                }
                            </div>
                            {unseenMessages[user._id] > 0 && <span className='text-xs h-5 w-5 flex justify-center items-center rounded-full bg-blue-600 text-white'>{unseenMessages[user._id]}</span>}
                        </div>
                    ))}
            </div>
        </div>
    )
}

export default Sidebar
