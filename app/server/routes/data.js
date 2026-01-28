import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Export all user data as JSON
router.get('/export/json', (req, res) => {
    const userId = req.user.id;

    const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ?').all(userId);
    const contactIds = contacts.map(c => c.id);

    let relationships = [];
    let journalEntries = [];
    let businessInfo = [];
    let customFields = [];

    if (contactIds.length > 0) {
        const placeholders = contactIds.map(() => '?').join(',');

        relationships = db.prepare(`
            SELECT * FROM relationships WHERE contact_id IN (${placeholders})
        `).all(...contactIds);

        journalEntries = db.prepare(`
            SELECT * FROM journal_entries WHERE contact_id IN (${placeholders})
        `).all(...contactIds);

        businessInfo = db.prepare(`
            SELECT * FROM business_info WHERE contact_id IN (${placeholders})
        `).all(...contactIds);

        customFields = db.prepare(`
            SELECT * FROM custom_fields WHERE contact_id IN (${placeholders})
        `).all(...contactIds);
    }

    const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        user: {
            email: req.user.email,
            displayName: req.user.display_name
        },
        data: {
            contacts,
            relationships,
            journalEntries,
            businessInfo,
            customFields
        }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="crm-export-${Date.now()}.json"`);
    res.json(exportData);
});

// Export contacts as CSV
router.get('/export/csv', (req, res) => {
    const userId = req.user.id;

    const contacts = db.prepare(`
        SELECT c.*,
            (SELECT GROUP_CONCAT(company, '; ') FROM business_info WHERE contact_id = c.id AND is_current = 1) as current_companies,
            (SELECT GROUP_CONCAT(title, '; ') FROM business_info WHERE contact_id = c.id AND is_current = 1) as current_titles
        FROM contacts c
        WHERE c.user_id = ?
        ORDER BY c.first_name, c.last_name
    `).all(userId);

    // CSV header
    const headers = [
        'First Name', 'Last Name', 'Nickname', 'Email', 'Phone', 'Address',
        'Birthday', 'Notes', 'Current Company', 'Current Title', 'Created At'
    ];

    // Escape CSV values
    const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = contacts.map(c => [
        escapeCSV(c.first_name),
        escapeCSV(c.last_name),
        escapeCSV(c.nickname),
        escapeCSV(c.email),
        escapeCSV(c.phone),
        escapeCSV(c.address),
        escapeCSV(c.birthday),
        escapeCSV(c.notes),
        escapeCSV(c.current_companies),
        escapeCSV(c.current_titles),
        escapeCSV(c.created_at)
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="crm-contacts-${Date.now()}.csv"`);
    res.send(csv);
});

