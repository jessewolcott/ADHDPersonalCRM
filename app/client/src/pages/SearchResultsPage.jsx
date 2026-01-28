import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            performSearch();
        }
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const data = await api.search(query);
            setResults(data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Failed to load search results</p>
            </div>
        );
    }

    const { contacts, journalEntries, businessInfo } = results.results;
    const hasResults = contacts.length > 0 || journalEntries.length > 0 || businessInfo.length > 0;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results
            </h1>
            <p className="text-gray-500 mb-6">
                {results.total} results for "{query}"
            </p>

            {!hasResults ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-xl font-medium text-gray-900 mb-2">No results found</h2>
                    <p className="text-gray-500">
                        Try different keywords or check your spelling
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {contacts.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Contacts ({contacts.length})
                            </h2>
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
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                                    {contact.first_name[0]}{contact.last_name?.[0] || ''}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900">
                                                    {contact.first_name} {contact.last_name}
                                                </h3>
                                                {contact.match_snippet && (
                                                    <p
                                                        className="text-sm text-gray-500 mt-1"
                                                        dangerouslySetInnerHTML={{ __html: contact.match_snippet }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {journalEntries.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Journal Entries ({journalEntries.length})
                            </h2>
                            <div className="space-y-3">
                                {journalEntries.map(entry => (
                                    <Link
                                        key={entry.id}
                                        to={`/contact/${entry.contact_id}`}
                                        className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                {entry.title && (
                                                    <h3 className="font-medium text-gray-900">{entry.title}</h3>
                                                )}
                                                <p className="text-sm text-gray-500">
                                                    {entry.first_name} {entry.last_name} • {new Date(entry.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {entry.match_snippet && (
                                            <p
                                                className="text-sm text-gray-600 mt-2"
                                                dangerouslySetInnerHTML={{ __html: entry.match_snippet }}
                                            />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {businessInfo.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Business ({businessInfo.length})
                            </h2>
                            <div className="space-y-3">
                                {businessInfo.map(info => (
                                    <Link
                                        key={info.id}
                                        to={`/contact/${info.contact_id}`}
                                        className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                                {info.first_name[0]}{info.last_name?.[0] || ''}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {info.first_name} {info.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {info.title && <span>{info.title}</span>}
                                                    {info.title && info.company && <span> at </span>}
                                                    {info.company && <span className="font-medium">{info.company}</span>}
                                                </p>
                                                {info.department && (
                                                    <p className="text-sm text-gray-500">{info.department}</p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
