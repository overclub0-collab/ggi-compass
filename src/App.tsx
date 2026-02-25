import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import ProductListNew from "./pages/ProductListNew";
import ProductDetail from "./pages/ProductDetail";
import InquiryPage from "./pages/InquiryPage";
import DeliveryCases from "./pages/DeliveryCases";
import Catalogs from "./pages/Catalogs";
import SpacePlanner from "./pages/SpacePlanner";
import Admin from "./pages/Admin";
import AdminAuth from "./pages/AdminAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          {/* New SEO-friendly product routes */}
          <Route path="/product/:mainCategory" element={<ProductListNew />} />
          <Route path="/product/:mainCategory/:subCategory" element={<ProductListNew />} />
          <Route path="/product/detail/:productSlug" element={<ProductDetail />} />
          {/* Inquiry page */}
          <Route path="/inquiry" element={<InquiryPage />} />
          {/* Delivery Cases page */}
          <Route path="/delivery-cases" element={<DeliveryCases />} />
          {/* Catalogs page */}
          <Route path="/catalogs" element={<Catalogs />} />
          {/* Space Planner */}
          <Route path="/planner" element={<SpacePlanner />} />
          {/* Legacy routes for backward compatibility */}
          <Route path="/products/category/:categorySlug" element={<ProductListNew />} />
          <Route path="/products/detail/:productId" element={<ProductDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/auth" element={<AdminAuth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
