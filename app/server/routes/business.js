import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Get business info for a contact
router.get('/contact/:contactId', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const businessInfo = db.prepare(`
        SELECT * FROM business_info
        WHERE contact_id = ?
        ORDER BY is_current DESC, start_date DESC
    `).all(contact.id);

    res.json(businessInfo);
});

// Create business info
router.post('/contact/:contactId', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
        .get(req.params.contactId, req.user.id);

    if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
    }

    const { company, title, department, workEmail, workPhone, linkedin, notes, isCurrent, startDate, endDate } = req.body;

    const result = db.prepare(`
        INSERT INTO business_info (contact_id, company, title, department, work_email, work_phone, linkedin, notes, is_current, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        contact.id,
        company || null,
        title || null,
        department || null,
        workEmail || null,
        workPhone || null,
        linkedin || null,
        notes || null,
        isCurrent !== false ? 1 : 0,
        startDate || null,
        endDate || null
    );

    const info = db.prepare('SELECT * FROM business_info WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(info);
});

// Update business info
router.put('/:id', (req, res) => {
    const info = db.prepare(`
        SELECT b.* FROM business_info b
        JOIN contacts c ON c.id = b.contact_id
        WHERE b.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!info) {
        return res.status(404).json({ error: 'Business info not found' });
    }

    const { company, title, department, workEmail, workPhone, linkedin, notes, isCurrent, startDate, endDate } = req.body;

    db.prepare(`
        UPDATE business_info
        SET company = ?, title = ?, department = ?, work_email = ?, work_phone = ?,
            linkedin = ?, notes = ?, is_current = ?, start_date = ?, end_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(
        company ?? info.company,
        title ?? info.title,
        department ?? info.department,
        workEmail ?? info.work_email,
        workPhone ?? info.work_phone,
        linkedin ?? info.linkedin,
        notes ?? info.notes,
        isCurrent !== undefined ? (isCurrent ? 1 : 0) : info.is_current,
        startDate ?? info.start_date,
        endDate ?? info.end_date,
        info.id
    );

    const updated = db.prepare('SELECT * FROM business_info WHERE id = ?').get(info.id);
    res.json(updated);
});

// Delete business info
router.delete('/:id', (req, res) => {
    const info = db.prepare(`
        SELECT b.* FROM business_info b
        JOIN contacts c ON c.id = b.contact_id
        WHERE b.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!info) {
        return res.status(404).json({ error: 'Business info not found' });
    }

    db.prepare('DELETE FROM business_info WHERE id = ?').run(info.id);
    res.status(204).send();
});

export default router;
