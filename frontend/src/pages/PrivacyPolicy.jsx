import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Mail, 
    Phone, 
    MapPin, 
    ArrowLeft, 
    Shield, 
    FileText, 
    HelpCircle, 
    Copy, 
    Check, 
    ExternalLink, 
    Lock, 
    Database, 
    UserX, 
    Info
} from 'lucide-react';

const sections = [
    {
        title: '1. Information We Collect',
        icon: <Database size={20} className="text-indigo-400" />,
        content: [
            'Personal Identification: Name, mobile number, age, height, weight, city, and date of birth provided during registration.',
            'Sensitive Health & Fitness Data: Height, weight, and fitness progress logs. This data is collected solely to provide fitness progression calculations (such as BMI tracks) and logging features.',
            'Media Assets: Optional profile photos uploaded by users, stored securely on Cloudinary.',
            'Device & Push Notification Data: Firebase Cloud Messaging (FCM) tokens required to deliver automated membership renewal alerts and official announcements.',
            'Session Details: Encrypted refresh tokens stored in our secure database for maintaining active login states (auto-deleted after 30 days).'
        ]
    },
    {
        title: '2. How We Use Your Information',
        icon: <Info size={20} className="text-indigo-400" />,
        content: [
            'To administer gym memberships, keep records of active subscriptions, and process renewals.',
            'To generate and send renewal notification alerts (5 days, 3 days, 1 day before expiry, on the expiry day, and 2, 4, 6 days post-expiry).',
            'To calculate and present fitness metrics (e.g. BMI progress logs) inside the Member Portal.',
            'To authorize secure logins and guard against unauthorized access.'
        ]
    },
    {
        title: '3. Data Sharing & Third-Party SDKs',
        icon: <ExternalLink size={20} className="text-indigo-400" />,
        content: [
            'Gym Owners: Your member records and payment history are visible only to the specific gym owner and authorized administrators of the gym you register with.',
            'Payment Gateway: All online payments are securely processed by Razorpay. We do not store or transmit credit/debit card numbers, CVVs, or netbanking credentials.',
            'Cloud Storage: Profile photos are stored securely on Cloudinary.',
            'Notification Delivery: Push alerts are sent via Google Firebase Cloud Messaging (FCM).',
            'Zero Selling: GymOS Management does not sell, lease, trade, or distribute your personal details to third-party ad networks or brokers.'
        ]
    },
    {
        title: '4. Security and Data Protection',
        icon: <Lock size={20} className="text-indigo-400" />,
        content: [
            'All traffic between the client application and our servers is fully encrypted using HTTPS/TLS protocols.',
            'Owner and member passwords are encrypted using one-way bcrypt cryptographic hashes.',
            'System credentials and environment configs are heavily guarded.',
            'JWT Access tokens expire after 15 minutes, while database-stored refresh tokens expire automatically after 30 days.'
        ]
    },
    {
        title: '5. Account and Data Deletion (Google Play Compliance)',
        icon: <UserX size={20} className="text-indigo-400" />,
        content: [
            'Google Play Store policies require that users have a straightforward method to delete their account and associated data.',
            'In-App Deletion: Members can request account deletion directly from the Profile -> Account Settings screen or by asking their gym owner.',
            'Web/Email Request: You can request complete erasure of your account, contact details, payment history, and measurements by emailing gymosmanagement@gmail.com or via WhatsApp at +91 7248909787. Please provide your registered mobile number and gym name.',
            'Upon receiving a valid request, your personal records will be permanently purged from our servers and database within 72 hours.'
        ]
    },
    {
        title: "6. Children's Privacy",
        icon: <Shield size={20} className="text-indigo-400" />,
        content: [
            'माझी जिम is strictly designed and intended for users aged 13 or older.',
            'We do not knowingly collect or maintain personal information from children under the age of 13.',
            'If you suspect that a child under 13 has registered, please contact us immediately to have their data purged.'
        ]
    },
    {
        title: '7. Policy Updates',
        icon: <FileText size={20} className="text-indigo-400" />,
        content: [
            'GymOS Management reserves the right to modify this Privacy Policy as our services evolve.',
            'Any changes will be posted immediately to this page, and the "Last Updated" date will be revised.',
            'Your continued use of the application after update notices constitutes your consent to the revised terms.'
        ]
    }
];

