import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const RELATIONSHIP_TYPES = [
    { value: 'spouse', label: 'Spouse', category: 'personal' },
    { value: 'partner', label: 'Partner', category: 'personal' },
    { value: 'parent', label: 'Parent', category: 'personal' },
    { value: 'child', label: 'Child', category: 'personal' },
    { value: 'sibling', label: 'Sibling', category: 'personal' },
    { value: 'friend', label: 'Friend', category: 'personal' },
    { value: 'coworker', label: 'Coworker', category: 'business' },
    { value: 'manager', label: 'Manager', category: 'business' },
    { value: 'report', label: 'Direct Report', category: 'business' },
    { value: 'client', label: 'Client', category: 'business' },
    { value: 'vendor', label: 'Vendor', category: 'business' }
];

export default function RelationshipSection({ contactId, relationships, onUpdate }) {
    const [showForm, setShowForm] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [relationshipType, setRelationshipType] = useState('');
    const [category, setCategory] = useState('personal');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (showForm) {
            loadContacts();
        }
    }, [showForm]);

    const loadContacts = async () => {
        try {
            const data = await api.getContacts(1, 100);
            // Filter out current contact
            setContacts(data.contacts.filter(c => c.id !== contactId));
        } catch (err) {
            console.error('Failed to load contacts:', err);
        }
    };

    const filteredContacts = contacts.filter(c => {
        const name = `${c.first_name} ${c.last_name || ''} ${c.nickname || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    const handleAddRelationship = async () => {
        if (!selectedContact || !relationshipType) return;

        setSaving(true);
        try {
            await api.createRelationship(contactId, {
                relatedContactId: selectedContact.id,
                relationshipType,
                category
            });
            setShowForm(false);
            setSelectedContact(null);
            setRelationshipType('');
            setSearchTerm('');
            onUpdate();
        } catch (err) {
            console.error('Failed to add relationship:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRelationship = async (id) => {
        if (!confirm('Remove this relationship?')) return;
        try {
            await api.deleteRelationship(id);
            onUpdate();
        } catch (err) {
            console.error('Failed to delete relationship:', err);
        }
    };

    const personalRelationships = relationships.filter(r => r.category === 'personal');
    const businessRelationships = relationships.filter(r => r.category === 'business');

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Relationships</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Relationship
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search for a contact
                        </label>
                        <input
                            type="text"
                            placeholder="Start typing a name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchTerm && filteredContacts.length > 0 && !selectedContact && (
                            <div className="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredContacts.slice(0, 10).map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedContact(c);
                                            setSearchTerm(`${c.first_name} ${c.last_name || ''}`);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                                            {c.first_name[0]}{c.last_name?.[0] || ''}
                                        </div>
                                        <span>{c.first_name} {c.last_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedContact && (
                            <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                                <span>Selected: {selectedContact.first_name} {selectedContact.last_name}</span>
                                <button
                                    onClick={() => {
                                        setSelectedContact(null);
                                        setSearchTerm('');
                                    }}
                                    className="ml-auto text-blue-500 hover:text-blue-700"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Relationship Type
                            </label>
                            <select
                                value={relationshipType}
                                onChange={(e) => {
                                    setRelationshipType(e.target.value);
                                    const type = RELATIONSHIP_TYPES.find(t => t.value === e.target.value);
                                    if (type) setCategory(type.category);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select type...</option>
                                <optgroup label="Personal">
                                    {RELATIONSHIP_TYPES.filter(t => t.category === 'personal').map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Business">
                                    {RELATIONSHIP_TYPES.filter(t => t.category === 'business').map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="personal">Personal</option>
                                <option value="business">Business</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setSelectedContact(null);
                                setSearchTerm('');
                            }}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddRelationship}
                            disabled={!selectedContact || !relationshipType || saving}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                        >
                            {saving ? 'Adding...' : 'Add Relationship'}
                        </button>
                    </div>
                </div>
            )}

            {relationships.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                    No relationships yet. Link this person to other contacts.
                </p>
            ) : (
                <div className="space-y-6">
                    {personalRelationships.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                Personal
                            </h3>
                            <div className="space-y-2">
                                {personalRelationships.map(rel => (
                                    <RelationshipCard
                                        key={rel.id}
                                        relationship={rel}
                                        onDelete={() => handleDeleteRelationship(rel.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {businessRelationships.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                Business
                            </h3>
                            <div className="space-y-2">
                                {businessRelationships.map(rel => (
                                    <RelationshipCard
                                        key={rel.id}
                                        relationship={rel}
                                        onDelete={() => handleDeleteRelationship(rel.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RelationshipCard({ relationship, onDelete }) {
    const typeLabel = RELATIONSHIP_TYPES.find(t => t.value === relationship.relationship_type)?.label
        || relationship.relationship_type;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
            <Link
                to={`/contact/${relationship.related_contact_id}`}
                className="flex items-center gap-3 hover:text-blue-600"
            >
                {relationship.avatar_url ? (
                    <img
                        src={relationship.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                        {relationship.first_name?.[0]}{relationship.last_name?.[0] || ''}
                    </div>
                )}
                <div>
                    <p className="font-medium">
                        {relationship.first_name} {relationship.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{typeLabel}</p>
                </div>
            </Link>
            <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-600 p-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
