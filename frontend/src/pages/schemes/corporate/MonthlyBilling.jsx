import React, { useState, useEffect } from 'react';
import { receivablesAPI } from '../../../services/apiService';
import { useToast } from '../../../context/ToastContext';
import {
    Calendar,
    FileText,
    Play,
    CheckCircle,
    AlertCircle,
    Clock,
    Download,
    Eye,
    Building2,
    Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MonthlyBilling = () => {
    const { addToast } = useToast();

    // Form State
    const [selectedScheme, setSelectedScheme] = useState('');
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Data State
    const [schemes, setSchemes] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const months = [
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    useEffect(() => {
        fetchCorporateSchemes();
    }, []);

    useEffect(() => {
        if (selectedScheme) {
            fetchSchemeInvoices(selectedScheme);
        } else {
            setInvoices([]);
        }
    }, [selectedScheme]);

    const fetchCorporateSchemes = async () => {
        setLoading(true);
        try {
            // Fetch schemes and optionally filter by 'corporate' if needed.
            // For now, grabbing all schemes since this might handle both.
            const response = await receivablesAPI.schemes.getAll();
            setSchemes(response.data || []);

            if (response.data && response.data.length > 0) {
                // Auto-select first scheme if none selected
                setSelectedScheme(response.data[0].id.toString());
            }
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
            addToast('error', 'Failed to load schemes.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchemeInvoices = async (schemeId) => {
        try {
            const response = await receivablesAPI.schemes.getInvoices(schemeId);
            setInvoices(response.data || []);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
            addToast('error', 'Failed to load historical invoices for this scheme.');
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!selectedScheme) {
            addToast('error', 'Please select a scheme first.');
            return;
        }

        setGenerating(true);
        try {
            const payload = {
                schemeId: parseInt(selectedScheme),
                month: parseInt(selectedMonth),
                year: parseInt(selectedYear)
            };

            const response = await receivablesAPI.schemes.generateInvoice(payload);

            addToast('success', `Invoice ${response.data.invoiceNumber} generated successfully!`);

            // Refresh invoice list
            fetchSchemeInvoices(selectedScheme);

        } catch (error) {
            console.error('Failed to generate invoice:', error);
            const msg = error.response?.data?.error || 'Failed to generate invoice. No uninvoiced bills found for period?';
            addToast('error', msg);
        } finally {
            setGenerating(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Paid</span>;
            case 'draft':
            case 'pending':
                return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
            case 'overdue':
                return <span className="badge badge-danger"><AlertCircle className="w-3 h-3 mr-1" /> Overdue</span>;
            default:
                return <span className="badge badge-neutral">{status}</span>;
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Monthly Billing Cycle</h1>
                    <p className="text-text-secondary">Process corporate monthly invoices and submit scheme claims</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Invoice Generation Form */}
                <div className="lg:col-span-1">
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Building2 className="w-5 h-5 text-primary-600" />
                            <h2 className="text-lg font-semibold text-text-primary">Generate Invoice</h2>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="form-label">Select Scheme</label>
                                <select
                                    className="form-select"
                                    value={selectedScheme}
                                    onChange={(e) => setSelectedScheme(e.target.value)}
                                    required
                                    disabled={loading || schemes.length === 0}
                                >
                                    <option value="">{loading ? 'Loading schemes...' : 'Select a Corporate Scheme'}</option>
                                    {schemes.map(s => (
                                        <option key={s.id} value={s.id}>{s.schemeName} ({s.schemeCode})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Billing Month</label>
                                    <select
                                        className="form-select"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        required
                                    >
                                        {months.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Billing Year</label>
                                    <select
                                        className="form-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        required
                                    >
                                        {years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border mt-6">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full flex justify-center items-center gap-2"
                                    disabled={generating || !selectedScheme}
                                >
                                    {generating ? (
                                        <><span>Processing Bills...</span></>
                                    ) : (
                                        <><Play className="w-4 h-4" /> Run Billing Cycle</>
                                    )}
                                </button>
                                <p className="text-xs text-text-secondary mt-3 text-center">
                                    This will compile all unpaid bills for the selected period into a single invoice.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="lg:col-span-2">
                    <div className="card h-full">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-text-primary">Invoice History</h2>
                            <div className="text-sm text-text-secondary">
                                {invoices.length} Invoices Found
                            </div>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Period</th>
                                        <th>Total Amount</th>
                                        <th>Status</th>
                                        <th>Date Generated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!selectedScheme ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-text-secondary">
                                                Select a scheme to view its invoice history
                                            </td>
                                        </tr>
                                    ) : invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-text-secondary flex flex-col items-center">
                                                <FileText className="w-12 h-12 text-text-disabled mb-3" />
                                                <p>No invoices generated for this scheme yet.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="font-medium text-primary-600">
                                                    {inv.invoiceNumber}
                                                </td>
                                                <td>
                                                    {new Date(inv.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="font-bold">
                                                    K{parseFloat(inv.totalAmount).toLocaleString()}
                                                </td>
                                                <td>
                                                    {getStatusBadge(inv.status)}
                                                </td>
                                                <td className="text-sm text-text-secondary">
                                                    {new Date(inv.createdAt).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            to={`/app/receivables/invoices/${inv.id}`}
                                                            className="p-1 text-text-secondary hover:text-primary-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            to={`/app/receivables/invoices/${inv.id}?download=true`}
                                                            className="p-1 text-text-secondary hover:text-primary-600 transition-colors"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Link>
                                                        <Link
                                                            to={`/app/receivables/invoices/${inv.id}?share=true`}
                                                            className="p-1 text-text-secondary hover:text-green-600 transition-colors"
                                                            title="Share Invoice"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MonthlyBilling;
