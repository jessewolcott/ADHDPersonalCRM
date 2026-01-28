import { useState } from 'react';
import api from '../services/api';
import MarkdownContent from './MarkdownContent';

export default function JournalSection({ contactId, entries, onUpdate }) {
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Journal Entries</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Entry
                </button>
            </div>

            {showForm && (
                <JournalForm
                    contactId={contactId}
                    onSuccess={() => { setShowForm(false); onUpdate(); }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {editingEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Edit Entry</h2>
                                <button
                                    onClick={() => setEditingEntry(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <JournalForm
                                contactId={contactId}
                                entry={editingEntry}
                                onSuccess={() => { setEditingEntry(null); onUpdate(); }}
                                onCancel={() => setEditingEntry(null)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                    No journal entries yet. Add one to start tracking your interactions.
                </p>
            ) : (
                <div className="space-y-4">
                    {entries.map(entry => (
                        <JournalEntry
                            key={entry.id}
                            entry={entry}
                            onEdit={() => setEditingEntry(entry)}
                            onDelete={async () => {
                                if (confirm('Delete this journal entry?')) {
                                    await api.deleteJournalEntry(entry.id);
                                    onUpdate();
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function JournalEntry({ entry, onEdit, onDelete }) {
    const tags = entry.tags ? entry.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
                <div>
                    {entry.title && (
                        <h3 className="font-medium text-gray-900">{entry.title}</h3>
                    )}
                    <p className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-gray-400 hover:text-red-600 p-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {entry.content && (
                <MarkdownContent content={entry.content} className="text-gray-700" />
            )}

            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function JournalForm({ contactId, entry, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        title: entry?.title || '',
        content: entry?.content || '',
        date: entry?.date || new Date().toISOString().split('T')[0],
        tags: entry?.tags || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (entry) {
                await api.updateJournalEntry(entry.id, formData);
            } else {
                await api.createJournalEntry(contactId, formData);
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to save journal entry:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="Title (optional)"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <textarea
                placeholder="What happened? (supports markdown)"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
                type="text"
                placeholder="Tags (comma-separated: meeting, call, lunch)"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                    {saving ? 'Saving...' : (entry ? 'Update' : 'Add Entry')}
                </button>
            </div>
        </form>
    );
}
