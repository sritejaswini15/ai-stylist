import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Search, 
  ArrowUpDown, 
  Filter,
  ShoppingCart,
  Heart,
  ExternalLink,
  Check,
  Loader2,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UnifiedHeader from "@/components/UnifiedHeader";
import { SPECIFIC_COLORS } from "@/constants";
import { getApiUrl } from "@/services/api";
import { WishlistItem } from "@/types";

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  source: string;
  link: string;
  category: string;
  subCategory?: string;
  color?: string;
  tags?: string[];
}

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Dresses", "Accessories"];

const SUB_CATEGORIES: Record<string, string[]> = {
  "Tops": ["T-Shirt", "Blouse", "Shirt", "Hoodie", "Crop Top", "Tank Top"],
  "Bottoms": ["Jeans", "Trousers", "Skirt", "Shorts", "Leggings"],
  "Shoes": ["Sneaker", "Heel", "Boot", "Flat", "Sandal"],
  "Dresses": ["Maxi Dress", "Mini Dress", "Midi Dress", "Evening Gown"],
  "Accessories": ["Bag", "Belt", "Scarf", "Jewelry", "Sunglasses"]
};

const COLOR_MAP: Record<string, string> = {
  "Black": "#000000",
  "White": "#FFFFFF",
  "Gray": "#808080",
  "Blue": "#0000FF",
  "Red": "#FF0000",
  "Green": "#008000",
  "Yellow": "#FFFF00",
  "Pink": "#FFC0CB",
  "Purple": "#800080",
  "Orange": "#FFA500",
  "Brown": "#A52A2A",
  "Beige": "#F5F5DC"
};

