"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Settings, BrainCircuit, User, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteAccount } from "@/app/actions/deleteAccount";

type ModalView = 'none' | 'context' | 'byok' | 'identity' | 'delete';

export default function ProfilePage() {
  const [globalContext, setGlobalContext] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [aiModel, setAiModel] = useState("gemini-1.5-flash");
  
  // Identity state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [lastUsernameUpdate, setLastUsernameUpdate] = useState<string | null>(null);

  // Edit Identity state
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalView>('none');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("global_context, username, display_name, avatar_url, last_username_update")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setGlobalContext(profile.global_context || "");
        setUsername(profile.username || "");
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url || "");
        setLastUsernameUpdate(profile.last_username_update || null);

        setEditUsername(profile.username || "");
        setEditDisplayName(profile.display_name || "");
        setEditAvatarUrl(profile.avatar_url || "");
      }

      const storedKey = localStorage.getItem("byok_api_key");
      if (storedKey) setApiKey(storedKey);

      const storedModel = localStorage.getItem("byok_ai_model");
      if (storedModel) setAiModel(storedModel);

      setLoading(false);
    }
    loadSettings();
  }, [supabase, router]);

  const saveContext = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ global_context: globalContext })
        .eq("id", user.id);
      
      if (error) {
        toast.error(`Failed to save context: ${error.message}`);
      } else {
        toast.success("Context saved successfully!");
        setActiveModal('none');
      }
    }
    setSaving(false);
  };

  const saveBYOK = async () => {
    setSaving(true);
    if (apiKey) {
      localStorage.setItem("byok_api_key", apiKey);
    } else {
      localStorage.removeItem("byok_api_key");
    }
    
    if (aiModel) {
      localStorage.setItem("byok_ai_model", aiModel);
    }
    
    toast.success("AI API Settings saved successfully!");
    setActiveModal('none');
    setSaving(false);
  };

  const openIdentityModal = () => {
    setEditUsername(username);
    setEditDisplayName(displayName);
    setEditAvatarUrl(avatarUrl);
    setActiveModal('identity');
  };

  const saveIdentity = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    let isUpdatingUsername = false;
    let newLastUpdate = lastUsernameUpdate;

    if (editUsername !== username) {
      // Check 28 day restriction
      if (lastUsernameUpdate) {
        const lastUpdate = new Date(lastUsernameUpdate);
        const daysSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);
        if (daysSinceUpdate < 28) {
          toast.error(`You can only change your username every 28 days. Please wait ${Math.ceil(28 - daysSinceUpdate)} more days.`);
          setSaving(false);
          return;
        }
      }
      isUpdatingUsername = true;
      newLastUpdate = new Date().toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update({ 
        username: editUsername,
        display_name: editDisplayName,
        avatar_url: editAvatarUrl,
        ...(isUpdatingUsername ? { last_username_update: newLastUpdate } : {})
      })
      .eq("id", user.id);
    
    if (error) {
      toast.error(`Failed to save profile: ${error.message}`);
    } else {
      setUsername(editUsername);
      setDisplayName(editDisplayName);
      setAvatarUrl(editAvatarUrl);
      if (isUpdatingUsername) setLastUsernameUpdate(newLastUpdate);
      
      toast.success("Profile saved successfully!");
      setActiveModal('none');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteAccount();
      // Server action handles redirect/signout but let's be safe
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 pt-28 md:p-12 md:pt-32 bg-background relative overflow-hidden">
      <FloatingBackground />

      {/* Top CTA Island */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white border-4 border-gray-200 rounded-[2rem] p-4 z-50 flex justify-center items-center shadow-[0_8px_0_0_#e5e7eb]">
        <div className="flex items-center justify-center px-6 py-2 rounded-xl bg-blue-50 text-blue-500 border-2 border-blue-200 font-black w-full cursor-default select-none shadow-sm">
          <User size={18} className="mr-2" /> Profile
        </div>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-6 z-10 relative">

        <div className="flex flex-col gap-4">
          
          <button 
            onClick={openIdentityModal}
            className="w-full bg-white hover:bg-gray-50 border-4 border-gray-200 rounded-3xl p-6 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 text-left">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl border-4 border-gray-100 object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border-4 border-gray-50">
                  <User size={32} />
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-gray-800">{displayName || username || "Anonymous"}</h3>
                <p className="text-sm font-bold text-gray-400">@{username || "username"}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" size={28} />
          </button>

          <button 
            onClick={() => setActiveModal('context')}
            className="w-full bg-white hover:bg-gray-50 border-4 border-gray-200 rounded-3xl p-6 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Global Context</h3>
                <p className="text-sm font-bold text-gray-400">Edit your daily routine instructions</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" size={28} />
          </button>

          <button 
            onClick={() => setActiveModal('byok')}
            className="w-full bg-white hover:bg-gray-50 border-4 border-gray-200 rounded-3xl p-6 flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">AI Model & API Key</h3>
                <p className="text-sm font-bold text-gray-400">Bring your own key & select model</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" size={28} />
          </button>
        </div>

        <div className="mt-8 mb-24 flex flex-col gap-4">
          <Button variant="secondary" fullWidth onClick={handleSignOut}>
            Sign Out
          </Button>
          <button
            onClick={() => setActiveModal('delete')}
            className="w-full bg-red-50 hover:bg-red-100 border-4 border-red-200 text-red-600 rounded-2xl py-4 font-black transition-all active:scale-[0.98]"
          >
            Delete Account
          </button>
        </div>

      </div>

      {/* FULL SCREEN MODALS */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {activeModal === 'context' && (
              <div className="p-6 md:p-12 flex-1 flex flex-col max-w-2xl mx-auto w-full relative h-full overflow-hidden">
                <div className="flex-1 flex flex-col pt-12 overflow-y-auto pb-6 hide-scrollbar">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">Global Context</h2>
                  <p className="text-gray-500 font-bold mb-8">
                    The AI uses this baseline to structure your daily routines. Give it your typical wake up time, work hours, and mandatory habits.
                  </p>
                  
                  <textarea 
                    value={globalContext}
                    onChange={(e) => setGlobalContext(e.target.value)}
                    placeholder="e.g. I wake up around 7am, workout, and work 9-5..."
                    className="w-full flex-1 max-h-[40vh] text-xl font-bold bg-white border-4 border-gray-200 rounded-3xl p-6 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-sm"
                  />
                </div>

                <div className="pt-8 pb-32 flex flex-col gap-4 mt-auto">
                  <Button type="button" variant="primary" fullWidth onClick={saveContext} disabled={saving}>
                    {saving ? "Saving..." : "Save Context"}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => setActiveModal('none')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeModal === 'byok' && (
              <div className="p-6 md:p-12 flex-1 flex flex-col max-w-2xl mx-auto w-full relative h-full overflow-hidden">
                <div className="flex-1 flex flex-col pt-12 overflow-y-auto pb-6 hide-scrollbar">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">AI Settings</h2>
                  <p className="text-gray-500 font-bold mb-8">
                    Bring your own Gemini API key. Stored securely in your browser's local storage.
                  </p>
                  
                  <div className="flex flex-col gap-8">
                    <div>
                      <Input 
                        label="Gemini API Key" 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                        AI Provider
                      </label>
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          className="w-full text-left p-5 rounded-2xl border-4 transition-all font-bold text-lg border-pink-400 bg-pink-50 text-pink-900"
                        >
                          Google (Gemini)
                        </button>
                        <p className="text-xs text-gray-400 font-semibold px-2">
                          More providers (OpenAI, Anthropic) coming soon.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">
                        Model Selection
                      </label>
                      <div className="flex flex-col gap-3">
                        {['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'].map((model) => (
                          <button
                            key={model}
                            type="button"
                            onClick={() => setAiModel(model)}
                            className={cn(
                              "w-full text-left p-5 rounded-2xl border-4 transition-all font-bold text-lg",
                              aiModel === model 
                                ? "border-pink-400 bg-pink-50 text-pink-900" 
                                : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                            )}
                          >
                            {model}
                          </button>
                        ))}
                        <div className="mt-2">
                          <Input 
                            label="Or type a custom model string" 
                            type="text" 
                            value={!['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'].includes(aiModel) ? aiModel : ""}
                            onChange={(e) => setAiModel(e.target.value)}
                            placeholder="e.g. gemini-2.5-pro"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 pb-32 flex flex-col gap-4 mt-auto">
                  <Button type="button" variant="primary" fullWidth onClick={saveBYOK} disabled={saving}>
                    {saving ? "Saving..." : "Save AI Settings"}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => setActiveModal('none')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {activeModal === 'identity' && (
              <div className="p-6 md:p-12 flex-1 flex flex-col max-w-2xl mx-auto w-full relative h-full overflow-hidden">
                <div className="flex-1 flex flex-col pt-12 overflow-y-auto pb-6 hide-scrollbar">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">Edit Profile</h2>
                  <p className="text-gray-500 font-bold mb-8">
                    Customize your public persona. Note: You can only change your @username once every 28 days!
                  </p>
                  
                  <div className="flex flex-col gap-6">
                    <Input 
                      label="Display Name" 
                      type="text" 
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                    <Input 
                      label="@username" 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="johndoe123"
                    />
                    <Input 
                      label="Avatar URL (Optional)" 
                      type="url" 
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="pt-8 pb-32 flex flex-col gap-4 mt-auto">
                  <Button type="button" variant="primary" fullWidth onClick={saveIdentity} disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => setActiveModal('none')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {activeModal === 'delete' && (
              <div className="p-6 md:p-12 flex-1 flex flex-col max-w-2xl mx-auto w-full relative h-full overflow-hidden">
                <div className="flex-1 flex flex-col pt-12 overflow-y-auto pb-6 hide-scrollbar items-center justify-center text-center">
                  <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertOctagon size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800 mb-4">Delete Account?</h2>
                  <p className="text-gray-500 font-bold mb-8 text-lg">
                    Are you absolutely sure? This will permanently erase your profile, all routines, tasks, and journals. This action <strong className="text-red-500">cannot be undone</strong>.
                  </p>
                </div>

                <div className="pt-8 pb-32 flex flex-col gap-4 mt-auto">
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="w-full bg-red-500 hover:bg-red-600 border-b-4 border-red-700 text-white rounded-2xl py-4 font-black transition-all active:translate-y-1 active:border-b-0 disabled:opacity-50"
                  >
                    {saving ? "Deleting..." : "Yes, Delete Everything"}
                  </button>
                  <Button type="button" variant="secondary" fullWidth onClick={() => setActiveModal('none')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
