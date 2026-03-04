import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Planification from "./pages/Planification";
import Cartographie from "./pages/Cartographie";
import Nomenclature from "./pages/Nomenclature";
import Exports from "./pages/Exports";
import Administration from "./pages/Administration";
import Support from "./pages/Support";
import DesignSystemShowcase from "./pages/DesignSystemShowcase";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/planification" element={<Planification />} />
              <Route path="/cartographie" element={<Cartographie />} />
              <Route path="/nomenclature" element={<Nomenclature />} />
              <Route path="/exports" element={<Exports />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="/support" element={<Support />} />
              <Route path="/design-system" element={<DesignSystemShowcase />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
