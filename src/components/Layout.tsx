import { MessageSquare, Settings, ClipboardCheck, ChevronDown } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useState } from 'react';
import type { AppView } from '../types';

const NAV_ITEMS: { view: AppView; label: string; icon: typeof MessageSquare }[] = [
  { view: 'chatbot', label: 'Talep Asistanı', icon: MessageSquare },
  { view: 'approvals', label: 'Onay Merkezi', icon: ClipboardCheck },
  { view: 'admin', label: 'Yönetim Paneli', icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  'talep-eden': 'Talep Eden',
  'satinalma-uzman': 'Satın Alma Uzmanı',
  'satinalma-yonetici': 'Satın Alma Yöneticisi',
  'bolum-yoneticisi': 'Bölüm Yöneticisi',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, currentUser, setCurrentUser, users } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">P</span>
            <span className="logo-text">ProcureAI</span>
          </div>
          <nav className="main-nav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.view}
                className={`nav-btn ${currentView === item.view ? 'active' : ''}`}
                onClick={() => setCurrentView(item.view)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="header-right">
          <div className="user-menu-wrapper">
            <button className="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="user-avatar">{currentUser.name[0]}</div>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role">{ROLE_LABELS[currentUser.role]}</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-label">Kullanıcı Değiştir</div>
                {users.map(u => (
                  <button
                    key={u.id}
                    className={`dropdown-item ${u.id === currentUser.id ? 'active' : ''}`}
                    onClick={() => { setCurrentUser(u); setUserMenuOpen(false); }}
                  >
                    <div className="dropdown-avatar">{u.name[0]}</div>
                    <div>
                      <div className="dropdown-name">{u.name}</div>
                      <div className="dropdown-role">{ROLE_LABELS[u.role]} — {u.department}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
