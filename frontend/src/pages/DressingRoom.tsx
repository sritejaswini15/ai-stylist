import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { 
  ChevronLeft, 
  ChevronRight,
  Heart, 
  Stars, 
  Trash2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

import { ClothingItem, Outfit } from "@/types";
import { getApiUrl } from "@/services/api";

interface LoopSpinRowProps {
  items: (ClothingItem | null)[];
  selectedId: string | null;
  onSelect: (item: ClothingItem | null) => void;
  height: string;
  className?: string;
  imgClassName?: string;
}

/**
 * LoopSpinRow: Refined for absolute button functionality and spacious alignment
 */
const LoopSpinRow = memo(({ items, selectedId, onSelect, height, className, imgClassName }: LoopSpinRowProps) => {
  const displayItems = useMemo(() => [null, ...items], [items]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: "center",
    skipSnaps: false
  });

  const onSelectEmbla = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    const item = displayItems[index];
    if ((item?._id || null) !== (selectedId || null)) {
      onSelect(item);
    }
  }, [emblaApi, displayItems, selectedId, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelectEmbla);
    emblaApi.on("reInit", onSelectEmbla);
    
    const index = displayItems.findIndex((i) => (i?._id || null) === (selectedId || null));
    if (index !== -1 && index !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(index, false);
    }
    
    return () => {
      emblaApi.off("select", onSelectEmbla);
      emblaApi.off("reInit", onSelectEmbla);
    };
  }, [emblaApi, selectedId, displayItems, onSelectEmbla]);

  return (
    <div className={cn("relative w-full group/spin overflow-visible", className)} style={{ height }}>
      {/* Navigation Arrows */}
      <button 
        type="button"
        onClick={() => emblaApi?.scrollPrev()} 
        className="absolute left-[-45px] top-1/2 -translate-y-1/2 z-[100] p-3 text-foreground/20 hover:text-[#D4AF37] transition-all bg-white/60 backdrop-blur-sm rounded-full border border-black/5 active:scale-90 shadow-sm cursor-pointer"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button 
        type="button"
        onClick={() => emblaApi?.scrollNext()} 
        className="absolute right-[-45px] top-1/2 -translate-y-1/2 z-[100] p-3 text-foreground/20 hover:text-[#D4AF37] transition-all bg-white/60 backdrop-blur-sm rounded-full border border-black/5 active:scale-90 shadow-sm cursor-pointer"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      <div className="overflow-hidden h-full w-full" ref={emblaRef}>
        <div className="flex h-full">
          {displayItems.map((item, idx) => (
            <div key={item?._id || `empty-${idx}`} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-0">
              <div className={cn(
                "w-full h-full flex items-center justify-center transition-all duration-500",
                (item?._id === selectedId || (item === null && selectedId === null)) ? "opacity-100 scale-100" : "opacity-20 scale-75 grayscale blur-[1px]"

              )}>
                {item ? (
                  <img src={item.imageUrl} className={cn("max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500", imgClassName)} alt="Clothes" />
                ) : (
                  <div className="w-16 h-16 border border-dashed border-black/10 rounded-full flex items-center justify-center opacity-20">
                    <Plus className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

LoopSpinRow.displayName = "LoopSpinRow";

const DressingRoom = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [bestOutfits, setBestOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTopLayer, setSelectedTopLayer] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClothingItem | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(getApiUrl("/api/users/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.status === "success") {
          setClothes(data.data.user.clothesOwned || []);
          setBestOutfits(data.data.user.bestOutfits || []);
        }
      } catch (error) {
        toast.error("Failed to load wardrobe");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, navigate]);

  const getCategories = (items: ClothingItem[]) => {
    return {
      topLayer: items.filter(c => {
        const cat = (c.category || "").toLowerCase();
        return cat.includes("top") || cat.includes("dress") || cat.includes("other") || cat.includes("accessory");
      }),
      bottoms: items.filter(c => {
        const cat = (c.category || "").toLowerCase();
        return cat.includes("bottom") || cat.includes("pant") || cat.includes("skirt") || cat.includes("jean");
      }),
      shoes: items.filter(c => {
        const cat = (c.category || "").toLowerCase();
        return cat.includes("shoe") || cat.includes("footwear") || cat.includes("boot") || cat.includes("sneaker");
      })
    };
  };

  const categories = getCategories(clothes);

  const getActiveOutfitFromArchive = () => {
    // If nothing is selected, nothing is in archive
    if (!selectedTopLayer && !selectedBottom && !selectedShoes) return null;

    const isDress = (selectedTopLayer?.category || "").toLowerCase().includes("dress");
    const currentTopId = selectedTopLayer?._id || null;
    const currentBottomId = isDress ? null : (selectedBottom?._id || null);
    const currentShoesId = selectedShoes?._id || null;

    return bestOutfits.find(o => {
      const oTopId = isDress ? (o.dressId || null) : (o.topId || null);
      const oBottomId = o.bottomId || null;
      const oShoesId = o.shoesId || null;

      return String(oTopId) === String(currentTopId) && 
             String(oBottomId) === String(currentBottomId) && 
             String(oShoesId) === String(currentShoesId);
    });
  };

  const isOutfitAlreadySaved = () => !!getActiveOutfitFromArchive();

  const handleSaveOutfit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      toast.error("Please sign in first");
      return;
    }

    if (!selectedTopLayer && !selectedBottom && !selectedShoes) {
      toast.error("Spin up an outfit first!");
      return;
    }

    const existingOutfit = getActiveOutfitFromArchive();

    if (existingOutfit) {
      console.log("Removing existing outfit:", existingOutfit._id);
      await handleDeleteOutfit(existingOutfit._id!);
      return;
    }

    try {
      console.log("Saving new outfit...");
      const isDress = (selectedTopLayer?.category || "").toLowerCase().includes("dress");
      const payload = {
        title: `Look ${bestOutfits.length + 1}`,
        topId: !isDress ? (selectedTopLayer?._id || null) : null,
        dressId: isDress ? (selectedTopLayer?._id || null) : null,
        bottomId: !isDress ? (selectedBottom?._id || null) : null,
        shoesId: selectedShoes?._id || null,
      };

      const response = await fetch(getApiUrl("/api/users/best-outfits"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.status === "success") {
        setBestOutfits(data.data.bestOutfits);
        toast.success("Look added to Best Fits!");
      } else {
        throw new Error(data.message || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save outfit");
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/users/best-outfits/${outfitId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setBestOutfits(data.data.bestOutfits);
        toast.success("Look removed from Best Fits");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to remove");
    }
  };

  const loadOutfit = useCallback((outfit: Outfit) => {
    const top = clothes.find(c => c._id === outfit.topId) || clothes.find(c => c._id === outfit.dressId) || null;
    setSelectedTopLayer(top);
    setSelectedBottom(clothes.find(c => c._id === outfit.bottomId) || null);
    setSelectedShoes(clothes.find(c => c._id === outfit.shoesId) || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clothes]);

  const isDressSelected = (selectedTopLayer?.category || "").toLowerCase().includes("dress");

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]"></div></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body overflow-x-hidden">
      <UnifiedHeader title="Studio" />

      <main className="container mx-auto max-w-6xl pt-8 pb-24 relative">
        <div className="relative min-h-[85vh] flex flex-col items-center justify-center py-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full shadow-[0_0_150px_50px_rgba(255,255,255,0.9)] -z-10 blur-3xl opacity-80" />
          
          {/* AESTHETIC FIT BOX */}
          <div className="relative w-full max-w-[650px] bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.03)] border border-black/5 p-16 flex flex-col items-center transition-all duration-700 overflow-visible">
            <div className="absolute top-10 right-10 z-50">
               <button onClick={handleSaveOutfit} className="transition-all active:scale-90">
                 <Heart className={cn("w-8 h-8 transition-all duration-500", isOutfitAlreadySaved() ? "fill-[#FF69B4] text-[#FF69B4]" : "text-muted-foreground/30 hover:text-[#FF69B4]")} />
               </button>
            </div>

            <div className="relative w-full flex flex-col items-center justify-center space-y-[-2rem] overflow-visible">
              {/* ROW 1: TOP LAYER */}
              <LoopSpinRow 
                items={categories.topLayer} 
                selectedId={selectedTopLayer?._id} 
                onSelect={setSelectedTopLayer} 
                height={isDressSelected ? "650px" : "320px"} 
                className="z-40 transition-all duration-700" 
                imgClassName="scale-100" 
              />
              {/* ROW 2: BOTTOMS */}
              <div className={cn("transition-all duration-700 w-full overflow-visible", isDressSelected ? "h-0 opacity-0 pointer-events-none" : "h-[420px] opacity-100 mt-[-4rem]")}>
                <LoopSpinRow 
                  items={categories.bottoms} 
                  selectedId={selectedBottom?._id} 
                  onSelect={setSelectedBottom} 
                  height="420px" 
                  className="z-30" 
                  imgClassName="scale-100" 
                />
              </div>
              {/* ROW 3: FOOTWEAR */}
              <div className="w-full mt-[-3rem]">
                <LoopSpinRow 
                  items={categories.shoes} 
                  selectedId={selectedShoes?._id} 
                  onSelect={setSelectedShoes} 
                  height="160px" 
                  className="z-20" 
                  imgClassName="scale-90" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* BEST FITS */}
        <section className="mt-20 px-8 border-t border-black/5 pt-20 pb-40">
           <div className="flex flex-col items-center mb-16 space-y-3">
             <h2 className="font-display text-6xl font-bold italic text-foreground/90 text-center tracking-tighter">Best Fits</h2>
           </div>
           {bestOutfits.length === 0 ? (
             <div className="text-center py-24 border border-dashed border-black/10 rounded-[4rem] bg-white/20"><Stars className="w-6 h-6 text-[#D4AF37]/30 mx-auto mb-3" /><p className="text-foreground/20 font-body italic text-[10px] tracking-[0.2em] uppercase text-center">Your archive is empty</p></div>
           ) : (
             <div className="columns-2 md:columns-3 lg:columns-4 gap-10 space-y-10">
               {bestOutfits.map((outfit, idx) => {
                 const topItem = clothes.find(c => c._id === outfit.topId) || clothes.find(c => c._id === outfit.dressId);
                 const bottomItem = clothes.find(c => c._id === outfit.bottomId);
                 const shoeItem = clothes.find(c => c._id === outfit.shoesId);
                 return (
                   <div key={outfit._id || idx} className="break-inside-avoid group relative">
                      <div 
                        onClick={() => loadOutfit(outfit)} 
                        className="bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center space-y-[-15%] relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all duration-1000 cursor-pointer border border-black/5"
                      >
                        {/* Pink Heart Toggle in Corner of Saved Card */}
                        <div className="absolute top-8 right-8 z-50">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteOutfit(outfit._id!); }} 
                             className="transition-all active:scale-90"
                           >
                             <Heart className="w-6 h-6 fill-[#FF69B4] text-[#FF69B4]" />
                           </button>
                        </div>

                        <div className="w-full h-32 flex items-center justify-center z-20">{topItem && <img src={topItem.imageUrl} className="max-h-full object-contain mix-blend-multiply drop-shadow-sm" />}</div>
                        {bottomItem && <div className="w-full h-36 flex items-center justify-center z-10"><img src={bottomItem.imageUrl} className="max-h-full object-contain mix-blend-multiply" /></div>}
                        <div className="w-full h-16 flex items-end justify-center z-0 pt-2">{shoeItem && <img src={shoeItem.imageUrl} className="max-h-full object-contain mix-blend-multiply" />}</div>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center backdrop-blur-[1px]"></div>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </section>
      </main>
    </div>
  );
};

export default DressingRoom;