const FindOutfits = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [sortBy, setSortBy] = useState("relevance");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    color: []
  });
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [products, setProducts] = useState<Product[]>([]);
  const [refinedQueries, setRefinedQueries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Sorting Logic
  const sortedProducts = useMemo(() => {
    const items = [...products];
    if (sortBy === "price-low") {
      return items.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      return items.sort((a, b) => b.price - a.price);
    }
    return items; // relevance (default from API)
  }, [products, sortBy]);

  const handleSearch = useCallback(async (override?: string | React.MouseEvent | React.KeyboardEvent | { query?: string, gender?: string, category?: string, subCategory?: string }) => {
    let actualQuery = searchQuery;
    let actualGender = selectedGender;
    let actualCategory = selectedCategory;
    let actualSubCategory = selectedSubCategory;

    if (typeof override === "string") {
      actualQuery = override;
    } else if (override && typeof override === "object" && !("nativeEvent" in override)) {
      const o = override as { query?: string, gender?: string, category?: string, subCategory?: string };
      if (o.query !== undefined) actualQuery = o.query;
      if (o.gender !== undefined) actualGender = o.gender;
      if (o.category !== undefined) actualCategory = o.category;
      if (o.subCategory !== undefined) actualSubCategory = o.subCategory;
    }
    
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(getApiUrl("/api/users/search-products"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          q: actualQuery || (actualSubCategory !== "All" ? actualSubCategory : actualCategory !== "All" ? actualCategory : ""),
          filters: activeFilters,
          maxPrice: maxPrice < 10000 ? maxPrice : null,
          gender: actualGender
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        if (data.data.error) {
          toast.error(data.data.error);
        }
        const enrichedProducts = (data.data.products || []).map((p: Partial<WishlistItem>) => ({
          ...p,
          category: actualCategory !== "All" ? actualCategory : undefined
        })) as WishlistItem[];
        setProducts(enrichedProducts);
        setRefinedQueries(data.data.refinedQueries || []);
        if (data.data.products?.length > 0) {
          setTimeout(() => { resultsRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
        }
      } else {
        toast.error(data.message || "Search failed on server");
      }
    } catch (error) {
      console.error("Search Error:", error);
      toast.error(error instanceof Error ? error.message : "Shopping API connection failed");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGender, selectedCategory, selectedSubCategory, activeFilters, maxPrice]);

  // Initial search on mount
  useEffect(() => {
    // Only search if we haven't already and there are no products
    if (products.length === 0 && !loading) {
      handleSearch("latest fashion");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
    handleSearch({ gender });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubCategory("All");
    const query = cat === "All" ? "" : cat;
    handleSearch({ query, category: cat, subCategory: "All" });
  };

  const handleSubCategoryChange = (sub: string) => {
    setSelectedSubCategory(sub);
    const query = sub === "All" ? selectedCategory : sub;
    handleSearch({ query, subCategory: sub });
  };

  const toggleFilterOption = (groupKey: string, option: string) => {
    const val = option.toLowerCase();
    setActiveFilters(prev => {
      const current = prev[groupKey] || [];
      const next = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
      return { ...prev, [groupKey]: next };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ color: [] });
    setMaxPrice(10000);
  };

  const handleSaveToWishlist = async (product: Product) => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/signin"); return; }
    try {
      const response = await fetch(getApiUrl("/api/users/wishlist"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          imageUrl: product.imageUrl, 
          title: product.title, 
          link: product.link, 
          source: product.source,
          category: product.category 
        })
      });
      if ((await response.json()).status === "success") toast.success("Added to wishlist!");
    } catch (error) { toast.error("Failed to add to wishlist"); }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body relative">
      <UnifiedHeader title="Shopping Hub" />
      <main className="container mx-auto px-6 pt-8 pb-32">
        <div className="flex flex-col lg:flex-row gap-6 items-center mb-12">
          <div className="relative flex-1 w-full group">
            <button onClick={() => handleSearch()} className="absolute left-5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full hover:bg-gold/10 transition-colors">
              <Search className="w-5 h-5 text-muted-foreground/40 group-focus-within:text-gold transition-colors" />
            </button>
            <Input placeholder="Search for clothes, brands etc" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="pl-14 pr-32 h-16 rounded-[2rem] border-none bg-white shadow-sm focus-visible:ring-gold/20 text-lg w-full" />
            <Button onClick={() => handleSearch()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white hover:bg-black/90 rounded-full h-12 px-6 font-black uppercase tracking-widest text-[10px]">Search</Button>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-[1.5rem] h-16 px-8 gap-3 shadow-sm border border-black/5 flex-1 lg:flex-none relative bg-white">
                  <Filter className="w-4 h-4 text-gold" /><span className="font-bold uppercase tracking-widest text-[10px]">Filters</span>
                  {(activeFilters.color.length > 0 || maxPrice < 10000) && (
                    <Badge className="absolute -top-2 -right-2 bg-gold text-white h-6 w-6 rounded-full flex items-center justify-center p-0 text-[10px] border-none">{activeFilters.color.length + (maxPrice < 10000 ? 1 : 0)}</Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                <DialogHeader className="p-10 pb-6 border-b border-black/5">
                  <div className="flex items-center justify-between w-full text-left">
                    <DialogTitle className="font-display text-4xl font-bold italic">Curation Filters</DialogTitle> 
                    <Button variant="ghost" onClick={clearFilters} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-gold transition-colors">Clear All</Button>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                  <div className="space-y-6">
                    <h5 className="text-[10px] uppercase tracking-widest font-black opacity-30 px-2">Select Colors</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {SPECIFIC_COLORS.map(tag => {
                        const isSelected = activeFilters.color.includes(tag.toLowerCase());
                        return (
                          <button key={tag} onClick={() => toggleFilterOption("color", tag)} className={cn("flex items-center gap-3 p-4 rounded-2xl transition-all text-left border", isSelected ? "bg-secondary/60 border-gold/30" : "hover:bg-secondary/30 border-transparent")}>
                            <div className="w-5 h-5 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: COLOR_MAP[tag] || "#ccc" }} />
                            <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-foreground" : "text-muted-foreground")}>{tag}</span>
                            {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-8 bg-[#FAF9F6] p-10 rounded-[2.5rem] border border-black/5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] uppercase tracking-widest font-black opacity-30">Price Limit</h5>
                      <span className="font-display font-bold text-2xl italic text-gold">{maxPrice >= 10000 ? "Any Price" : `Under ₹${maxPrice.toLocaleString()}`}</span>
                    </div>
                    <Slider defaultValue={[maxPrice]} max={10000} step={500} onValueChange={(vals) => setMaxPrice(vals[0])} className="py-4" />
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest opacity-20"><span>₹0</span><span>₹5,000</span><span>₹10,000+</span></div>
                  </div>
                </div>
                <div className="p-10 border-t border-black/5 bg-[#FAF9F6]/50 flex justify-end gap-4">
                  <DialogClose asChild><Button onClick={() => handleSearch()} className="bg-black text-white hover:bg-black/90 rounded-2xl h-14 px-12 font-black uppercase tracking-widest text-[10px] shadow-xl">Apply Filters</Button></DialogClose>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-[1.5rem] h-16 px-8 gap-3 shadow-sm border border-black/5 flex-1 lg:flex-none bg-white">
                  <ArrowUpDown className="w-4 h-4 text-gold" /><span className="font-bold uppercase tracking-widest text-[10px]">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-[2rem] p-4 shadow-2xl bg-white border-black/5">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-black px-2 block mb-4">Arrange by</span>
                <div className="grid gap-1">
                  {[
                    { label: "Relevance", value: "relevance" },
                    { label: "Price: Low to High", value: "price-low" },
                    { label: "Price: High to Low", value: "price-high" }
                  ].map((option) => (
                    <div key={option.value} onClick={() => setSortBy(option.value)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all", sortBy === option.value ? "bg-secondary/50" : "hover:bg-secondary/20")}>
                      <span className={cn("text-sm font-medium", sortBy === option.value ? "text-gold" : "text-foreground/60")}>{option.label}</span>
                      {sortBy === option.value && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-16 space-y-8 text-center">
          <div className="flex justify-center gap-3 mb-6">
            {["All", "Men", "Women"].map(gender => (
              <button key={gender} onClick={() => handleGenderChange(gender)} className={cn("px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border", selectedGender === gender ? "bg-gold text-white border-gold shadow-lg" : "bg-white text-muted-foreground/40 border-black/5 hover:border-gold/20")}>{gender}</button>
            ))}
          </div>
          <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => handleCategoryChange(cat)} className={cn("px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border", selectedCategory === cat ? "bg-black text-white border-black shadow-xl" : "bg-white text-muted-foreground/60 border-black/5 hover:border-black/20")}>{cat}</button>
            ))}
          </div>
          {selectedCategory !== "All" && SUB_CATEGORIES[selectedCategory] && (
            <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => handleSubCategoryChange("All")} className={cn("px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border", selectedSubCategory === "All" ? "bg-gold/10 text-gold border-gold/20" : "bg-white text-muted-foreground/40 border-black/5")}>All {selectedCategory}</button>
              {SUB_CATEGORIES[selectedCategory].map(sub => (
                <button key={sub} onClick={() => handleSubCategoryChange(sub)} className={cn("px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border", selectedSubCategory === sub ? "bg-gold/10 text-gold border-gold/20" : "bg-white text-muted-foreground/40 border-black/5")}>{sub}</button>
              ))}
            </div>
          )}
        </div>

        {refinedQueries.length > 0 && !loading && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3 mb-4"><Sparkles className="w-4 h-4 text-gold" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">AI Refined Search</span></div>
            <div className="flex flex-wrap gap-2">
              {refinedQueries.map((q, i) => (
                <button key={i} onClick={() => { setSearchQuery(q); handleSearch(q); }} className="px-5 py-2 rounded-full bg-gold/5 border border-gold/10 text-[11px] font-bold text-gold hover:bg-gold hover:text-white transition-all duration-500">{q}</button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="relative"><Loader2 className="w-16 h-16 text-gold animate-spin" /><Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-gold/40" /></div>
            <div className="text-center space-y-2"><p className="font-display text-3xl italic text-foreground/60">Curating Marketplace...</p><p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Scanning Myntra, Ajio, Amazon & more</p></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-black/10 animate-in fade-in zoom-in duration-1000">
            <div className="p-8 rounded-full bg-[#FAF9F6] w-24 h-24 flex items-center justify-center mx-auto mb-6"><ShoppingCart className="w-10 h-10 text-muted-foreground/20" /></div>
            <h3 className="text-2xl font-display font-bold mb-2 text-foreground/40 italic">No Marketplace Matches</h3>       
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">We couldn't find products matching your current filters or query. Try broadening your search.</p>
            <Button onClick={() => { clearFilters(); setSearchQuery(""); handleSearch("latest fashion"); }} className="bg-black text-white hover:bg-black/90 rounded-full h-14 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl">Try Another Search</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10" ref={resultsRef}>
            {sortedProducts.map((product) => (
              <div key={product.id} className="group relative bg-white rounded-[3.5rem] p-8 hover:shadow-2xl hover:-translate-y-4 border border-black/5 transition-all duration-700 shadow-sm flex flex-col h-full">
                <div className="relative aspect-[3/4] mb-6 rounded-3xl overflow-hidden shadow-sm bg-[#FDFDFD]">
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6 gap-3">
                    <a href={product.link} target="_blank" rel="noopener noreferrer" className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-2xl"><ExternalLink className="w-5 h-5" />View on Website</a>
                    <Button onClick={() => handleSearch(product.title)} className="w-full bg-gold text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl border-none"><Search className="w-5 h-5" />Find Similar</Button>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex flex-col"><Badge variant="secondary" className="rounded-lg text-[9px] uppercase tracking-[0.2em] font-black bg-gold/5 text-gold border-none w-fit mb-1">{product.source}</Badge><span className="font-display font-bold text-xl tracking-tight text-foreground/90">₹{product.price.toLocaleString("en-IN")}</span></div>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); handleSaveToWishlist(product); }} className="rounded-full h-12 w-12 border border-black/5 hover:bg-secondary/50 hover:text-red-500 active:scale-90 shrink-0"><Heart className="w-6 h-6" /></Button>
                  </div>
                  <h3 className="font-display font-bold text-lg leading-tight tracking-tight text-foreground/80 group-hover:text-gold transition-colors line-clamp-2">{product.title}</h3>
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">{product.tags.slice(0, 3).map((tag, i) => (<span key={i} className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/40">{tag}</span>))}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FindOutfits;
