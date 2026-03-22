import { Check, X, Clock, FileText, User } from 'lucide-react';
import { useApp } from '../store/AppContext';

const TIER_LABELS: Record<string, string> = {
  ekonomik: 'Ekonomik',
  orta: 'Orta Segment',
  premium: 'Premium',
};

const TIER_COLORS: Record<string, string> = {
  ekonomik: '#10b981',
  orta: '#f59e0b',
  premium: '#8b5cf6',
};

const STATUS_CONFIG = {
  bekliyor: { label: 'Bekliyor', color: '#f59e0b', icon: Clock },
  onaylandi: { label: 'Onaylandı', color: '#10b981', icon: Check },
  reddedildi: { label: 'Reddedildi', color: '#ef4444', icon: X },
};

export default function ApprovalCenter() {
  const { approvalRequests, updateApprovalStatus, currentUser } = useApp();

  const canApprove = currentUser.role === 'bolum-yoneticisi' || currentUser.role === 'satinalma-yonetici' || currentUser.role === 'satinalma-uzman';
  const approverKey = currentUser.role === 'bolum-yoneticisi' ? 'departmentManager' : 'purchasingUnit';

  const pending = approvalRequests.filter(r => r.status === 'bekliyor');
  const completed = approvalRequests.filter(r => r.status !== 'bekliyor');

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="approval-container">
      <div className="approval-header">
        <h2><FileText size={22} /> Onay Merkezi</h2>
        <p>Satın alma taleplerinin onay durumlarını takip edin</p>
      </div>

      {approvalRequests.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} />
          <h3>Henüz onay talebi yok</h3>
          <p>Talep Asistanı üzerinden oluşturulan talepler burada görünecek.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="approval-section">
              <h3 className="section-title">Bekleyen Onaylar ({pending.length})</h3>
              <div className="approval-list">
                {pending.map(req => (
                  <div key={req.id} className="approval-card pending">
                    <div className="card-tier-bar" style={{ background: TIER_COLORS[req.selectedTier] }} />
                    <div className="card-body">
                      <div className="card-top">
                        <div>
                          <h4>{req.productName}</h4>
                          <div className="card-meta">
                            <span><User size={14} /> {req.requesterName}</span>
                            <span>{formatDate(req.date)}</span>
                          </div>
                        </div>
                        <span className="tier-badge" style={{ background: TIER_COLORS[req.selectedTier] }}>
                          {TIER_LABELS[req.selectedTier]}
                        </span>
                      </div>

                      {req.justification && (
                        <div className="justification-box">
                          <strong>Gerekçe:</strong> {req.justification}
                        </div>
                      )}

                      <div className="analysis-info">
                        <strong>AI Analizi:</strong> {req.analysis.summary}
                      </div>

                      <div className="approval-chain">
                        {(['departmentManager', 'purchasingUnit'] as const).map(key => {
                          const status = req.approvals[key];
                          const cfg = STATUS_CONFIG[status];
                          const Icon = cfg.icon;
                          const label = key === 'departmentManager' ? 'Bölüm Yöneticisi' : 'Satın Alma Birimi';
                          return (
                            <div key={key} className="approval-step">
                              <div className="step-status" style={{ background: cfg.color }}><Icon size={14} /></div>
                              <div className="step-info">
                                <span className="step-label">{label}</span>
                                <span className="step-status-text" style={{ color: cfg.color }}>{cfg.label}</span>
                              </div>
                              {canApprove && approverKey === key && status === 'bekliyor' && (
                                <div className="step-actions">
                                  <button className="approve-btn" onClick={() => updateApprovalStatus(req.id, key, 'onaylandi')}>
                                    <Check size={14} /> Onayla
                                  </button>
                                  <button className="reject-btn" onClick={() => updateApprovalStatus(req.id, key, 'reddedildi')}>
                                    <X size={14} /> Reddet
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="approval-section">
              <h3 className="section-title">Tamamlanan Talepler ({completed.length})</h3>
              <div className="approval-list">
                {completed.map(req => {
                  const cfg = STATUS_CONFIG[req.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={req.id} className={`approval-card ${req.status}`}>
                      <div className="card-tier-bar" style={{ background: TIER_COLORS[req.selectedTier] }} />
                      <div className="card-body">
                        <div className="card-top">
                          <div>
                            <h4>{req.productName}</h4>
                            <div className="card-meta">
                              <span><User size={14} /> {req.requesterName}</span>
                              <span>{formatDate(req.date)}</span>
                            </div>
                          </div>
                          <span className="final-status" style={{ background: cfg.color }}>
                            <Icon size={14} /> {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