// Import data from JSON
router.post('/import/json', (req, res) => {
    const userId = req.user.id;
    const { data, mode } = req.body; // mode: 'merge' or 'replace'

    if (!data || !data.contacts) {
        return res.status(400).json({ error: 'Invalid import data' });
    }

    try {
        const transaction = db.transaction(() => {
            // If replace mode, delete all existing data
            if (mode === 'replace') {
                const existingContacts = db.prepare('SELECT id FROM contacts WHERE user_id = ?').all(userId);
                const existingIds = existingContacts.map(c => c.id);

                if (existingIds.length > 0) {
                    const placeholders = existingIds.map(() => '?').join(',');
                    db.prepare(`DELETE FROM custom_fields WHERE contact_id IN (${placeholders})`).run(...existingIds);
                    db.prepare(`DELETE FROM business_info WHERE contact_id IN (${placeholders})`).run(...existingIds);
                    db.prepare(`DELETE FROM journal_entries WHERE contact_id IN (${placeholders})`).run(...existingIds);
                    db.prepare(`DELETE FROM relationships WHERE contact_id IN (${placeholders})`).run(...existingIds);
                }
                db.prepare('DELETE FROM contacts WHERE user_id = ?').run(userId);
            }

            // Map old contact IDs to new ones
            const idMap = new Map();

            // Import contacts
            const insertContact = db.prepare(`
                INSERT INTO contacts (user_id, first_name, last_name, nickname, email, phone, address, birthday, notes, avatar_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const contact of data.contacts) {
                const result = insertContact.run(
                    userId,
                    contact.first_name,
                    contact.last_name,
                    contact.nickname,
                    contact.email,
                    contact.phone,
                    contact.address,
                    contact.birthday,
                    contact.notes,
                    contact.avatar_url,
                    contact.created_at || new Date().toISOString(),
                    contact.updated_at || new Date().toISOString()
                );
                idMap.set(contact.id, result.lastInsertRowid);
            }

            // Import relationships
            if (data.relationships) {
                const insertRelationship = db.prepare(`
                    INSERT INTO relationships (contact_id, related_contact_id, relationship_type, category, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                for (const rel of data.relationships) {
                    const newContactId = idMap.get(rel.contact_id);
                    const newRelatedId = idMap.get(rel.related_contact_id);
                    if (newContactId && newRelatedId) {
                        try {
                            insertRelationship.run(
                                newContactId,
                                newRelatedId,
                                rel.relationship_type,
                                rel.category,
                                rel.notes,
                                rel.created_at || new Date().toISOString()
                            );
                        } catch (e) {
                            // Skip duplicate relationships
                        }
                    }
                }
            }

            // Import journal entries
            if (data.journalEntries) {
                const insertJournal = db.prepare(`
                    INSERT INTO journal_entries (contact_id, title, content, date, tags, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);

                for (const entry of data.journalEntries) {
                    const newContactId = idMap.get(entry.contact_id);
                    if (newContactId) {
                        insertJournal.run(
                            newContactId,
                            entry.title,
                            entry.content,
                            entry.date,
                            entry.tags,
                            entry.created_at || new Date().toISOString(),
                            entry.updated_at || new Date().toISOString()
                        );
                    }
                }
            }

            // Import business info
            if (data.businessInfo) {
                const insertBusiness = db.prepare(`
                    INSERT INTO business_info (contact_id, company, title, department, work_email, work_phone, linkedin, notes, is_current, start_date, end_date, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const info of data.businessInfo) {
                    const newContactId = idMap.get(info.contact_id);
                    if (newContactId) {
                        insertBusiness.run(
                            newContactId,
                            info.company,
                            info.title,
                            info.department,
                            info.work_email,
                            info.work_phone,
                            info.linkedin,
                            info.notes,
                            info.is_current,
                            info.start_date,
                            info.end_date,
                            info.created_at || new Date().toISOString(),
                            info.updated_at || new Date().toISOString()
                        );
                    }
                }
            }

            // Import custom fields
            if (data.customFields) {
                const insertField = db.prepare(`
                    INSERT INTO custom_fields (contact_id, field_name, field_value, field_type, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                for (const field of data.customFields) {
                    const newContactId = idMap.get(field.contact_id);
                    if (newContactId) {
                        insertField.run(
                            newContactId,
                            field.field_name,
                            field.field_value,
                            field.field_type,
                            field.created_at || new Date().toISOString(),
                            field.updated_at || new Date().toISOString()
                        );
                    }
                }
            }

            return idMap.size;
        });

        const importedCount = transaction();
        res.json({ success: true, importedContacts: importedCount });
    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: 'Import failed: ' + err.message });
    }
});

// Get data statistics
router.get('/stats', (req, res) => {
    const userId = req.user.id;

    const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE user_id = ?').get(userId).count;

    const contactIds = db.prepare('SELECT id FROM contacts WHERE user_id = ?').all(userId).map(c => c.id);

    let relationshipCount = 0;
    let journalCount = 0;
    let businessCount = 0;

    if (contactIds.length > 0) {
        const placeholders = contactIds.map(() => '?').join(',');
        relationshipCount = db.prepare(`SELECT COUNT(*) as count FROM relationships WHERE contact_id IN (${placeholders})`).get(...contactIds).count;
        journalCount = db.prepare(`SELECT COUNT(*) as count FROM journal_entries WHERE contact_id IN (${placeholders})`).get(...contactIds).count;
        businessCount = db.prepare(`SELECT COUNT(*) as count FROM business_info WHERE contact_id IN (${placeholders})`).get(...contactIds).count;
    }

    res.json({
        contacts: contactCount,
        relationships: relationshipCount,
        journalEntries: journalCount,
        businessRecords: businessCount
    });
});

export default router;
