import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// List all contacts for user
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const contacts = db.prepare(`
        SELECT * FROM contacts
        WHERE user_id = ?
        ORDER BY first_name, last_name
        LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?')
        .get(req.user.id).count;

    res.json({
        contacts,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Get single contact with relationships and recent journal entries
router.get('/:id', (req, res) => {
    const contact = db.prepare(`
        SELECT * FROM contacts WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    // Get relationships
    const relationships = db.prepare(`
        SELECT r.*, c.first_name, c.last_name, c.nickname, c.avatar_url
        FROM relationships r
        JOIN contacts c ON c.id = r.related_contact_id
        WHERE r.contact_id = ?
    `).all(contact.id);

    // Get reverse relationships (where this contact is the related one)
    const reverseRelationships = db.prepare(`
        SELECT r.*, c.first_name, c.last_name, c.nickname, c.avatar_url,
               r.contact_id as related_contact_id
        FROM relationships r
        JOIN contacts c ON c.id = r.contact_id
        WHERE r.related_contact_id = ?
    `).all(contact.id);

    // Get recent journal entries
    const journalEntries = db.prepare(`
        SELECT * FROM journal_entries
        WHERE contact_id = ?
        ORDER BY date DESC, created_at DESC
        LIMIT 10
    `).all(contact.id);

    // Get business info
    const businessInfo = db.prepare(`
        SELECT * FROM business_info WHERE contact_id = ? ORDER BY is_current DESC, start_date DESC
    `).all(contact.id);

    // Get custom fields
    const customFields = db.prepare(`
        SELECT * FROM custom_fields WHERE contact_id = ?
    `).all(contact.id);

    res.json({
        ...contact,
        relationships: [...relationships, ...reverseRelationships.map(r => ({
            ...r,
            relationship_type: getInverseRelationship(r.relationship_type)
        }))],
        journalEntries,
        businessInfo,
        customFields
    });
});

// Create contact
router.post('/', (req, res) => {
    const { firstName, lastName, nickname, email, phone, address, birthday, notes, avatarUrl } = req.body;

    if (!firstName) {
        return res.status(400).json({ error: 'First name is required' });
    }

    const result = db.prepare(`
        INSERT INTO contacts (user_id, first_name, last_name, nickname, email, phone, address, birthday, notes, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, firstName, lastName || null, nickname || null, email || null,
           phone || null, address || null, birthday || null, notes || null, avatarUrl || null);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contact);
});

// Update contact
router.put('/:id', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const { firstName, lastName, nickname, email, phone, address, birthday, notes, avatarUrl } = req.body;

    db.prepare(`
        UPDATE contacts
        SET first_name = ?, last_name = ?, nickname = ?, email = ?, phone = ?,
            address = ?, birthday = ?, notes = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        firstName ?? contact.first_name,
        lastName ?? contact.last_name,
        nickname ?? contact.nickname,
        email ?? contact.email,
        phone ?? contact.phone,
        address ?? contact.address,
        birthday ?? contact.birthday,
        notes ?? contact.notes,
        avatarUrl ?? contact.avatar_url,
        contact.id
    );

    const updated = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact.id);
    res.json(updated);
});

// Delete contact
router.delete('/:id', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.id, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    db.prepare('DELETE FROM contacts WHERE id = ?').run(contact.id);
    res.status(204).send();
});

// Helper to get inverse relationship type
function getInverseRelationship(type) {
    const inverses = {
        'parent': 'child',
        'child': 'parent',
        'spouse': 'spouse',
        'partner': 'partner',
        'sibling': 'sibling',
        'friend': 'friend',
        'coworker': 'coworker',
        'manager': 'report',
        'report': 'manager',
        'client': 'vendor',
        'vendor': 'client'
    };
    return inverses[type] || type;
}

export default router;
