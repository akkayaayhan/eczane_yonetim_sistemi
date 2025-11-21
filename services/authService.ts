
import { User } from '../types';

// Simulated Database Key
const DB_KEY = 'pharma_users_db';
const SESSION_KEY = 'pharma_active_session';

// Helper: Simulate Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Simple Hash (Not for production, just for demo security)
const hashPassword = (password: string) => {
  return btoa(password).split('').reverse().join('');
};

// Initialize DB with Admin if empty
const initDB = () => {
  const db = localStorage.getItem(DB_KEY);
  if (!db) {
    const adminUser = {
      id: 'admin-1',
      name: 'Baş Eczacı',
      email: 'bozansurucu', // İstenilen kullanıcı adı
      passwordHash: hashPassword('Urfa.63'), // İstenilen şifre
      role: 'pharmacist',
      history: [],
      createdAt: Date.now()
    };
    // Anahtar olarak da kullanıcı adını kullanıyoruz
    localStorage.setItem(DB_KEY, JSON.stringify({ [adminUser.email]: adminUser }));
  }
};

// Init on load
initDB();

export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay(800); // Simulate network latency

    const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
    const user = db[email];

    if (!user) {
      throw new Error('Bu kullanıcı adı ile kayıtlı hesap bulunamadı.');
    }

    if (user.passwordHash !== hashPassword(password)) {
      throw new Error('Hatalı şifre girdiniz.');
    }

    // Return user without password info
    const { passwordHash, ...safeUser } = user;
    
    // Save Session
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    
    return safeUser as User;
  },

  // Standart kayıt (Oturum açar)
  async register(email: string, password: string, name: string, role: 'pharmacist' | 'patient'): Promise<User> {
    await delay(1000); // Simulate network latency

    const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');

    if (db[email]) {
      throw new Error('Bu kullanıcı adı/e-posta zaten kullanımda.');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      passwordHash: hashPassword(password),
      role,
      history: [],
      createdAt: Date.now()
    };

    // Save to DB
    db[email] = newUser;
    localStorage.setItem(DB_KEY, JSON.stringify(db));

    // Auto Login logic (Return user)
    const { passwordHash, ...safeUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));

    return safeUser as User;
  },

  // Personel kaydı (Oturum açmaz, sadece veritabanına ekler)
  async registerStaff(adminEmail: string, newStaffEmail: string, password: string, name: string): Promise<void> {
    await delay(800);

    // Admin kontrolü (Basit yetki kontrolü)
    const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
    const admin = db[adminEmail];
    if (!admin || admin.role !== 'pharmacist') {
        throw new Error("Bu işlem için yetkiniz yok.");
    }

    if (db[newStaffEmail]) {
      throw new Error('Bu kullanıcı adı zaten kullanımda.');
    }

    const newStaff = {
      id: `staff-${Date.now()}`,
      email: newStaffEmail,
      name: name,
      passwordHash: hashPassword(password),
      role: 'pharmacist', // Çalışanlar da eczacı yetkisine sahip olur
      history: [],
      createdAt: Date.now(),
      createdBy: adminEmail
    };

    db[newStaffEmail] = newStaff;
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },

  async logout() {
    await delay(300);
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  async updateUserProfile(email: string, data: Partial<User>): Promise<User> {
    await delay(500);
    const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
    
    if (!db[email]) throw new Error("Kullanıcı bulunamadı");

    // Update in DB
    const updatedUserDB = { ...db[email], ...data };
    db[email] = updatedUserDB;
    localStorage.setItem(DB_KEY, JSON.stringify(db));

    // Update in Session
    const { passwordHash, ...safeUser } = updatedUserDB;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));

    return safeUser as User;
  },

  // Tüm personeli listeleme (Sadece demo amaçlı veritabanından çekme)
  async getStaffList(): Promise<User[]> {
    await delay(500);
    const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
    return Object.values(db).filter((u: any) => u.role === 'pharmacist') as User[];
  }
};
