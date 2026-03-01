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
    Radio,
    Wrench,
    Layers,
    Terminal
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

    // ── Role groups ──────────────────────────────────────────────────────
    const SUPER_ROLES = ['superintendent', 'admin'];
    const FINANCE = ['accountant', ...SUPER_ROLES];
    const CASHIER_ROLES = ['cashier', ...FINANCE];

    // Clinical: includes ALL roles that walk the wards
    const CLINICAL = ['doctor', 'nurse', ...SUPER_ROLES];

    // Admin portal only — no clinical, no finance
    const ADMIN_ONLY = SUPER_ROLES;

    // Doctor-level clinical (NOT nurse — nurses can't request lab/radiology)
    const DOCTOR_PLUS = ['doctor', ...SUPER_ROLES];

    // Dept-specific queues visible to their own team + doctors + admin
    const LAB_VISIBLE = ['lab_technician', 'doctor', 'nurse', ...SUPER_ROLES];
    const PHARMA_QUEUE = ['pharmacist', 'doctor', 'nurse', ...SUPER_ROLES];
    const RADIO_VISIBLE = ['radiographer', 'doctor', 'nurse', ...SUPER_ROLES];

    // Helper: does the current user's role appear in the allowed list?
    const hasRole = (...allowedRoles) => allowedRoles.flat().includes(user?.role);

    const menuItems = [

        // ── ALWAYS VISIBLE ───────────────────────────────────────────────
        {
            path: '/app/dashboard', icon: LayoutDashboard, label: 'Home',
            // Every role sees the dashboard
        },

        // Patients: clinical staff + cashier + admin (NOT dept-only staff)
        {
            path: '/app/patients', icon: Users, label: 'Patients',
            roles: ['doctor', 'nurse', 'cashier', ...SUPER_ROLES]
        },

        // Visits: clinical staff only (nurses & doctors manage visits)
        {
            path: '/app/visits', icon: ClipboardList, label: 'Visits',
            roles: CLINICAL
        },

        // ── SCHEME MANAGER (Finance + Cashier) ───────────────────────────
        { isHeading: true, label: 'SCHEME MANAGER', roles: CASHIER_ROLES },
        {
            path: '/app/receivables/schemes', icon: Settings, label: 'All Schemes',
            roles: CASHIER_ROLES
        },
        {
            id: 'private_scheme', icon: DollarSign, label: 'Private Prepaid',
            roles: CASHIER_ROLES,
            submenu: [
                { path: '/app/schemes/private/members', label: 'Membership Registration' },
                { path: '/app/schemes/private/plans', label: 'Plan Selection' },
                { path: '/app/schemes/private/duration', label: 'Start & End Date' },
                { path: '/app/schemes/private/validation', label: 'Service Coverage' },
                { path: '/app/schemes/private/tracking', label: 'Utilisation Tracking' }
            ]
        },
        {
            id: 'corporate_scheme', icon: BookOpen, label: 'Corporate Scheme',
            roles: CASHIER_ROLES,
            submenu: [
                { path: '/app/schemes/corporate/members', label: 'Member Management' },
                { path: '/app/schemes/corporate/credit', label: 'Credit Limit' },
                { path: '/app/schemes/corporate/terms', label: 'Payment Terms' },
                { path: '/app/schemes/corporate/billing', label: 'Monthly Billing' }
            ]
        },

        // ── FINANCE (Accountant + Superintendent) ────────────────────────
        { isHeading: true, label: 'FINANCE & OPERATIONS', roles: CASHIER_ROLES },
        {
            path: '/app/payables/suppliers', icon: CreditCard, label: 'Payables',
            roles: FINANCE
        },
        {
            id: 'ledger', icon: BookOpen, label: 'General Ledger',
            roles: FINANCE,
            submenu: [
                { path: '/app/ledger/accounts', label: 'Chart of Accounts' },
                { path: '/app/ledger/journal-entries', label: 'Journal Entries' },
                { path: '/app/ledger/trial-balance', label: 'Trial Balance' }
            ]
        },
        {
            id: 'cash', icon: Wallet, label: 'Cash & Banking',
            roles: CASHIER_ROLES,
            submenu: [
                { path: '/app/cash/payments', label: 'Cashier Queue' },
                { path: '/app/cash/shift-report', label: 'Shift Report' }
            ]
        },
        {
            id: 'budgets', icon: TrendingUp, label: 'Budget Management',
            roles: FINANCE,
            submenu: [
                { path: '/app/budgets', label: 'Annual Budget' },
                { path: '/app/budgets/analysis', label: 'Budget vs Actual' }
            ]
        },
        {
            id: 'funds', icon: DollarSign, label: 'Fund Accounting',
            roles: FINANCE,
            submenu: [
                { path: '/app/funds/donor', label: 'Donor Fund' },
                { path: '/app/funds/retention', label: 'Retention Fund' }
            ]
        },
        {
            id: 'payroll_medical', icon: Stethoscope, label: 'Payroll Medical',
            roles: FINANCE,
            submenu: [
                { path: '/app/payroll/medical', label: 'Deduction Schedule' },
                { path: '/app/payroll/medical', label: 'Staff Balances' }
            ]
        },
        { path: '/app/reports', icon: BarChart3, label: 'Reports', roles: [...FINANCE, 'doctor'] },
        {
            path: '/app/receivables/ageing', icon: FileCheck, label: 'Debtor Ageing',
            roles: FINANCE
        },

        // ── DEPARTMENTAL QUEUES ──────────────────────────────────────────
        { isHeading: true, label: 'DEPARTMENTAL QUEUES', roles: [...CLINICAL, 'pharmacist', 'lab_technician', 'radiographer', 'cashier'] },

        // OPD — doctors, nurses, cashier (billing), admin
        {
            path: '/app/opd/dashboard', icon: Stethoscope, label: 'OPD Queue',
            roles: [...CLINICAL, 'cashier']
        },
        // Laboratory — lab techs enter results; doctors & nurses submit requests
        {
            path: '/app/lab/dashboard', icon: Beaker, label: 'Laboratory',
            roles: LAB_VISIBLE
        },
        // Pharmacy queue — pharmacists dispense; doctors & nurses can view
        {
            path: '/app/pharmacy/dashboard', icon: Pill, label: 'Pharmacy',
            roles: PHARMA_QUEUE
        },
        // Radiology — radiographers process; doctors & nurses submit requests
        {
            path: '/app/radiology/dashboard', icon: Radio, label: 'Radiology',
            roles: RADIO_VISIBLE
        },
        // Other clinical departments — doctors & nurses only
        {
            id: 'departments', icon: Building, label: 'Other Clinics',
            roles: CLINICAL,
            submenu: [
                { path: '/app/maternity/billing', label: 'Labour Ward' },
                { path: '/app/theatre/dashboard', label: 'Theatre' },
                { path: '/app/physiology/dashboard', label: 'Physiotherapy' },
                { path: '/app/dental/dashboard', label: 'Dental' },
                { path: '/app/specialist-clinics/billing', label: 'Specialist Clinics' }
            ]
        },

        // ── PHARMACY INVENTORY (Pharmacist manages stock) ────────────────
        {
            id: 'pharmacy_inv', icon: Package, label: 'Pharmacy Inventory',
            roles: ['pharmacist', ...SUPER_ROLES],
            submenu: [
                { path: '/app/pharmacy/inventory', label: 'Inventory List' },
                { path: '/app/pharmacy/dispense', label: 'Dispense Drugs' },
                { path: '/app/pharmacy/grn', label: 'Receive Stock (GRN)' }
            ]
        },

        // ── SETTINGS (Admin + Superintendent only) ───────────────────────
        { isHeading: true, label: 'SETTINGS', roles: ADMIN_ONLY },
        {
            path: '/app/setup/services', icon: Layers, label: 'Service Master',
            roles: ADMIN_ONLY
        },
        {
            id: 'setup', icon: Wrench, label: 'System Setup',
            roles: ADMIN_ONLY,
            submenu: [
                { path: '/app/setup', label: 'Tariffs' },
                { path: '/app/setup/users/new', label: 'Staff Management' },
                { path: '/app/setup/roles', label: 'User Roles' },
                ...(hasRole(...ADMIN_ONLY) ? [{ path: '/app/setup/pending-approvals', label: '🔔 Pending Approvals' }] : [])
            ]
        },
        {
            path: '/app/setup/audit-logs', icon: Terminal, label: 'Audit Logs',
            roles: ADMIN_ONLY
        },

    ].filter(item => !item.roles || hasRole(...item.roles));


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
                                        className={`px-3 pt-5 pb-1 text-[11px] font-semibold text-white/30 uppercase tracking-widest ${sidebarCollapsed ? 'text-center' : ''}`}
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
                                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                                transition-all duration-200 group text-sm font-medium
                                                ${hasActiveChild
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                }
                                                ${sidebarCollapsed ? 'justify-center' : ''}
                                            `}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 opacity-50 ${isExpanded ? 'rotate-90' : ''}`} />
                                                </>
                                            )}
                                        </button>

                                        {/* Submenu items */}
                                        {isExpanded && !sidebarCollapsed && (
                                            <div className="mt-1 ml-7 space-y-0.5 border-l border-white/10 pl-3">
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
                                                                w-full flex items-center px-3 py-2 rounded-lg
                                                                transition-all duration-200 text-[13px] font-medium
                                                                ${isActive
                                                                    ? 'text-blue-400'
                                                                    : 'text-white/40 hover:text-white'
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
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                        transition-all duration-200 text-sm font-medium group
                                        ${active
                                            ? 'bg-blue-600 text-white'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }
                                        ${sidebarCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {!sidebarCollapsed && <span>{item.label}</span>}
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
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400
                            transition-all duration-200
                            ${sidebarCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
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
                    <div className="p-6 max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
