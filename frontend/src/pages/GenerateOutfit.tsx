import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Heart, 
  Stars, 
  Trash2,
  Plus,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  LayoutGrid,
  CheckCircle2,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UnifiedHeader from "@/components/UnifiedHeader";
import { getApiUrl } from "@/services/api";

interface ClothingItem {
  _id: string;
  imageUrl: string;
  category: string;
  subCategory?: string;
  tags?: string[];
  color?: string;
  style?: string;
}

interface Outfit {
  _id?: string;
  topId: string | null;
  bottomId: string | null;
  shoesId: string | null;
  dressId: string | null;
  title?: string;
}

const PREMIUM_REFERENCES = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529139513075-3a1991adc3f3?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop"
];

const FILTER_CATEGORIES = [
  { id: "01", key: "occasion", label: "OCCASION", subLabel: "Where are you going", options: ["Work", "Casual", "Party", "Wedding", "Date Night", "Brunch", "Travel", "Airport", "Festival", "Formal Event", "Gym", "Lounge"] },
  { id: "02", key: "aesthetic", label: "STYLE AESTHETIC", subLabel: "What’s your fashion identity", options: ["Minimalist", "Classic", "Streetwear", "Old Money", "Y2K", "Chic", "Bohemian", "Korean", "Vintage", "Sporty", "Luxury", "Edgy"] },        
  { id: "03", key: "mood", label: "MOOD", subLabel: "How do you want to feel", options: ["Confident", "Soft", "Bold", "Elegant", "Playful", "Mysterious", "Chill", "Romantic", "Powerful", "Cute"] },
  { id: "04", key: "time", label: "TIME", subLabel: "When will you wear it", options: ["Morning", "Afternoon", "Evening", "Night"] },
  { id: "05", key: "location", label: "LOCATION", subLabel: "Where will you be", options: ["Indoor", "Outdoor", "Beach", "City", "Office", "Resort", "Street", "Home"] },
  { id: "06", key: "weather", label: "WEATHER", subLabel: "What’s the weather like", options: ["Summer", "Winter", "Spring", "Fall", "Rainy", "Snowy", "Humid", "Windy"] },
  { id: "07", key: "specificColor", label: "SPECIFIC COLORS", subLabel: "Choose your primary color", options: ["Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Black", "White", "Brown", "Grey", "Beige"] },
  { id: "08", key: "color", label: "COLOR PALETTE", subLabel: "Pick your colors", options: ["Neutral", "Dark", "Light", "Bold", "Monochrome", "Pastel"] },
];

