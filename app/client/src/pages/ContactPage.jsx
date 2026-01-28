import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ContactForm from '../components/ContactForm';
import RelationshipSection from '../components/RelationshipSection';
import BusinessSection from '../components/BusinessSection';
import JournalSection from '../components/JournalSection';
import MarkdownContent from '../components/MarkdownContent';

export default function ContactPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('journal');

    useEffect(() => {
        loadContact();
    }, [id]);

    const loadContact = async () => {
        setLoading(true);
        try {
            const data = await api.getContact(id);
            setContact(data);
        } catch (err) {
            console.error('Failed to load contact:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this contact? This will also delete all journal entries and relationships.')) {
            return;
        }

        try {
            await api.deleteContact(id);
            navigate('/');
        } catch (err) {
            console.error('Failed to delete contact:', err);
        }
    };

    const handleContactUpdated = (updated) => {
        setContact(prev => ({ ...prev, ...updated }));
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-medium text-gray-900 mb-2">Contact not found</h2>
                <Link to="/" className="text-blue-600 hover:underline">
                    Back to contacts
                </Link>
            </div>
        );
    }

    const tabs = [
        { id: 'journal', label: 'Journal', count: contact.journalEntries?.length || 0 },
        { id: 'relationships', label: 'Relationships', count: contact.relationships?.length || 0 },
        { id: 'business', label: 'Business', count: contact.businessInfo?.length || 0 }
    ];

    return (
        <div>
            {/* Back button */}
            <Link
                to="/"
                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to contacts
            </Link>

            {/* Contact header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start gap-6">
                    {contact.avatar_url ? (
                        <img
                            src={contact.avatar_url}
                            alt={`${contact.first_name} ${contact.last_name || ''}`}
                            className="w-24 h-24 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                            {contact.first_name[0]}{contact.last_name?.[0] || ''}
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {contact.first_name} {contact.last_name}
                                </h1>
                                {contact.nickname && (
                                    <p className="text-gray-500">"{contact.nickname}"</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditing(true)}
                                    className="text-gray-400 hover:text-gray-600 p-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="text-gray-400 hover:text-red-600 p-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            {contact.email && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                        {contact.email}
                                    </a>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                        {contact.phone}
                                    </a>
                                </div>
                            )}
                            {contact.address && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {contact.address}
                                </div>
                            )}
                            {contact.birthday && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                    </svg>
                                    {new Date(contact.birthday).toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        {contact.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <MarkdownContent content={contact.notes} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab content */}
            {activeTab === 'journal' && (
                <JournalSection
                    contactId={contact.id}
                    entries={contact.journalEntries || []}
                    onUpdate={loadContact}
                />
            )}
            {activeTab === 'relationships' && (
                <RelationshipSection
                    contactId={contact.id}
                    relationships={contact.relationships || []}
                    onUpdate={loadContact}
                />
            )}
            {activeTab === 'business' && (
                <BusinessSection
                    contactId={contact.id}
                    businessInfo={contact.businessInfo || []}
                    onUpdate={loadContact}
                />
            )}

            {/* Edit modal */}
            {editing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Edit Contact</h2>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <ContactForm
                                contact={contact}
                                onSuccess={handleContactUpdated}
                                onCancel={() => setEditing(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
