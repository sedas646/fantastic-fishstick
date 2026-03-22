import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../store/AppContext';
import AnalysisCard from './AnalysisCard';
import type { AnalysisResult } from '../types';

const QUICK_STARTERS = [
  'Kalem almak istiyorum',
  'Laptop lazım',
  'Yazıcı toneri bitti',
  'Ofis koltuğu gerekiyor',
  'Temizlik malzemesi',
  'Kartvizit bastırmak istiyorum',
];

interface ConversationState {
  step: 'initial' | 'purpose' | 'context' | 'budget' | 'analysis';
  product: string;
  purpose: string;
  context: string;
  budget: string;
}

const PURPOSE_OPTIONS: Record<string, string[]> = {
  default: ['Günlük kullanım', 'Proje/iş bazlı', 'Hediye amaçlı', 'Toplu dağıtım', 'Yedek/stok'],
  kalem: ['Günlük yazışma', 'İmza için', 'Hediye amaçlı', 'Toplu dağıtım'],
  laptop: ['Ofis işleri (mail, Excel)', 'Yazılım geliştirme', 'Tasarım/video', 'Sunum/toplantı'],
  yazıcı: ['Siyah-beyaz baskı', 'Renkli baskı', 'Fotoğraf baskısı', 'Yüksek hacimli baskı'],
  koltuk: ['Standart ofis kullanımı', 'Uzun süreli oturma (8+ saat)', 'Toplantı odası', 'Misafir koltuğu'],
};

const CONTEXT_QUESTIONS: Record<string, { question: string; options: string[] }> = {
  'Günlük yazışma': { question: 'Kaç kişi kullanacak?', options: ['Sadece ben', '5-10 kişi', '10+ kişi'] },
  'İmza için': { question: 'Ne tür belgeler imzalanacak?', options: ['İç yazışmalar', 'Resmi belgeler', 'Sözleşmeler'] },
  'Hediye amaçlı': { question: 'Kime hediye edilecek?', options: ['Çalışana', 'Müşteriye', 'Üst düzey yöneticiye'] },
  'Toplu dağıtım': { question: 'Kaç adet gerekiyor?', options: ['10-50 adet', '50-200 adet', '200+ adet'] },
  default: { question: 'Kullanım sıklığı ne olacak?', options: ['Nadiren', 'Haftalık', 'Her gün'] },
};

function getProductKey(product: string): string {
  const lower = product.toLowerCase();
  if (lower.includes('kalem') || lower.includes('dolma')) return 'kalem';
  if (lower.includes('laptop') || lower.includes('bilgisayar')) return 'laptop';
  if (lower.includes('yazıcı') || lower.includes('toner') || lower.includes('printer')) return 'yazıcı';
  if (lower.includes('koltuk') || lower.includes('sandalye')) return 'koltuk';
  return 'default';
}

