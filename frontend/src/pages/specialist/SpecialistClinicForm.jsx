import React from 'react';
import { useNavigate } from 'react-router-dom';

const SpecialistClinicForm = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="card p-6">
                <h1 className="text-2xl font-bold text-text-primary mb-4">Specialist Clinic Bill Form</h1>
                <p className="text-text-secondary">This form is under development. Please check back later.</p>
                <button onClick={() => navigate('/app/specialist-clinics/billing')} className="btn btn-secondary mt-4">
                    Back to Specialist Clinics
                </button>
            </div>
        </div>
    );
};

export default SpecialistClinicForm;
