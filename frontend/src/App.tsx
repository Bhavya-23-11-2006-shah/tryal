import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { AccessibilityPanel } from './components/AccessibilityPanel.tsx';
import { JudgeModePanel } from './components/JudgeModePanel.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { SearchResultsPage } from './pages/SearchResultsPage.tsx';
import { BusDetailPage } from './pages/BusDetailPage.tsx';
import { AssistanceDetailsPage } from './pages/AssistanceDetailsPage.tsx';
import { ReviewConfirmPage } from './pages/ReviewConfirmPage.tsx';
import { TicketPage } from './pages/TicketPage.tsx';
import { LiveTrackingPage } from './pages/LiveTrackingPage.tsx';
import { MyTripsPage } from './pages/MyTripsPage.tsx';
import { ConductorPage } from './pages/ConductorPage.tsx';
import { DepotPage } from './pages/DepotPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';
import { SosPage } from './pages/SosPage.tsx';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background text-text">
        <Navbar />

        {/* Accessibility Floating Panel & Judge Mode Panel */}
        <AccessibilityPanel />
        <JudgeModePanel />

        {/* Main Application Landmark */}
        <main id="main-content" className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/bus/:tripId" element={<BusDetailPage />} />
            <Route path="/assistance/:tripId" element={<AssistanceDetailsPage />} />
            <Route path="/review" element={<ReviewConfirmPage />} />
            <Route path="/ticket/:bookingId" element={<TicketPage />} />
            <Route path="/track/:tripId" element={<LiveTrackingPage />} />
            <Route path="/trips" element={<MyTripsPage />} />
            <Route path="/conductor" element={<ConductorPage />} />
            <Route path="/depot" element={<DepotPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/sos" element={<SosPage />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
};
