import React, { useState, useEffect } from 'react';
import { receivablesAPI } from '../../services/apiService';
import { Check, X, AlertCircle } from 'lucide-react';

const ClaimsVetting = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPendingClaims();
    }, []);

    const fetchPendingClaims = async () => {
        try {
            setLoading(true);
            const res = await receivablesAPI.nhima.getPendingVetting();
            setClaims(res.data);
        } catch (error) {
            console.error('Failed to fetch claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVet = async (id, status, rejectionReason = null) => {
        try {
            setProcessingId(id);
            await receivablesAPI.nhima.vetClaim(id, {
                status,
                rejectionReason
            });

            // Remove processed claim from list
            setClaims(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to vet claim:', error);
            alert('Operation failed');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading pending claims...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">NHIMA Claims Vetting</h1>
                <div className="text-sm text-gray-500">
                    {claims.length} pending claims
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b text-left">
                                <th className="p-4">Date</th>
                                <th className="p-4">Claim #</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">NHIMA #</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Staff</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.length > 0 ? (
                                claims.map(claim => (
                                    <tr key={claim.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{new Date(claim.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium">{claim.claimNumber}</td>
                                        <td className="p-4">{claim.patient?.firstName} {claim.patient?.lastName}</td>
                                        <td className="p-4">{claim.nhimaNumber}</td>
                                        <td className="p-4">K {claim.claimAmount}</td>
                                        <td className="p-4 text-sm text-gray-500">{claim.creator?.firstName}</td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button
                                                onClick={() => handleVet(claim.id, 'approved')}
                                                disabled={processingId === claim.id}
                                                className="btn btn-sm btn-success text-white"
                                                title="Approve"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Enter rejection reason:');
                                                    if (reason) handleVet(claim.id, 'rejected', reason);
                                                }}
                                                disabled={processingId === claim.id}
                                                className="btn btn-sm btn-danger text-white"
                                                title="Reject"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Check className="w-12 h-12 text-green-500 mb-2" />
                                            <p>All caught up! No pending claims.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClaimsVetting;
