import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setupAPI } from '../../services/apiService';
import NotificationBell from '../ui/NotificationBell';
import {
    LayoutDashboard,
    FileText,
    Users,
    DollarSign,
    CreditCard,
    BookOpen,
    Wallet,
    TrendingUp,
    Package,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    Stethoscope,
    ClipboardList,
    FileCheck,
    Activity,
    Calculator,
    Building,
    Beaker,
    Pill,
    Radio
} from 'lucide-react';

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [orgName, setOrgName] = React.useState('MEDFINANCE360');
    const [expandedMenus, setExpandedMenus] = React.useState({});

    React.useEffect(() => {
        const fetchOrgProfile = async () => {
            try {
                const response = await setupAPI.organization.get();
                if (response.data && response.data.name) {
                    setOrgName(response.data.name);
                }
            } catch (error) {
                console.error('Failed to fetch organization profile', error);
            }
        };

        fetchOrgProfile();

        // Listen for profile updates
        window.addEventListener('org-profile-updated', fetchOrgProfile);

        return () => {
            window.removeEventListener('org-profile-updated', fetchOrgProfile);
        };
    }, []);

    // Auto-expand menus based on current path
    React.useEffect(() => {
        const path = location.pathname;
        const newExpanded = { ...expandedMenus };

        if (path.includes('/billing/') || path.includes('/invoice/') || path.includes('/patients') || path.includes('/visits/') || path.includes('/theatre/') || path.includes('/maternity/') || path.includes('/specialist-clinics/')) {
            newExpanded['billing'] = true;
        }
        if (path.includes('/departments/')) {
            newExpanded['departments'] = true;
        }

        setExpandedMenus(newExpanded);
    }, [location.pathname]);

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    const menuItems = [
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/app/patients', icon: Users, label: 'Patient' },
        {
            isHeading: true,
            label: 'SCHEME MANAGER'
        },
        { path: '/app/receivables/schemes', icon: Settings, label: 'All Schemes' },
        {
            id: 'private_scheme',
            icon: DollarSign,
            label: 'Private Prepaid Scheme',
            submenu: [
                { path: '/app/schemes/private/members', label: 'Membership registration' },
                { path: '/app/schemes/private/plans', label: 'Plan selection' },
                { path: '/app/schemes/private/duration', label: 'Start & end date' },
                { path: '/app/schemes/private/validation', label: 'Service coverage validation' },
                { path: '/app/schemes/private/tracking', label: 'Utilisation tracking' }
            ]
        },
        {
            id: 'corporate_scheme',
            icon: BookOpen,
            label: 'Corporate Scheme',
            submenu: [
                { path: '/app/schemes/corporate/members', label: 'Member management' },
                { path: '/app/schemes/corporate/credit', label: 'Credit limit' },
                { path: '/app/schemes/corporate/terms', label: 'Payment terms' },
                { path: '/app/schemes/corporate/billing', label: 'Monthly billing cycle' }
            ]
        },
        {
            isHeading: true,
            label: 'FINANCE & OPERATIONS'
        },
        { path: '/app/payables/suppliers', icon: CreditCard, label: 'Payables' },
        {
            id: 'ledger',
            icon: BookOpen,
            label: 'General Ledger',
            submenu: [
                { path: '/app/ledger/accounts', label: 'Chart of Accounts' },
                { path: '/app/ledger/journal-entries', label: 'Journal Entries' },
                { path: '/app/ledger/trial-balance', label: 'Trial Balance' }
            ]
        },
        {
            id: 'cash',
            icon: Wallet,
            label: 'Cash & Banking',
            submenu: [
                { path: '/app/cash/payments', label: 'Cashier Queue' },
                { path: '/app/cash/shift-report', label: 'Shift Report' }
            ]
        },
        {
            id: 'budgets',
            icon: TrendingUp,
            label: 'Budget Management',
            submenu: [
                { path: '/app/budgets', label: 'Annual Budget' },
                { path: '/app/budgets/analysis', label: 'Budget vs Actual' }
            ]
        },
        {
            id: 'funds',
            icon: DollarSign,
            label: 'Fund Accounting',
            submenu: [
                { path: '/app/funds/donor', label: 'Donor Fund' },
                { path: '/app/funds/retention', label: 'Retention Fund' }
            ]
        },
        {
            id: 'payroll_medical',
            icon: Stethoscope,
            label: 'Payroll Medical',
            submenu: [
                { path: '/app/payroll/medical', label: 'Deduction Schedule' },
                { path: '/app/payroll/medical', label: 'Staff Balances' } // Both link to same page with tabs
            ]
        },
        {
            isHeading: true,
            label: 'DEPARTMENTAL QUEUES'
        },
        { path: '/app/opd/dashboard', icon: Stethoscope, label: 'OPD Queue' },
        { path: '/app/lab/dashboard', icon: Beaker, label: 'Laboratory' },
        { path: '/app/pharmacy/dashboard', icon: Pill, label: 'Pharmacy' },
        { path: '/app/radiology/dashboard', icon: Radio, label: 'Radiology' },
        {
            id: 'departments',
            icon: Building,
            label: 'Other Clinics',
            submenu: [
                { path: '/app/billing/ipd/new', label: 'IPD / Children Ward' },
                { path: '/app/maternity/billing', label: 'Labour Ward' },
                { path: '/app/theatre/billing', label: 'Theater' },
                { path: '/app/billing/physiology/new', label: 'Physiology' },
                { path: '/app/billing/dental/new', label: 'Dental' }
            ]
        },
        {
            id: 'pharmacy',
            icon: Package,
            label: 'Pharmacy Inventory',
            submenu: [
                { path: '/app/pharmacy/inventory', label: 'Inventory list' },
                { path: '/app/pharmacy/grn', label: 'Receive Stock (GRN)' }
            ]
        },
        {
            id: 'setup',
            icon: Settings,
            label: 'Setup',
            submenu: [
                { path: '/app/setup', label: 'Tariffs' }, // Services
                { path: '/app/setup/services', label: 'Services' },
                { path: '/app/setup/users/new', label: 'Staff Management' },
                { path: '/app/setup/roles', label: 'User Roles' },
                ...(user?.role === 'admin' ? [{ path: '/app/setup/pending-approvals', label: '🔔 Pending Approvals' }] : [])
            ]
        },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex">
            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full glass-panel border-r border-white/5 z-40
          transform transition-all duration-300 lg:translate-x-0
          flex flex-col bg-black/40 backdrop-blur-2xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
`}
            >
                {/* Logo & Collapse Button */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-white/5">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                {orgName.split(' ')[0]}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex p-2 hover:bg-white/5 rounded-xl transition-all text-text-secondary hover:text-white"
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform duration-500 ${sidebarCollapsed ? 'rotate-180' : ''} `} />
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-text-secondary"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* User Profile - Suno Style */}
                {!sidebarCollapsed && (
                    <div className="mx-4 mt-6 mb-2 p-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-primary to-accent p-[2px]">
                                    <div className="w-full h-full rounded-[14px] bg-bg-primary flex items-center justify-center overflow-hidden">
                                        <span className="text-sm font-black text-white">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-bg-primary"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-white truncate">
                                    {user?.firstName} {user?.lastName}
                                </div>
                                <div className="text-[11px] font-medium text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-primary/60"></span>
                                    {user?.role?.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
                    <div className="space-y-1">
                        {menuItems.map((item, index) => {
                            if (item.isHeading) {
                                return (
                                    <div
                                        key={`heading-${index}`}
                                        className={`px-3 py-4 mt-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ${sidebarCollapsed ? 'text-center' : ''}`}
                                    >
                                        {sidebarCollapsed ? '⋯' : item.label}
                                    </div>
                                );
                            }

                            const Icon = item.icon;

                            // Parent menu with submenu
                            if (item.submenu) {
                                const isExpanded = expandedMenus[item.id];
                                const hasActiveChild = item.submenu.some(sub => location.pathname.startsWith(sub.path));

                                return (
                                    <div key={item.id} className="relative">
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className={`
                                                w-full flex items-center gap-4 px-4 py-3 rounded-2xl
                                                transition-all duration-300 group
                                                ${hasActiveChild
                                                    ? 'bg-white/5 text-white shadow-lg'
                                                    : 'text-text-secondary hover:bg-white/[0.03] hover:text-white'
                                                }
                                                ${sidebarCollapsed ? 'justify-center' : ''}
                                            `}
                                        >
                                            <div className={`
                                                p-2 rounded-xl transition-all duration-300
                                                ${hasActiveChild ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,0,204,0.3)]' : 'bg-white/5 group-hover:bg-white/10'}
                                            `}>
                                                <Icon className="w-5 h-5 flex-shrink-0" />
                                            </div>
                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="flex-1 text-left font-bold text-sm tracking-tight">{item.label}</span>
                                                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                </>
                                            )}
                                        </button>

                                        {/* Submenu items */}
                                        {isExpanded && !sidebarCollapsed && (
                                            <div className="mt-2 ml-10 space-y-1 border-l border-white/5 pl-4">
                                                {item.submenu.map((subItem) => {
                                                    const isActive = location.pathname === subItem.path;
                                                    return (
                                                        <button
                                                            key={subItem.path}
                                                            onClick={() => {
                                                                navigate(subItem.path);
                                                                setSidebarOpen(false);
                                                            }}
                                                            className={`
                                                                w-full flex items-center px-4 py-2.5 rounded-xl
                                                                transition-all duration-300 text-[13px] font-semibold
                                                                ${isActive
                                                                    ? 'text-primary'
                                                                    : 'text-text-secondary hover:text-white'
                                                                }
                                                            `}
                                                        >
                                                            {subItem.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Regular menu item
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        setSidebarOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-4 px-4 py-3 rounded-2xl
                                        transition-all duration-300 group
                                        ${active
                                            ? 'bg-white/5 text-white shadow-lg'
                                            : 'text-text-secondary hover:bg-white/[0.03] hover:text-white'
                                        }
                                        ${sidebarCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-xl transition-all duration-300
                                        ${active ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(255,0,204,0.3)]' : 'bg-white/5 group-hover:bg-white/10'}
                                    `}>
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                    </div>
                                    {!sidebarCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-4 px-4 py-3 rounded-2xl
                            text-sm font-bold text-text-secondary hover:bg-red-500/10 hover:text-red-500
                            transition-all duration-300
                            ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <div className="p-2 bg-white/5 rounded-xl group-hover:bg-red-500/20">
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                        </div>
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-md"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-500 bg-bg-primary ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} `}>
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all"
                    >
                        <Menu className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-black tracking-tighter text-white">{orgName.split(' ')[0]}</span>
                    </div>
                    <NotificationBell />
                </header>

                {/* Desktop Top Nav Component could go here if needed, but currently keeping it clean */}

                {/* Page Content */}
                <main className="flex-1 overflow-x-auto overflow-y-auto bg-bg-primary custom-scrollbar">
                    <div className="p-6 lg:p-10 max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
