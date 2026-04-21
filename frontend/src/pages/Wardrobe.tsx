import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  ArrowUpDown, 
  Filter,
  LayoutGrid, 
  List, 
  Trash2,
  Edit2,
  X,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UnifiedHeader from "@/components/UnifiedHeader";
import { getApiUrl } from "@/services/api";
import { 
  CATEGORIES, 
  OCCASIONS, 
  STYLE_AESTHETICS, 
  MOODS, 
  TIMES, 
  LOCATIONS, 
  WEATHERS, 
  SPECIFIC_COLORS, 
  COLOR_PALETTES 
} from "@/constants";

interface ClothingItem {
  id: number;
  image_base64: string;
  category: string;
  sub_category: string;
  color: string;
  style: string;
  occasion: string[];
  style_aesthetic: string[];
  mood: string[];
  time: string[];
  location: string[];
  weather: string[];
  specific_colors: string[];
  color_palette: string[];
  tags: string[];
  is_favorite: boolean;
  created_at: string;
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempColors, setTempColors] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Tag editing state (Manual adjustment for AI)
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<ClothingItem>>({});

  const colorOptions = [
    "Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Pink", "Brown", "Beige",
    "Navy", "Olive", "Maroon", "Lavender", "Turquoise", "Coral", "Cream", "Mustard", "Teal", "Rust", "Khaki", "Orange", "Purple", "Cyan", "Magenta"
  ];
  const sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "A-Z Name", value: "name" }
  ];

  const fetchClothes = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      navigate("/signin");
      return;
    }

    try {
      console.log("Fetching clothes from /api/clothing/...");
      const response = await fetch(getApiUrl("/api/clothing/"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please sign in again.");
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log("Fetched clothes count:", data.length);
      console.log("First item sample:", data[0]);
      setClothes(data);
    } catch (error) {
      console.error("Wardrobe fetch error:", error);
      toast.error("Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchClothes();
  }, [fetchClothes]);

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(getApiUrl(`/api/clothing/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setClothes(prev => prev.filter(item => item.id !== id));
        toast.success("Item removed from wardrobe");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const toggleFavorite = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(getApiUrl(`/api/clothing/${id}/favorite`), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const updated = await response.json();
        setClothes(prev => prev.map(item => 
          item.id === id ? { ...item, is_favorite: updated.is_favorite } : item
        ));
      }
    } catch (error) {
      toast.error("Failed to update favorite");
    }
  };

  const handleEditOpen = (item: ClothingItem) => {
    setEditingItem(item);
    setEditForm({ ...item });
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(getApiUrl(`/api/clothing/${editingItem.id}`), {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        const updated = await response.json();
        setClothes(prev => prev.map(item => item.id === updated.id ? updated : item));
        setEditingItem(null);
        toast.success("Item updated successfully");
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const toggleTag = (field: keyof ClothingItem, tag: string) => {
    const currentTags = (editForm[field] as string[]) || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    setEditForm({ ...editForm, [field]: newTags });
  };

  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({
    occasion: [],
    style_aesthetic: [],
    mood: [],
    time: [],
    location: [],
    weather: [],
    specific_colors: [],
    color_palette: []
  });

  const toggleFilterTag = (category: string, tag: string) => {
    setSelectedTags(prev => {
      const current = prev[category] || [];
      const updated = current.includes(tag) 
        ? current.filter(t => t !== tag) 
        : [...current, tag];
      return { ...prev, [category]: updated };
    });
  };

  const activeFilterCount = Object.values(selectedTags).flat().length;

  const sortedAndFilteredClothes = useMemo(() => {
    return (clothes || []).filter(item => {
      if (!item) return false;
      
      // Basic Search
      const category = item.category || "";
      const subCategory = item.sub_category || "";
      const color = item.color || "";
      const allTags = [
        ...(item.tags || []),
        ...(item.occasion || []),
        ...(item.style_aesthetic || []),
        ...(item.mood || []),
        ...(item.time || []),
        ...(item.location || []),
        ...(item.weather || []),
        ...(item.specific_colors || []),
        ...(item.color_palette || [])
      ].join(" ");
      
      const searchTerms = `${category} ${subCategory} ${color} ${allTags}`.toLowerCase();
      const matchesSearch = !searchQuery || searchTerms.includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || 
        (category && category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
      
      // Multi-tag filtering (Must match ANY selected tag in a category, AND if no tags selected, match all)
      // Actually, usually users want "match any of these tags" within a category, 
      // but "match all selected categories". 
      // Let's go with: if multiple tags selected in ONE category, match ANY of them.
      // If tags selected across multiple categories, match ALL those categories.
      
      const matchesFilters = Object.entries(selectedTags).every(([cat, tags]) => {
        if (tags.length === 0) return true;
        const itemTags = (item[cat as keyof ClothingItem] as string[]) || [];
        return tags.some(t => itemTags.includes(t));
      });
        
      return matchesSearch && matchesCategory && matchesFilters;
    }).sort((a, b) => {
      if (sortBy === "newest") {
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === "name") return (a.sub_category || "").localeCompare(b.sub_category || "");
      return 0;
    });
  }, [clothes, searchQuery, selectedCategory, selectedTags, sortBy]);

  const clearAllFilters = () => {
    setSelectedTags({
      occasion: [],
      style_aesthetic: [],
      mood: [],
      time: [],
      location: [],
      weather: [],
      specific_colors: [],
      color_palette: []
    });
    setSelectedCategory("All");
    setSearchQuery("");
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

  const FilterSection = ({ title, category, options }: { title: string, category: string, options: string[] }) => (
    <div className="space-y-4 py-2">
      <h5 className="text-[10px] uppercase tracking-widest font-black opacity-30 px-4">{title}</h5>
      <div className="flex flex-col gap-1">
        {options.map(tag => {
          const isSelected = selectedTags[category]?.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleFilterTag(category, tag)}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all w-full text-left group",
                isSelected ? "bg-secondary/60" : "hover:bg-secondary/30"
              )}
            >
              <div 
                className="w-5 h-5 rounded-full border border-black/5 shadow-sm transition-transform group-hover:scale-110" 
                style={{ backgroundColor: COLOR_MAP[tag] || "#ccc" }} 
              />
              <span className={cn(
                "text-sm font-bold tracking-tight transition-colors",
                isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {tag}
              </span>
              {isSelected && <div className="ml-auto w-2 h-2 rounded-full bg-gold shadow-sm animate-in fade-in zoom-in duration-300" />}
            </button>
          );
        })}
      </div>
    </div>
  );


  const toggleTempColor = (color: string) => {
    setTempColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const applyColorFilter = () => {
    setSelectedColors(tempColors);
    setIsFilterOpen(false);
  };

  const clearColorFilter = () => {
    setTempColors([]);
    setSelectedColors([]);
  };

  const TagSection = ({ title, field, options }: { title: string, field: keyof ClothingItem, options: string[] }) => (
    <div className="space-y-3">
      <h5 className="text-[10px] uppercase tracking-widest font-black opacity-40">{title}</h5>
      <div className="flex flex-wrap gap-2">
        {options.map(tag => {
          const isSelected = (editForm[field] as string[])?.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(field, tag)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                isSelected 
                  ? "bg-gold border-gold text-white shadow-lg shadow-gold/20" 
                  : "bg-white border-black/5 text-muted-foreground hover:border-gold/30"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body relative">
      <UnifiedHeader title="Wardrobe" />

      <main className="container mx-auto px-6 pt-8 pb-32">
        {/* CONTROL BAR - Matches Reference exactly */}
        <div className="flex flex-col lg:flex-row gap-6 items-center mb-12">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
            <Input 
              placeholder="Search clothes or color..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 rounded-[2rem] border-none bg-white shadow-sm focus-visible:ring-gold/20 text-lg w-full"
            />
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* Filter Dropdown */}
            <DropdownMenu 
              open={isFilterOpen} 
              onOpenChange={setIsFilterOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="white" className="rounded-[1.5rem] h-16 px-8 gap-3 shadow-sm border border-black/5 flex-1 lg:flex-none relative hover:border-gold/30 transition-all">
                  <Filter className="w-4 h-4 text-gold" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Filter</span>
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-black text-white h-6 w-6 rounded-full flex items-center justify-center p-0 text-[10px] border-none shadow-lg">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-[2rem] p-4 shadow-2xl bg-white border-black/5 flex flex-col gap-2">
                <div className="flex items-center justify-between px-2 pt-2">
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-black">Colors</span>
                  {activeFilterCount > 0 && (
                    <button 
                      onClick={clearAllFilters}
                      className="text-[10px] uppercase tracking-widest text-destructive font-bold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="max-h-60 overflow-y-auto no-scrollbar px-2 grid gap-1">
                  {SPECIFIC_COLORS.map(tag => {
                    const isSelected = selectedTags["specific_colors"]?.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleFilterTag("specific_colors", tag)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left",
                          isSelected ? "bg-secondary/50" : "hover:bg-secondary/20"
                        )}
                      >
                        <div 
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm shrink-0" 
                          style={{ backgroundColor: COLOR_MAP[tag] || "#ccc" }} 
                        />
                        <span className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-foreground" : "text-foreground/60"
                        )}>
                          {tag}
                        </span>
                        {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-black/5 mt-2">
                  <Button 
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-black text-white hover:bg-black/90 rounded-xl h-12 font-black uppercase tracking-widest text-[10px]"
                  >
                    Apply
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="white" className="rounded-[1.5rem] h-16 px-8 gap-3 shadow-sm border border-black/5 flex-1 lg:flex-none">
                  <ArrowUpDown className="w-4 h-4 text-gold" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-[2rem] p-4 shadow-2xl bg-white border-black/5">
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-black px-2 block mb-4">Arrange by</span>
                <div className="grid gap-1">
                  {sortOptions.map((option) => (
                    <div 
                      key={option.value} 
                      onClick={() => setSortBy(option.value)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                        sortBy === option.value ? "bg-secondary/50" : "hover:bg-secondary/20"
                      )}
                    >
                      <span className={cn("text-sm font-medium", sortBy === option.value ? "text-gold" : "text-foreground/60")}>
                        {option.label}
                      </span>
                      {sortBy === option.value && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex bg-white p-2 rounded-[1.5rem] shadow-sm border border-black/5 h-16">
              <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={cn("rounded-xl h-full w-12", viewMode === "grid" ? "bg-secondary/50 text-gold" : "text-muted-foreground/40")}><LayoutGrid className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={cn("rounded-xl h-full w-12", viewMode === "list" ? "bg-secondary/50 text-gold" : "text-muted-foreground/40")}><List className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        {/* CATEGORY BAR - Matches Reference */}
        <div className="flex justify-center gap-3 mb-12 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border", selectedCategory === cat ? "bg-black text-white border-black shadow-xl" : "bg-white text-muted-foreground/60 border-black/5 hover:border-black/20")}>{cat}</button>
          ))}
        </div>

        {sortedAndFilteredClothes.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-black/10">
            <h3 className="text-2xl font-display font-bold mb-2">No items found</h3>
            <Button onClick={() => navigate("/add-clothes")} className="bg-gold text-white rounded-full px-10 h-14 mt-8 font-black uppercase tracking-widest text-[10px]">Add New Item</Button>
          </div>
        ) : (
          <div className={cn(viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10" : "flex flex-col gap-6 max-w-4xl mx-auto")}>
            {sortedAndFilteredClothes.map((item) => (
              <div key={item.id} className={cn("group relative bg-white transition-all duration-700", viewMode === "grid" ? "rounded-[3.5rem] p-10 hover:shadow-2xl hover:-translate-y-4 border border-black/5 shadow-sm" : "rounded-[2.5rem] p-6 flex items-center gap-8 border border-black/5 shadow-sm")}>
                <div className={cn("relative bg-white rounded-3xl overflow-hidden shadow-sm", viewMode === "grid" ? "aspect-[3/4] mb-6" : "w-32 h-32 shrink-0")}>
                  {item.image_base64 ? (
                    <img 
                      src={item.image_base64.startsWith('data:') ? item.image_base64 : `data:image/png;base64,${item.image_base64}`} 
                      alt={item.sub_category || "Clothing Item"} 
                      className="w-full h-full object-contain transition-transform duration-1000 p-2" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      <Plus className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Badge variant="secondary" className="rounded-lg text-[9px] uppercase tracking-[0.2em] font-black bg-gold/5 text-gold border-none">
                    {item.category}
                  </Badge>
                  <h4 className="font-display font-bold text-2xl tracking-tighter capitalize text-foreground/90 truncate">
                    {item.sub_category}
                  </h4>
                </div>
                
                <div className={cn("flex gap-3", viewMode === "grid" ? "absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all" : "opacity-100")}>
                  <Button 
                    size="icon" 
                    variant="white" 
                    onClick={() => toggleFavorite(item.id)} 
                    className={cn(
                      "rounded-full h-12 w-12 shadow-xl border border-black/5 active:scale-90 transition-all",
                      item.is_favorite ? "text-red-500 hover:text-red-600" : "hover:text-gold"
                    )}
                    title={item.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart className={cn("w-5 h-5", item.is_favorite && "fill-current")} />
                  </Button>
                  <Button size="icon" variant="white" onClick={() => handleEditOpen(item)} className="rounded-full h-12 w-12 shadow-xl border border-black/5 hover:text-gold active:scale-90" title="Edit AI Tags">
                    <Edit2 className="w-5 h-5 transition-all" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="white" className="rounded-full h-12 w-12 shadow-xl border border-black/5 hover:text-destructive active:scale-90"><Trash2 className="w-5 h-5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2.5rem] bg-white/90 backdrop-blur-xl border-black/5 shadow-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display italic text-2xl">Delete item?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body text-muted-foreground/60">This will permanently remove the item from your wardrobe.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full border-black/5 uppercase tracking-widest text-[10px] font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 uppercase tracking-widest text-[10px] font-bold">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* EDIT TAGS DIALOG (Manual adjustment for AI processing) */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none bg-white shadow-2xl no-scrollbar">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-12 py-8 border-b border-black/5 flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-3xl font-bold">Refine Details</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">Adjust AI-suggested tags for your {editForm.sub_category}</DialogDescription>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setEditingItem(null)} className="rounded-2xl h-14 px-8 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
              <Button onClick={handleUpdate} className="bg-black text-white rounded-2xl h-14 px-10 font-bold uppercase tracking-widest text-[10px] hover:bg-black/90 shadow-xl shadow-black/10">Save Changes</Button>
            </div>
          </div>
          
          <div className="p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="aspect-square bg-secondary/30 rounded-[2.5rem] overflow-hidden p-8 flex items-center justify-center">
                  <img 
                    src={editForm.image_base64?.startsWith('data:') ? editForm.image_base64 : `data:image/png;base64,${editForm.image_base64}`} 
                    className="max-w-full max-h-full object-contain mix-blend-multiply" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black opacity-40 px-2">Category</label>
                    <select 
                      value={editForm.category} 
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full h-14 rounded-2xl bg-secondary/50 border-none px-6 font-bold text-sm focus:ring-2 focus:ring-gold/20"
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black opacity-40 px-2">Sub-Category</label>
                    <Input 
                      value={editForm.sub_category} 
                      onChange={(e) => setEditForm({...editForm, sub_category: e.target.value})}
                      className="h-14 rounded-2xl bg-secondary/50 border-none px-6 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black opacity-40 px-2">Main Color</label>
                    <Input 
                      value={editForm.color} 
                      onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                      className="h-14 rounded-2xl bg-secondary/50 border-none px-6 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black opacity-40 px-2">Primary Style</label>
                    <Input 
                      value={editForm.style} 
                      onChange={(e) => setEditForm({...editForm, style: e.target.value})}
                      className="h-14 rounded-2xl bg-secondary/50 border-none px-6 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <TagSection title="Occasion" field="occasion" options={OCCASIONS} />
                <TagSection title="Aesthetic" field="style_aesthetic" options={STYLE_AESTHETICS} />
                <TagSection title="Mood" field="mood" options={MOODS} />
                <TagSection title="Time" field="time" options={TIMES} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-black/5 pt-12">
               <TagSection title="Location" field="location" options={LOCATIONS} />
               <TagSection title="Weather" field="weather" options={WEATHERS} />
               <TagSection title="Color Palette" field="color_palette" options={COLOR_PALETTES} />
               <TagSection title="Specific Colors" field="specific_colors" options={SPECIFIC_COLORS} />
            </div>
            
            <div className="space-y-4 border-t border-black/5 pt-12">
              <h5 className="text-[10px] uppercase tracking-widest font-black opacity-40">Extra Expressive Tags</h5>
              <div className="flex flex-wrap gap-2">
                {editForm.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="pl-4 pr-2 py-2 rounded-xl bg-secondary text-foreground flex items-center gap-2 group">
                    <span className="font-bold text-xs">{tag}</span>
                    <button onClick={() => toggleTag('tags', tag)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
                <Input 
                  placeholder="Add custom tag + Enter" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        toggleTag('tags', val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                  className="w-48 h-10 rounded-xl bg-transparent border-dashed border-black/10 text-xs px-4"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <button onClick={() => navigate("/add-clothes")} className="fixed bottom-12 right-12 w-20 h-20 bg-black text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 hover:-translate-y-2 transition-all duration-500 group z-50 flex items-center justify-center border-4 border-white active:scale-95"><Plus className="w-10 h-10 transition-transform duration-700 group-hover:rotate-180" /></button>
    </div>
  );
};

export default Wardrobe;