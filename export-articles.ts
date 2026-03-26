import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWD || '',
    database: process.env.DB || 'talenteedio',
    entities: ['src/database/entities/**/*.ts'],
    synchronize: false,
    logging: false,
});

async function exportArticles() {
    await AppDataSource.initialize();
    console.log('✅ Connexion DB établie');

    const articles = await AppDataSource.query(`
        SELECT
            a.id,
            a.title,
            a.slug,
            a.content,
            a.publicContent,
            a.isPremium,
            a.metaDescription,
            a.status,
            a.createdAt,
            -- Admin (via user)
            adm.id        AS admin_id,
            u.firstname   AS admin_firstName,
            u.lastname    AS admin_lastName,
            u.email       AS admin_email,
            -- Company
            co.id           AS company_id,
            co.company_name AS company_name,
            cu.email        AS company_email,
            -- Image (Media)
            m.id          AS media_id,
            m.fileUrl     AS media_fileUrl,
            m.fileType    AS media_fileType,
            m.fileName    AS media_fileName
        FROM article a
        LEFT JOIN admin adm ON adm.id = a.adminId
        LEFT JOIN user u ON u.id = adm.userId
        LEFT JOIN company co ON co.id = a.companyId
        LEFT JOIN user cu ON cu.id = co.userId
        LEFT JOIN media m ON m.id = a.imageId
        ORDER BY a.createdAt DESC
    `);

    // Récupérer les catégories pour chaque article
    const articleIds = articles.map((a: any) => a.id);

    let categoriesMap: Record<string, any[]> = {};

    if (articleIds.length > 0) {
        const placeholders = articleIds.map(() => '?').join(',');
        const categories = await AppDataSource.query(`
            SELECT
                ac.articleId,
                c.id,
                c.name,
                c.slug,
                c.subtitle,
                c.description,
                c.status,
                c.model,
                c.createdAt
            FROM article_categories_category ac
            JOIN category c ON c.id = ac.categoryId
            WHERE ac.articleId IN (${placeholders})
        `, articleIds);

        for (const cat of categories) {
            if (!categoriesMap[cat.articleId]) categoriesMap[cat.articleId] = [];
            const { articleId, ...catData } = cat;
            categoriesMap[cat.articleId].push(catData);
        }
    }

    // Assembler les articles avec leurs relations
    const result = articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        content: a.content,
        publicContent: a.publicContent,
        isPremium: Boolean(a.isPremium),
        metaDescription: a.metaDescription,
        status: a.status,
        createdAt: a.createdAt,
        admin: a.admin_id ? {
            id: a.admin_id,
            firstName: a.admin_firstName,
            lastName: a.admin_lastName,
            email: a.admin_email,
        } : null,
        company: a.company_id ? {
            id: a.company_id,
            name: a.company_name,
            email: a.company_email,
        } : null,
        image: a.media_id ? {
            id: a.media_id,
            fileUrl: a.media_fileUrl,
            fileType: a.media_fileType,
            fileName: a.media_fileName,
        } : null,
        categories: categoriesMap[a.id] || [],
    }));

    // Créer le dossier data s'il n'existe pas
    const outputDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'articles.json');
    fs.writeFileSync(outputPath, JSON.stringify({ total: result.length, exportedAt: new Date().toISOString(), articles: result }, null, 2), 'utf-8');

    console.log(`✅ ${result.length} articles exportés → ${outputPath}`);
    await AppDataSource.destroy();
}

exportArticles().catch((err) => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
