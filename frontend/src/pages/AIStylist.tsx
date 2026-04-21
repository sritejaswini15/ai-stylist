import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Camera, Sparkles, Loader2, Send, 
  CheckCircle2, XCircle, ArrowRight, Trash2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import UnifiedHeader from "@/components/UnifiedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StyleItem, AnalysisData, ChatMessage } from "@/types";
import { getApiUrl } from "@/services/api";

const AIStylist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // SEPARATE IMAGE STATES
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null); // The stylist photo
  const [globalProfilePic, setGlobalProfilePic] = useState<string | null>(null); // The main avatar pic
  const [username, setUsername] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [sunReactionInput, setSunReactionInput] = useState("");
  const [hairColorInput, setHairColorInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: "Hello! I'm **Clueless AI**, your personal Style Architect. \n\nI can help you build the perfect wardrobe, analyze your silhouette, or just chat about the latest trends. How can I inspire your look today?" }]);
  const [userInput, setUserInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(getApiUrl("/api/users/me"), { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) { navigate("/signin"); return; }
      const data = await response.json();
      if (data.status === "success") {
        const user = data.data.user;
        setUsername(user.username);
        setGlobalProfilePic(user.profilePicture); // KEEP THE LETTER/MAIN PIC
        if (user.stylistPicture) setProfileImage(user.stylistPicture); // This is just for analysis logic
        if (user.styleAdvice && user.styleAdvice.color_analysis) setCurrentAnalysis(user.styleAdvice);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, [token, navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (isRefining = false) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) { navigate("/signin"); return; }

    const analysisImage = isRefining ? profileImage : pendingImage;
    if (!analysisImage) { toast.error("Upload a photo"); return; }

    setLoading(true);
    if (!isRefining) setIsAnalyzing(true);
    if (isRefining) setShowRefinement(false);

    try {
      if (isRefining) {
        await fetch(getApiUrl("/api/users/updateMe"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
          body: JSON.stringify({ sun_reaction: sunReactionInput, hair_color: hairColorInput }),
        });
      }

      const response = await fetch(getApiUrl("/api/users/analyze-appearance"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ image_base64: analysisImage, height: height ? parseInt(height) : null, weight: weight ? parseInt(weight) : null }),
      });

      if (response.status === 401) { navigate("/signin"); return; }
      const data = await response.json();
      if (data.status === "success") {
        setCurrentAnalysis(data.data);
        setProfileImage(analysisImage);
        setPendingImage(null);
        setHeight("");
        setWeight("");
        toast.success("Detailed profile generated!");
        if (!isRefining && data.data.needs_info?.length > 0) setShowRefinement(true);
        fetchProfile();
      } else { toast.error("Error generating profile"); }
    } catch (error) { toast.error("Analysis failed"); } finally { 
      setLoading(false); 
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken || !userInput.trim()) return;
    const msg = userInput;
    setUserInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsChatLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/chatbot/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ 
          message: msg,
          history: chatMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.data.response }]);
        if (data.data.profile_updated) fetchProfile();
      }
    } catch (error) { toast.error("Chat busy"); } finally { setIsChatLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-body flex flex-col">
      <UnifiedHeader title="AI Stylist" />
      <main className="flex-1 container mx-auto pt-8 pb-20 px-6 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
              <CardHeader className="bg-foreground text-white p-8"><CardTitle className="font-display text-xl flex items-center gap-3"><Camera className="w-5 h-5 text-gold"/> Fit & Color Analysis</CardTitle></CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="aspect-square rounded-[2rem] border-2 border-dashed border-secondary flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-secondary/10" onClick={() => document.getElementById("photo-upload")?.click()}>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {pendingImage ? <img src={pendingImage} className="w-full h-full object-cover" /> : <div className="text-center p-6"><Camera className="w-12 h-12 text-gold mx-auto mb-4" /><p className="font-bold">Upload New Photo</p></div>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Height</Label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="cm" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Weight</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg" /></div>
                </div>
                <Button onClick={() => runAnalysis(false)} disabled={loading} className="w-full h-16 rounded-2xl bg-gold hover:bg-gold/90 text-white font-bold">{loading ? <Loader2 className="animate-spin" /> : "Analyse"}</Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-8 space-y-8">
            {isAnalyzing ? (
              <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden h-[600px] flex flex-col items-center justify-center text-center p-20">
                <Loader2 className="w-16 h-16 animate-spin text-gold mb-6" />
                <h2 className="font-display text-3xl font-bold">Consulting AI Masters...</h2>
                <p className="text-muted-foreground mt-2">Performing surgical analysis of bone structure and undertones.</p>
              </Card>
            ) : !currentAnalysis ? (
              <div className="h-[600px] flex flex-col items-center justify-center text-center p-20 opacity-30 border-2 border-dashed border-secondary rounded-[3rem]">
                <Sparkles className="w-24 h-24 mb-6" />
                <h2 className="font-display text-3xl font-bold">Waiting for Scan</h2>
                <p>Your permanent style profile will appear here.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
                <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                   <div className="bg-gold h-2" />
                   <CardContent className="p-8 flex flex-col md:flex-row items-center gap-10">
                      <Avatar className="h-40 w-40 border-8 border-[#FAF9F6] shadow-2xl">
                        <AvatarImage src={profileImage || ""} className="object-cover" />
                        <AvatarFallback className="bg-gold text-white text-4xl font-display">{username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="text-center md:text-left space-y-4">
                        <h2 className="font-display text-5xl font-bold">{currentAnalysis.sub_season}</h2>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                           <span className="px-5 py-2 bg-secondary/50 rounded-full text-xs font-black uppercase tracking-widest">{currentAnalysis.body_shape}</span>
                           <span className="px-5 py-2 bg-secondary/50 rounded-full text-xs font-black uppercase tracking-widest">{currentAnalysis?.color_analysis?.undertone} Undertone</span>
                        </div>
                      </div>
                   </CardContent>
                </Card>
                <Tabs defaultValue="colors" className="w-full">
                  <TabsList className="w-full h-16 bg-white rounded-full p-2 shadow-lg mb-8"><TabsTrigger value="colors" className="flex-1 rounded-full font-bold data-[state=active]:bg-gold data-[state=active]:text-white transition-all">Color Palette</TabsTrigger><TabsTrigger value="fit" className="flex-1 rounded-full font-bold data-[state=active]:bg-gold data-[state=active]:text-white transition-all">Fit & Form</TabsTrigger><TabsTrigger value="strategy" className="flex-1 rounded-full font-bold data-[state=active]:bg-gold data-[state=active]:text-white transition-all">Studio Strategy</TabsTrigger></TabsList>
                  <TabsContent value="colors"><Card className="rounded-[3rem] border-none shadow-2xl bg-white p-10 space-y-10">
                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <h3 className="font-display text-2xl font-bold flex items-center gap-3 text-green-600"><CheckCircle2/> Best Colors</h3>
                        {(['power_colors', 'neutrals', 'accents'] as const).map(key => (
                          <div key={key} className="space-y-4">
                            <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.2em]">{key.replace('_', ' ')}</p>
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
                              {currentAnalysis.color_analysis?.best_colors?.[key]?.map((c: StyleItem, i: number) => (
                                <div key={i} className="space-y-2 group">
                                  <div className="aspect-square rounded-xl shadow-sm hover:scale-110 transition-transform cursor-help" style={{backgroundColor: c.hex}} title={c.reason} />
                                  <p className="text-[9px] font-bold text-center leading-tight truncate">{c.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-8">
                        <h3 className="font-display text-2xl font-bold flex items-center gap-3 text-red-600"><XCircle/> Colors to Avoid</h3>
                        <div className="grid grid-cols-4 md:grid-cols-5 gap-4 opacity-60">
                          {currentAnalysis.color_analysis?.avoid_colors?.map((c, i) => (
                            <div key={i} className="space-y-2">
                              <div className="aspect-square rounded-xl shadow-sm grayscale-[0.3]" style={{backgroundColor: c.hex}} title={c.reason} />
                              <p className="text-[9px] font-bold text-center leading-tight truncate">{c.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div></Card></TabsContent>
                  <TabsContent value="fit"><div className="grid md:grid-cols-2 gap-8">
                    <Card className="rounded-[2.5rem] shadow-xl bg-white p-8 space-y-6"><h3 className="font-display text-xl font-bold text-green-600">Fits to Embrace</h3><div className="space-y-4">{currentAnalysis.clothing_analysis?.styles_to_embrace?.map((s, i) => <div key={i} className="p-5 bg-secondary/10 rounded-2xl text-xs flex gap-4"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0"/><div><p className="font-bold text-sm mb-1">{s.item}</p><p className="opacity-70 leading-relaxed">{s.reason}</p></div></div>)}</div></Card>
                    <Card className="rounded-[2.5rem] shadow-xl bg-white p-8 space-y-6 opacity-80"><h3 className="font-display text-xl font-bold text-red-600">Fits to Avoid</h3><div className="space-y-4">{currentAnalysis.clothing_analysis?.styles_to_avoid?.map((s, i) => <div key={i} className="p-5 bg-red-50 rounded-2xl text-xs flex gap-4"><XCircle className="w-4 h-4 text-red-500 shrink-0"/><div><p className="font-bold text-sm mb-1 text-red-900">{s.item}</p><p className="text-red-700/70 leading-relaxed">{s.reason}</p></div></div>)}</div></Card>
                  </div></TabsContent>
                  <TabsContent value="strategy"><Card className="rounded-[3rem] shadow-2xl bg-white p-10 space-y-10">
                    <div className="p-8 bg-gold/5 rounded-[2.5rem] border border-gold/10 italic text-lg text-foreground leading-relaxed shadow-inner">"{currentAnalysis.fashion_advice?.general}"</div>
                    <div className="grid md:grid-cols-3 gap-10">
                      <div className="space-y-3"><p className="text-[10px] font-black uppercase text-gold tracking-widest">Tops Strategy</p><p className="text-sm leading-relaxed">{currentAnalysis.fashion_advice?.tops}</p></div>
                      <div className="space-y-3"><p className="text-[10px] font-black uppercase text-gold tracking-widest">Bottoms Strategy</p><p className="text-sm leading-relaxed">{currentAnalysis.fashion_advice?.bottoms}</p></div>
                      <div className="space-y-3"><p className="text-[10px] font-black uppercase text-gold tracking-widest">Dresses Strategy</p><p className="text-sm leading-relaxed">{currentAnalysis.fashion_advice?.dresses}</p></div>
                    </div>
                    
                    {currentAnalysis.fashion_advice?.dataset_recommendations && (
                      <div className="pt-10 border-t border-secondary/20">
                        <h3 className="font-display text-2xl font-bold mb-8 flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-gold" />
                          Technical Specifications
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {Object.entries(currentAnalysis.fashion_advice.dataset_recommendations).map(([key, value]) => (
                            <div key={key} className="p-6 bg-secondary/5 rounded-3xl border border-secondary/10">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gold mb-2">{key}</p>
                              <p className="text-sm font-medium">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card></TabsContent>
                </Tabs>
              </div>)}
          </div>
        </div>
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col h-[700px] mt-10">
          <CardHeader className="bg-foreground text-white p-8 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-gold shadow-lg">
                <AvatarFallback className="bg-gold text-white font-display font-bold">AI</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-display text-2xl tracking-tight">Clueless AI</CardTitle>
                <p className="text-[10px] font-black uppercase tracking-widest text-gold opacity-80">Style Architect</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setChatMessages([{ role: 'assistant', content: "Hello! I'm **Clueless AI**, your personal Style Architect. \n\nHow can I help you refine your look today?" }])} 
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#FDFDFD]">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-8 rounded-[2.5rem] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gold text-white rounded-tr-none' 
                    : 'bg-white border border-secondary/50 text-foreground rounded-tl-none shadow-md'
                }`}>
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-stone'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-secondary/50 p-6 rounded-[2rem] rounded-tl-none flex gap-2 shadow-md">
                  <span className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gold/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>
          <div className="p-8 bg-white border-t flex gap-4">
            <Input 
              value={userInput} 
              onChange={(e) => setUserInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Ask for style advice..." 
              className="h-16 rounded-full bg-secondary/10 border-none flex-1 pl-10 text-lg shadow-inner focus-visible:ring-gold/20" 
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isChatLoading || !userInput.trim()} 
              className="h-16 w-16 rounded-full bg-gold hover:bg-gold/90 text-white shadow-xl shrink-0 transition-transform hover:scale-105 active:scale-95"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </Card>
      </main>
      <Dialog open={showRefinement} onOpenChange={setShowRefinement}><DialogContent className="rounded-[3rem] p-10 max-w-lg border-none shadow-2xl bg-white"><DialogHeader><DialogTitle className="font-display text-3xl">Refine Analysis</DialogTitle></DialogHeader>
          <div className="py-8 space-y-6">
            <div className="space-y-2"><Label className="font-bold">Sun Reaction?</Label><Input value={sunReactionInput} onChange={(e) => setSunReactionInput(e.target.value)} placeholder="e.g. Tans easily..." className="h-14 rounded-2xl" /></div>
            <div className="space-y-2"><Label className="font-bold">Natural Hair Color?</Label><Input value={hairColorInput} onChange={(e) => setHairColorInput(e.target.value)} placeholder="e.g. Jet black..." className="h-14 rounded-2xl" /></div>
          </div>
          <DialogFooter className="flex gap-4"><Button variant="ghost" onClick={() => setShowRefinement(false)} className="rounded-full h-14 px-8 font-bold">Later</Button><Button onClick={() => runAnalysis(true)} className="rounded-full h-14 px-10 bg-gold text-white font-bold shadow-lg">Complete Profile <ArrowRight className="ml-2 w-4 h-4"/></Button></DialogFooter>
        </DialogContent></Dialog>
    </div>
  );
};
export default AIStylist;