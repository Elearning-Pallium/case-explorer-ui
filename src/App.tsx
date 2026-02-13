import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import LandingPage from "./pages/LandingPage";
import CaseSelectionPage from "./pages/CaseSelectionPage";
import CaseFlowPage from "./pages/CaseFlowPage";
import CompletionPage from "./pages/CompletionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/level/:levelId" element={<CaseSelectionPage />} />
            <Route path="/case/:caseId" element={<CaseFlowPage />} />
            <Route path="/completion/:caseId" element={<CompletionPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
