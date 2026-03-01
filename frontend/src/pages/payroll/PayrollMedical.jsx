import React, { useState } from 'react';
import DeductionSchedule from './tabs/DeductionSchedule';
import StaffBalances from './tabs/StaffBalances';
import { FileText, Users, DollarSign } from 'lucide-react';

const PayrollMedical = () => {
    const [activeTab, setActiveTab] = useState('schedule');

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-text-primary">Payroll Medical</h1>
                <p className="text-text-secondary">Manage staff medical bill deductions and view outstanding balances.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border-color">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`pb-3 px-5 flex items-center gap-2 transition-colors relative ${activeTab === 'schedule'
                        ? 'text-primary-500 font-medium'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Deduction Schedule
                    {activeTab === 'schedule' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={`pb-3 px-5 flex items-center gap-2 transition-colors relative ${activeTab === 'balances'
                        ? 'text-primary-500 font-medium'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    Staff Balances
                    {activeTab === 'balances' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="glass-panel p-6">
                {activeTab === 'schedule' ? <DeductionSchedule /> : <StaffBalances />}
            </div>
        </div>
    );
};

export default PayrollMedical;
