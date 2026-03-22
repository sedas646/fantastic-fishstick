import { useState } from 'react';
import {
  FileText, Scale, Clock, Brain, Plus, Trash2, Edit3, X, Check,
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { DocumentCategory, TrainingDocument, TrainingRule } from '../types';

const TABS = [
  { id: 'documents', label: 'Dokümanlar', icon: FileText },
  { id: 'rules', label: 'Kurallar', icon: Scale },
  { id: 'history', label: 'Geçmiş', icon: Clock },
  { id: 'ai-summary', label: 'AI Özeti', icon: Brain },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  politika: 'Politika',
  'tedarikci-kriterleri': 'Tedarikçi Kriterleri',
  'butce-kurallari': 'Bütçe Kuralları',
  'sozlesme-sablonlari': 'Sözleşme Şablonları',
  'urun-standartlari': 'Ürün Standartları',
  'onay-proseduru': 'Onay Prosedürü',
  diger: 'Diğer',
};

const RULE_TYPE_LABELS: Record<string, string> = {
  'onay-esigi': 'Onay Eşiği',
  'butce-limiti': 'Bütçe Limiti',
  'tedarikci-kisiti': 'Tedarikçi Kısıtı',
  'genel-kural': 'Genel Kural',
};

const RULE_TYPE_COLORS: Record<string, string> = {
  'onay-esigi': '#8b5cf6',
  'butce-limiti': '#f59e0b',
  'tedarikci-kisiti': '#3b82f6',
  'genel-kural': '#6b7280',
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  eklendi: { label: 'Eklendi', color: '#10b981' },
  guncellendi: { label: 'Güncellendi', color: '#3b82f6' },
  silindi: { label: 'Silindi', color: '#ef4444' },
  'aktif-edildi': { label: 'Aktif Edildi', color: '#10b981' },
  'pasif-edildi': { label: 'Pasif Edildi', color: '#f59e0b' },
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('documents');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Yönetim Paneli</h2>
        <p>Chatbot eğitim dokümanları ve şirket kurallarını yönetin</p>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'rules' && <RulesTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'ai-summary' && <AISummaryTab />}
      </div>
    </div>
  );
}

