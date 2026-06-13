export interface ICreateUser {
  password: string;
  uniqueId: string;
  username: string;
}
export type IStatus =
  | "unverified"
  | "verified"
  | "PENDING"
  | "PENDING_APPROVAL"
  | "APPROVED";

export interface AuthResponse {
  message: string;
  data: AuthData;
}
export interface IDocumentUploadResponse {
  message: string;
  data: IStatus;
}
export interface ILogoResponse {
  message: string;
  data: any;
}

export interface DashboardResponse {
  message: string;
  data: {
    totalRecords: number;
    totalPages: number;
    totalAmount: number;
    totalAmountPaid: number;
    totalOutstandingBalance: number;
    records: unknown[]; // You can replace `any` with a more specific type if records have a defined structure
  };
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: UserModel;
  // Present instead of tokens when the account has 2FA enabled —
  // the client must call POST /auth/login-2fa with { email, otp }.
  requires2FA?: boolean;
  email?: string;
}

export interface UserToken {
  accessToken: string;
  refreshToken: string;
}

export interface TokenDetails {
  token: string;
  expiryTimeInMinutes: number;
}

export interface UserModel {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  avatarPublicId: string | null;
  role: "CUSTOMER" | "ADMIN" | string;
  adminSubRole: string | null;
  authProvider: "EMAIL" | "GOOGLE" | "APPLE" | string;
  googleId: string | null;
  appleId: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  fcmToken: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface UserRole {
  code: string;
  name: string;
  privileges: string[];
}

export interface CorporateBNPLModel {
  companyName: string;
  businessType: string;
  companyEmail: string;
  logo: string;
  phoneNumber: string | null;
  address: string;
  contactName: string;
  contactEmail: string;
  businessCertificateStatus: IStatus;
  tinStatus: IStatus;
  cacStatus: IStatus;
}

export interface ISignup {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface IEmployeeApprovalRequestBody {
  approved: boolean;
  orderId: string[];
}
