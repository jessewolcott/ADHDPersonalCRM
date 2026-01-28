import { useState } from 'react';
import api from '../services/api';

export default function BusinessSection({ contactId, businessInfo, onUpdate }) {
    const [showForm, setShowForm] = useState(false);
    const [editingInfo, setEditingInfo] = useState(null);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Position
                </button>
            </div>

            {showForm && (
                <BusinessForm
                    contactId={contactId}
                    onSuccess={() => { setShowForm(false); onUpdate(); }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {editingInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Edit Position</h2>
                                <button
                                    onClick={() => setEditingInfo(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <BusinessForm
                                contactId={contactId}
                                info={editingInfo}
                                onSuccess={() => { setEditingInfo(null); onUpdate(); }}
                                onCancel={() => setEditingInfo(null)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {businessInfo.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                    No business information yet. Add their work history and contact info.
                </p>
            ) : (
                <div className="space-y-4">
                    {businessInfo.map(info => (
                        <BusinessCard
                            key={info.id}
                            info={info}
                            onEdit={() => setEditingInfo(info)}
                            onDelete={async () => {
                                if (confirm('Delete this business information?')) {
                                    await api.deleteBusinessInfo(info.id);
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

function BusinessCard({ info, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{info.title || 'Position'}</h3>
                        {info.is_current ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                Current
                            </span>
                        ) : (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                Past
                            </span>
                        )}
                    </div>
                    {info.company && (
                        <p className="text-gray-600">{info.company}</p>
                    )}
                    {info.department && (
                        <p className="text-sm text-gray-500">{info.department}</p>
                    )}
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

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {info.work_email && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${info.work_email}`} className="hover:text-blue-600">
                            {info.work_email}
                        </a>
                    </div>
                )}
                {info.work_phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${info.work_phone}`} className="hover:text-blue-600">
                            {info.work_phone}
                        </a>
                    </div>
                )}
                {info.linkedin && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        <a href={info.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                            LinkedIn
                        </a>
                    </div>
                )}
            </div>

            {(info.start_date || info.end_date) && (
                <p className="text-xs text-gray-400 mt-2">
                    {info.start_date && new Date(info.start_date).toLocaleDateString()}
                    {info.start_date && info.end_date && ' - '}
                    {info.end_date && new Date(info.end_date).toLocaleDateString()}
                    {info.start_date && !info.end_date && info.is_current && ' - Present'}
                </p>
            )}

            {info.notes && (
                <p className="text-sm text-gray-600 mt-2 border-t border-gray-100 pt-2">
                    {info.notes}
                </p>
            )}
        </div>
    );
}

function BusinessForm({ contactId, info, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        company: info?.company || '',
        title: info?.title || '',
        department: info?.department || '',
        workEmail: info?.work_email || '',
        workPhone: info?.work_phone || '',
        linkedin: info?.linkedin || '',
        notes: info?.notes || '',
        isCurrent: info?.is_current !== false,
        startDate: info?.start_date || '',
        endDate: info?.end_date || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (info) {
                await api.updateBusinessInfo(info.id, formData);
            } else {
                await api.createBusinessInfo(contactId, formData);
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to save business info:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="text"
                    placeholder="Company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                    type="text"
                    placeholder="Title/Position"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="grid grid-cols-2 gap-3">
                <input
                    type="email"
                    placeholder="Work Email"
                    value={formData.workEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, workEmail: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                    type="tel"
                    placeholder="Work Phone"
                    value={formData.workPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, workPhone: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <input
                type="url"
                placeholder="LinkedIn URL"
                value={formData.linkedin}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="grid grid-cols-3 gap-3">
                <input
                    type="date"
                    placeholder="Start Date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                    type="date"
                    placeholder="End Date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={formData.isCurrent}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={formData.isCurrent}
                        onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked, endDate: e.target.checked ? '' : prev.endDate }))}
                        className="rounded border-gray-300"
                    />
                    Current position
                </label>
            </div>

            <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
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
                    {saving ? 'Saving...' : (info ? 'Update' : 'Add Position')}
                </button>
            </div>
        </form>
    );
}
