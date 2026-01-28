import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Full-text search across contacts and journal entries
router.get('/', (req, res) => {
    const query = req.query.q;

    if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Prepare search term for FTS5 (escape special characters and add wildcards)
    const searchTerm = query.trim().replace(/['"]/g, '').split(/\s+/).map(term => `"${term}"*`).join(' ');

    // Search contacts
    const contacts = db.prepare(`
        SELECT c.*, snippet(contacts_fts, 0, '<mark>', '</mark>', '...', 32) as match_snippet
        FROM contacts_fts
        JOIN contacts c ON c.id = contacts_fts.rowid
        WHERE contacts_fts MATCH ? AND c.user_id = ?
        ORDER BY rank
        LIMIT 20
    `).all(searchTerm, req.user.id);

    // Search journal entries
    const journalEntries = db.prepare(`
        SELECT j.*, c.first_name, c.last_name,
               snippet(journal_fts, 1, '<mark>', '</mark>', '...', 64) as match_snippet
        FROM journal_fts
        JOIN journal_entries j ON j.id = journal_fts.rowid
        JOIN contacts c ON c.id = j.contact_id
        WHERE journal_fts MATCH ? AND c.user_id = ?
        ORDER BY rank
        LIMIT 20
    `).all(searchTerm, req.user.id);

    // Search business info (non-FTS, simple LIKE search)
    const businessInfo = db.prepare(`
        SELECT b.*, c.first_name, c.last_name, c.id as contact_id
        FROM business_info b
        JOIN contacts c ON c.id = b.contact_id
        WHERE c.user_id = ? AND (
            b.company LIKE ? OR
            b.title LIKE ? OR
            b.department LIKE ?
        )
        LIMIT 20
    `).all(req.user.id, `%${query}%`, `%${query}%`, `%${query}%`);

    res.json({
        query,
        results: {
            contacts,
            journalEntries,
            businessInfo
        },
        total: contacts.length + journalEntries.length + businessInfo.length
    });
});

export default router;
