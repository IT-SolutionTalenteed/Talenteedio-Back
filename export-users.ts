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

async function fetchManyToMany(ids: string[], joinTable: string, joinCol: string, targetTable: string, targetCol: string, selectCols: string) {
    if (!ids.length) return {};
    const placeholders = ids.map(() => '?').join(',');
    const rows = await AppDataSource.query(`
        SELECT jt.${joinCol} AS __ownerId, ${selectCols}
        FROM ${joinTable} jt
        JOIN ${targetTable} t ON t.id = jt.${targetCol}
        WHERE jt.${joinCol} IN (${placeholders})
    `, ids);
    const map: Record<string, any[]> = {};
    for (const r of rows) {
        const { __ownerId, ...data } = r;
        if (!map[__ownerId]) map[__ownerId] = [];
        map[__ownerId].push(data);
    }
    return map;
}

// ─── TALENTS ────────────────────────────────────────────────────────────────

async function exportTalents() {
    const talents = await AppDataSource.query(`
        SELECT
            t.id,
            t.title,
            t.gender,
            t.experience,
            t.status,
            t.educationLevel,
            t.tjm,
            t.annualSalary,
            t.mobility,
            t.availabilityDate,
            t.desiredLocation,
            t.workMode,
            t.currentSalary,
            t.skillsText,
            t.languages,
            t.educationText,
            t.desiredSector,
            t.interests,
            t.desiredPosition,
            t.desiredSalary,
            t.availability,
            t.country,
            t.city,
            t.yearsOfExperience,
            t.competences,
            t.address,
            t.postalCode,
            t.formations,
            t.salaryRange,
            t.desiredWorkLocation,
            t.desiredContractType,
            t.desiredCompanyType,
            t.createdAt,
            -- User
            u.id          AS user_id,
            u.email       AS user_email,
            u.password    AS user_password,
            u.firstname   AS user_firstname,
            u.lastname    AS user_lastname,
            u.createdAt   AS user_createdAt,
            -- Category
            cat.id        AS category_id,
            cat.name      AS category_name,
            cat.slug      AS category_slug,
            -- Contact
            con.id        AS contact_id,
            con.email     AS contact_email,
            con.phoneNumber AS contact_phone,
            -- Address
            adr.line      AS address_line,
            adr.postalCode AS address_postalCode,
            adr.city      AS address_city,
            adr.state     AS address_state,
            adr.country   AS address_country,
            -- Consent (Media)
            cm.id         AS consent_id,
            cm.fileUrl    AS consent_fileUrl
        FROM talent t
        LEFT JOIN user u ON u.id = t.userId
        LEFT JOIN category cat ON cat.id = t.categoryId
        LEFT JOIN contact con ON con.id = t.contactId
        LEFT JOIN address adr ON adr.id = con.addressId
        LEFT JOIN media cm ON cm.id = t.consentId
        ORDER BY t.createdAt DESC
    `);

    const ids = talents.map((t: any) => t.id);
    const skillsMap  = await fetchManyToMany(ids, 'talent_skills_skill',  'talentId', 'skill',  'skillId',  't.id, t.name, t.status');
    const valuesMap  = await fetchManyToMany(ids, 'talent_values_value',  'talentId', 'value',  'valueId',  't.id, t.title, t.status');

    // CVs
    let cvsMap: Record<string, any[]> = {};
    if (ids.length) {
        const cvs = await AppDataSource.query(`
            SELECT
                cv.id, cv.title, cv.description, cv.languages, cv.diplomas,
                cv.experiences, cv.skills AS cv_skills, cv.createdAt,
                cv.talentId,
                m.fileUrl AS file_url, m.fileName AS file_name
            FROM cv
            LEFT JOIN media m ON m.id = cv.fileId
            WHERE cv.talentId IN (${ids.map(() => '?').join(',')})
        `, ids);
        for (const cv of cvs) {
            const { talentId, ...data } = cv;
            if (!cvsMap[talentId]) cvsMap[talentId] = [];
            cvsMap[talentId].push(data);
        }
    }

    return talents.map((t: any) => ({
        id: t.id,
        status: t.status,
        title: t.title,
        gender: t.gender,
        experience: t.experience,
        educationLevel: t.educationLevel,
        tjm: t.tjm,
        annualSalary: t.annualSalary,
        mobility: t.mobility,
        availabilityDate: t.availabilityDate,
        desiredLocation: t.desiredLocation,
        workMode: t.workMode,
        currentSalary: t.currentSalary,
        skillsText: t.skillsText,
        languages: t.languages,
        educationText: t.educationText,
        desiredSector: t.desiredSector,
        interests: t.interests,
        desiredPosition: t.desiredPosition,
        desiredSalary: t.desiredSalary,
        availability: t.availability,
        country: t.country,
        city: t.city,
        yearsOfExperience: t.yearsOfExperience,
        competences: t.competences,
        address: t.address,
        postalCode: t.postalCode,
        formations: t.formations,
        salaryRange: t.salaryRange,
        desiredWorkLocation: t.desiredWorkLocation,
        desiredContractType: t.desiredContractType,
        desiredCompanyType: t.desiredCompanyType,
        createdAt: t.createdAt,
        user: t.user_id ? {
            id: t.user_id,
            email: t.user_email,
            password: t.user_password,
            firstname: t.user_firstname,
            lastname: t.user_lastname,
            createdAt: t.user_createdAt,
        } : null,
        category: t.category_id ? { id: t.category_id, name: t.category_name, slug: t.category_slug } : null,
        contact: t.contact_id ? {
            id: t.contact_id,
            email: t.contact_email,
            phone: t.contact_phone,
            address: t.address_line ? {
                line: t.address_line,
                postalCode: t.address_postalCode,
                city: t.address_city,
                state: t.address_state,
                country: t.address_country,
            } : null,
        } : null,
        consent: t.consent_id ? { id: t.consent_id, fileUrl: t.consent_fileUrl } : null,
        skills: skillsMap[t.id] || [],
        values: valuesMap[t.id] || [],
        cvs: cvsMap[t.id] || [],
    }));
}

