import React, { useState, useEffect } from 'react';
import { receivablesAPI } from '../../services/apiService';
import { Plus, Send, FileText, CheckCircle, Package } from 'lucide-react';

const NHIMAClaimsSubmission = () => {
    const [approvedClaims, setApprovedClaims] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingBatch, setCreatingBatch] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'batches'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [claimsRes, batchesRes] = await Promise.all([
                receivablesAPI.nhima.getAll({ vettingStatus: 'approved', batchId: 'null' }), // Fetch unbatched approved claims
                receivablesAPI.nhima.getBatches()
            ]);
            setApprovedClaims(claimsRes.data.data || []);
            setBatches(batchesRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async () => {
        if (approvedClaims.length === 0) return;

        try {
            setCreatingBatch(true);
            const today = new Date();
            await receivablesAPI.nhima.createBatch({
                month: today.getMonth() + 1,
                year: today.getFullYear(),
                notes: `Batch created on ${today.toLocaleDateString()}`
            });

            alert('Claims batch created successfully!');
            fetchData(); // Refresh lists
            setActiveTab('batches');
        } catch (error) {
            console.error('Failed to create batch:', error);
            alert('Failed to create batch');
        } finally {
            setCreatingBatch(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading claims data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Claims Submission & Batching</h1>
                    <p className="text-gray-600 mt-1">Group vetted claims into batches for submission</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'pending' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Ready for Batching ({approvedClaims.length})
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'batches' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('batches')}
                >
                    Submitted Batches
                </button>
            </div>

            {activeTab === 'pending' && (
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Approved Claims ({approvedClaims.length})</h3>
                        <button
                            onClick={handleCreateBatch}
                            disabled={approvedClaims.length === 0 || creatingBatch}
                            className="btn btn-primary"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            {creatingBatch ? 'Creating Batch...' : 'Create Batch'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left border-b">
                                    <th className="p-3">Claim #</th>
                                    <th className="p-3">Patient</th>
                                    <th className="p-3">NHIMA Number</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Approved Date</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedClaims.length > 0 ? (
                                    approvedClaims.map(claim => (
                                        <tr key={claim.id} className="border-b">
                                            <td className="p-3 font-medium">{claim.claimNumber}</td>
                                            <td className="p-3">{claim.patient?.firstName} {claim.patient?.lastName}</td>
                                            <td className="p-3">{claim.nhimaNumber}</td>
                                            <td className="p-3">K {claim.claimAmount}</td>
                                            <td className="p-3">{new Date(claim.updatedAt).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <span className="badge badge-success flex w-fit items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Vetted
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-6 text-center text-gray-500">
                                            No approved claims ready for batching.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'batches' && (
                <div className="grid gap-6">
                    {batches.map(batch => (
                        <div key={batch.id} className="card p-6 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{batch.batchNumber}</h3>
                                <p className="text-sm text-gray-500">
                                    Created: {new Date(batch.createdAt).toLocaleDateString()} | Claims: {batch.claimCount}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-primary-600">K {batch.totalAmount}</p>
                                <span className={`badge ${batch.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                    {batch.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {batches.length === 0 && (
                        <div className="text-center p-8 text-gray-500 card">
                            No batches created yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NHIMAClaimsSubmission;
