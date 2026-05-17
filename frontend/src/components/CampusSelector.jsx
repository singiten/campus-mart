import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCampuses } from '../services/api';

const CampusSelector = () => {
    const { selectedCampus, changeCampus } = useAuth();
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampuses();
    }, []);

    const fetchCampuses = async () => {
        try {
            const response = await getCampuses();
            setCampuses(response.data.data);
        } catch (error) {
            console.error('Error fetching campuses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCampusColor = (campusName) => {
        switch(campusName) {
            case '4kilo': return '#27ae60';
            case '5kilo': return '#f39c12';
            case '6kilo': return '#e74c3c';
            default: return '#667eea';
        }
    };

    if (loading) return null;

    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                {campuses.map(campus => (
                    <button
                        key={campus.name}
                        onClick={() => changeCampus(campus.name)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: selectedCampus === campus.name ? getCampusColor(campus.name) : 'white',
                            color: selectedCampus === campus.name ? 'white' : '#333',
                            border: selectedCampus === campus.name ? 'none' : '2px solid #e0e0e0',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            textAlign: 'center',
                            minWidth: '120px'
                        }}
                    >
                        <div style={{ fontWeight: 'bold' }}>{campus.displayName}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                            {campus.deliveryFee} ETB delivery
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            {campus.name === '4kilo' ? '24/7' : '1PM - 4AM'}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CampusSelector;