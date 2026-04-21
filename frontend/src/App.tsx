import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Index from "./pages/Index.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import Wardrobe from "./pages/Wardrobe.tsx";
import DressingRoom from "./pages/DressingRoom.tsx";
import AddClothes from "./pages/AddClothes.tsx";
import Wishlist from "./pages/Wishlist.tsx";
import Moodboard from "./pages/Moodboard.tsx";
import AITryOn from "./pages/AITryOn.tsx";
import AIStylist from "./pages/AIStylist.tsx";
import GenerateOutfit from "./pages/GenerateOutfit.tsx";
import FindOutfits from "./pages/FindOutfits.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Sonner position="top-center" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wardrobe" element={<ProtectedRoute><Wardrobe /></ProtectedRoute>} />
        <Route path="/dressing-room" element={<ProtectedRoute><DressingRoom /></ProtectedRoute>} />
        <Route path="/add-clothes" element={<ProtectedRoute><AddClothes /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/moodboard" element={<ProtectedRoute><Moodboard /></ProtectedRoute>} />
        <Route path="/ai-try-on" element={<ProtectedRoute><AITryOn /></ProtectedRoute>} />
        <Route path="/ai-stylist" element={<ProtectedRoute><AIStylist /></ProtectedRoute>} />
        <Route path="/generate-outfit" element={<ProtectedRoute><GenerateOutfit /></ProtectedRoute>} />
        <Route path="/find-outfits" element={<ProtectedRoute><FindOutfits /></ProtectedRoute>} />
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