const termsContent = [
    {
        title: '1. Acceptance of Terms',
        content: 'By registering, logging in, or using माझी जिम (operated by GymOS Management), you agree to comply with and be bound by these Terms of Service. If you do not accept these terms in full, you must immediately cease using the application.'
    },
    {
        title: '2. User Accounts and Verification',
        content: 'You must provide accurate, complete, and current information during registration. You are solely responsible for keeping your login credentials confidential. Any activity under your account is your responsibility. Report any unauthorized usage immediately.'
    },
    {
        title: '3. Payments, Renewals, and Refunds',
        content: 'Payment transactions for gym plans are handled via the Razorpay gateway. GymOS Management is a software platform and is not responsible for refund policies, payment failures, or pricing models. All decisions regarding membership fees, plan freezes, and refunds are strictly set by individual gym owners.'
    },
    {
        title: '4. Prohibited Activities',
        content: 'You agree not to modify, adapt, translate, reverse-engineer, decompile, or disassemble any portion of माझी जिम. You must not introduce viruses, trojans, worms, or other malicious software, or attempt to gain unauthorized access to our servers or user databases.'
    },
    {
        title: '5. Disclaimers and Service Availability',
        content: 'माझी जिम is provided on an "as-is" and "as-available" basis. While we strive to maintain a 99.9% uptime, we cannot guarantee uninterrupted access. The application may be temporarily unavailable due to scheduled maintenance, updates, or force majeure events.'
    },
    {
        title: '6. Limitation of Liability',
        content: 'GymOS Management acts as a SaaS platform provider. We are not liable for physical injuries, health conditions, or accidents occurring at any gym registered on our platform. We are also not liable for financial disputes between members and gym owners, or any indirect, incidental, or punitive damages.'
    },
    {
        title: '7. Governing Law and Jurisdiction',
        content: 'These Terms of Service shall be governed by and construed in accordance with the laws of India. Any legal disputes or claims arising out of this agreement shall be subject to the exclusive jurisdiction of the courts located in Kolhapur, Maharashtra, India.'
    }
];

