-- Migration manuelle pour créer la table newsletter (MySQL/MariaDB)
-- À utiliser si la migration TypeORM ne fonctionne pas

CREATE TABLE IF NOT EXISTS newsletter (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    htmlMessage TEXT,
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') DEFAULT 'draft',
    recipientTypes TEXT NOT NULL,
    customRecipientEmails TEXT,
    attachments JSON,
    totalRecipients INT DEFAULT 0,
    sentCount INT DEFAULT 0,
    failedCount INT DEFAULT 0,
    scheduledAt TIMESTAMP NULL,
    sentAt TIMESTAMP NULL,
    createdById VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_newsletter_createdBy FOREIGN KEY (createdById) 
        REFERENCES user(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_newsletter_status ON newsletter(status);
CREATE INDEX idx_newsletter_createdAt ON newsletter(createdAt);
CREATE INDEX idx_newsletter_createdById ON newsletter(createdById);
