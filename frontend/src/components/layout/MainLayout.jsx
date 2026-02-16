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
    ChevronLeft
} from 'lucide-react';

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [orgName, setOrgName] = React.useState('MEDFINANCE360');

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
    }, []);

    const menuItems = [
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/app/billing/opd', icon: FileText, label: 'Billing' },
        { path: '/app/patients', icon: Users, label: 'Patients' },
        { path: '/app/receivables/nhima', icon: DollarSign, label: 'Receivables' },
        { path: '/app/payables/suppliers', icon: CreditCard, label: 'Payables' },
        { path: '/app/ledger/accounts', icon: BookOpen, label: 'Ledger' },
        { path: '/app/cash/payments', icon: Wallet, label: 'Cash & Bank' },
        { path: '/app/budgets', icon: TrendingUp, label: 'Budgets' },
        { path: '/app/assets', icon: Package, label: 'Assets' },
        { path: '/app/reports', icon: BarChart3, label: 'Reports' },
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
          fixed top-0 left-0 h-full glass-panel border-r border-border-color z-40
          transform transition-all duration-300 lg:translate-x-0
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
                        <ChevronLeft className={`w-4 h-4 text-text-secondary transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
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
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
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
