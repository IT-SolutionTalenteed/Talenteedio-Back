import { Company, Referral, Talent, Consultant, User, Job, Article, Contact, CV, LM, Event, Partner, Interview, ACTIVE_STATUS, Ad } from './database/entities';
import { Address } from './database/entities/Address';
import { MODEL } from './database/entities/Category';
import { HrFirstClub } from './database/entities/HrFirstClub';
import { STATUS } from './database/entities/Status';

interface UploadedFile {
    id: string;
    filename: string;
    mimetype: string;
    encoding: string;
    fileUrl: string;
}

export interface LoginUser extends Pick<User, 'email'> {
    password: string;
}

export interface CreateLocationInput {
    name: string;
    status?: STATUS;
    address: Address;
}

export interface UpdateLocationInput {
    id: string;
    name?: string;
    status?: STATUS;
    address?: Address;
}

export interface CreateReferredInput {
    job: Job;
    talentNumber?: string;
    talentEmail: string;
    talentFullName: string;
    jobReferenceLink: string;
}
export interface CreatePermissionInput {
    title: string;
    numberOfJobsPerYear: number;
    numberOfArticlesPerYear: number;
    validityPeriodOfAJob: number;
}

export interface UpdatePermissionInput {
    id: string;
    title?: string;
    numberOfJobsPerYear?: number;
    numberOfArticlesPerYear?: number;
    validityPeriodOfAJob?: number;
}

export interface CreateSkillInput {
    name: string;
    status?: STATUS;
}

export interface UpdateSkillInput {
    id: string;
    name?: string;
    status?: STATUS;
}

export interface CreateValueInput {
    title: string;
    status?: STATUS;
}

export interface UpdateValueInput {
    id: string;
    title?: string;
    status?: STATUS;
}

export interface CreateJobTypeInput extends CreateSkillInput {}

export interface UpdateJobTypeInput extends UpdateSkillInput {}

export interface CreateCategoryInput extends CreateSkillInput {
    slug: string;
    subtitle?: string;
    description?: string;
    image?: string;
    faq?: { question: string; answer: string }[];
    gallery?: string[];
    testimonials?: { avatar: string; fullname: string; job: string; avis: string }[];
    video?: string;
    detailList?: string[];
    model: MODEL;
}

export interface UpdateCategoryInput extends UpdateSkillInput {
    slug?: string;
    subtitle?: string;
    description?: string;
    image?: string;
    faq?: { question: string; answer: string }[];
    gallery?: string[];
    testimonials?: { avatar: string; fullname: string; job: string; avis: string }[];
    video?: string;
    detailList?: string[];
    model?: MODEL;
}

export interface PaginationInput {
    limit: number;
    page: number;
    direction: 'ASC' | 'DESC';
    orderBy: string;
}

export interface FileUpload {
    name: string;
    type: string;
    encoding: string;
    lastModified: Date;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blobParts: any;
    size: number;
}

export interface UpdateMediaInput {
    id: string;
    fileName: string;
}

export interface ChangeArticleStatusInput {
    id: string;
    status: STATUS;
}

export interface DeleteArticleInput {
    id: string;
}

export interface CreateArticleInput extends Partial<Article> {
    title: string;
    content: string;
    company: Company;
}

export interface UpdateArticleInput extends Partial<Article> {
    id: string;
}

export interface ChangePartnerStatusInput {
    id: string;
    status: STATUS;
}

export interface DeletePartnerInput {
    id: string;
}

export interface CreatePartnerInput extends Partial<Partner> {
    title: string;
    content: string;
}

export interface UpdatePartnerInput extends Partial<Partner> {
    id: string;
}

export interface ChangeAdStatusInput {
    id: string;
    status: ACTIVE_STATUS;
}

export interface DeleteAdInput {
    id: string;
}

export interface CreateAdInput extends Partial<Ad> {
    title: string;
    content: string;
}

export interface UpdateAdInput extends Partial<Ad> {
    id: string;
}

export interface ChangeEventStatusInput {
    id: string;
    status: STATUS;
}

