import { AppProvider, useApp } from './store/AppContext';
import Layout from './components/Layout';
import ChatBot from './components/ChatBot';
import AdminPanel from './components/AdminPanel';
import ApprovalCenter from './components/ApprovalCenter';
import './App.css';

function AppContent() {
  const { currentView } = useApp();

  return (
    <Layout>
      {currentView === 'chatbot' && <ChatBot />}
      {currentView === 'admin' && <AdminPanel />}
      {currentView === 'approvals' && <ApprovalCenter />}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
