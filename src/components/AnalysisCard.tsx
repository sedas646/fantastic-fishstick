import { useState } from 'react';
import { Check, Star, AlertTriangle, ArrowRight, Send as SendIcon } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { AnalysisResult, ProductOption } from '../types';

interface Props {
  analysis: AnalysisResult;
  requesterName: string;
}

type Stage = 'selection' | 'justification' | 'submitted';

export default function AnalysisCard({ analysis, requesterName }: Props) {
  const { addApprovalRequest } = useApp();
  const [selectedTier, setSelectedTier] = useState<ProductOption['tier'] | null>(null);
  const [stage, setStage] = useState<Stage>('selection');
  const [justification, setJustification] = useState('');

  const selectedOption = analysis.options.find(o => o.tier === selectedTier);

  function handleSelect(tier: ProductOption['tier']) {
    setSelectedTier(tier);
  }

  function handleProceed() {
    if (!selectedTier || !selectedOption) return;

    const isEconomic = selectedTier === 'ekonomik';
    if (isEconomic) {
      addApprovalRequest({
        requesterName,
        productName: selectedOption.name,
        selectedTier,
        justification: 'Ekonomik seçenek — otomatik onay.',
        analysis,
      });
      setStage('submitted');
    } else {
      setStage('justification');
    }
  }

  function handleSubmitJustification() {
    if (!justification.trim() || !selectedTier || !selectedOption) return;
    addApprovalRequest({
      requesterName,
      productName: selectedOption.name,
      selectedTier,
      justification,
      analysis,
    });
    setStage('submitted');
  }

  const tierColors = {
    ekonomik: '#10b981',
    orta: '#f59e0b',
    premium: '#8b5cf6',
  };

  const tierLabels = {
    ekonomik: 'Ekonomik',
    orta: 'Orta Segment',
    premium: 'Premium',
  };

  if (stage === 'submitted') {
    const isAuto = selectedTier === 'ekonomik';
    return (
      <div className="analysis-card submitted-card">
        <div className="submitted-icon" style={{ background: isAuto ? '#10b981' : '#f59e0b' }}>
          {isAuto ? <Check size={24} /> : <AlertTriangle size={24} />}
        </div>
        <h3>{isAuto ? 'Talep Oluşturuldu' : 'Onaya Gönderildi'}</h3>
        <p>
          {isAuto
            ? `"${selectedOption?.name}" için satın alma talebi otomatik olarak oluşturuldu.`
            : `"${selectedOption?.name}" talebi bölüm yöneticisi ve satın alma birimi onayına gönderildi.`
          }
        </p>
        <div className="submitted-summary">
          <div className="summary-row">
            <span>Ürün</span>
            <strong>{selectedOption?.name}</strong>
          </div>
          <div className="summary-row">
            <span>Segment</span>
            <span className="tier-badge" style={{ background: tierColors[selectedTier!] }}>{tierLabels[selectedTier!]}</span>
          </div>
          <div className="summary-row">
            <span>Durum</span>
            <span className="status-badge" style={{ background: isAuto ? '#10b981' : '#f59e0b' }}>
              {isAuto ? 'Onaylandı' : 'Onay Bekliyor'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'justification') {
    return (
      <div className="analysis-card justification-card">
        <div className="justification-warning">
          <AlertTriangle size={18} />
          <span>Bu seçenek için bölüm yöneticinizin ve satın alma biriminin onayı gerekiyor.</span>
        </div>
        <div className="selected-product-summary">
          <div className="tier-indicator" style={{ background: tierColors[selectedTier!] }} />
          <div>
            <strong>{selectedOption?.name}</strong>
            <span className="price-tag">{selectedOption?.priceRange}</span>
          </div>
        </div>
        <div className="justification-form">
          <label>Neden bu seçeneği tercih ediyorsunuz?</label>
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Kısa bir gerekçe yazınız... (ör: Resmi sözleşme imzaları için profesyonel görünüm gereklidir)"
            rows={3}
          />
          <button
            className="submit-justification-btn"
            onClick={handleSubmitJustification}
            disabled={!justification.trim()}
          >
            <SendIcon size={16} />
            Onaya Gönder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <p>{analysis.summary}</p>
      </div>

      <div className="options-grid">
        {analysis.options.map(opt => (
          <div
            key={opt.tier}
            className={`option-card ${selectedTier === opt.tier ? 'selected' : ''}`}
            onClick={() => handleSelect(opt.tier)}
          >
            <div className="option-tier-bar" style={{ background: tierColors[opt.tier] }} />
            <div className="option-content">
              <div className="option-header">
                <span className="option-tier-label" style={{ color: tierColors[opt.tier] }}>
                  {tierLabels[opt.tier]}
                </span>
                {opt.recommended && (
                  <span className="recommended-badge">
                    <Star size={12} /> ÖNERİLEN
                  </span>
                )}
              </div>
              <h4>{opt.name}</h4>
              <p className="option-desc">{opt.description}</p>
              <div className="option-footer">
                <span className="option-price">{opt.priceRange}</span>
                {opt.savingsPercent > 0 && (
                  <span className="savings-badge">%{opt.savingsPercent} tasarruf</span>
                )}
              </div>
              <div className="option-radio">
                {selectedTier === opt.tier ? <Check size={16} /> : <div className="radio-empty" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTier && (
        <button className="proceed-btn" onClick={handleProceed}>
          {selectedTier === 'ekonomik' ? 'Talebi Oluştur' : 'Devam Et'}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
