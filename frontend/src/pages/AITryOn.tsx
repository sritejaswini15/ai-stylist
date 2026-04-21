import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Loader2, Sparkles, Check, User as UserIcon, Shirt, ShoppingBag, Plus, RefreshCcw, Camera, Heart, ChevronLeft, ChevronRight, Ruler, Scan, Archive, AlertCircle, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UnifiedHeader from "@/components/UnifiedHeader";
import { useNavigate } from "react-router-dom";
import { getMe } from "@/services/user";
import { getWardrobe } from "@/services/clothing";
import { performTryOn } from "@/services/tryon";
import { UserProfile, ClothingItem } from "@/types";

interface Clothing {
  id: number;
  _id?: string;
  category: string;
  image_base64: string; 
  imageUrl?: string;
}

const AITryOn = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mannequin, setMannequin] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveCategory] = useState("Closet"); 
  
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  
  const mannequinFileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [userData, wardrobeData] = await Promise.all([
        getMe(token),
        getWardrobe(token)
      ]);

      if (userData.status === "success") {
        setUser(userData.data.user as UserProfile);
      }

      const clothes = (Array.isArray(wardrobeData) ? wardrobeData : (wardrobeData.data?.clothes || [])) as ClothingItem[];
      // Filter to only include Tops for the Studio
      const topKeywords = ["top", "shirt", "blouse", "hoodie", "sweater", "jacket", "coat", "tank", "tee", "outerwear", "cardigan"];
      const onlyTops = clothes.filter(item => {
        const cat = (item.category || "").toLowerCase();
        return topKeywords.some(kw => cat.includes(kw));
      });
      setWardrobe(onlyTops);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to sync studio");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchData();
  }, [token, navigate, fetchData]);

  const handleMannequinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setMannequin(reader.result as string);
      setResultImage(null);
      setSelectedTop(null);
      setIsProcessing(false);
      toast.success("Ready for Try-On");
    };
    reader.readAsDataURL(file);
  };

  const selectItem = async (item: Clothing) => {
    if (!mannequin) {
      toast.error("Please upload your photo first.");
      return;
    }

    const itemId = item.id || item._id;
    const isCurrentlySelected = selectedTop && (selectedTop.id === itemId || selectedTop._id === itemId);

    if (isCurrentlySelected) {
      setSelectedTop(null);
      setResultImage(null);
      return;
    }

    // Replace previous selection
    setSelectedTop(item as unknown as ClothingItem);

    setIsProcessing(true);
    try {
      const garmentImg = item.image_base64 || item.imageUrl;
      const res = await performTryOn(mannequin, garmentImg!, `top ${item.id}`);
      if (res.status === "success") {
        setResultImage(res.image_url);
        toast.success("Synthesis complete!");
      }
    } catch (error) {
      console.error("Try-on error:", error);
      toast.error("AI is busy. Please try again in a moment.");
      setResultImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = activeTab === "Closet" 
    ? wardrobe 
    : (user?.wishlist || []).filter(item => {
        const cat = (item.category || "").toLowerCase();
        const title = (item.title || "").toLowerCase();
        const topKeywords = ["top", "shirt", "blouse", "hoodie", "sweater", "jacket", "coat", "tank", "tee", "outerwear", "cardigan"];
        return topKeywords.some(kw => cat.includes(kw) || title.includes(kw));
      });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body flex flex-col overflow-hidden">
      <UnifiedHeader title="Try-On Studio" />
      
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full px-6 gap-12 py-12 items-center justify-center">
        
        {/* LEFT: THE PHOTO AREA */}
        <div className="flex-1 w-full max-w-lg flex flex-col items-center">
           <div className="relative w-full aspect-[3/4.2] bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-white overflow-hidden flex flex-col group">
              {!mannequin ? (
                <div onClick={() => mannequinFileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center space-y-6 cursor-pointer hover:bg-gold/5 transition-all">
                   <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Camera className="w-10 h-10 text-gold/50" />
                   </div>
                   <div className="text-center space-y-2 px-8">
                     <h3 className="font-display text-3xl font-bold italic">Upload Your Photo</h3>
                     <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground leading-loose">Choose a clear photo<br/>for the best AI synthesis</p>
                   </div>
                </div>
              ) : (
                <div className="relative flex-1 bg-[#F4F3F0]">
                   <img src={resultImage || mannequin} className={cn("absolute inset-0 w-full h-full object-contain transition-all duration-700", isProcessing ? "opacity-40 blur-md" : "opacity-100")} alt="Try On" />
                   
                   {isProcessing && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm z-20">
                        <Loader2 className="w-16 h-12 text-gold animate-spin" />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.5em] text-gold">Synthesizing...</p>
                     </div>
                   )}

                   <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer group/overlay z-10" onClick={() => mannequinFileInputRef.current?.click()}>
                      <Camera className="w-12 h-12 text-white mb-4" />
                      <p className="text-white font-display text-xl font-bold">Change Photo</p>
                   </div>

                   <div className="absolute top-8 right-8 flex flex-col gap-3 z-30">
                      <Button variant="ghost" size="icon" onClick={() => {setMannequin(null); setResultImage(null); setSelectedTop(null);}} className="w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-xl hover:bg-white text-red-400">
                        <X className="w-5 h-5" />
                      </Button>
                   </div>
                </div>
              )}
              <input type="file" ref={mannequinFileInputRef} className="hidden" accept="image/*" onChange={handleMannequinUpload} />
           </div>

           {mannequin && (
             <div className="mt-8 px-8 py-3 rounded-full bg-white/50 border border-black/5 shadow-sm">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Studio Mode: <span className="text-gold uppercase">Tops Only</span></p>
             </div>
           )}
        </div>

        {/* RIGHT: THE CLOSET PANEL */}
        <div className="flex-1 w-full max-w-lg bg-white rounded-[3.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.04)] border border-black/5 flex flex-col p-10 h-[720px] my-auto">
           <div className="flex items-center justify-between mb-8 shrink-0">
              <h2 className="font-display text-4xl font-bold">Try on</h2>
              <div className="flex bg-secondary/30 p-1.5 rounded-full">
                 <button onClick={() => setActiveCategory("Closet")} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "Closet" ? "bg-white text-black shadow-lg" : "text-muted-foreground")}>Owned</button>
                 <button onClick={() => setActiveCategory("Wishlist")} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", activeTab === "Wishlist" ? "bg-white text-black shadow-lg" : "text-muted-foreground")}>Inspo</button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
              {filteredItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                   <Shirt size={48} className="text-muted-foreground" />
                   <p className="font-display text-xl font-bold">No Tops Found</p>
                   <p className="text-[10px] uppercase tracking-widest leading-loose">Add some tops to your wishlist<br/>to try them on in the studio</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                   {filteredItems.map((item) => {
                     const it = item as (ClothingItem & { image_base64?: string }) & WishlistItem;
                     const itemId = it.id || it._id;
                     const rawImg = it.image_base64 || it.imageUrl;
                     const imageUrl = rawImg?.startsWith('http') || rawImg?.startsWith('data:') 
                        ? rawImg 
                        : `data:image/png;base64,${rawImg}`;

                     const isSelected = !!itemId && selectedTop && (selectedTop.id === itemId || selectedTop._id === itemId);

                     return (
                       <div 
                        key={itemId || Math.random()} 
                        onClick={() => selectItem(item as unknown as Clothing)}
                        className={cn(
                          "aspect-[3/4] rounded-[2.5rem] bg-secondary/5 border-2 transition-all cursor-pointer overflow-hidden p-5 flex items-center justify-center relative group",
                          isSelected 
                            ? "border-gold bg-gold/5 shadow-inner scale-[0.98]" 
                            : "border-transparent hover:border-gold/20 hover:bg-white"
                        )}
                       >
                          <img src={imageUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" alt="Item" />
                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-gold text-white rounded-full p-1.5 shadow-2xl animate-in zoom-in">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
              )}
           </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default AITryOn;