export interface DeleteEventInput {
    id: string;
}

export interface CreateEventInput extends Partial<Event> {
    title: string;
    content: string;
}

export interface UpdateInterviewInput extends Partial<Interview> {
    id: string;
}

export interface ChangeInterviewStatusInput {
    id: string;
    status: STATUS;
}

export interface DeleteInterviewInput {
    id: string;
}

export interface CreateInterviewInput extends Partial<Interview> {
    title: string;
    content: string;
}

export interface UpdateEventInput extends Partial<Event> {
    id: string;
}

export interface UserInput extends Omit<User, 'roles' | 'name'> {
    password: string;
    confirmPassword: string;
    role: string;
}

export interface AuthPayload {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    message: string;
}

export interface Payload {
    success: boolean;
    msg?: string;
}

export type Constructor<T> = new () => T;
export type Class<T> = Constructor<T>;
export type RoleName = 'admin' | 'company' | 'referral' | 'talent' | 'consultant' | 'hr-first-club';
export type RoleRegitration = 'talent' | 'referral' | 'consultant' | 'company';
export type RoleModel = Talent | Referral | Consultant;

export interface Resource<T> {
    rows: T[];
    total: number;
    page?: number;
    limit?: number;
}

interface PartialId {
    id: string;
}

export interface JobWithReferralLink extends Job {
    referralLink?: string;
}

export interface JobWithIsApplied extends Job {
    hasApplied?: boolean;
}

export interface CreateJobInput extends Partial<Job> {
    company: PartialId;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
    id: string;
    company?: PartialId;
}

export interface UpdateMultipleJobsInput extends Pick<Job, 'expirationDate'> {
    includedIds?: string[];
    excludedIds?: string[];
}

export interface CreateUserInput extends User {
    role?: string;
}

export interface UpdateUserInput extends Partial<User> {
    id: string;
    role?: string;
    confirmPassword: string;
    oldPassword: string;
}

export interface CreateCompanyInput extends Partial<Company> {
    company_name: string;
    contact: Contact;
    user: UpdateUserInput;
}

export interface UpdateCompanyInput extends Partial<Company> {
    id: string;
}

export interface CreateReferralInput extends Partial<Referral> {
    title: string;
    contact: Contact;
    user: UpdateUserInput;
}

export interface UpdateReferralInput extends Partial<Referral> {
    id: string;
}
export interface UpdateHrFirstClubInput extends Partial<HrFirstClub> {
    id: string;
}

export interface CreateHrFirstClubInput extends Partial<HrFirstClub> {
    companyName: string;
    function: string;
    membershipReason: string;
    contact: Contact;
    user: UpdateUserInput;
}

export interface CreateTalentInput extends Partial<Talent> {
    title: string;
    contact: Contact;
    user: UpdateUserInput;
}

export interface UpdateTalentInput extends Partial<Talent> {
    id: string;
}

export interface CreateConsultantInput extends Partial<Consultant> {
    contact: Contact;
    user: UpdateUserInput;
}

export interface UpdateConsultantInput extends Partial<Consultant> {
    id: string;
}

export interface CreateCVInput extends Omit<CV, 'file'> {}

export interface UploadCVInput extends Pick<CV, 'file' | 'title'> {}

export interface UpdateCVInput extends Partial<CV> {
    id: string;
}

export interface CreateLMInput extends LM {}

export interface UpdateLMInput extends Partial<LM> {
    id: string;
}

export interface CreateTestimonialInput {
    name: string;
    comment: string;
    jobPosition?: string;
    status?: STATUS;
}

export interface UpdateTestimonialInput {
    id: string;
    name?: string;
    comment?: string;
    jobPosition?: string;
    status?: STATUS;
}

export interface JoinUsForm {
    socialReason: string;
    address: string;
    firstName: string;
    lastName: string;
    professionalEmail: string;
    role: string;
    phone: string;
    motivation: string;
    events: Event[];
    otherTopics: string;
}

declare module 'pdf-parse';
declare module 'html-to-text';
