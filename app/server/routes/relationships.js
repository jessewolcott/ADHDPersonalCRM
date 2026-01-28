import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Get relationships for a contact
router.get('/contact/:contactId', (req, res) => {
    // Verify contact belongs to user
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const relationships = db.prepare(`
        SELECT r.*, c.first_name, c.last_name, c.nickname, c.avatar_url
        FROM relationships r
        JOIN contacts c ON c.id = r.related_contact_id
        WHERE r.contact_id = ?
    `).all(contact.id);

    res.json(relationships);
});

// Create relationship
router.post('/contact/:contactId', (req, res) => {
    const { relatedContactId, relationshipType, category, notes } = req.body;

    // Verify both contacts belong to user
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    const relatedContact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(relatedContactId, req.user.id);

    if (!contact || !relatedContact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.id === relatedContact.id) {
        return res.status(400).json({ error: 'Cannot create relationship with self' });
    }

    if (!relationshipType) {
        return res.status(400).json({ error: 'Relationship type is required' });
    }

    try {
        const result = db.prepare(`
            INSERT INTO relationships (contact_id, related_contact_id, relationship_type, category, notes)
            VALUES (?, ?, ?, ?, ?)
        `).run(contact.id, relatedContact.id, relationshipType, category || 'personal', notes || null);

        const relationship = db.prepare('SELECT * FROM relationships WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(relationship);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Relationship already exists' });
        }
        throw err;
    }
});

// Delete relationship
router.delete('/:id', (req, res) => {
    const relationship = db.prepare(`
        SELECT r.* FROM relationships r
        JOIN contacts c ON c.id = r.contact_id
        WHERE r.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!relationship) {
        return res.status(404).json({ error: 'Relationship not found' });
    }

    db.prepare('DELETE FROM relationships WHERE id = ?').run(relationship.id);
    res.status(204).send();
});

export default router;
