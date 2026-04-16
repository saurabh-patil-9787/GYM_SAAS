import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Send, Phone, ChevronDown, CheckSquare, ChevronUp } from 'lucide-react';
import BicepCurlLoader from '../../components/BicepCurlLoader';

const MemberFollowUp = () => {
    const { user } = useAuth();
    const gymName = user?.gymName || user?.gym?.name || "our";
    const [loading, setLoading] = useState(true);
    const [expiredMembers, setExpiredMembers] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Categories
    const [highChance, setHighChance] = useState([]);
    const [mediumChance, setMediumChance] = useState([]);
    const [lowChance, setLowChance] = useState([]);

    const fetchExpiredMembers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('status', 'expired');
            params.append('limit', 'all');
            params.append('t', Date.now());

            const res = await api.get(`/api/members?${params.toString()}`);
            const members = res.data.data || res.data || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const high = [];
            const medium = [];
            const low = [];

            members.forEach(member => {
                const expDate = new Date(member.expiryDate);
                expDate.setHours(0, 0, 0, 0);
                const daysExpired = Math.floor((today - expDate) / (1000 * 60 * 60 * 24));

                member.daysExpired = daysExpired;

                if (daysExpired >= 0 && daysExpired <= 7) {
                    high.push(member);
                } else if (daysExpired >= 8 && daysExpired <= 30) {
                    medium.push(member);
                } else if (daysExpired > 30) {
                    low.push(member);
                }
            });

            setHighChance(high);
            setMediumChance(medium);
            setLowChance(low);
            setExpiredMembers(members);

        } catch (error) {
            console.error("Failed to fetch expired members", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpiredMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const generateMessage = (member) => {
        const { name, daysExpired } = member;

        if (daysExpired >= 1 && daysExpired <= 7) {
            return `नमस्कार ${name},\n\nतुमचा जिम प्लॅन ${daysExpired} दिवसांपूर्वी संपला आहे.\n\nतुमची फिटनेस journey थांबवू नका 💪\nआजच तुमचा प्लॅन renew करा आणि पुन्हा सुरुवात करा!\n\nआम्ही तुमच्यासोबत आहोत 🙌`;
        } else if (daysExpired >= 8 && daysExpired <= 30) {
            return `नमस्कार ${name},\n\nतुम्हाला जिमला येऊन ${daysExpired} दिवस झाले आहेत.\n\nइतके दिवस workout मिस केल्यामुळे तुमचा progress थांबला असेल 😔\n\nआजच पुन्हा सुरुवात करा 💪\nतुमची जिम तुमची वाट पाहत आहे 😊`;
        } else {
            return `नमस्कार ${name},\n\nतुम्ही जिमला येणं थांबवून ${daysExpired} दिवस झाले आहेत.\n\nआम्हाला तुमची खूप आठवण येते 😄\n\nतुमची फिटनेस journey पुन्हा सुरू करा 💪\nआजच परत या — आम्ही तुमच्यासाठी आहोत 🙌`;
        }
    };

    const handleWhatsAppSend = (e, member) => {
        e.stopPropagation();
        const message = generateMessage(member);
        const cleanMobile = member.mobile.replace(/\D/g, '');
        const targetMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
        const url = `https://wa.me/${targetMobile}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const toggleCategory = (category) => {
        if (expandedCategory === category) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(category);
        }
    };

    const SummaryCard = ({ id, title, count, titleColor, bgGradient, activeBorder, emoji, isExpanded }) => {
        return (
            <div
                onClick={() => toggleCategory(id)}
                className={`relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer group
                    ${isExpanded
                        ? `${activeBorder} ${bgGradient} shadow-2xl scale-[1.02] ring-1 ring-inset ${activeBorder.replace('border-', 'ring-')}`
                        : 'border-gray-700 bg-gray-800/80 hover:bg-gray-800 hover:border-gray-600 shadow-lg hover:shadow-xl hover:-translate-y-1'
                    }`}
            >
                {/* Decorative background glow */}
                <div className={`absolute -inset-24 opacity-[0.08] blur-2xl transition-opacity duration-300 ${isExpanded ? 'opacity-[0.15]' : 'group-hover:opacity-[0.12]'} ${bgGradient.replace('bg-gradient-to-br', 'bg-gradient-to-t')}`}></div>

                <div className="p-6 md:p-8 flex justify-between items-center relative z-10 w-full">
                    <div className="flex items-center gap-5 w-full">
                        <div className={`text-4xl md:text-5xl drop-shadow-lg transform transition-transform duration-300 ${isExpanded ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-lg md:text-xl truncate ${titleColor}`}>
                                {title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 border-t border-gray-700/50 pt-1.5 max-w-[fit-content]">
                                <span className={`text-sm font-semibold rounded-full px-2.5 py-0.5 ${isExpanded ? 'bg-white/10 text-white' : 'bg-gray-900/50 text-gray-300'}`}>
                                    {count} member{count !== 1 && 's'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={`flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpanded ? 'bg-white/10 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600 group-hover:text-white'}`}>
                            <ChevronDown size={24} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ExpandedList = ({ members, accentColor, bgClass }) => {
        return (
            <div className={`rounded-3xl border ${bgClass} border-gray-700 shadow-2xl overflow-hidden mt-6 mx-1 md:mx-4 animate-in slide-in-from-top-4 fade-in duration-300`}>
                <div className={`p-4 md:p-6 border-b border-gray-700/50 flex items-center justify-between`}>
                    <h4 className={`text-xl font-bold ${accentColor} flex items-center gap-2`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Target List ({members.length})
                    </h4>
                </div>

                <div className="p-4 md:p-6 max-h-[600px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {members.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center justify-center gap-3">
                            <CheckSquare size={48} className="text-gray-600 opacity-50" />
                            <p>No members currently in this tier.</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member._id}
                                className={`group flex flex-col justify-between p-4 rounded-3xl transition-all duration-300 bg-gray-800/80 border ${accentColor.replace('text-', 'border-').replace('-400', '-500/40')} hover:-translate-y-1 hover:shadow-lg gap-4 relative overflow-hidden h-full shadow-[0_0_15px_rgba(255,255,255,0.02)]`}
                            >
                                {/* Fixed Background Glow */}
                                <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${accentColor.replace('text-', 'from-').replace('-400', '-500/10')} to-transparent pointer-events-none transition-colors duration-300`}></div>

                                <div className="flex flex-col items-center text-center relative z-10 w-full mt-2">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center flex-shrink-0 justify-center font-black text-2xl sm:text-3xl shadow-lg border-[3px] ${accentColor.replace('text-', 'border-').replace('-400', '-500/40')} ${accentColor.replace('text-', 'bg-').replace('-400', '-500/10')} text-white mb-3`}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="font-bold text-gray-100 text-lg sm:text-[19px] px-2 w-full truncate" title={member.name}>{member.name}</h3>
                                    <div className="flex flex-col items-center gap-1.5 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1.5 font-medium"><Phone size={14} className={accentColor}/> {member.mobile}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between w-full z-10 pt-3 border-t border-gray-700/50 mt-auto">
                                    <div className="flex flex-col items-start px-2">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Overdue</span>
                                        <span className={`text-sm sm:text-base font-black ${accentColor}`}>
                                            {member.daysExpired} <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Days</span>
                                        </span>
                                    </div>
                                    <button
                                        className={`flex-shrink-0 font-bold flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 ${accentColor.replace('text-', 'bg-').replace('-400', '-500/10')} hover:${accentColor.replace('text-', 'bg-').replace('-400', '-500/20')} ${accentColor} border border-transparent shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95`}
                                        onClick={(e) => handleWhatsAppSend(e, member)}
                                        title="Send personalized Marathi reminder"
                                    >
                                        <Send size={16} /> <span>Reminder</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="pb-24 max-w-6xl mx-auto px-2 md:px-6">
            {/* Header & Actions */}
            <div className="mb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Member Follow-Up</h2>
                    <p className="text-gray-400 text-sm md:text-base mt-2 max-w-xl leading-relaxed">Boost your retention rates by sending personalized WhatsApp reminders. Members automatically flow out of these lists once their plan is renewed.</p>
                </div>
            </div>

            {loading ? (
                <div className="mt-12">
                    <BicepCurlLoader text="Analyzing expirations..." />
                </div>
            ) : (
                <div className="flex flex-col gap-5 md:gap-8">
                    {/* The 3 Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
                        <SummaryCard
                            id="high"
                            title="1–7 Days (Urgent)"
                            count={highChance.length}
                            titleColor="text-red-400"
                            bgGradient="bg-gradient-to-br from-red-900/40 via-gray-900 to-gray-900"
                            activeBorder="border-red-500/50"
                            emoji="🔴"
                            isExpanded={expandedCategory === 'high'}
                        />
                        <SummaryCard
                            id="medium"
                            title="8–30 Days (At Risk)"
                            count={mediumChance.length}
                            titleColor="text-orange-400"
                            bgGradient="bg-gradient-to-br from-orange-900/40 via-gray-900 to-gray-900"
                            activeBorder="border-orange-500/50"
                            emoji="🟠"
                            isExpanded={expandedCategory === 'medium'}
                        />
                        <SummaryCard
                            id="low"
                            title="30+ Days (Lost)"
                            count={lowChance.length}
                            titleColor="text-gray-400"
                            bgGradient="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900"
                            activeBorder="border-gray-500/50"
                            emoji="⚫"
                            isExpanded={expandedCategory === 'low'}
                        />
                    </div>

                    {/* Expanded List Rendered Below Cards */}
                    {expandedCategory === 'high' && <ExpandedList members={highChance} accentColor="text-red-400" bgClass="bg-red-900/10" />}
                    {expandedCategory === 'medium' && <ExpandedList members={mediumChance} accentColor="text-orange-400" bgClass="bg-orange-900/10" />}
                    {expandedCategory === 'low' && <ExpandedList members={lowChance} accentColor="text-gray-400" bgClass="bg-gray-800/30" />}
                </div>
            )}
        </div>
    );
};

export default MemberFollowUp;
