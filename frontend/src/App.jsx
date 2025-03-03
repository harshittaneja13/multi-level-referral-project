import { useState } from 'react'

import './App.css'
import { useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:4000';
const API_BASE_URL = 'http://localhost:4000';
let socket;

function App() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [referrerId, setReferrerId] = useState('');
    const [loggedInUserId, setLoggedInUserId] = useState('');
    const [purchaseAmount, setPurchaseAmount] = useState('');

    const [searchName, setSearchName] = useState('');
    const [viewUserId, setViewUserId] = useState('');
    const [earnings, setEarnings] = useState([]);
    const [totalEarnings, setTotalEarnings] = useState(0);

    const [referralSearchName, setReferralSearchName] = useState('');
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


   // Realtime Integration
    useEffect(() => {
        const effectiveId = viewUserId.trim() !== '' ? viewUserId : loggedInUserId;
        if (!effectiveId) {
            console.log("No effective id available. Skipping socket initialization.");
            return;
        }
        console.log("Initializing Socket.IO with effective id:", effectiveId);

        if (socket) {
            console.log("Disconnecting existing socket instance.");
            socket.disconnect();
        }

        socket = io(SOCKET_SERVER_URL);

        socket.on('connect', () => {
            console.log('Socket connected with id:', socket.id);
            console.log('Joining room:', effectiveId);
            socket.emit('joinRoom', effectiveId);
        });

        socket.on('earningUpdate', (data) => {
            console.log(`Realtime update for user ${effectiveId}:`, data);
            setEarnings(prev => [data, ...prev]);
            setTotalEarnings(data.newTotal);
            alert(`${data.parentname} just earned Rs. ${data.amount} from ${data.username} a ${data.type} referral!`);
        });

        socket.on('connect_error', (err) => console.error('Socket connection error:', err));

        return () => {
            console.log("Cleaning up socket connection for effective id:", effectiveId);
            if (socket) socket.disconnect();
        };
    }, [viewUserId, loggedInUserId]);


    //  Fetch Earnings
    useEffect(() => {
        async function fetchEarnings() {
            if (viewUserId.trim() === '') return;
            try {
                const response = await axios.get(`${API_BASE_URL}/api/earnings`, {
                    params: { userId: viewUserId },
                });
                console.log(`Fetched earnings for user ${viewUserId}:`, response.data);
                setEarnings(response.data.earnings);
                // setViewUserName(response.data.user.name)
                if (response.data.earnings && response.data.earnings.length > 0) {
                    const sum = response.data.earnings.reduce((acc, record) => acc + record.amount, 0);
                    setTotalEarnings(sum);
                } else {
                    setTotalEarnings(0);
                }
            } catch (error) {
                console.error('Error fetching earnings:', error);
            }
        }
        fetchEarnings();
    }, [viewUserId]);

    // Handlers
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const payload = { name, email };
            if (referrerId.trim() !== '') payload.referrerId = referrerId;
            const res = await axios.post(`${API_BASE_URL}/api/users`, payload);
            if (res.data.user) {
                alert( res.data.message + ' Your user ID: ' + res.data.user._id);
                setLoggedInUserId(res.data.user._id);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user. ' + error.response?.data?.message);
        }
    };

    const handleProcessPurchase = async (e) => {
        e.preventDefault();
        if (!loggedInUserId) {
            alert('Please create a user first.');
            return;
        }
        try {
            const payload = {
                userId: loggedInUserId,
                purchaseAmount: parseFloat(purchaseAmount)
            };
            const res = await axios.post(`${API_BASE_URL}/api/purchase`, payload);

            alert(res.data.message);

        } catch (error) {
            console.error('Error processing purchase:', error);
            alert('Failed to process purchase. ' + error.response?.data?.message);
        }
    };


    const handleViewEarnings = async (e) => {
        e.preventDefault();
        if (searchName.trim() === '') {
            alert('Please enter a valid name.');
            return;
        }
        try {

            const res = await axios.get(`${API_BASE_URL}/api/user`, {
                params: { name: searchName }
            });
            if (res.data.user) {
                setViewUserId(res.data.user._id);
            } else {
                alert('User not found.');
                setViewUserId('');
                setEarnings([]);
                setTotalEarnings(0);
            }
        } catch (error) {
            console.error('Error looking up user by name:', error);
            alert('Failed to search for user. Please try again.');
            setViewUserId('');
            setEarnings([]);
            setTotalEarnings(0);
        }
    };

    const handleSearchReferrals = async (e) => {
        e.preventDefault();
        setError('');
        setReferralData(null);
        // Basic validation.
        if (referralSearchName.trim() === '') {
            setError('Please enter a name.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.get(`${API_BASE_URL}/api/referrals`, {
                params: { name: referralSearchName }
            });

            if (response.data) {
                setReferralData(response.data);
            }
        } catch (err) {
            console.error('Error fetching referral data:', err);
            setError(err.response?.data?.message || 'Error fetching referral data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* User Creation Form */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Create User</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block font-medium">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-medium">Referrer User ID (optional)</label>
                        <input
                            type="text"
                            value={referrerId}
                            onChange={e => setReferrerId(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter user id of referrer"
                        />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Create User / Login
                    </button>
                </form>
                {loggedInUserId && (
                    <p className="mt-4 text-sm text-gray-700">
                        Your User ID (logged in): <span className="font-mono">{loggedInUserId}</span>
                    </p>
                )}
            </div>

            {/* Purchase Processing Form */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Process Purchase</h2>
                <form onSubmit={handleProcessPurchase} className="space-y-4">
                    <div>
                        <label className="block font-medium">Purchase Amount (Rs.)</label>
                        <input
                            type="number"
                            value={purchaseAmount}
                            onChange={e => setPurchaseAmount(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter amount (minimum 1000Rs)"
                            required
                        />
                    </div>
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Process Purchase
                    </button>
                </form>
            </div>

            {/* View Earnings By User Name */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">View Earnings by User Name</h2>
                <form onSubmit={handleViewEarnings} className="mb-6 space-y-4">
                    <div>
                        <label className="block font-medium">Enter User Name</label>
                        <input
                            type="text"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter the user name to view earnings"
                            required
                        />
                    </div>
                    <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                        View Earnings
                    </button>
                </form>

                {viewUserId.trim() !== '' && (
                    <div>
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <span className="font-bold">Total Earnings for User ({searchName}):</span> Rs. {totalEarnings.toFixed(2)}
                        </div>
                        <div className="overflow-auto">
                            <ul>
                                {earnings && earnings.length > 0 ? (
                                    earnings.map((earning, index) => (
                                        <li key={earning._id || index} className="p-3 border-b border-gray-200">
                                            {earning.type ? (
                                                <div>
                                                    Earned Rs. {earning.amount} from a <span className="font-semibold">{earning.type}</span> referral by user {earning.fromUser}
                                                </div>
                                            ) : (
                                                <div>
                                                    Earned Rs. {earning.amount} from a Level {earning.referralLevel} referral on{' '}
                                                    {new Date(earning.createdAt).toLocaleString()}
                                                </div>
                                            )}
                                        </li>
                                    ))
                                ) : (
                                    <li className="p-3 text-gray-500">No earnings recorded for this user yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Referral Search Form */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Search Referral Information</h2>
                <form onSubmit={handleSearchReferrals} className="space-y-4">
                    <div>
                        <label className="block font-medium">Enter User Name</label>
                        <input
                            type="text"
                            value={referralSearchName}
                            onChange={(e) => setReferralSearchName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Enter a user's name"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                    >
                        Search Referrals
                    </button>
                </form>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>

            {/* Referral Display */}
            {loading && (
                <div className="mb-8">
                    <p>Loading referral data...</p>
                </div>
            )}
            {referralData && (
                <div className="border-t pt-6">
                    <h2 className="text-2xl font-semibold mb-4">Referral Information</h2>
                    <div className="mb-6">
                        <p className="font-medium">User Information:</p>
                        <p><strong>Name:</strong> {referralData.user.name}</p>
                        <p><strong>Email:</strong> {referralData.user.email}</p>
                        <p><strong>ID:</strong> {referralData.user._id}</p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-medium mb-2">Level 1 Referrals</h3>
                        {referralData.level1.length > 0 ? (
                            <ul className="list-disc pl-5">
                                {referralData.level1.map((ref, index) => (
                                    <li key={ref._id || index} className="mb-1">
                                        <span className="font-semibold">Name:</span> {ref.name} | <span className="font-semibold">Email:</span> {ref.email} | <span className="font-semibold">ID:</span> {ref._id}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">No Level 1 referrals found.</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-medium mb-2">Level 2 Referrals</h3>
                        {referralData.level2.length > 0 ? (
                            <ul className="list-disc pl-5">
                                {referralData.level2.map((ref, index) => (
                                    <li key={ref._id || index} className="mb-1">
                                        <span className="font-semibold">Name:</span> {ref.name} | <span className="font-semibold">Email:</span> {ref.email} | <span className="font-semibold">ID:</span> {ref._id}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">No Level 2 referrals found.</p>
                        )}
                    </div>
                </div>
            )}


        </>
    )

}

export default App
