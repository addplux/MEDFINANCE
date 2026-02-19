import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/apiService';
import { Bell, UserCheck, X, CheckCheck } from 'lucide-react';

const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // Only show for admins
    if (!user || user.role !== 'admin') return null;

    const fetchCount = async () => {
        try {
            const res = await notificationsAPI.getCount();
            setUnreadCount(res.data.count);
        } catch { /* silent */ }
    };

    const fetchNotifications = async () => {
        try {
            const res = await notificationsAPI.getAll();
            setNotifications(res.data);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAllRead = async () => {
        try {
            await notificationsAPI.markAllRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { /* silent */ }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await notificationsAPI.markRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch { /* silent */ }
        }
        if (notification.type === 'registration_request') {
            navigate('/app/setup/pending-approvals');
        }
        setOpen(false);
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-12 w-80 bg-gray-950 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="text-sm font-semibold text-white">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    All read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-start gap-3 ${!n.isRead ? 'bg-primary-500/5' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === 'registration_request' ? 'bg-amber-500/15 text-amber-400' : 'bg-primary-500/15 text-primary-400'}`}>
                                        <UserCheck className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-white/10">
                            <button
                                onClick={() => { navigate('/app/setup/pending-approvals'); setOpen(false); }}
                                className="text-xs text-primary-400 hover:text-primary-300 w-full text-center transition-colors"
                            >
                                View Pending Approvals →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
