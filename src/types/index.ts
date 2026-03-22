export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ProductOption {
  tier: 'ekonomik' | 'orta' | 'premium';
  name: string;
  description: string;
  priceRange: string;
  savingsPercent: number;
  recommended: boolean;
}

export interface AnalysisResult {
  summary: string;
  category: string;
  purpose: string;
  options: ProductOption[];
  justification: string;
}

export interface ApprovalRequest {
  id: string;
  requesterName: string;
  date: Date;
  productName: string;
  selectedTier: 'ekonomik' | 'orta' | 'premium';
  justification: string;
  analysis: AnalysisResult;
  status: 'bekliyor' | 'onaylandi' | 'reddedildi';
  approvals: {
    departmentManager: 'bekliyor' | 'onaylandi' | 'reddedildi';
    purchasingUnit: 'bekliyor' | 'onaylandi' | 'reddedildi';
  };
}

export interface TrainingDocument {
  id: string;
  title: string;
  content: string;
  category: DocumentCategory;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentCategory =
  | 'politika'
  | 'tedarikci-kriterleri'
  | 'butce-kurallari'
  | 'sozlesme-sablonlari'
  | 'urun-standartlari'
  | 'onay-proseduru'
  | 'diger';

export interface TrainingRule {
  id: string;
  title: string;
  description: string;
  type: 'onay-esigi' | 'butce-limiti' | 'tedarikci-kisiti' | 'genel-kural';
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangeLogEntry {
  id: string;
  action: 'eklendi' | 'guncellendi' | 'silindi' | 'aktif-edildi' | 'pasif-edildi';
  targetType: 'dokuman' | 'kural' | 'ai-ozeti';
  targetTitle: string;
  userName: string;
  date: Date;
  summary: string;
}

export type UserRole = 'talep-eden' | 'satinalma-uzman' | 'satinalma-yonetici' | 'bolum-yoneticisi';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
}

export type AppView = 'chatbot' | 'admin' | 'approvals';
