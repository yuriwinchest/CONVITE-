import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import EventDetails from "./pages/EventDetails";
import ConfirmPresence from "./pages/ConfirmPresence";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

import EventPhotos from "./pages/EventPhotos";
import GuestPhotoGallery from "./pages/GuestPhotoGallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/event/:eventId/photos" element={<EventPhotos />} />
          <Route path="/event/:eventId/guest-gallery" element={<GuestPhotoGallery />} />
          <Route path="/confirm" element={<ConfirmPresence />} />
          <Route path="/confirm/:eventId" element={<ConfirmPresence />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
