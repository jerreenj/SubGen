import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Save, Eye, EyeOff, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAiSettings, saveAiSettings, type AiSettings } from "@/lib/ai-settings";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AiSettings>({ apiKey: "", baseUrl: "", model: "whisper-1" });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getAiSettings());
  }, []);

  const handleSave = () => {
    saveAiSettings(settings);
    setSaved(true);
    toast({ title: "Settings saved" });
    setTimeout(() => setSaved(false), 2000);
  };

  const isOpenRouter = settings.baseUrl.includes("openrouter");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border/50 flex items-center px-6 bg-card/30">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-semibold">Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">AI Transcription</h2>
            <p className="text-sm text-muted-foreground mt-1">
              SubGen uses the OpenAI-compatible Whisper API to transcribe your audio. Bring your own key — nothing is stored on the server.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={settings.apiKey}
                  onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stored only in your browser (localStorage). Never sent to our servers except to forward to the AI provider.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">
                Base URL{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="https://openrouter.ai/api/v1"
                value={settings.baseUrl}
                onChange={e => setSettings(s => ({ ...s, baseUrl: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use OpenAI directly. Set to{" "}
                <code className="bg-muted px-1 rounded text-xs">https://openrouter.ai/api/v1</code> for OpenRouter.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">
                Whisper Model{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="model"
                type="text"
                placeholder="whisper-1"
                value={settings.model}
                onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Default: <code className="bg-muted px-1 rounded text-xs">whisper-1</code>. OpenRouter users can try{" "}
                <code className="bg-muted px-1 rounded text-xs">openai/whisper-large-v3</code>.
              </p>
            </div>

            <Button onClick={handleSave} className="w-full gap-2">
              {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved!" : "Save Settings"}
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Get an API Key</h2>
          <div className="grid gap-3">
            {[
              {
                name: "OpenAI",
                desc: "Official Whisper API — pay-per-minute, $0.006/min",
                url: "https://platform.openai.com/api-keys",
                recommended: true,
              },
              {
                name: "OpenRouter",
                desc: "Multi-provider gateway — supports many Whisper-compatible models",
                url: "https://openrouter.ai/keys",
                recommended: false,
              },
            ].map(provider => (
              <a
                key={provider.name}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50 hover:bg-card/80 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{provider.name}</span>
                    {provider.recommended && (
                      <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">Recommended</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{provider.desc}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-4" />
              </a>
            ))}
          </div>
        </section>

        {isOpenRouter && (
          <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-400">
              <strong>OpenRouter tip:</strong> Set Base URL to{" "}
              <code className="bg-black/20 px-1 rounded">https://openrouter.ai/api/v1</code> and use a model like{" "}
              <code className="bg-black/20 px-1 rounded">openai/whisper-large-v3</code>.
            </p>
          </section>
        )}

      </div>
    </div>
  );
}
