import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Upload, Trash2, Edit, Video, PlayCircle, PlusCircle, Dumbbell, X, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const FitnessHubAdmin = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'stretching',
        muscleGroup: '',
        youtubeUrl: ''
    });

    const extractYoutubeId = (url) => {
        if (!url) return null;
        const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/fitness-videos?all=true');
            setVideos(res.data);
        } catch (error) {
            toast.error('Failed to fetch videos');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.youtubeUrl) {
            toast.error('Please fill all fields and provide a YouTube URL');
            return;
        }

        const videoId = extractYoutubeId(formData.youtubeUrl);
        if (!videoId) {
            toast.error('Invalid YouTube URL');
            return;
        }

        try {
            setUploading(true);
            const res = await api.post('/api/fitness-videos', formData);
            toast.success('Video added successfully!');
            setFormData({ title: '', description: '', category: 'stretching', muscleGroup: '', youtubeUrl: '' });
            fetchVideos(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add video');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to completely delete this video?')) return;
        try {
            await api.delete(`/api/fitness-videos/${id}`);
            toast.success('Video deleted');
            setVideos(videos.filter(v => v._id !== id));
        } catch (error) {
            toast.error('Failed to delete video');
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const res = await api.put(`/api/fitness-videos/${id}`, { isActive: !currentStatus });
            toast.success(`Video ${!currentStatus ? 'activated' : 'hidden'}`);
            setVideos(videos.map(v => v._id === id ? { ...v, isActive: !currentStatus } : v));
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <BicepCurlLoader text="Loading Hub..." fullScreen={false} />;

    return (
        <div className="max-w-5xl mx-auto p-2 sm:p-6 lg:p-8 animate-fade-in text-gray-100">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/[0.08] p-2.5 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <Video className="text-purple-400" size={26} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Fitness Hub Management
                    </h1>
                </div>
                <p className="text-sm text-gray-400 ml-[52px]">Upload and manage global standard workout videos.</p>
            </div>

            {/* Upload Section */}
            <div className="bg-[#13131f] rounded-2xl border border-white/[0.08] p-5 sm:p-8 mb-10 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                    <PlusCircle className="text-purple-400" size={20} /> Add New Video
                </h2>
                
                <form onSubmit={handleUpload} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Video Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Biceps Curl Correct Form"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0a0a0f] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-gray-600 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all ${formData.category === 'stretching' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-white/[0.08] bg-[#0a0a0f] text-gray-400 hover:border-white/[0.15] hover:bg-white/[0.02]'}`}>
                                        <input type="radio" name="category" value="stretching" checked={formData.category === 'stretching'} onChange={() => setFormData({...formData, category: 'stretching'})} className="sr-only" />
                                        <span className="font-bold text-sm tracking-wide">🔥 Stretching</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all ${formData.category === 'muscle' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-white/[0.08] bg-[#0a0a0f] text-gray-400 hover:border-white/[0.15] hover:bg-white/[0.02]'}`}>
                                        <input type="radio" name="category" value="muscle" checked={formData.category === 'muscle'} onChange={() => setFormData({...formData, category: 'muscle'})} className="sr-only" />
                                        <span className="font-bold text-sm tracking-wide">💪 Muscle</span>
                                    </label>
                                </div>
                            </div>
                            
                            {formData.category === 'muscle' && (
                                <div className="animate-fade-in mt-4">
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Muscle Group</label>
                                    <select
                                        value={formData.muscleGroup}
                                        onChange={(e) => setFormData({...formData, muscleGroup: e.target.value})}
                                        className="w-full bg-[#0a0a0f] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                                        required={formData.category === 'muscle'}
                                    >
                                        <option value="">Select Muscle Group</option>
                                        <option value="abs">Abs</option>
                                        <option value="back">Back</option>
                                        <option value="biceps">Biceps</option>
                                        <option value="chest">Chest</option>
                                        <option value="forearm">Forearm</option>
                                        <option value="leg">Leg</option>
                                        <option value="shoulder">Shoulder</option>
                                        <option value="traps">Traps</option>
                                        <option value="triceps">Triceps</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    placeholder="Provide brief instructions..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#0a0a0f] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-gray-600 text-sm h-32 resize-none font-inter"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">YouTube Video URL</label>
                            <input
                                type="url"
                                placeholder="https://youtu.be/example"
                                value={formData.youtubeUrl}
                                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                                className="w-full bg-[#0a0a0f] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder-gray-600 text-sm"
                                required
                            />
                        </div>
                        
                        {extractYoutubeId(formData.youtubeUrl) && (
                            <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/[0.08]">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview</h3>
                                <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden border border-white/[0.05]">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${extractYoutubeId(formData.youtubeUrl)}?rel=0`}
                                        className="absolute top-0 left-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                <div className="mt-3">
                                    <p className="font-bold text-white text-sm">{formData.title || 'Video Title'}</p>
                                    <p className="text-xs text-purple-400 mt-1 uppercase font-bold tracking-wider">{formData.category === 'stretching' ? 'Stretching Workout' : 'Muscle Workout'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-900/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-purple-500/30"
                    >
                        {uploading ? (
                            <>
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                Uploading to Cloudinary...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Add Video Link
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="mb-6 flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">Video Library</h2>
                <div className="h-px bg-white/[0.08] flex-1"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {videos.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-500 bg-[#13131f] rounded-2xl border border-dashed border-white/[0.08]">
                        <Video className="mx-auto h-12 w-12 text-gray-600 mb-3 opacity-50" />
                        <p>No videos have been uploaded yet.</p>
                    </div>
                ) : videos.map(video => (
                    <div key={video._id} className={`bg-[#13131f] p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${!video.isActive ? 'border-red-500/30 bg-red-500/5 opacity-80' : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-white text-lg leading-tight flex items-center gap-2">
                                    {video.title}
                                </h3>
                                <div className="flex flex-col gap-1 items-end">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${video.category === 'stretching' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {video.category}
                                    </span>
                                    {video.muscleGroup && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.1] bg-white/[0.05] text-gray-400">
                                            {video.muscleGroup.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed font-inter">{video.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.05]">
                            <div className="flex items-center gap-2">
                                {!video.isActive && <span className="bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-red-500/20 mr-2">Hidden</span>}
                                <span className="text-xs text-gray-500 font-medium bg-[#0a0a0f] px-2.5 py-1 rounded-md border border-white/[0.05]">
                                    YouTube
                                </span>
                                <span className="text-xs text-gray-500 font-medium bg-[#0a0a0f] px-2.5 py-1 rounded-md border border-white/[0.05]">
                                    {video.views} Views
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleToggleActive(video._id, video.isActive)}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] border ${video.isActive ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'}`}
                                    title={video.isActive ? 'Hide Video' : 'Activate Video'}
                                >
                                    {video.isActive ? <EyeOff size={16} /> : <Eye size={16} />} 
                                    <span className="hidden sm:inline">{video.isActive ? 'Hide' : 'Activate'}</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleDelete(video._id)} 
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" 
                                    title="Delete Video"
                                >
                                    <Trash2 size={16} />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FitnessHubAdmin;
