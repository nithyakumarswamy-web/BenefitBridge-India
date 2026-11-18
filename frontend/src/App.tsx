import { useState, useCallback } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { SchemeDiscoveryPage } from './pages/SchemeDiscoveryPage';
import { SchemeDetailsPage } from './pages/SchemeDetailsPage';
import { ChatPage } from './pages/ChatPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { EligibilityModal } from './components/EligibilityModal';
import { ActionPlanModal } from './components/ActionPlanModal';
import { DocumentChecklistModal } from './components/DocumentChecklistModal';
import { VoiceMicModal } from './components/VoiceMicModal';
import { EligibilityEvaluation } from './types';
import { api } from './services/api';

type PageId = 'home' | 'discover' | 'chat' | 'profile' | 'dashboard' | 'admin' | 'scheme-detail';

function App() {
  // --- Navigation ---
  const [activePage, setActivePage] = useState<PageId>('home');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
  const [discoverCategory, setDiscoverCategory] = useState<string | undefined>();
  const [detailSchemeId, setDetailSchemeId] = useState<number>(0);

  // --- Modal state ---
  const [eligibilityData, setEligibilityData] = useState<EligibilityEvaluation | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);
  const [actionPlanSchemeId, setActionPlanSchemeId] = useState<number | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [eligLoading, setEligLoading] = useState(false);

  // --- Navigators ---
  const handleNavigate = useCallback((page: string, params?: any) => {
    if (page === 'chat') {
      setChatInitialPrompt(params?.initialPrompt || undefined);
    }
    if (page === 'discover') {
      setDiscoverCategory(params?.category || undefined);
    }
    if (page === 'scheme-detail') {
      setDetailSchemeId(params?.schemeId || 0);
    }
    setActivePage(page as PageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- Modal handlers ---
  const handleCheckEligibility = useCallback(async (schemeId: number) => {
    try {
      setEligLoading(true);
      setShowEligibility(true);
      const result = await api.evaluateScheme(schemeId);
      setEligibilityData(result);
    } catch (err) {
      console.error('Eligibility check failed:', err);
      setEligibilityData({
        scheme_id: schemeId,
        scheme_name: 'Scheme',
        overall_status: 'UNKNOWN',
        passed_criteria: [],
        failed_criteria: [],
        unknown_criteria: [],
        missing_fields: ['Unable to reach backend – showing fallback.'],
        summary_explanation: 'Could not evaluate eligibility. The backend may not be running.',
        next_steps: 'Please ensure the backend server is running on port 8000.',
      });
    } finally {
      setEligLoading(false);
    }
  }, []);

  const handleOpenActionPlan = useCallback((schemeId: number) => {
    setActionPlanSchemeId(schemeId);
  }, []);

  const handleOpenDocuments = useCallback(() => {
    setShowDocuments(true);
  }, []);

  const handleOpenVoice = useCallback(() => {
    setShowVoice(true);
  }, []);

  const handleVoiceSubmit = useCallback((text: string) => {
    setShowVoice(false);
    setChatInitialPrompt(text);
    setActivePage('chat');
  }, []);

  // --- Render active page ---
  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenVoice={handleOpenVoice}
          />
        );
      case 'discover':
        return (
          <SchemeDiscoveryPage
            initialCategory={discoverCategory}
            onViewDetails={(id) => handleNavigate('scheme-detail', { schemeId: id })}
            onCheckEligibility={handleCheckEligibility}
            onOpenActionPlan={handleOpenActionPlan}
          />
        );
      case 'scheme-detail':
        return (
          <SchemeDetailsPage
            schemeId={detailSchemeId}
            onBack={() => handleNavigate('discover')}
            onCheckEligibility={handleCheckEligibility}
            onOpenActionPlan={handleOpenActionPlan}
          />
        );
      case 'chat':
        return (
          <ChatPage
            initialPrompt={chatInitialPrompt}
            onOpenVoice={handleOpenVoice}
            onCheckEligibility={handleCheckEligibility}
            onOpenActionPlan={handleOpenActionPlan}
            onOpenDocuments={handleOpenDocuments}
          />
        );
      case 'profile':
        return <ProfileSetupPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onCheckEligibility={handleCheckEligibility}
            onOpenActionPlan={handleOpenActionPlan}
            onOpenDocuments={handleOpenDocuments}
          />
        );
      case 'admin':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} onOpenVoice={handleOpenVoice} />;
    }
  };

  return (
    <LanguageProvider>
      <UserProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          {/* Navbar */}
          <Navbar activePage={activePage} onNavigate={handleNavigate} />

          {/* Page Content */}
          <main className="flex-1">
            {renderPage()}
          </main>

          {/* Footer (hide on chat page for immersion) */}
          {activePage !== 'chat' && <Footer />}

          {/* ===== MODALS ===== */}

          {/* Eligibility Modal */}
          {showEligibility && (
            <EligibilityModal
              evaluation={eligLoading ? null : eligibilityData}
              onClose={() => {
                setShowEligibility(false);
                setEligibilityData(null);
              }}
              onOpenActionPlan={handleOpenActionPlan}
            />
          )}

          {/* Action Plan Modal */}
          {actionPlanSchemeId !== null && (
            <ActionPlanModal
              schemeId={actionPlanSchemeId}
              onClose={() => setActionPlanSchemeId(null)}
              onOpenDocuments={handleOpenDocuments}
            />
          )}

          {/* Document Checklist Modal */}
          {showDocuments && (
            <DocumentChecklistModal onClose={() => setShowDocuments(false)} />
          )}

          {/* Voice Mic Modal */}
          {showVoice && (
            <VoiceMicModal
              onClose={() => setShowVoice(false)}
              onSubmitPrompt={handleVoiceSubmit}
            />
          )}

          {/* Loading overlay for eligibility */}
          {showEligibility && eligLoading && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin" />
                <p className="text-sm font-semibold text-slate-700">Evaluating eligibility criteria...</p>
              </div>
            </div>
          )}
        </div>
      </UserProvider>
    </LanguageProvider>
  );
}

export default App;