function DocumentsTab() {
  const { documents, addDocument, updateDocument, deleteDocument, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ title: '', content: '', category: 'politika' as DocumentCategory });

  function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) return;
    addDocument({ ...form, createdBy: currentUser.name });
    setForm({ title: '', content: '', category: 'politika' });
    setShowForm(false);
  }

  function handleEdit(doc: TrainingDocument) {
    setEditingId(doc.id);
    setForm({ title: doc.title, content: doc.content, category: doc.category });
  }

  function handleUpdate() {
    if (!editingId || !form.title.trim() || !form.content.trim()) return;
    updateDocument(editingId, form);
    setEditingId(null);
    setForm({ title: '', content: '', category: 'politika' });
  }

  function toggleExpanded(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="tab-content">
      <div className="tab-top-bar">
        <span className="doc-count">{documents.length} doküman</span>
        <button className="add-btn" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus size={16} /> Yeni Doküman
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="form-card">
          <h4>{editingId ? 'Dokümanı Düzenle' : 'Yeni Doküman Ekle'}</h4>
          <div className="form-field">
            <label>Başlık</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Doküman başlığı" />
          </div>
          <div className="form-field">
            <label>Kategori</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as DocumentCategory }))}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>İçerik</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Doküman içeriğini girin..." />
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X size={14} /> İptal
            </button>
            <button className="save-btn" onClick={editingId ? handleUpdate : handleAdd}>
              <Check size={14} /> {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      <div className="documents-list">
        {documents.map(doc => (
          <div key={doc.id} className="document-card">
            <div className="doc-card-header" onClick={() => toggleExpanded(doc.id)}>
              {expanded[doc.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div className="doc-info">
                <h4>{doc.title}</h4>
                <div className="doc-meta">
                  <span className="category-badge">{CATEGORY_LABELS[doc.category]}</span>
                  <span>{doc.createdBy} — {formatDate(doc.updatedAt)}</span>
                </div>
              </div>
              <div className="doc-actions">
                <button className="icon-btn" onClick={e => { e.stopPropagation(); handleEdit(doc); }}><Edit3 size={14} /></button>
                <button className="icon-btn danger" onClick={e => { e.stopPropagation(); deleteDocument(doc.id); }}><Trash2 size={14} /></button>
              </div>
            </div>
            {expanded[doc.id] && (
              <div className="doc-card-body">
                <pre>{doc.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesTab() {
  const { rules, addRule, deleteRule, toggleRule, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'genel-kural' as TrainingRule['type'], active: true });

  function handleAdd() {
    if (!form.title.trim() || !form.description.trim()) return;
    addRule({ ...form, createdBy: currentUser.name });
    setForm({ title: '', description: '', type: 'genel-kural', active: true });
    setShowForm(false);
  }

  return (
    <div className="tab-content">
      <div className="tab-top-bar">
        <span className="doc-count">{rules.length} kural ({rules.filter(r => r.active).length} aktif)</span>
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Yeni Kural
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h4>Yeni Kural Ekle</h4>
          <div className="form-field">
            <label>Başlık</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Kural başlığı" />
          </div>
          <div className="form-field">
            <label>Tip</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TrainingRule['type'] }))}>
              {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Açıklama</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Kural açıklamasını girin..." />
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowForm(false)}><X size={14} /> İptal</button>
            <button className="save-btn" onClick={handleAdd}><Check size={14} /> Kaydet</button>
          </div>
        </div>
      )}

      <div className="rules-list">
        {rules.map(rule => (
          <div key={rule.id} className={`rule-card ${rule.active ? '' : 'inactive'}`}>
            <div className="rule-type-bar" style={{ background: RULE_TYPE_COLORS[rule.type] }} />
            <div className="rule-content">
              <div className="rule-header">
                <div>
                  <span className="rule-type-badge" style={{ color: RULE_TYPE_COLORS[rule.type] }}>
                    {RULE_TYPE_LABELS[rule.type]}
                  </span>
                  <h4>{rule.title}</h4>
                </div>
                <div className="rule-actions">
                  <button className="toggle-btn" onClick={() => toggleRule(rule.id)}>
                    {rule.active ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#9ca3af" />}
                  </button>
                  <button className="icon-btn danger" onClick={() => deleteRule(rule.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="rule-desc">{rule.description}</p>
              <span className="rule-meta">{rule.createdBy} — {new Date(rule.updatedAt).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab() {
  const { changeLog } = useApp();

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const TARGET_ICONS: Record<string, typeof FileText> = {
    dokuman: FileText,
    kural: Scale,
    'ai-ozeti': Brain,
  };

  return (
    <div className="tab-content">
      <h3 className="history-title">Değişiklik Geçmişi</h3>
      <div className="timeline">
        {changeLog.map(entry => {
          const actionCfg = ACTION_LABELS[entry.action];
          const Icon = TARGET_ICONS[entry.targetType] || FileText;
          return (
            <div key={entry.id} className="timeline-item">
              <div className="timeline-dot" style={{ background: actionCfg.color }}>
                <Icon size={12} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="action-badge" style={{ background: actionCfg.color }}>
                    {actionCfg.label}
                  </span>
                  <span className="timeline-target">{entry.targetTitle}</span>
                </div>
                <p className="timeline-summary">{entry.summary}</p>
                <div className="timeline-meta">
                  <span className="timeline-user">{entry.userName}</span>
                  <span className="timeline-date">{formatDate(entry.date)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AISummaryTab() {
  const { documents, rules, aiSummary, setAiSummary, addChangeLog, currentUser } = useApp();
  const [generating, setGenerating] = useState(false);

  function generateSummary() {
    setGenerating(true);

    const activeDocs = documents.map(d => `[${CATEGORY_LABELS[d.category]}] ${d.title}: ${d.content}`).join('\n\n');
    const activeRules = rules.filter(r => r.active).map(r => `[${RULE_TYPE_LABELS[r.type]}] ${r.title}: ${r.description}`).join('\n');

    setTimeout(() => {
      const summary = `SİSTEM TALİMATI — ProcureAI Satın Alma Asistanı
Güncelleme: ${new Date().toLocaleDateString('tr-TR')} | Güncelleyen: ${currentUser.name}

DOKÜMAN ÖZETİ (${documents.length} doküman):
${activeDocs}

AKTİF KURALLAR (${rules.filter(r => r.active).length} kural):
${activeRules}

DAVRANIŞ KURALLARI:
1. Her talep için önce ihtiyaç analizi yap — istek mi, gerçek ihtiyaç mı belirle.
2. Ekonomik seçeneği her zaman sun. Daha pahalı seçenekler için gerekçe iste.
3. Onay eşiklerini kontrol et ve uygun onay zincirini başlat.
4. Tercihli tedarikçileri öncelikle öner.
5. Aylık bütçe limitlerini takip et, limit aşımı riski varsa uyar.`;

      setAiSummary(summary);
      setGenerating(false);
      addChangeLog({
        action: 'guncellendi',
        targetType: 'ai-ozeti',
        targetTitle: 'AI Sistem Özeti',
        userName: currentUser.name,
        summary: `AI sistem özeti güncellendi. ${documents.length} doküman ve ${rules.filter(r => r.active).length} aktif kural işlendi.`,
      });
    }, 1500);
  }

  return (
    <div className="tab-content">
      <div className="ai-summary-header">
        <div>
          <h3>AI Sistem Talimatı</h3>
          <p>Tüm doküman ve kurallardan otomatik üretilen chatbot eğitim özeti</p>
        </div>
        <button className="generate-btn" onClick={generateSummary} disabled={generating}>
          <Brain size={16} />
          {generating ? 'Üretiliyor...' : 'AI\'ı Güncelle'}
        </button>
      </div>

      {generating && (
        <div className="generating-indicator">
          <div className="spinner" />
          <span>Dokümanlar ve kurallar analiz ediliyor...</span>
        </div>
      )}

      {aiSummary ? (
        <div className="ai-summary-box">
          <pre>{aiSummary}</pre>
        </div>
      ) : (
        <div className="empty-state small">
          <Brain size={32} />
          <p>Henüz AI özeti üretilmedi. "AI'ı Güncelle" butonuna tıklayarak mevcut doküman ve kurallardan sistem talimatı oluşturun.</p>
        </div>
      )}
    </div>
  );
}
