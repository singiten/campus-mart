import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [campus, setCampus] = useState('4kilo');
    const [dorm, setDorm] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({ name, email, password, role: 'student', campus, dorm, phone });
            navigate('/');
        } catch (error) {
            console.error('Register error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 200px)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <form onSubmit={handleSubmit} style={{
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>
    🛒 U-Shop
</h1>
<h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Register</h2>
                
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
                
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
                
                <input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
                
                <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                >
                    <option value="4kilo">4 Kilo Campus</option>
                    <option value="5kilo">5 Kilo Campus</option>
                    <option value="6kilo">6 Kilo Campus</option>
                </select>
                
                <input
                    type="text"
                    placeholder="Dorm/Hall Name"
                    value={dorm}
                    onChange={(e) => setDorm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
                
                <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                    }}
                />
                
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Creating account...' : 'Register'}
                </button>
                
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;