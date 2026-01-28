const API_BASE = '/api';

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'include'
    });

    if (response.status === 401) {
        window.location.href = '/login';
        return null;
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

const api = {
    // Auth
    getCurrentUser: () => fetch('/auth/me', { credentials: 'include' }).then(r => r.json()),
    getAuthProviders: () => fetch('/auth/providers').then(r => r.json()),

    // Contacts
    getContacts: (page = 1, limit = 50) =>
        request(`${API_BASE}/contacts?page=${page}&limit=${limit}`),
    getContact: (id) => request(`${API_BASE}/contacts/${id}`),
    createContact: (data) => request(`${API_BASE}/contacts`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateContact: (id, data) => request(`${API_BASE}/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteContact: (id) => request(`${API_BASE}/contacts/${id}`, { method: 'DELETE' }),

    // Relationships
    getRelationships: (contactId) => request(`${API_BASE}/relationships/contact/${contactId}`),
    createRelationship: (contactId, data) => request(`${API_BASE}/relationships/contact/${contactId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    deleteRelationship: (id) => request(`${API_BASE}/relationships/${id}`, { method: 'DELETE' }),

    // Journal
    getJournalEntries: (contactId) => request(`${API_BASE}/journal/contact/${contactId}`),
    getJournalEntry: (id) => request(`${API_BASE}/journal/${id}`),
    createJournalEntry: (contactId, data) => request(`${API_BASE}/journal/contact/${contactId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateJournalEntry: (id, data) => request(`${API_BASE}/journal/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteJournalEntry: (id) => request(`${API_BASE}/journal/${id}`, { method: 'DELETE' }),

    // Business Info
    getBusinessInfo: (contactId) => request(`${API_BASE}/business/contact/${contactId}`),
    createBusinessInfo: (contactId, data) => request(`${API_BASE}/business/contact/${contactId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateBusinessInfo: (id, data) => request(`${API_BASE}/business/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteBusinessInfo: (id) => request(`${API_BASE}/business/${id}`, { method: 'DELETE' }),

    // Custom Fields
    getCustomFields: (contactId) => request(`${API_BASE}/fields/contact/${contactId}`),
    createCustomField: (contactId, data) => request(`${API_BASE}/fields/contact/${contactId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateCustomField: (id, data) => request(`${API_BASE}/fields/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteCustomField: (id) => request(`${API_BASE}/fields/${id}`, { method: 'DELETE' }),

    // Search
    search: (query) => request(`${API_BASE}/search?q=${encodeURIComponent(query)}`),

    // Data Management
    getStats: () => request(`${API_BASE}/data/stats`),
    exportJSON: () => `${API_BASE}/data/export/json`,
    exportCSV: () => `${API_BASE}/data/export/csv`,
    importJSON: (data, mode) => request(`${API_BASE}/data/import/json`, {
        method: 'POST',
        body: JSON.stringify({ data, mode })
    })
};

export default api;