function generateAnalysis(state: ConversationState): AnalysisResult {
  const key = getProductKey(state.product);

  const analyses: Record<string, () => AnalysisResult> = {
    kalem: () => {
      if (state.purpose === 'Günlük yazışma' || state.purpose === 'Toplu dağıtım') {
        return {
          summary: 'Günlük kullanım için jenerik tükenmez kalem yeterlidir. Dolma kalem gereksiz maliyet oluşturur.',
          category: 'Kırtasiye',
          purpose: state.purpose,
          options: [
            { tier: 'ekonomik', name: 'Jenerik Tükenmez Kalem (12\'li)', description: 'Standart yazım için ideal, toplu alımda avantajlı', priceRange: '₺45-60', savingsPercent: 85, recommended: true },
            { tier: 'orta', name: 'Pilot BPS Tükenmez Kalem', description: 'Ergonomik tutuş, uzun ömürlü mürekkep', priceRange: '₺120-180', savingsPercent: 50, recommended: false },
            { tier: 'premium', name: 'Parker Jotter Tükenmez', description: 'Metal gövde, profesyonel görünüm', priceRange: '₺350-500', savingsPercent: 0, recommended: false },
          ],
          justification: `${state.purpose} amacıyla kullanılacak kalem için fonksiyonel değerlendirme yapıldı. Temel yazım ihtiyacı için ekonomik seçenek önerilmektedir.`,
        };
      }
      if (state.purpose === 'İmza için') {
        return {
          summary: 'İmza kullanımı için kalın uçlu, akıcı mürekkepli bir kalem gereklidir.',
          category: 'Kırtasiye',
          purpose: state.purpose,
          options: [
            { tier: 'ekonomik', name: 'Pentel Sign Pen (Kalın Uç)', description: 'Keçe uçlu, net imza hattı', priceRange: '₺35-50', savingsPercent: 75, recommended: false },
            { tier: 'orta', name: 'Pilot Super Grip (1.0mm)', description: 'Kalın uç, ergonomik tutuş, resmi belgeler için ideal', priceRange: '₺80-120', savingsPercent: 40, recommended: true },
            { tier: 'premium', name: 'Cross Classic Century', description: 'Lüks metal gövde, prestijli görünüm', priceRange: '₺800-1200', savingsPercent: 0, recommended: false },
          ],
          justification: `İmza amaçlı kalem talebi değerlendirildi. ${state.context || 'Resmi belgeler'} için kullanılacağı göz önüne alınarak orta segment kalın uçlu kalem önerilmektedir.`,
        };
      }
      return {
        summary: 'Hediye amaçlı kalem talebi. Alıcının konumuna göre segment belirlenmiştir.',
        category: 'Kırtasiye',
        purpose: state.purpose,
        options: [
          { tier: 'ekonomik', name: 'Parker Jotter (Hediye Kutulu)', description: 'Şık kutu, metal gövde', priceRange: '₺350-500', savingsPercent: 60, recommended: false },
          { tier: 'orta', name: 'Waterman Hemisphere', description: 'Prestijli marka, zarif tasarım', priceRange: '₺800-1200', savingsPercent: 25, recommended: state.context === 'Müşteriye' },
          { tier: 'premium', name: 'Mont Blanc Meisterstück', description: 'Ultra lüks, üst düzey hediye', priceRange: '₺5000-8000', savingsPercent: 0, recommended: state.context === 'Üst düzey yöneticiye' },
        ],
        justification: `Hediye amaçlı kalem talebi. ${state.context || 'Belirtilmemiş'} kişiye verilecek olup buna uygun segment önerilmiştir.`,
      };
    },
    default: () => ({
      summary: `${state.product} talebi analiz edildi. Kullanım amacına göre en uygun seçenekler sunulmaktadır.`,
      category: 'Genel',
      purpose: state.purpose,
      options: [
        { tier: 'ekonomik', name: `Standart ${state.product}`, description: 'Temel ihtiyacı karşılar, maliyet avantajlı', priceRange: '₺---', savingsPercent: 60, recommended: true },
        { tier: 'orta', name: `Orta Segment ${state.product}`, description: 'Kalite-fiyat dengesi, uzun ömürlü', priceRange: '₺---', savingsPercent: 25, recommended: false },
        { tier: 'premium', name: `Premium ${state.product}`, description: 'En yüksek kalite, profesyonel kullanım', priceRange: '₺---', savingsPercent: 0, recommended: false },
      ],
      justification: `${state.product} talebi ${state.purpose} amacıyla değerlendirildi. ${state.budget === 'En düşük maliyet' ? 'Maliyet odaklı' : 'Kalite odaklı'} yaklaşım benimsenmiştir.`,
    }),
  };

  return (analyses[key] || analyses.default)();
}