const GenerateOutfit = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outfitBoxRef = useRef<HTMLDivElement>(null);

  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [inspoBoard, setInspoBoard] = useState<string[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [selectedBoardImg, setSelectedBoardImg] = useState<string | null>(null);

  // Track generated combination history to prevent repeats
  const [generatedHistory, setGeneratedHistory] = useState<string[]>([]);

  const [filters, setFilters] = useState<{ [key: string]: string[] }>({
    occasion: ["none"],
    aesthetic: ["none"],
    mood: ["none"],
    time: ["none"],
    location: ["none"],
    weather: ["none"],
    specificColor: ["none"],
    color: ["none"],
  });

  const [refImageUrl, setRefImageUrl] = useState("");
  const [currentOutfit, setCurrentOutfit] = useState<Outfit | null>(null);
  const [isShoppingDialogOpen, setIsShoppingDialogOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl("/api/users/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.status === "success") {
          const user = data.data.user;
          setClothes(user.clothesOwned || []);
          setInspoBoard(user.fashionInspoBoard || []);
          setSavedOutfits(user.savedGeneratedOutfits || []);
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  const toggleFilter = (key: string, value: string) => {
    setFilters(prev => {
      // Single-select logic: clicking an already selected one stays selected, 
      // clicking 'none' or a different one replaces it.
      if (value === "none") return { ...prev, [key]: ["none"] };
      
      // If it's already selected, clicking it again resets to none 
      // (or you can keep it selected if you prefer strict single choice)
      const isCurrentlySelected = prev[key].includes(value);
      if (isCurrentlySelected) return { ...prev, [key]: ["none"] };
      
      return { ...prev, [key]: [value] };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      occasion: ["none"],
      aesthetic: ["none"],
      mood: ["none"],
      time: ["none"],
      location: ["none"],
      weather: ["none"],
      specificColor: ["none"],
      color: ["none"],
    });
    setRefImageUrl("");
    setGeneratedHistory([]); // Clear history when filters are reset
    toast.success("All filters cleared");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch(getApiUrl("/api/users/generate-outfit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...filters, refImageUrl, excludeHistory: generatedHistory })
      });

      if (response.status === 401) {
        toast.error("Session expired. Please sign in again.");
        navigate("/signin");
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.detail || `Server error: ${response.status}`);
        return;
      }

      const data = await response.json();
      if (data.status === "success") {
        if (data.data.noMatches) {
          setIsShoppingDialogOpen(true);
          return;
        }
        const newOutfit = data.data.outfit;
        setCurrentOutfit(newOutfit);

        // Add to local history
        const comboKey = `${newOutfit.topId}-${newOutfit.bottomId}-${newOutfit.shoesId}-${newOutfit.dressId}`;
        setGeneratedHistory(prev => [...prev, comboKey]);

        toast.success("Outfit generated!");

        // Smooth scroll to the result box
        setTimeout(() => {
          outfitBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        toast.error(data.message || "Failed to generate outfit");
      }
    } catch (error) {
      toast.error("Error generating outfit");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!currentOutfit) return;
    try {
      const response = await fetch(getApiUrl("/api/users/saved-generated-outfits"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...currentOutfit, title: `Generated ${savedOutfits.length + 1}` })
      });
      const data = await response.json();
      if (data.status === "success") {
        setSavedOutfits(data.data.savedGeneratedOutfits);
        toast.success("Outfit saved!");
      }
    } catch (error) {
      toast.error("Failed to save outfit");
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/saved-generated-outfits/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setSavedOutfits(data.data.savedGeneratedOutfits);
        toast.success("Outfit removed");
      }
    } catch (error) {
      toast.error("Failed to remove outfit");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setRefImageUrl(reader.result as string);
      toast.success("Reference image uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const confirmBoardSelection = () => {
    if (selectedBoardImg) {
      setRefImageUrl(selectedBoardImg);
      setIsBoardModalOpen(false);
      toast.success("Reference selected from board!");
    }
  };

  const topItem = clothes.find(c => c._id === currentOutfit?.topId) || clothes.find(c => c._id === currentOutfit?.dressId);  
  const bottomItem = clothes.find(c => c._id === currentOutfit?.bottomId);
  const shoeItem = clothes.find(c => c._id === currentOutfit?.shoesId);
  const isDress = topItem && (topItem.category || "").toLowerCase().includes("dress");

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body overflow-x-hidden">
      <UnifiedHeader title="Dressing Room" />

      <main className="container mx-auto max-w-6xl pt-4 pb-24 relative px-6">

        {/* MAIN WORKSPACE CONTAINER */}
        <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.02)] border border-black/5 flex flex-col overflow-hidden min-h-[800px]">

          {/* FILTERS SECTION */}
          <div className="w-full p-10 md:p-16 relative">
            <div className="flex items-center justify-between mb-12">
              <h2 className="font-display text-2xl font-bold tracking-tight">Curation Filters</h2>
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="rounded-full gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="uppercase text-[10px] font-black tracking-widest">Clear All</span>
              </Button>
            </div>

            <div className="space-y-16">
              {FILTER_CATEGORIES.map((cat) => (
                <div key={cat.key} className="space-y-6">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-sm font-black text-gold/40">{cat.id}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">{cat.label}</span>
                      <span className="text-xs italic text-muted-foreground">{cat.subLabel}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => toggleFilter(cat.key, "none")}
                      className={cn(
                        "px-6 py-2.5 rounded-full border text-[11px] uppercase tracking-widest transition-all duration-500 font-bold",
                        filters[cat.key].includes("none")
                          ? "bg-black text-white border-black shadow-lg scale-105"
                          : "bg-white text-muted-foreground/50 border-black/5 hover:border-gold/30 hover:text-foreground"    
                      )}
                    >
                      None
                    </button>
                    {cat.options.map(opt => {
                      const val = opt.toLowerCase();
                      const isSelected = filters[cat.key].includes(val);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleFilter(cat.key, val)}
                          className={cn(
                            "px-6 py-2.5 rounded-full border text-[11px] uppercase tracking-widest transition-all duration-500 font-bold",
                            isSelected
                              ? "bg-black text-white border-black shadow-lg scale-105"
                              : "bg-white text-muted-foreground border-black/5 hover:border-gold/30 hover:text-foreground"   
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTERED REFERENCE IMAGE SECTION - NOW BELOW FILTERS */}
        <section className="mt-12 flex flex-col items-center">
          <div className="bg-white rounded-[3rem] p-10 shadow-[0_20px_80px_rgba(0,0,0,0.03)] border border-black/5 w-full max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold italic">Style Inspo</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Upload a reference image</p>
            </div>

            <div className="relative group w-full max-w-md mx-auto">
              {!refImageUrl ? (
                <div className="w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-black/10 bg-[#FAF9F6]/50 flex flex-col items-center justify-center space-y-4 hover:border-gold/30 hover:bg-gold/5 transition-all duration-700 cursor-pointer group/box overflow-hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex flex-col items-center justify-center space-y-4 w-full h-full p-8 text-center">    
                        <div className="p-5 rounded-full bg-white shadow-sm group-hover/box:scale-110 transition-transform duration-500">
                          <Upload className="w-8 h-8 text-muted-foreground group-hover/box:text-gold" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Upload Style Ref</p>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-2xl p-2 min-w-[220px] border-black/5 shadow-2xl">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl py-4 cursor-pointer gap-3 font-body">
                        <Upload className="w-4 h-4 text-gold" />
                        <span className="text-xs uppercase font-bold tracking-widest">From Device</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsBoardModalOpen(true)} className="rounded-xl py-4 cursor-pointer gap-3 font-body">
                        <LayoutGrid className="w-4 h-4 text-gold" />
                        <span className="text-xs uppercase font-bold tracking-widest">From Moodboard</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />   
                </div>
              ) : (
                <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-700 border border-black/5 group">
                  <img src={refImageUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/20 rounded-full px-8 uppercase text-[10px] font-black tracking-widest h-10">Change</Button>   
                    <Button onClick={() => setRefImageUrl("")} variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/20 rounded-full px-8 uppercase text-[10px] font-black tracking-widest h-10">Remove</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* GENERATE BUTTON */}
        <div className="mt-12 flex justify-center">
           <Button
             onClick={handleGenerate}
             disabled={generating}
             className="bg-black text-white hover:bg-black/90 rounded-full px-20 py-10 text-2xl gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:shadow-[0_40px_80px_rgba(212,175,55,0.2)] hover:scale-105 active:scale-95 transition-all duration-700 font-display font-bold uppercase tracking-[0.2em] border border-gold/10"
           >
             <Sparkles className={cn("w-8 h-8 text-[#D4AF37]", generating && "animate-spin")} />
             {generating ? "Curating..." : "Generate Look"}
           </Button>
        </div>

        {/* GENERATED OUTFIT DISPLAY */}
        <div className="relative min-h-[85vh] flex flex-col items-center justify-start py-8" ref={outfitBoxRef}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full shadow-[0_0_150px_50px_rgba(255,255,255,0.9)] -z-10 blur-3xl opacity-80" />

          <div className="relative w-full max-w-[650px] bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.03)] border border-black/5 p-16 flex flex-col items-center transition-all duration-1000 overflow-visible">
            {currentOutfit ? (
              <div className="relative w-full flex flex-col items-center justify-center space-y-[-2rem] overflow-visible">
                {/* ROW 1: TOP LAYER / DRESS */}
                <div className={cn("w-full flex items-center justify-center z-30 transition-all duration-1000", isDress ? "h-[600px]" : "h-[320px]")}>
                  {topItem && (
                    <img 
                      src={topItem.imageUrl} 
                      className="max-h-full max-w-full object-contain mix-blend-multiply transition-all duration-1000 scale-100" 
                      alt="Top"
                    />
                  )}
                </div>

                {/* ROW 2: BOTTOMS */}
                {!isDress && (
                  <div className="w-full h-[400px] flex items-center justify-center z-20 mt-[-4rem] transition-all duration-1000">
                    {bottomItem && (
                      <img 
                        src={bottomItem.imageUrl} 
                        className="max-h-full max-w-full object-contain mix-blend-multiply transition-all duration-1000 scale-100" 
                        alt="Bottom"
                      />
                    )}
                  </div>
                )}

                {/* ROW 3: FOOTWEAR */}
                <div className="w-full h-[160px] flex items-center justify-center z-10 mt-[-3rem] transition-all duration-1000">
                  {shoeItem && (
                    <img 
                      src={shoeItem.imageUrl} 
                      className="max-h-full max-w-full object-contain mix-blend-multiply transition-all duration-1000 scale-90" 
                      alt="Shoes"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[500px] space-y-10 opacity-20">
                <Sparkles className="w-20 h-20 text-[#D4AF37]" />
                <div className="text-center space-y-4">
                   <p className="font-display text-2xl uppercase tracking-[0.4em] font-light">Elegance Awaits</p>
                   <p className="font-body text-[10px] italic tracking-[0.2em] uppercase">Configure to curate</p> 
                </div>
              </div>
            )}
          </div>

          {currentOutfit && (
            <div className="mt-16 flex justify-center">
              <Button
                onClick={handleSaveOutfit}
                className="bg-black text-white hover:bg-black/90 rounded-full px-12 py-6 text-sm gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_rgba(212,175,55,0.15)] hover:scale-105 active:scale-95 transition-all duration-500 font-display font-bold uppercase tracking-widest border border-gold/10"
              >
                <Heart className="w-5 h-5 fill-[#FF69B4] text-[#FF69B4]" />
                Save this Look
              </Button>
            </div>
          )}
        </div>

        {/* SAVED FITS SECTION */}
        <section className="mt-40 px-8 border-t border-black/5 pt-32 pb-40">
           <div className="flex flex-col items-center mb-24 space-y-4">
             <h2 className="font-display text-7xl font-bold italic text-foreground/90 text-center tracking-tighter">Archive</h2>
             <p className="text-muted-foreground font-body text-xs uppercase tracking-[0.3em]">Your Curated History</p>      
           </div>

           {savedOutfits.length === 0 ? (
             <div className="text-center py-32 border border-dashed border-black/10 rounded-[5rem] bg-white/20">
               <Stars className="w-10 h-10 text-[#D4AF37]/20 mx-auto mb-6" />
               <p className="text-foreground/20 font-body italic text-[11px] tracking-[0.3em] uppercase text-center">Your archive remains empty</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
               {savedOutfits.map((outfit: Outfit, idx) => {
                 const sTop = clothes.find(c => c._id === outfit.topId) || clothes.find(c => c._id === outfit.dressId);      
                 const sBottom = clothes.find(c => c._id === outfit.bottomId);
                 const sShoes = clothes.find(c => c._id === outfit.shoesId);
                 const sIsDress = sTop && (sTop.category || "").toLowerCase().includes("dress");

                 return (
                   <div key={outfit._id || idx} className="group relative">
                      <div className="bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center space-y-[-10%] relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-2xl transition-all duration-1000 border border-black/5 h-[400px]">
                        <div className="absolute top-8 right-8 z-50">
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <button className="text-muted-foreground/10 hover:text-red-400 transition-colors">
                                 <Trash2 className="w-6 h-6" />
                               </button>
                             </AlertDialogTrigger>
                             <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                               <AlertDialogHeader>
                                 <AlertDialogTitle className="font-display text-2xl font-bold italic">Remove from Archive?</AlertDialogTitle>
                                 <AlertDialogDescription className="font-body text-muted-foreground">
                                   This curated look will be permanently deleted from your fashion history.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter className="mt-6 gap-3">
                                 <AlertDialogCancel className="rounded-full px-8">Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleDeleteSaved(outfit._id!)}
                                   className="bg-red-500 hover:bg-red-600 text-white rounded-full px-8"
                                 >
                                   Delete Forever
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                        </div>

                        <div className="w-full h-32 flex items-center justify-center z-20">
                          {sTop && <img src={sTop.imageUrl} className="max-h-full object-contain mix-blend-multiply" />}     
                        </div>
                        {!sIsDress && sBottom && (
                          <div className="w-full h-36 flex items-center justify-center z-10">
                            <img src={sBottom.imageUrl} className="max-h-full object-contain mix-blend-multiply" />
                          </div>
                        )}
                        <div className="w-full h-20 flex items-end justify-center z-0">
                          {sShoes && <img src={sShoes.imageUrl} className="max-h-full object-contain mix-blend-multiply" />} 
                        </div>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </section>

        {/* REFERENCE BOARD MODAL */}
        <Dialog open={isBoardModalOpen} onOpenChange={setIsBoardModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-[4rem] border-none shadow-2xl p-0 bg-[#FAF9F6]">
            <DialogHeader className="p-12 pb-6 border-b border-black/5 bg-white/50 backdrop-blur-md">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-1">
                  <DialogTitle className="font-display text-4xl font-bold tracking-tight">Reference Board</DialogTitle>      
                  <p className="text-muted-foreground font-body text-xs uppercase tracking-widest">Select an aesthetic guide</p>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-black/5">
                    <X className="w-6 h-6" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="columns-2 md:columns-3 lg:columns-4 gap-8 space-y-8">
                {PREMIUM_REFERENCES.map((url, i) => (
                  <div key={i} onClick={() => setSelectedBoardImg(url)} className={cn("relative cursor-pointer rounded-3xl overflow-hidden break-inside-avoid group transition-all duration-700", selectedBoardImg === url ? "ring-4 ring-gold ring-offset-8 ring-offset-[#FAF9F6] scale-95" : "hover:-translate-y-2 shadow-sm hover:shadow-2xl")}>
                    <img src={url} className="w-full h-auto object-cover" />
                    <div className={cn("absolute inset-0 bg-gold/20 flex items-center justify-center transition-opacity duration-700", selectedBoardImg === url ? "opacity-100" : "opacity-0 group-hover:opacity-40")}>
                      {selectedBoardImg === url && <CheckCircle2 className="w-12 h-12 text-white drop-shadow-2xl" />}        
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 border-t border-black/5 bg-white/50 backdrop-blur-md flex justify-end gap-6">
              <Button variant="ghost" onClick={() => setIsBoardModalOpen(false)} className="rounded-full px-12 h-14 uppercase text-[10px] font-black tracking-widest">Cancel</Button>
              <Button disabled={!selectedBoardImg} onClick={confirmBoardSelection} className="bg-black text-white hover:bg-black/80 rounded-full px-16 h-14 gap-3 shadow-2xl uppercase text-[10px] font-black tracking-widest">Confirm Aesthetic</Button> 
            </div>
          </DialogContent>
        </Dialog>

        {/* SHOPPING SUGGESTION DIALOG */}
        <AlertDialog open={isShoppingDialogOpen} onOpenChange={setIsShoppingDialogOpen}>
          <AlertDialogContent className="rounded-[3rem] border-none shadow-2xl p-12 bg-white max-w-lg">
            <AlertDialogHeader className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center">
                <LayoutGrid className="w-10 h-10 text-gold" />
              </div>
              <AlertDialogTitle className="font-display text-3xl font-bold italic">Expand Your Wardrobe</AlertDialogTitle>   
              <AlertDialogDescription className="font-body text-muted-foreground text-lg">
                We couldn't find a match for those specific filters in your current closet. Ready to discover some new pieces that fit this aesthetic?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-10 flex-col sm:flex-col gap-4">
              <Button
                onClick={() => navigate("/find-outfits")}
                className="w-full bg-black text-white hover:bg-black/90 rounded-full h-16 text-lg font-bold shadow-xl uppercase tracking-widest"
              >
                Go to Find Outfits
              </Button>
              <AlertDialogCancel className="w-full rounded-full h-14 border-black/5 uppercase text-[10px] font-black tracking-widest">
                Maybe Later
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default GenerateOutfit;

