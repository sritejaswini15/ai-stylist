import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sparkles, Wand2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-fashion.jpg";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
            clueless
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button className="font-body text-sm bg-foreground text-background hover:bg-foreground/90 rounded-full px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" className="font-body text-sm font-medium text-muted-foreground hover:text-foreground">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="font-body text-sm bg-foreground text-background hover:bg-foreground/90 rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-sm text-muted-foreground font-body">
              <Sparkles className="w-4 h-4 text-gold" />
              AI - Powered Personal Styling
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight text-foreground">
              Your closet,
              <br />
              <span className="italic text-gold">reimagined.</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body max-w-md leading-relaxed">
              Clueless is your AI stylist that learns your taste, curates outfits, and transforms the way you dress - effortlessly.
            </p>
            <div className="flex items-center gap-4">
              <Link to={isLoggedIn ? "/dashboard" : "/signup"}>
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 font-body text-base">
                  {isLoggedIn ? "Go to Dashboard" : "Start Styling"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gold/10">
              <img
                src={heroImage}
                alt="Curated fashion flat lay with designer clothing and accessories"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl p-4 shadow-lg">
              <p className="font-display text-sm italic text-muted-foreground">"This outfit is so you!"</p>
              <p className="text-xs text-gold font-body mt-1">- Your AI Stylist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-secondary/50">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Everything you need to dress with <span className="italic text-gold">Confidence</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Sparkles, title: "Smart Wardrobe", desc: "Your closet, but finally organized like it has its life together." },
              { icon: Sparkles, title: "AI Stylist", desc: "Knows your style better than you do on your “nothing looks good” days." },
              { icon: Sparkles, title: "Mix & Match", desc: "Turns “I have nothing to wear” into “wait, this actually works?”" },
              { icon: Sparkles, title: "Shop Smarter", desc: "Stops you from buying your 7th “slightly different” black top." },
              { icon: Sparkles, title: "Style Planner", desc: "Because 8am decisions are where fashion goes to die." },
              { icon: Sparkles, title: "Trend Radar", desc: "Filters trends so you look current, not confused." },
            ].map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-8 space-y-4 hover:shadow-lg hover:shadow-gold/5 transition-shadow duration-300">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="text-muted-foreground font-body leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="container mx-auto text-center space-y-8 max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Ready to be <span className="italic text-gold">fabulous</span>?
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Join and transform your style with Clueless.
          </p>
          <Link to={isLoggedIn ? "/dashboard" : "/signup"}>
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-10 font-body text-base mt-4">
              {isLoggedIn ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <p className="font-display text-lg font-bold text-foreground">clueless</p>
          <p className="text-sm text-muted-foreground font-body">© 2026 Clueless</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
