import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ContactForm from '../components/ContactForm';

export default function HomePage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async (page = 1) => {
        setLoading(true);
        try {
            const data = await api.getContacts(page);
            setContacts(data.contacts);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Failed to load contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleContactCreated = (contact) => {
        setContacts([contact, ...contacts]);
        setShowForm(false);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
    };

    if (loading && contacts.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Contacts
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({pagination.total})
                    </span>
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Contact
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">New Contact</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <ContactForm onSuccess={handleContactCreated} onCancel={() => setShowForm(false)} />
                        </div>
                    </div>
                </div>
            )}

            {contacts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">No contacts yet</h2>
                    <p className="text-gray-500 mb-4">Get started by adding your first contact</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add Contact
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contacts.map(contact => (
                            <Link
                                key={contact.id}
                                to={`/contact/${contact.id}`}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-3">
                                    {contact.avatar_url ? (
                                        <img
                                            src={contact.avatar_url}
                                            alt={`${contact.first_name} ${contact.last_name || ''}`}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
                                            {contact.first_name[0]}{contact.last_name?.[0] || ''}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate">
                                            {contact.first_name} {contact.last_name}
                                        </h3>
                                        {contact.nickname && (
                                            <p className="text-sm text-gray-500 truncate">"{contact.nickname}"</p>
                                        )}
                                        {contact.email && (
                                            <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => loadContacts(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => loadContacts(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
