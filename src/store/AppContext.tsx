import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AppView, User, TrainingDocument, TrainingRule, ChangeLogEntry,
  ApprovalRequest, ChatMessage, AnalysisResult
} from '../types';

interface AppState {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  documents: TrainingDocument[];
  addDocument: (doc: Omit<TrainingDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDocument: (id: string, updates: Partial<TrainingDocument>) => void;
  deleteDocument: (id: string) => void;
  rules: TrainingRule[];
  addRule: (rule: Omit<TrainingRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRule: (id: string, updates: Partial<TrainingRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  changeLog: ChangeLogEntry[];
  addChangeLog: (entry: Omit<ChangeLogEntry, 'id' | 'date'>) => void;
  approvalRequests: ApprovalRequest[];
  addApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'date' | 'status' | 'approvals'>) => void;
  updateApprovalStatus: (id: string, approver: 'departmentManager' | 'purchasingUnit', status: 'onaylandi' | 'reddedildi') => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  aiSummary: string;
  setAiSummary: (summary: string) => void;
}

const USERS: User[] = [
  { id: '1', name: 'Ahmet Yılmaz', role: 'talep-eden', department: 'Pazarlama' },
  { id: '2', name: 'Fatma Demir', role: 'satinalma-uzman', department: 'Satın Alma' },
  { id: '3', name: 'Mehmet Kaya', role: 'satinalma-yonetici', department: 'Satın Alma' },
  { id: '4', name: 'Ayşe Çelik', role: 'bolum-yoneticisi', department: 'Pazarlama' },
];

const INITIAL_DOCUMENTS: TrainingDocument[] = [
  {
    id: 'd1',
    title: 'Genel Satın Alma Politikası',
    content: '1. Tüm satın alma talepleri sistem üzerinden yapılmalıdır.\n2. 500 TL altı talepler otomatik onaylanır.\n3. 500-5000 TL arası bölüm yöneticisi onayı gerekir.\n4. 5000 TL üzeri hem bölüm yöneticisi hem satın alma yöneticisi onayı gerekir.\n5. Acil talepler için hızlandırılmış onay süreci uygulanır.',
    category: 'politika',
    createdBy: 'Mehmet Kaya',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'd2',
    title: 'Kırtasiye Ürün Standartları',
    content: 'Kalem: Günlük kullanım için jenerik tükenmez kalem tercih edilmeli. İmza kalemleri için pilot marka kalın uçlu kalem standart olarak belirlenmiştir. Dolma kalem sadece hediye amaçlı satın alınabilir ve yönetici onayı gerektirir.\n\nKağıt: A4 80gr standart kağıt kullanılmalı. Özel baskılar için 100gr kuşe kağıt talep edilebilir.',
    category: 'urun-standartlari',
    createdBy: 'Fatma Demir',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-10'),
  },
];

const INITIAL_RULES: TrainingRule[] = [
  {
    id: 'r1',
    title: 'Otomatik Onay Eşiği',
    description: '500 TL altındaki talepler ekonomik seçenek seçildiğinde otomatik onaylanır.',
    type: 'onay-esigi',
    active: true,
    createdBy: 'Mehmet Kaya',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'r2',
    title: 'Aylık Bütçe Limiti',
    description: 'Her departman için aylık kırtasiye bütçesi 5.000 TL, teknoloji bütçesi 25.000 TL olarak belirlenmiştir.',
    type: 'butce-limiti',
    active: true,
    createdBy: 'Mehmet Kaya',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'r3',
    title: 'Tercihli Tedarikçi Kuralı',
    description: 'Kırtasiye ürünleri için öncelikle anlaşmalı tedarikçi olan "OfisMax" tercih edilmelidir.',
    type: 'tedarikci-kisiti',
    active: true,
    createdBy: 'Fatma Demir',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

const INITIAL_CHANGELOG: ChangeLogEntry[] = [
  {
    id: 'cl1',
    action: 'eklendi',
    targetType: 'dokuman',
    targetTitle: 'Genel Satın Alma Politikası',
    userName: 'Mehmet Kaya',
    date: new Date('2024-01-15'),
    summary: 'Temel satın alma politikası dokümanı oluşturuldu. Onay eşikleri ve acil talep prosedürü tanımlandı.',
  },
  {
    id: 'cl2',
    action: 'eklendi',
    targetType: 'kural',
    targetTitle: 'Otomatik Onay Eşiği',
    userName: 'Mehmet Kaya',
    date: new Date('2024-01-15'),
    summary: '500 TL altı talepler için otomatik onay kuralı eklendi.',
  },
  {
    id: 'cl3',
    action: 'eklendi',
    targetType: 'dokuman',
    targetTitle: 'Kırtasiye Ürün Standartları',
    userName: 'Fatma Demir',
    date: new Date('2024-02-01'),
    summary: 'Kalem ve kağıt ürün standartları belirlendi. Hediye kalem politikası eklendi.',
  },
  {
    id: 'cl4',
    action: 'guncellendi',
    targetType: 'dokuman',
    targetTitle: 'Kırtasiye Ürün Standartları',
    userName: 'Fatma Demir',
    date: new Date('2024-03-10'),
    summary: 'İmza kalemi standart markası güncellendi, Pilot marka tercih olarak belirlendi.',
  },
];

const AppContext = createContext<AppState | null>(null);

let idCounter = 100;
const genId = () => String(++idCounter);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<AppView>('chatbot');
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]);
  const [documents, setDocuments] = useState<TrainingDocument[]>(INITIAL_DOCUMENTS);
  const [rules, setRules] = useState<TrainingRule[]>(INITIAL_RULES);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>(INITIAL_CHANGELOG);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [aiSummary, setAiSummary] = useState('');

  const addChangeLog = useCallback((entry: Omit<ChangeLogEntry, 'id' | 'date'>) => {
    setChangeLog(prev => [{
      ...entry,
      id: genId(),
      date: new Date(),
    }, ...prev]);
  }, []);

  const addDocument = useCallback((doc: Omit<TrainingDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    setDocuments(prev => [...prev, { ...doc, id: genId(), createdAt: now, updatedAt: now }]);
    addChangeLog({
      action: 'eklendi',
      targetType: 'dokuman',
      targetTitle: doc.title,
      userName: doc.createdBy,
      summary: `"${doc.title}" dokümanı eklendi.`,
    });
  }, [addChangeLog]);

  const updateDocument = useCallback((id: string, updates: Partial<TrainingDocument>) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, ...updates, updatedAt: new Date() };
      addChangeLog({
        action: 'guncellendi',
        targetType: 'dokuman',
        targetTitle: updated.title,
        userName: currentUser.name,
        summary: `"${updated.title}" dokümanı güncellendi.`,
      });
      return updated;
    }));
  }, [addChangeLog, currentUser.name]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => {
      const doc = prev.find(d => d.id === id);
      if (doc) {
        addChangeLog({
          action: 'silindi',
          targetType: 'dokuman',
          targetTitle: doc.title,
          userName: currentUser.name,
          summary: `"${doc.title}" dokümanı silindi.`,
        });
      }
      return prev.filter(d => d.id !== id);
    });
  }, [addChangeLog, currentUser.name]);

  const addRule = useCallback((rule: Omit<TrainingRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    setRules(prev => [...prev, { ...rule, id: genId(), createdAt: now, updatedAt: now }]);
    addChangeLog({
      action: 'eklendi',
      targetType: 'kural',
      targetTitle: rule.title,
      userName: rule.createdBy,
      summary: `"${rule.title}" kuralı eklendi.`,
    });
  }, [addChangeLog]);

  const updateRule = useCallback((id: string, updates: Partial<TrainingRule>) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates, updatedAt: new Date() };
      addChangeLog({
        action: 'guncellendi',
        targetType: 'kural',
        targetTitle: updated.title,
        userName: currentUser.name,
        summary: `"${updated.title}" kuralı güncellendi.`,
      });
      return updated;
    }));
  }, [addChangeLog, currentUser.name]);

  const deleteRule = useCallback((id: string) => {
    setRules(prev => {
      const rule = prev.find(r => r.id === id);
      if (rule) {
        addChangeLog({
          action: 'silindi',
          targetType: 'kural',
          targetTitle: rule.title,
          userName: currentUser.name,
          summary: `"${rule.title}" kuralı silindi.`,
        });
      }
      return prev.filter(r => r.id !== id);
    });
  }, [addChangeLog, currentUser.name]);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newActive = !r.active;
      addChangeLog({
        action: newActive ? 'aktif-edildi' : 'pasif-edildi',
        targetType: 'kural',
        targetTitle: r.title,
        userName: currentUser.name,
        summary: `"${r.title}" kuralı ${newActive ? 'aktif edildi' : 'pasif edildi'}.`,
      });
      return { ...r, active: newActive, updatedAt: new Date() };
    }));
  }, [addChangeLog, currentUser.name]);

  const addApprovalRequest = useCallback((req: Omit<ApprovalRequest, 'id' | 'date' | 'status' | 'approvals'>) => {
    setApprovalRequests(prev => [...prev, {
      ...req,
      id: genId(),
      date: new Date(),
      status: 'bekliyor',
      approvals: {
        departmentManager: 'bekliyor',
        purchasingUnit: 'bekliyor',
      },
    }]);
  }, []);

  const updateApprovalStatus = useCallback((id: string, approver: 'departmentManager' | 'purchasingUnit', status: 'onaylandi' | 'reddedildi') => {
    setApprovalRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      const newApprovals = { ...req.approvals, [approver]: status };
      let newStatus = req.status;
      if (newApprovals.departmentManager === 'reddedildi' || newApprovals.purchasingUnit === 'reddedildi') {
        newStatus = 'reddedildi';
      } else if (newApprovals.departmentManager === 'onaylandi' && newApprovals.purchasingUnit === 'onaylandi') {
        newStatus = 'onaylandi';
      }
      return { ...req, approvals: newApprovals, status: newStatus };
    }));
  }, []);

  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setChatMessages(prev => [...prev, { ...msg, id: genId(), timestamp: new Date() }]);
  }, []);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setCurrentAnalysis(null);
  }, []);

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      currentUser, setCurrentUser,
      users: USERS,
      documents, addDocument, updateDocument, deleteDocument,
      rules, addRule, updateRule, deleteRule, toggleRule,
      changeLog, addChangeLog,
      approvalRequests, addApprovalRequest, updateApprovalStatus,
      chatMessages, addChatMessage, clearChat,
      currentAnalysis, setCurrentAnalysis,
      aiSummary, setAiSummary,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
