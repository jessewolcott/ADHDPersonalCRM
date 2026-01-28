import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Get custom fields for a contact
router.get('/contact/:contactId', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const fields = db.prepare('SELECT * FROM custom_fields WHERE contact_id = ?').all(contact.id);
    res.json(fields);
});

// Create custom field
router.post('/contact/:contactId', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const { fieldName, fieldValue, fieldType } = req.body;

    if (!fieldName) {
        return res.status(400).json({ error: 'Field name is required' });
    }

    const result = db.prepare(`
        INSERT INTO custom_fields (contact_id, field_name, field_value, field_type)
        VALUES (?, ?, ?, ?)
    `).run(contact.id, fieldName, fieldValue || null, fieldType || 'text');

    const field = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(field);
});

// Update custom field
router.put('/:id', (req, res) => {
    const field = db.prepare(`
        SELECT f.* FROM custom_fields f
        JOIN contacts c ON c.id = f.contact_id
        WHERE f.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!field) {
        return res.status(404).json({ error: 'Custom field not found' });
    }

    const { fieldName, fieldValue, fieldType } = req.body;

    db.prepare(`
        UPDATE custom_fields
        SET field_name = ?, field_value = ?, field_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        fieldName ?? field.field_name,
        fieldValue ?? field.field_value,
        fieldType ?? field.field_type,
        field.id
    );

    const updated = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(field.id);
    res.json(updated);
});

// Delete custom field
router.delete('/:id', (req, res) => {
    const field = db.prepare(`
        SELECT f.* FROM custom_fields f
        JOIN contacts c ON c.id = f.contact_id
        WHERE f.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!field) {
        return res.status(404).json({ error: 'Custom field not found' });
    }

    db.prepare('DELETE FROM custom_fields WHERE id = ?').run(field.id);
    res.status(204).send();
});

export default router;
