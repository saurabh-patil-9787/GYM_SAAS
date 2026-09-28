import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Phone, ChevronDown, CheckSquare } from 'lucide-react';
import BicepCurlLoader from '../../components/BicepCurlLoader';
import MembershipShareCard from '../../components/members/MembershipShareCard';
import useWhatsAppCardShare from '../../hooks/useWhatsAppCardShare';
import { generateWhatsAppMessage } from '../../utils/whatsappMessages';

const WhatsAppIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} fill={color}>
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.824.738 5.477 2.031 7.785L0 32l8.469-2.219A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.25a13.21 13.21 0 0 1-6.725-1.833l-.482-.286-4.99 1.308 1.33-4.86-.315-.5A13.197 13.197 0 0 1 2.75 16C2.75 8.682 8.682 2.75 16 2.75S29.25 8.682 29.25 16 23.318 29.25 16 29.25zm7.243-9.87c-.397-.199-2.35-1.16-2.715-1.291-.365-.132-.63-.199-.896.199-.265.397-1.029 1.291-1.26 1.556-.232.265-.464.298-.861.1-.397-.2-1.677-.618-3.194-1.972-1.18-1.053-1.977-2.353-2.209-2.75-.232-.397-.025-.612.174-.81.178-.177.397-.464.596-.696.199-.232.265-.397.397-.662.132-.265.066-.497-.033-.696-.099-.199-.896-2.16-1.228-2.956-.324-.776-.65-.671-.896-.683l-.762-.013c-.265 0-.696.1-.1061.497-.364.397-1.392 1.36-1.392 3.316 0 1.956 1.425 3.848 1.623 4.113.199.265 2.805 4.282 6.797 6.004.95.41 1.691.655 2.269.838.954.303 1.822.26 2.509.158.765-.114 2.35-.962 2.681-1.89.33-.928.33-1.723.232-1.89-.099-.166-.364-.265-.762-.464z"/>
    </svg>
);

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

    // Card share hook
    const { cardRef, sharing: sharingCard, shareCard, prepareImages, memberBase64Photo, gymBase64Logo } = useWhatsAppCardShare();
    const [cardMember, setCardMember] = useState(null);

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

    const getMessageType = (daysExpired) => {
        if (daysExpired >= 0 && daysExpired <= 7) return 'reminder_7d';
        if (daysExpired >= 8 && daysExpired <= 30) return 'reminder_30d';
        return 'reminder_30p';
    };

    const handleWhatsAppSend = async (e, member) => {
        e.stopPropagation();
        const type = getMessageType(member.daysExpired);
        const message = generateWhatsAppMessage(type, { member, gymName });

        // Pre-convert images to base64 for CORS-safe capture
        await prepareImages(member.photoUrl || null, user?.gymLogoUrl || user?.gym?.logoUrl || null);

        setCardMember(member);
        requestAnimationFrame(() => {
            setTimeout(async () => {
                await shareCard(member, message, {
                    gymName,
                    onSuccess: () => setCardMember(null),
                    onError: () => setCardMember(null),
                });
            }, 150);
        });
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
                className={`relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer group bg-white
                    ${isExpanded
                        ? `${activeBorder} shadow-md scale-[1.02] ring-1 ring-inset ${activeBorder.replace('border-', 'ring-')}`
                        : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md hover:-translate-y-1'
                    }`}
            >
                {/* Decorative background glow */}
                <div className={`absolute -inset-24 opacity-[0.2] blur-2xl transition-opacity duration-300 ${isExpanded ? 'opacity-[0.4]' : 'group-hover:opacity-[0.3]'} ${bgGradient.replace('bg-gradient-to-br', 'bg-gradient-to-t')}`}></div>

                <div className="p-6 md:p-8 flex justify-between items-center relative z-10 w-full">
                    <div className="flex items-center gap-5 w-full">
                        <div className={`text-4xl md:text-5xl drop-shadow-sm transform transition-transform duration-300 ${isExpanded ? 'scale-110' : 'group-hover:scale-110'}`}>
                            {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-lg md:text-xl truncate ${titleColor}`}>
                                {title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5 border-t border-slate-100 pt-1.5 max-w-[fit-content]">
                                <span className={`text-sm font-semibold rounded-full px-2.5 py-0.5 ${isExpanded ? 'bg-white text-slate-700 shadow-sm border border-slate-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                    {count} member{count !== 1 && 's'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={`flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpanded ? 'bg-white text-slate-700 shadow-sm border border-slate-100' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 border border-slate-100'}`}>
                            <ChevronDown size={24} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ExpandedList = ({ members, accentColor, bgClass }) => {
        return (
            <div className={`rounded-3xl border border-slate-200 shadow-md overflow-hidden mt-6 mx-1 md:mx-4 animate-in slide-in-from-top-4 fade-in duration-300 bg-white`}>
                <div className={`p-4 md:p-6 border-b border-slate-100 flex items-center justify-between`}>
                    <h4 className={`text-xl font-bold ${accentColor} flex items-center gap-2`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Target List ({members.length})
                    </h4>
                </div>

                <div className="p-4 md:p-6 max-h-[600px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {members.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                            <CheckSquare size={48} className="text-slate-300" />
                            <p>No members currently in this tier.</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member._id}
                                className={`group flex flex-col justify-between p-4 rounded-3xl transition-all duration-300 bg-white border ${accentColor.replace('text-', 'border-').replace('-600', '-200').replace('-500', '-200')} hover:-translate-y-1 hover:shadow-md gap-4 relative overflow-hidden h-full shadow-sm`}
                            >
                                {/* Fixed Background Glow */}
                                <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${accentColor.replace('text-', 'from-').replace('-600', '-50').replace('-500', '-50')} to-transparent pointer-events-none transition-colors duration-300`}></div>

                                <div className="flex flex-col items-center text-center relative z-10 w-full mt-2">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center flex-shrink-0 justify-center font-black text-2xl sm:text-3xl shadow-sm border-[3px] ${accentColor.replace('text-', 'border-').replace('-600', '-200').replace('-500', '-200')} ${accentColor.replace('text-', 'bg-').replace('-600', '-50').replace('-500', '-50')} ${accentColor} mb-3`}>
                                        {member.photoUrl
                                            ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                            : member.name.charAt(0).toUpperCase()
                                        }
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg sm:text-[19px] px-2 w-full truncate" title={member.name}>{member.name}</h3>
                                    <div className="flex flex-col items-center gap-1.5 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1.5 font-medium"><Phone size={14} className={accentColor}/> {member.mobile}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between w-full z-10 pt-3 border-t border-slate-100 mt-auto">
                                    <div className="flex flex-col items-start px-2">
                                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Overdue</span>
                                        <span className={`text-sm sm:text-base font-black ${accentColor}`}>
                                            {member.daysExpired} <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Days</span>
                                        </span>
                                    </div>
                                    <button
                                        className={`flex-shrink-0 font-bold flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 bg-[#25D366] hover:bg-[#1ebe5d] text-white border border-transparent shadow-sm hover:scale-105 active:scale-95`}
                                        onClick={(e) => handleWhatsAppSend(e, member)}
                                        disabled={sharingCard}
                                        title="Send card + reminder on WhatsApp"
                                    >
                                        <WhatsAppIcon size={16} color="#fff" /> <span>{sharingCard && cardMember?._id === member._id ? 'Sending...' : 'Remind'}</span>
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
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Member Follow-Up</h2>
                    <p className="text-slate-500 text-sm md:text-base mt-2 max-w-xl leading-relaxed">Boost your retention rates by sending personalized WhatsApp reminders with membership cards. Members automatically flow out of these lists once their plan is renewed.</p>
                </div>
            </div>

            {loading ? (
                <div className="mt-12">
                    <BicepCurlLoader text="Analyzing expirations..." fullScreen={false} />
                </div>
            ) : (
                <div className="flex flex-col gap-5 md:gap-8">
                    {/* The 3 Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
                        <SummaryCard
                            id="high"
                            title="1–7 Days (Urgent)"
                            count={highChance.length}
                            titleColor="text-rose-600"
                            bgGradient="bg-gradient-to-br from-rose-50 to-transparent"
                            activeBorder="border-rose-200"
                            emoji="🔴"
                            isExpanded={expandedCategory === 'high'}
                        />
                        <SummaryCard
                            id="medium"
                            title="8–30 Days (At Risk)"
                            count={mediumChance.length}
                            titleColor="text-amber-600"
                            bgGradient="bg-gradient-to-br from-amber-50 to-transparent"
                            activeBorder="border-amber-200"
                            emoji="🟠"
                            isExpanded={expandedCategory === 'medium'}
                        />
                        <SummaryCard
                            id="low"
                            title="30+ Days (Lost)"
                            count={lowChance.length}
                            titleColor="text-slate-600"
                            bgGradient="bg-gradient-to-br from-slate-100 to-transparent"
                            activeBorder="border-slate-300"
                            emoji="⚫"
                            isExpanded={expandedCategory === 'low'}
                        />
                    </div>

                    {/* Expanded List Rendered Below Cards */}
                    {expandedCategory === 'high' && <ExpandedList members={highChance} accentColor="text-rose-600" bgClass="bg-rose-50/50" />}
                    {expandedCategory === 'medium' && <ExpandedList members={mediumChance} accentColor="text-amber-600" bgClass="bg-amber-50/50" />}
                    {expandedCategory === 'low' && <ExpandedList members={lowChance} accentColor="text-slate-600" bgClass="bg-slate-50/50" />}
                </div>
            )}

            {/* Hidden card for html2canvas capture */}
            {cardMember && (
                <div className="pointer-events-none fixed left-0 top-0 -z-10">
                    <MembershipShareCard
                        ref={cardRef}
                        member={cardMember}
                        gymName={user?.gymName || user?.gym?.name}
                        gymLogoUrl={gymBase64Logo || user?.gymLogoUrl || user?.gym?.logoUrl}
                        gymMobile={user?.mobile || user?.gym?.mobile || ''}
                        memberPhotoUrl={memberBase64Photo || cardMember.photoUrl}
                    />
                </div>
            )}
        </div>
    );
};

export default MemberFollowUp;
