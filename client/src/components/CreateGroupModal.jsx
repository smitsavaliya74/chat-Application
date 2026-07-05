import React, { useContext, useState } from 'react';
import { ChatContext } from '../../context/ChatContext';
import assets from '../assets/assets';

const CreateGroupModal = () => {
    const { setIsCreatingGroup, createGroup, users } = useContext(ChatContext);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleMember = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return;
        if (selectedMembers.length === 0) return alert("Select at least one member");

        let imageData = "";
        if (image) {
            // Convert to base64 for cloudinary upload in controller
            // My controller expects 'image' as base64 string or url?
            // Previous code: const uploadResponse = await cloudinary.uploader.upload(image);
            // So it expects base64 string or path. Reader result is base64.
            imageData = imagePreview;
        }

        await createGroup({
            name: groupName,
            members: JSON.stringify(selectedMembers),
            image: imageData
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1c1d25] p-6 rounded-2xl w-full max-w-md border border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Create Group</h2>
                    <button onClick={() => setIsCreatingGroup(false)} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="flex justify-center">
                        <label htmlFor="group-image" className="cursor-pointer relative group">
                            <img
                                src={imagePreview || assets.avatar_icon}
                                alt="Group Icon"
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-600 group-hover:border-blue-500 transition-colors"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs">Upload</span>
                            </div>
                        </label>
                        <input type="file" id="group-image" accept="image/*" hidden onChange={handleImageChange} />
                    </div>

                    {/* Group Name */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:outline-none focus:border-blue-500"
                            placeholder="Enter group name"
                            required
                        />
                    </div>

                    {/* Member Selection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Select Members</label>
                        <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-lg p-2 border border-gray-700">
                            {users.map(user => (
                                <div key={user._id} onClick={() => toggleMember(user._id)} className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700 ${selectedMembers.includes(user._id) ? 'bg-blue-500/20' : ''}`}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMembers.includes(user._id) ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                        {selectedMembers.includes(user._id) && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="white" viewBox="0 0 16 16">
                                                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                            </svg>
                                        )}
                                    </div>
                                    <img src={user.profilePic || assets.avatar_icon} className="w-6 h-6 rounded-full" alt="" />
                                    <span className="text-sm text-gray-200">{user.fullName}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{selectedMembers.length} members selected</p>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