export default function ChatBot() {
  const { chatMessages, addChatMessage, clearChat, currentAnalysis, setCurrentAnalysis, currentUser } = useApp();
  const [input, setInput] = useState('');
  const [convState, setConvState] = useState<ConversationState>({
    step: 'initial', product: '', purpose: '', context: '', budget: '',
  });
  const [showOptions, setShowOptions] = useState<string[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showOptions]);

  function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    addChatMessage({ role: 'user', content: msg });

    if (convState.step === 'initial') {
      setConvState(prev => ({ ...prev, step: 'purpose', product: msg }));
      const key = getProductKey(msg);
      const options = PURPOSE_OPTIONS[key] || PURPOSE_OPTIONS.default;
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: `"${msg}" talebinizi aldım. Bu ürünü hangi amaçla kullanmayı planlıyorsunuz?`,
        });
        setShowOptions(options);
      }, 500);
    } else if (convState.step === 'purpose') {
      setConvState(prev => ({ ...prev, step: 'context', purpose: msg }));
      setShowOptions([]);
      const ctxInfo = CONTEXT_QUESTIONS[msg] || CONTEXT_QUESTIONS.default;
      setTimeout(() => {
        addChatMessage({ role: 'assistant', content: ctxInfo.question });
        setShowOptions(ctxInfo.options);
      }, 500);
    } else if (convState.step === 'context') {
      setConvState(prev => ({ ...prev, step: 'budget', context: msg }));
      setShowOptions([]);
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: 'Son olarak, bütçe tercihiniz nedir?',
        });
        setShowOptions(['En düşük maliyet', 'Kalite-fiyat dengesi', 'Kalite ön planda']);
      }, 500);
    } else if (convState.step === 'budget') {
      const finalState = { ...convState, step: 'analysis' as const, budget: msg };
      setConvState(finalState);
      setShowOptions([]);
      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: 'Talebinizi analiz ettim. İşte size özel önerilerim:',
        });
        const analysis = generateAnalysis(finalState);
        setCurrentAnalysis(analysis);
      }, 800);
    }
  }

  function handleReset() {
    clearChat();
    setConvState({ step: 'initial', product: '', purpose: '', context: '', budget: '' });
    setShowOptions([]);
  }

  const isComplete = convState.step === 'analysis' && currentAnalysis;

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <Sparkles size={20} />
          <div>
            <h2>İhtiyaç Analiz Asistanı</h2>
            <p>Satın alma talebinizi birlikte değerlendirelim</p>
          </div>
        </div>
        <button className="reset-btn" onClick={handleReset} title="Yeni sohbet">
          <RotateCcw size={18} />
          <span>Yeni Talep</span>
        </button>
      </div>

      <div className="chatbot-messages">
        {chatMessages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon"><Sparkles size={32} /></div>
            <h3>Merhaba {currentUser.name}!</h3>
            <p>Ne satın almak istediğinizi yazın, birlikte en uygun çözümü bulalım.</p>
            <div className="quick-starters">
              {QUICK_STARTERS.map(s => (
                <button key={s} className="starter-chip" onClick={() => handleSend(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map(msg => (
          <div key={msg.id} className={`chat-msg ${msg.role}`}>
            {msg.role === 'assistant' && <div className="msg-avatar"><Sparkles size={16} /></div>}
            <div className="msg-bubble">{msg.content}</div>
          </div>
        ))}

        {showOptions.length > 0 && (
          <div className="chat-options">
            {showOptions.map(opt => (
              <button key={opt} className="option-chip" onClick={() => handleSend(opt)}>{opt}</button>
            ))}
          </div>
        )}

        {isComplete && currentAnalysis && (
          <AnalysisCard analysis={currentAnalysis} requesterName={currentUser.name} />
        )}

        <div ref={messagesEnd} />
      </div>

      {!isComplete && (
        <div className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={convState.step === 'initial' ? 'Ne satın almak istiyorsunuz?' : 'Cevabınızı yazın...'}
          />
          <button className="send-btn" onClick={() => handleSend()} disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