export default function PrivacyPolicy() {
    const navigate = useNavigate();
    const location = useLocation();
    const [copiedEmail, setCopiedEmail] = React.useState(false);

    // Determine active tab from URL path
    const getTabFromPath = (path) => {
        if (path === '/terms') return 'terms';
        if (path === '/contact') return 'contact';
        return 'privacy';
    };

    const activeTab = getTabFromPath(location.pathname);

    const handleTabChange = (tab) => {
        navigate(`/${tab}`);
    };

    const handleCopyEmail = () => {
        navigator.clipboard.writeText('gymosmanagement@gmail.com');
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #070714 0%, #0d0d1f 50%, #0a0a1a 100%)',
            color: '#e2e8f0',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: '0 0 60px 0',
        }}>
            {/* Top Navigation Bar */}
            <div style={{
                background: 'rgba(7, 7, 20, 0.75)',
                borderBottom: '1px solid rgba(108, 92, 231, 0.15)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backdropFilter: 'blur(20px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            color: '#cbd5e1',
                            padding: '8px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.color = '#cbd5e1';
                        }}
                    >
                        <ArrowLeft size={14} /> Back to Home
                    </button>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            माझी जिम <span style={{ fontSize: '11px', background: 'rgba(108,92,231,0.25)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Legal & Support Hub</span>
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }} className="hidden sm:block">
                    Last updated: June 2026
                </div>
            </div>

            {/* Content Container */}
            <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px' }}>
                
                {/* Unified Tab Switcher */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '35px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '6px',
                }}>
                    {[
                        { id: 'privacy', label: 'Privacy Policy', icon: <Shield size={15} /> },
                        { id: 'terms', label: 'Terms of Service', icon: <FileText size={15} /> },
                        { id: 'contact', label: 'Contact & Support', icon: <HelpCircle size={15} /> }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                style={{
                                    flex: 1,
                                    padding: '12px 10px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #6c5ce7, #4f46e5)'
                                        : 'transparent',
                                    color: isActive ? '#fff' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: isActive ? '0 4px 12px rgba(108, 92, 231, 0.25)' : 'none',
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* 1. PRIVACY POLICY TAB */}
                {activeTab === 'privacy' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '30px' }}>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: 800,
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                Privacy Policy
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                                GymOS Management ("we", "us", "our") values your privacy. This Privacy Policy details how we handle, protect, and manage your personal and sensitive physical measurements when you use the <strong>माझी जिम</strong> app.
                            </p>
                        </div>

                        {sections.map((section, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '20px',
                                transition: 'transform 0.2s',
                            }}>
                                <h2 style={{
                                    fontSize: '17px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    {section.icon}
                                    {section.title}
                                </h2>
                                <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {section.content.map((item, j) => (
                                        <li key={j} style={{
                                            color: '#cbd5e1',
                                            fontSize: '14px',
                                            lineHeight: 1.65,
                                        }}>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. TERMS OF SERVICE TAB */}
                {activeTab === 'terms' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '30px' }}>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: 800,
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                Terms of Service
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                                These Terms of Service govern your access and use of माझी जिम. By utilizing the app, you agree to these legal obligations.
                            </p>
                        </div>

                        {termsContent.map((section, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '20px',
                            }}>
                                <h2 style={{
                                    fontSize: '17px',
                                    fontWeight: 700,
                                    color: '#a5b4fc',
                                    marginBottom: '12px',
                                }}>
                                    {section.title}
                                </h2>
                                <p style={{
                                    color: '#cbd5e1',
                                    fontSize: '14px',
                                    lineHeight: 1.65,
                                    margin: 0,
                                }}>
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. CONTACT & SUPPORT TAB */}
                {activeTab === 'contact' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '35px' }}>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: 800,
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                Contact & Support
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                                Have questions, feature requests, or need assistance? Reach out to GymOS Management. Our support team is here to assist gym owners and members alike.
                            </p>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'window.innerWidth < 768 ? "1fr" : "1.2fr 1fr"', 
                            gap: '24px' 
                        }} className="grid grid-cols-1 md:grid-cols-2">
                            {/* Left Column: Direct Contact Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>Support Details</h3>
                                
                                {/* Email Card */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'flex-start',
                                }}>
                                    <div style={{
                                        background: 'rgba(108, 92, 231, 0.12)',
                                        color: '#8b5cf6',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Mail size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '2px' }}>Email Address</div>
                                        <a href="mailto:gymosmanagement@gmail.com" style={{ fontSize: '14px', color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'block', wordBreak: 'break-all' }}>
                                            gymosmanagement@gmail.com
                                        </a>
                                        <button 
                                            onClick={handleCopyEmail}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: copiedEmail ? '#10b981' : '#a5b4fc',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                marginTop: '8px',
                                                padding: '2px 0'
                                            }}
                                        >
                                            {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
                                            {copiedEmail ? 'Copied!' : 'Copy to Clipboard'}
                                        </button>
                                    </div>
                                </div>

                                {/* Phone Card */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'flex-start',
                                }}>
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '2px' }}>Phone Number</div>
                                        <a href="tel:+917248909787" style={{ fontSize: '14px', color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'block' }}>
                                            +91 7248909787
                                        </a>
                                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                            Available 10:00 AM - 7:00 PM IST
                                        </span>
                                    </div>
                                </div>

                                {/* Address Card */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'flex-start',
                                }}>
                                    <div style={{
                                        background: 'rgba(245, 158, 11, 0.12)',
                                        color: '#f59e0b',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '2px' }}>Office Address</div>
                                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600, lineHeight: 1.5 }}>
                                            Rendal, Kolhapur,<br />
                                            Maharashtra, India - 416203
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: WhatsApp & Dev Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>Instant Channels</h3>

                                {/* WhatsApp Card */}
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(18, 140, 116, 0.15) 100%)',
                                    border: '1px solid rgba(37, 211, 102, 0.25)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                }}>
                                    {/* Custom WhatsApp Icon SVG */}
                                    <div style={{
                                        background: '#25D366',
                                        color: '#fff',
                                        padding: '12px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 20px rgba(37, 211, 102, 0.4)',
                                    }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.49 1.967 14.03.94 11.416.94c-5.44 0-9.866 4.372-9.87 9.802 0 1.769.482 3.49 1.396 5.029l-.985 3.598 3.69-.975zm11.365-5.592c-.29-.145-1.716-.848-1.98-.942-.262-.096-.453-.145-.642.145-.19.29-.733.942-.897 1.13-.164.19-.327.21-.617.066-.29-.144-1.223-.45-2.329-1.436-.86-.767-1.44-1.716-1.609-2.006-.169-.29-.018-.447.127-.591.13-.13.29-.338.435-.507.145-.17.193-.29.29-.483.097-.19.048-.362-.024-.507-.072-.145-.642-1.547-.88-2.117-.23-.556-.466-.48-.642-.489-.164-.008-.353-.01-.542-.01-.19 0-.498.07-.759.353-.26.29-1.002.978-1.002 2.39s1.023 2.774 1.167 2.968c.145.19 2.013 3.074 4.877 4.307.68.292 1.213.467 1.628.599.684.218 1.307.187 1.8.113.55-.082 1.716-.702 1.96-1.378.243-.677.243-1.258.17-1.378-.073-.12-.263-.19-.553-.335z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#fff', fontWeight: 700 }}>WhatsApp Support</h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                                            Connect with support staff instantly. Ideal for urgent account reactivation or data deletion requests.
                                        </p>
                                    </div>
                                    <a 
                                        href="https://wa.me/917248909787?text=Hi%20GymOS%20Support%2C%20I%20have%20a%20query%20regarding%20the%20app."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            background: '#25D366',
                                            color: '#fff',
                                            textDecoration: 'none',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.2)'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.35)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.2)';
                                        }}
                                    >
                                        Chat on WhatsApp
                                    </a>
                                </div>

                                {/* Google Play Compliance Note Card */}
                                <div style={{
                                    background: 'rgba(108, 92, 231, 0.05)',
                                    border: '1px solid rgba(108, 92, 231, 0.15)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#a5b4fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Shield size={14} /> Developer Identity
                                    </h4>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                                        <p style={{ margin: '0 0 6px 0' }}>This application is owned, developed, and maintained by <strong>GymOS Management</strong>.</p>
                                        <p style={{ margin: 0 }}>To meet Google Play developer rules, we display direct email, physical location, and contact parameters on this official support page.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Section */}
                <div style={{
                    marginTop: '50px',
                    padding: '24px',
                    background: 'rgba(108,92,231,0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(108,92,231,0.12)',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#94a3b8',
                }}>
                    <strong>माझी जिम</strong> is a product of <strong>GymOS Management</strong> · Made in India 🇮🇳<br />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'inline-block' }}>
                        © 2026 GymOS Management. All rights reserved.
                    </span>
                </div>

            </div>
        </div>
    );
}
