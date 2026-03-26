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

async function exportJobs() {
    await AppDataSource.initialize();
    console.log('✅ Connexion DB établie');

    const jobs = await AppDataSource.query(`
        SELECT
            j.id,
            j.title,
            j.slug,
            j.content,
            j.metaDescription,
            j.expirationDate,
            j.hours,
            j.hourType,
            j.gender,
            j.salaryMin,
            j.salaryMax,
            j.salaryType,
            j.experience,
            j.recruitmentNumber,
            j.status,
            j.isFeatured,
            j.isUrgent,
            j.isSharable,
            j.createdAt,
            j.updatedAt,
            -- Company
            co.id           AS company_id,
            co.company_name AS company_name,
            cu.email        AS company_email,
            -- Featured Image (Media)
            m.id            AS media_id,
            m.fileUrl       AS media_fileUrl,
            m.fileType      AS media_fileType,
            m.fileName      AS media_fileName,
            -- Location
            loc.id          AS location_id,
            loc.name        AS location_name,
            -- JobType
            jt.id           AS jobType_id,
            jt.name         AS jobType_name,
            -- Category
            cat.id          AS category_id,
            cat.name        AS category_name,
            cat.slug        AS category_slug
        FROM job j
        LEFT JOIN company co ON co.id = j.companyId
        LEFT JOIN user cu ON cu.id = co.userId
        LEFT JOIN media m ON m.id = j.featuredImageId
        LEFT JOIN location loc ON loc.id = j.locationId
        LEFT JOIN job_type jt ON jt.id = j.jobTypeId
        LEFT JOIN category cat ON cat.id = j.categoryId
        ORDER BY j.createdAt DESC
    `);

    const jobIds = jobs.map((j: any) => j.id);
    let skillsMap: Record<string, any[]> = {};
    let valuesMap: Record<string, any[]> = {};

    if (jobIds.length > 0) {
        const placeholders = jobIds.map(() => '?').join(',');

        const skills = await AppDataSource.query(`
            SELECT js.jobId, s.id, s.name, s.status
            FROM job_skills_skill js
            JOIN skill s ON s.id = js.skillId
            WHERE js.jobId IN (${placeholders})
        `, jobIds);

        for (const s of skills) {
            if (!skillsMap[s.jobId]) skillsMap[s.jobId] = [];
            const { jobId, ...data } = s;
            skillsMap[s.jobId].push(data);
        }

        const values = await AppDataSource.query(`
            SELECT jv.jobId, v.id, v.title, v.status
            FROM job_values_value jv
            JOIN value v ON v.id = jv.valueId
            WHERE jv.jobId IN (${placeholders})
        `, jobIds);

        for (const v of values) {
            if (!valuesMap[v.jobId]) valuesMap[v.jobId] = [];
            const { jobId, ...data } = v;
            valuesMap[v.jobId].push(data);
        }
    }

    const result = jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        slug: j.slug,
        content: j.content,
        metaDescription: j.metaDescription,
        expirationDate: j.expirationDate,
        hours: j.hours,
        hourType: j.hourType,
        gender: j.gender,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryType: j.salaryType,
        experience: j.experience,
        recruitmentNumber: j.recruitmentNumber,
        status: j.status,
        isFeatured: Boolean(j.isFeatured),
        isUrgent: Boolean(j.isUrgent),
        isSharable: Boolean(j.isSharable),
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        company: j.company_id ? {
            id: j.company_id,
            name: j.company_name,
            email: j.company_email,
        } : null,
        featuredImage: j.media_id ? {
            id: j.media_id,
            fileUrl: j.media_fileUrl,
            fileType: j.media_fileType,
            fileName: j.media_fileName,
        } : null,
        location: j.location_id ? { id: j.location_id, name: j.location_name } : null,
        jobType: j.jobType_id ? { id: j.jobType_id, name: j.jobType_name } : null,
        category: j.category_id ? { id: j.category_id, name: j.category_name, slug: j.category_slug } : null,
        skills: skillsMap[j.id] || [],
        values: valuesMap[j.id] || [],
    }));

    const outputDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'jobs.json');
    fs.writeFileSync(outputPath, JSON.stringify({ total: result.length, exportedAt: new Date().toISOString(), jobs: result }, null, 2), 'utf-8');

    console.log(`✅ ${result.length} jobs exportés → ${outputPath}`);
    await AppDataSource.destroy();
}

exportJobs().catch((err) => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
