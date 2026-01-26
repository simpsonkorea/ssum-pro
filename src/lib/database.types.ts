export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthyear?: string;
  gender?: 'male' | 'female';
  provider: 'local' | 'kakao';
  kakao_id?: string;
  password_hash?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  purpose: 'signup' | 'reset';
  expires_at: string;
  attempts: number;
  verified: boolean;
  verification_token?: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      verification_codes: {
        Row: VerificationCode;
        Insert: Omit<VerificationCode, 'id' | 'created_at'>;
        Update: Partial<Omit<VerificationCode, 'id'>>;
      };
    };
  };
}
