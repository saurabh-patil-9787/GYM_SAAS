import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Play, Dumbbell, PlayCircle, Activity } from 'lucide-react';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import toast from 'react-hot-toast';

const VideoCard = ({ video }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);

    const handlePlayClick = () => {
        setIsPlaying(true);
        if (!hasViewed) {
            setHasViewed(true);
            api.put(`/api/fitness-videos/${video._id}/view`).catch(() => {});
        }
    };

    return (
        <div className="bg-member-surface rounded-[24px] shadow-sm border border-member-border overflow-hidden mb-6 flex flex-col group transition-all duration-300 hover:border-member-accent/30 hover:shadow-[0_4px_20px_rgba(108,92,231,0.08)] relative">
            {/* 16:9 Video Container */}
            <div className="relative w-full pt-[56.25%] bg-black">
                {isPlaying ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeVideoId}?rel=0&autoplay=1`}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div 
                        className="absolute top-0 left-0 w-full h-full cursor-pointer group"
                        onClick={handlePlayClick}
                    >
                        {/* YouTube Thumbnail */}
                        <img 
                            src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`} 
                            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg` }}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            alt={video.title}
                        />
                        
                        {/* Custom Play Button Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center transition-all group-hover:bg-black/30 z-10">
                            <div className="w-16 h-16 bg-member-accent/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transform group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(108,92,231,0.4)]">
                                <Play className="text-white ml-1 w-8 h-8" fill="white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Info */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-2.5">
                    <h3 className="text-lg font-bold text-member-primary leading-tight font-syne">{video.title}</h3>
                </div>
                <p className="text-xs text-member-secondary leading-relaxed font-normal">{video.description}</p>
            </div>
        </div>
    );
};

const muscles = [
    { id: 'abs', name: 'Abs', image: '/Abs.png' },
    { id: 'biceps', name: 'Biceps', image: '/biceps.png' },
    { id: 'chest', name: 'Chest', image: '/chest.png' },
    { id: 'forearm', name: 'Forearm', image: '/forearm.png' },
    { id: 'leg', name: 'Leg', image: '/leg.png' },
    { id: 'back', name: 'Back', image: '/back.png' },
    { id: 'shoulder', name: 'Shoulder', image: '/shoulder.png' },
    { id: 'traps', name: 'Traps', image: '/traps.png' },
    { id: 'triceps', name: 'Triceps', image: '/triceps.png' },
];

const FitnessHub = () => {
    const [activeTab, setActiveTab] = useState('muscle');
    const [activeMuscleGroup, setActiveMuscleGroup] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVideos(activeTab);
    }, [activeTab]);

    const fetchVideos = async (category) => {
        try {
            setLoading(true);
            const res = await api.get(`/api/fitness-videos?category=${category}`);
            setVideos(res.data);
        } catch (error) {
            toast.error("Failed to load videos");
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'stretching') {
            setActiveMuscleGroup(null);
        }
    };

    const getExerciseCount = (muscleId) => {
        return videos.filter(v => v.muscleGroup === muscleId).length;
    };

    const filteredVideos = activeTab === 'muscle' && activeMuscleGroup 
        ? videos.filter(v => v.muscleGroup === activeMuscleGroup)
        : videos;

    return (
        <div className="min-h-screen bg-member-bg text-member-primary pb-24 pt-4 px-4 sm:px-6">
            {/* Header Section */}
            <div className="text-center mb-8 animate-fade-in">
                <div className="inline-flex items-center justify-center p-3.5 bg-member-accent/10 text-member-accent rounded-2xl mb-4 border border-member-accent/20 shadow-[0_0_20px_rgba(108,92,231,0.1)]">
                    <Activity size={28} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-member-primary tracking-tight mb-2 font-syne">Improve Your Training</h1>
                <p className="text-member-secondary text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-medium px-4">
                    Learn correct exercise form and avoid mistakes with our curated standard workout library.
                </p>
            </div>

            {/* Sticky Tabs */}
            <div className="sticky top-16 z-20 bg-member-bg/95 backdrop-blur-xl py-3 -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 border-b border-member-border shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                <div className="flex p-1.5 bg-member-surface rounded-[16px] border border-member-border shadow-inner">
                    <button
                        onClick={() => handleTabChange('muscle')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-[12px] text-[11px] uppercase tracking-wider font-bold transition-all duration-300 ${
                            activeTab === 'muscle'
                                ? 'bg-member-accent text-white shadow-md scale-[1.02]'
                                : 'text-member-secondary hover:text-member-primary'
                        }`}
                    >
                        <span className="text-sm">💪</span> Muscle
                    </button>
                    <button
                        onClick={() => handleTabChange('stretching')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-[12px] text-[11px] uppercase tracking-wider font-bold transition-all duration-300 ${
                            activeTab === 'stretching'
                                ? 'bg-member-accent text-white shadow-md scale-[1.02]'
                                : 'text-member-secondary hover:text-member-primary'
                        }`}
                    >
                        <span className="text-sm">🔥</span> Stretching
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <BicepCurlLoader text="Loading Workouts..." fullScreen={false} />
                    </div>
                ) : activeTab === 'muscle' && !activeMuscleGroup ? (
                    /* Muscle Grid View */
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                        {muscles.map(muscle => {
                            const count = getExerciseCount(muscle.id);
                            return (
                                <button
                                    key={muscle.id}
                                    onClick={() => setActiveMuscleGroup(muscle.id)}
                                    className="bg-[#0a0a0f] rounded-[24px] overflow-hidden relative group transition-all duration-300 hover:scale-105 active:scale-95 border border-member-border hover:border-member-accent/50 shadow-sm flex flex-col text-left aspect-square md:aspect-[4/3]"
                                >
                                    <img 
                                        src={muscle.image} 
                                        alt={muscle.name} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300 mix-blend-screen"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                    
                                    <div className="absolute bottom-0 left-0 p-4 w-full z-10">
                                        <h3 className="text-lg font-bold text-white tracking-wide font-syne uppercase leading-tight mb-1 drop-shadow-md">{muscle.name}</h3>
                                        <p className="text-xs font-medium text-gray-300 drop-shadow-sm">{count} {count === 1 ? 'Exercise' : 'Exercises'}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* Video List View */
                    <div className="animate-fade-in">
                        {activeTab === 'muscle' && activeMuscleGroup && (
                            <div className="flex items-center justify-between mb-6 mt-2">
                                <button 
                                    onClick={() => setActiveMuscleGroup(null)}
                                    className="flex items-center gap-2 text-member-secondary hover:text-member-primary transition-all font-bold text-sm bg-member-surface px-4 py-2.5 rounded-xl border border-member-border hover:border-member-secondary/50 active:scale-95 shadow-sm"
                                >
                                    ← All Muscle Groups
                                </button>
                                <h2 className="text-lg font-black text-member-primary font-syne uppercase tracking-wider hidden sm:block">
                                    {muscles.find(m => m.id === activeMuscleGroup)?.name} Training
                                </h2>
                            </div>
                        )}

                        {filteredVideos.length === 0 ? (
                            <div className="text-center py-20 bg-member-surface border border-dashed border-member-border rounded-[24px] animate-fade-in mx-2 shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-member-bg border border-member-border flex items-center justify-center mx-auto mb-4">
                                    {activeTab === 'muscle' ? <Dumbbell className="text-member-muted" size={28} /> : <PlayCircle className="text-member-muted" size={28} />}
                                </div>
                                <h3 className="text-base font-bold text-member-primary font-syne">
                                    {activeTab === 'muscle' ? `${muscles.find(m => m.id === activeMuscleGroup)?.name} workouts coming soon` : 'No videos available'}
                                </h3>
                                <p className="text-xs text-member-secondary mt-1.5 max-w-[200px] mx-auto">
                                    {activeTab === 'muscle' ? 'New exercises are being added.' : 'Check back later for new workouts in this category.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredVideos.map(video => (
                                    <VideoCard key={video._id} video={video} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FitnessHub;
