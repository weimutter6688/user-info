// Corresponds to backend schemas.SecondaryEmail
export interface SecondaryEmail {
    id: number;
    user_id: number;
    email: string;
    description?: string | null; // Match Pydantic Optional[str] = None
}

// Corresponds to backend schemas.Education
export interface Education {
    id: number;
    user_id: number;
    institution_name: string;
    student_id?: string | null; // Match Pydantic Optional[str] = None
    institution_type?: string | null; // Match Pydantic Optional[str] = None
    // Add other fields like start_date, end_date, degree if they are added to the backend schema
}

// Corresponds to backend schemas.User
export interface User {
    id: number;
    full_name: string;
    birth_date: string; // Dates are often transferred as ISO strings
    address: string;
    high_school?: string | null; // Match Pydantic Optional[str] = None
    primary_email: string;
    secondary_emails: SecondaryEmail[];
    educations: Education[];
    remark1?: string | null; // Added remarks
    remark2?: string | null;
    remark3?: string | null;
}

// Optional: Define types for Create/Update payloads if needed
// export interface UserCreatePayload { ... }
// export interface UserUpdatePayload { ... }
// export interface EducationCreatePayload { ... }
// export interface SecondaryEmailCreatePayload { ... }