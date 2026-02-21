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
    Building
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
        if (path.includes('/nhima/')) {
            newExpanded['nhima'] = true;
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
            id: 'nhima',
            icon: Activity,
            label: 'NHIMA',
            submenu: [
                { path: '/app/nhima/tariffs', label: 'Tariff management' },
                { path: '/app/nhima/claims', label: 'Claim generation' },
                { path: '/app/nhima/vetting', label: 'Vetting status' },
                { path: '/app/nhima/batches', label: 'Batch submission' }
            ]
        },
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
                { path: '/app/funds/nhima', label: 'NHIMA Fund' },
                { path: '/app/funds/donor', label: 'Donor Fund' },
                { path: '/app/funds/retention', label: 'Retention Fund' }
            ]
        },
        { path: '/app/assets', icon: Package, label: 'Assets' },
        {
            id: 'payroll_medical',
            icon: Stethoscope,
            label: 'Payroll Medical',
            submenu: [
                { path: '/app/payroll/medical', label: 'Deduction Schedule' },
                { path: '/app/payroll/medical', label: 'Staff Balances' } // Both link to same page with tabs
            ]
        },
        { path: '/app/lab/dashboard', icon: Activity, label: 'Laboratory' },
        {
            id: 'departments',
            icon: Building,
            label: 'Departments',
            submenu: [
                { path: '/app/billing/opd/new', label: 'OPD' },
                { path: '/app/billing/ipd/new', label: 'IPD / Children Ward' },
                { path: '/app/maternity/billing', label: 'Labour Ward' },
                { path: '/app/theatre/billing', label: 'Theater' },
                { path: '/app/billing/radiology/new', label: 'Scan / Radiology' },
                { path: '/app/billing/lab/new', label: 'Lab' },
                { path: '/app/billing/physiology/new', label: 'Physiology' },
                { path: '/app/billing/pharmacy/new', label: 'Pharmacy' },
                { path: '/app/billing/dental/new', label: 'Dental' }
            ]
        },
        {
            id: 'pharmacy',
            icon: Package,
            label: 'Pharmacy',
            submenu: [
                { path: '/app/pharmacy/inventory', label: 'Inventory' },
                { path: '/app/pharmacy/grn', label: 'Receive Stock (GRN)' },
                { path: '/app/pharmacy/dispense', label: 'Dispense' }
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
        <div className="min-h-screen bg-bg-primary flex">
            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full glass-panel border-r border-border-color z-40
          transform transition-all duration-300 lg:translate-x-0
          flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-16' : 'w-56'}
`}
            >
                {/* Logo & Collapse Button */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-border-color">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-text-primary tracking-tight">{orgName}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex p-1.5 hover:bg-bg-tertiary rounded-md transition-colors"
                    >
                        <ChevronLeft className={`w-4 h-4 text-text-secondary transition-transform ${sidebarCollapsed ? 'rotate-180' : ''} `} />
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 hover:bg-bg-tertiary rounded-md"
                    >
                        <X className="w-4 h-4 text-text-secondary" />
                    </button>
                </div>

                {/* User Profile */}
                <div className="p-3 border-b border-border-color">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-white">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </span>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary truncate">
                                    {user?.firstName} {user?.lastName}
                                </div>
                                <div className="text-xs text-text-secondary truncate capitalize">
                                    {user?.role?.replace('_', ' ')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2">
                    <div className="space-y-0.5">
                        {menuItems.map((item, index) => {
                            if (item.isHeading) {
                                return (
                                    <div
                                        key={`heading-${index}`}
                                        className={`px-3 py-2 mt-4 mb-1 text-xs font-bold text-text-secondary tracking-wider ${sidebarCollapsed ? 'text-center' : ''}`}
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
                                    <div key={item.id}>
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className={`
w-full flex items-center gap-3 px-3 py-2 rounded-md
transition-all duration-200 text-sm
                                                ${hasActiveChild
                                                    ? 'bg-bg-tertiary text-text-primary font-medium'
                                                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                                }
                                                ${sidebarCollapsed ? 'justify-center' : ''}
`}
                                            title={sidebarCollapsed ? item.label : ''}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            {!sidebarCollapsed && (
                                                <>
                                                    <span className="flex-1 text-left">{item.label}</span>
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </>
                                            )}
                                        </button>

                                        {/* Submenu items */}
                                        {isExpanded && !sidebarCollapsed && (
                                            <div className="ml-7 mt-1 space-y-0.5">
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
w-full flex items-center px-3 py-1.5 rounded-md
transition-all duration-200 text-sm
                                                                ${isActive
                                                                    ? 'bg-primary-50 text-primary-600 font-medium'
                                                                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
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
w-full flex items-center gap-3 px-3 py-2 rounded-md
transition-all duration-200 text-sm
                                        ${active
                                            ? 'bg-bg-tertiary text-text-primary font-medium'
                                            : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                                        }
                                        ${sidebarCollapsed ? 'justify-center' : ''}
`}
                                    title={sidebarCollapsed ? item.label : ''}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {!sidebarCollapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className="p-2 border-t border-border-color">
                    <button
                        onClick={handleLogout}
                        className={`
w-full flex items-center gap-3 px-3 py-2 rounded-md
text-sm text-text-secondary hover:bg-bg-tertiary hover:text-error
transition-all duration-200
              ${sidebarCollapsed ? 'justify-center' : ''}
`}
                        title={sidebarCollapsed ? 'Logout' : ''}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'} `}>
                {/* Mobile Header */}
                <header className="lg:hidden h-14 glass border-b border-border-color px-4 flex items-center justify-between sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-bg-tertiary rounded-md"
                    >
                        <Menu className="w-5 h-5 text-text-primary" />
                    </button>
                    <span className="text-base font-bold text-text-primary">{orgName}</span>
                    <NotificationBell />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-4 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
