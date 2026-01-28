import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [importError, setImportError] = useState('');
    const [importMode, setImportMode] = useState('merge');
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleExportJSON = () => {
        window.location.href = api.exportJSON();
    };

    const handleExportCSV = () => {
        window.location.href = api.exportCSV();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);
        setImportError('');

        try {
            const text = await file.text();
            const json = JSON.parse(text);

            if (!json.data || !json.data.contacts) {
                throw new Error('Invalid export file format');
            }

            const result = await api.importJSON(json.data, importMode);
            setImportResult(result);
            loadStats(); // Refresh stats
        } catch (err) {
            setImportError(err.message || 'Import failed');
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            {/* Account Info */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
                <div className="flex items-center gap-4">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-16 h-16 rounded-full"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                            {user?.displayName?.[0] || user?.email?.[0] || '?'}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-gray-900">{user?.displayName}</p>
                        <p className="text-gray-500">{user?.email}</p>
                        <p className="text-sm text-gray-400 capitalize">
                            Signed in via {user?.provider}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-4 text-red-600 hover:text-red-700 text-sm font-medium"
                >
                    Sign out
                </button>
            </section>

            {/* Data Statistics */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Data</h2>
                {stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">{stats.contacts}</p>
                            <p className="text-sm text-gray-500">Contacts</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">{stats.relationships}</p>
                            <p className="text-sm text-gray-500">Relationships</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">{stats.journalEntries}</p>
                            <p className="text-sm text-gray-500">Journal Entries</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-gray-900">{stats.businessRecords}</p>
                            <p className="text-sm text-gray-500">Business Records</p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-pulse flex gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-1 h-20 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                )}
            </section>

            {/* Export Data */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Export Data</h2>
                <p className="text-gray-500 text-sm mb-4">
                    Download all your contacts, relationships, journal entries, and business information.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportJSON}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export JSON
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    JSON includes all data and can be re-imported. CSV contains contacts only for spreadsheet use.
                </p>
            </section>

            {/* Import Data */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Import Data</h2>
                <p className="text-gray-500 text-sm mb-4">
                    Restore from a JSON export file.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Import Mode
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="importMode"
                                value="merge"
                                checked={importMode === 'merge'}
                                onChange={() => setImportMode('merge')}
                                className="text-blue-600"
                            />
                            <span className="text-sm">
                                <span className="font-medium">Merge</span>
                                <span className="text-gray-500"> - Add to existing data</span>
                            </span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="importMode"
                                value="replace"
                                checked={importMode === 'replace'}
                                onChange={() => setImportMode('replace')}
                                className="text-blue-600"
                            />
                            <span className="text-sm">
                                <span className="font-medium">Replace</span>
                                <span className="text-gray-500"> - Delete existing data first</span>
                            </span>
                        </label>
                    </div>
                </div>

                {importMode === 'replace' && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> Replace mode will delete all your existing contacts,
                            relationships, journal entries, and business information before importing.
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {importing ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                            Importing...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Select JSON File
                        </>
                    )}
                </button>

                {importResult && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                            Successfully imported {importResult.importedContacts} contacts!
                        </p>
                    </div>
                )}

                {importError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                            Import failed: {importError}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