// ─── COMPANIES ──────────────────────────────────────────────────────────────

async function exportCompanies() {
    const companies = await AppDataSource.query(`
        SELECT
            co.id,
            co.company_name,
            co.status,
            co.slogan,
            co.description,
            co.about,
            co.headquarters,
            co.website,
            co.socialNetworks,
            co.foundedDate,
            co.foundedYear,
            co.employeeCount,
            co.numberOfEmployees,
            co.companySize,
            co.country,
            co.city,
            co.address,
            co.postalCode,
            co.phone,
            co.industry,
            co.sector,
            co.companyDescription,
            co.companyStatus,
            co.profileSought,
            co.positionsToFill,
            co.requiredSkills,
            co.requiredExperience,
            co.contractTypes,
            co.workingHours,
            co.createdAt,
            -- User
            u.id          AS user_id,
            u.email       AS user_email,
            u.password    AS user_password,
            u.firstname   AS user_firstname,
            u.lastname    AS user_lastname,
            u.createdAt   AS user_createdAt,
            -- Logo (Media)
            lg.id         AS logo_id,
            lg.fileUrl    AS logo_fileUrl,
            lg.fileName   AS logo_fileName,
            -- Category
            cat.id        AS category_id,
            cat.name      AS category_name,
            cat.slug      AS category_slug,
            -- Contact
            con.id        AS contact_id,
            con.email     AS contact_email,
            con.phoneNumber AS contact_phone,
            -- Address
            adr.line      AS address_line,
            adr.postalCode AS address_postalCode,
            adr.city      AS address_city,
            adr.state     AS address_state,
            adr.country   AS address_country
        FROM company co
        LEFT JOIN user u ON u.id = co.userId
        LEFT JOIN media lg ON lg.id = co.logoId
        LEFT JOIN category cat ON cat.id = co.categoryId
        LEFT JOIN contact con ON con.id = co.contactId
        LEFT JOIN address adr ON adr.id = con.addressId
        ORDER BY co.createdAt DESC
    `);

    const ids = companies.map((c: any) => c.id);
    const valuesMap = await fetchManyToMany(ids, 'company_values_value', 'companyId', 'value', 'valueId', 't.id, t.title, t.status');

    return companies.map((c: any) => ({
        id: c.id,
        name: c.company_name,
        status: c.status,
        slogan: c.slogan,
        description: c.description,
        about: c.about,
        headquarters: c.headquarters,
        website: c.website,
        socialNetworks: c.socialNetworks,
        foundedDate: c.foundedDate,
        foundedYear: c.foundedYear,
        employeeCount: c.employeeCount,
        numberOfEmployees: c.numberOfEmployees,
        companySize: c.companySize,
        country: c.country,
        city: c.city,
        address: c.address,
        postalCode: c.postalCode,
        phone: c.phone,
        industry: c.industry,
        sector: c.sector,
        companyDescription: c.companyDescription,
        companyStatus: c.companyStatus,
        profileSought: c.profileSought,
        positionsToFill: c.positionsToFill,
        requiredSkills: c.requiredSkills,
        requiredExperience: c.requiredExperience,
        contractTypes: c.contractTypes,
        workingHours: c.workingHours,
        createdAt: c.createdAt,
        user: c.user_id ? {
            id: c.user_id,
            email: c.user_email,
            password: c.user_password,
            firstname: c.user_firstname,
            lastname: c.user_lastname,
            createdAt: c.user_createdAt,
        } : null,
        logo: c.logo_id ? { id: c.logo_id, fileUrl: c.logo_fileUrl, fileName: c.logo_fileName } : null,
        category: c.category_id ? { id: c.category_id, name: c.category_name, slug: c.category_slug } : null,
        contact: c.contact_id ? {
            id: c.contact_id,
            email: c.contact_email,
            phone: c.contact_phone,
            address: c.address_line ? {
                line: c.address_line,
                postalCode: c.address_postalCode,
                city: c.address_city,
                state: c.address_state,
                country: c.address_country,
            } : null,
        } : null,
        values: valuesMap[c.id] || [],
    }));
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
    await AppDataSource.initialize();
    console.log('✅ Connexion DB établie');

    const outputDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const talents = await exportTalents();
    fs.writeFileSync(
        path.join(outputDir, 'talents.json'),
        JSON.stringify({ total: talents.length, exportedAt: new Date().toISOString(), talents }, null, 2),
        'utf-8'
    );
    console.log(`✅ ${talents.length} talents exportés → data/talents.json`);

    const companies = await exportCompanies();
    fs.writeFileSync(
        path.join(outputDir, 'companies.json'),
        JSON.stringify({ total: companies.length, exportedAt: new Date().toISOString(), companies }, null, 2),
        'utf-8'
    );
    console.log(`✅ ${companies.length} companies exportées → data/companies.json`);

    await AppDataSource.destroy();
}

main().catch((err) => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
