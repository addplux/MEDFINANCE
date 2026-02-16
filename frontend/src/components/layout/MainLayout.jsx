import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setupAPI } from '../../services/apiService';
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
    Calculator
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

        if (path.includes('/billing/') || path.includes('/invoice/')) {
            newExpanded['billing'] = true;
        }
        if (path.includes('/nhima/')) {
            newExpanded['receivables'] = true;
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
        {
            id: 'billing',
            icon: FileText,
            label: 'Patient Billing',
            submenu: [
                { path: '/app/billing/opd/new', label: 'New Bill' },
                { path: '/app/billing/opd', label: 'Invoice List' }
            ]
        },
        { path: '/app/patients', icon: Users, label: 'Patients' },
        {
            id: 'receivables',
            icon: DollarSign,
            label: 'Receivables',
            submenu: [
                { path: '/app/receivables/corporate', label: 'Corporate Accounts' },
                { path: '/app/receivables/schemes', label: 'Schemes' },
                { path: '/app/nhima/eligibility', label: 'NHIMA Eligibility' },
                { path: '/app/nhima/submission', label: 'NHIMA Claims' },
                { path: '/app/nhima/tracking', label: 'Claims Tracking' },
                { path: '/app/nhima/reconciliation', label: 'Reconciliation' }
            ]
        },
        { path: '/app/payables/suppliers', icon: CreditCard, label: 'Payables' },
        { path: '/app/ledger/accounts', icon: BookOpen, label: 'Ledger' },
        { path: '/app/cash/payments', icon: Wallet, label: 'Cash & Bank' },
        { path: '/app/budgets', icon: TrendingUp, label: 'Budgets' },
        {
            id: 'funds',
            icon: DollarSign,
            label: 'Fund Accounting',
            submenu: [
                { path: '/app/funds', label: 'All Funds' },
                { path: '/app/funds/nhima', label: 'NHIMA Fund' },
                { path: '/app/funds/donor', label: 'Donor Fund' },
                { path: '/app/funds/retention', label: 'Retention Fund' }
            ]
        },
        { path: '/app/assets', icon: Package, label: 'Assets' },
        { path: '/app/payroll/medical', icon: Stethoscope, label: 'Payroll Medical' },
        { path: '/app/lab/dashboard', icon: Activity, label: 'Laboratory' },
        { path: '/app/reports', icon: BarChart3, label: 'Reports' },
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
        { path: '/app/setup', icon: Settings, label: 'Setup' },
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
          fixed top - 0 left - 0 h - full glass - panel border - r border - border - color z - 40
          transform transition - all duration - 300 lg: translate - x - 0
          flex flex - col
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
                        <ChevronLeft className={`w - 4 h - 4 text - text - secondary transition - transform ${sidebarCollapsed ? 'rotate-180' : ''} `} />
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
                        {menuItems.map((item) => {
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
w - full flex items - center gap - 3 px - 3 py - 2 rounded - md
transition - all duration - 200 text - sm
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
w - full flex items - center px - 3 py - 1.5 rounded - md
transition - all duration - 200 text - sm
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
w - full flex items - center gap - 3 px - 3 py - 2 rounded - md
transition - all duration - 200 text - sm
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
w - full flex items - center gap - 3 px - 3 py - 2 rounded - md
text - sm text - text - secondary hover: bg - bg - tertiary hover: text - error
transition - all duration - 200
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
            <div className={`flex - 1 flex flex - col transition - all duration - 300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'} `}>
                {/* Mobile Header */}
                <header className="lg:hidden h-14 glass border-b border-border-color px-4 flex items-center justify-between sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-bg-tertiary rounded-md"
                    >
                        <Menu className="w-5 h-5 text-text-primary" />
                    </button>
                    <span className="text-base font-bold text-text-primary">{orgName}</span>
                    <div className="w-9" /> {/* Spacer for centering */}
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
