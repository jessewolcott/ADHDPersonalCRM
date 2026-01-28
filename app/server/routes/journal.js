import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Get journal entries for a contact
router.get('/contact/:contactId', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const entries = db.prepare(`
        SELECT * FROM journal_entries
        WHERE contact_id = ?
        ORDER BY date DESC, created_at DESC
    `).all(contact.id);

    res.json(entries);
});

// Get single journal entry
router.get('/:id', (req, res) => {
    const entry = db.prepare(`
        SELECT j.* FROM journal_entries j
        JOIN contacts c ON c.id = j.contact_id
        WHERE j.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!entry) {
        return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json(entry);
});

// Create journal entry
router.post('/contact/:contactId', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const { title, content, date, tags } = req.body;

    const result = db.prepare(`
        INSERT INTO journal_entries (contact_id, title, content, date, tags)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        contact.id,
        title || null,
        content || null,
        date || new Date().toISOString().split('T')[0],
        Array.isArray(tags) ? tags.join(',') : (tags || null)
    );

    const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(entry);
});

// Update journal entry
router.put('/:id', (req, res) => {
    const entry = db.prepare(`
        SELECT j.* FROM journal_entries j
        JOIN contacts c ON c.id = j.contact_id
        WHERE j.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!entry) {
        return res.status(404).json({ error: 'Journal entry not found' });
    }

    const { title, content, date, tags } = req.body;

    db.prepare(`
        UPDATE journal_entries
        SET title = ?, content = ?, date = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        title ?? entry.title,
        content ?? entry.content,
        date ?? entry.date,
        tags !== undefined ? (Array.isArray(tags) ? tags.join(',') : tags) : entry.tags,
        entry.id
    );

    const updated = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(entry.id);
    res.json(updated);
});

// Delete journal entry
router.delete('/:id', (req, res) => {
    const entry = db.prepare(`
        SELECT j.* FROM journal_entries j
        JOIN contacts c ON c.id = j.contact_id
        WHERE j.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!entry) {
        return res.status(404).json({ error: 'Journal entry not found' });
    }

    db.prepare('DELETE FROM journal_entries WHERE id = ?').run(entry.id);
    res.status(204).send();
});

export default router;
