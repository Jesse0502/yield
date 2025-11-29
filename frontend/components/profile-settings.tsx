"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { supabase } from "@/lib/supabase"
import { setSession } from "@/lib/store/slices/authSlice"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function ProfileSettings() {
  const dispatch = useAppDispatch()
  const { user, token } = useAppSelector((state) => state.auth)
  const [fullName, setFullName] = useState(
    ((user?.user_metadata?.full_name as string) || "").trim()
  )
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null)
  const [notificationPrefs, setNotificationPrefs] = useState({
    product: true,
    digests: false,
    memoryAlerts: true,
  })

  const initials = useMemo(() => {
    const source = fullName || user?.email || ""
    return source
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [fullName, user])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setStatus(null)
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      })
      if (error) throw error
      if (!data.user) {
        throw new Error("Supabase updateUser response did not include user payload.")
      }

      const nextToken = token ?? data.session?.access_token ?? null
      if (!nextToken) {
        console.warn("Supabase updateUser did not return a session; retaining existing auth token.")
      }

      dispatch(
        setSession({
          user: data.user,
          token: nextToken,
        })
      )
      setStatus({ type: "success", message: "Profile updated successfully." })
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Failed to update profile." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 pb-6">
      <div>
        <h2 className="text-lg font-mono font-semibold text-white">Profile & Settings</h2>
        <p className="text-sm text-gray-400">
          Manage your identity, preferences, and privacy across yield.
        </p>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
            status.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/40 bg-red-500/10 text-red-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-base">Identity</CardTitle>
            <CardDescription>Basic info used across your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C586C0] to-cyan-500 flex items-center justify-center text-xl font-semibold text-white">
                {initials || "YY"}
              </div>
              <div className="text-sm text-gray-400">
                <p>Avatar generated from your initials.</p>
                <p>Custom uploads coming soon.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-xs uppercase tracking-widest text-gray-400">
                Full Name
              </Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ada Lovelace"
                className="bg-slate-950/60 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-gray-400">Email</Label>
              <Input
                value={user?.email ?? ""}
                readOnly
                className="bg-slate-900/40 border-white/10 text-gray-400"
              />
              <p className="text-xs text-gray-500">
                Email changes are handled via Supabase dashboard.
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              className="w-full bg-gradient-to-r from-[#C586C0] to-cyan-500 text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-slate-900/40 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-base">Workspace Preferences</CardTitle>
            <CardDescription>Tune how yield behaves on your devices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Product Updates",
                  desc: "Receive curated release notes and onboarding tips.",
                  key: "product",
                },
                {
                  title: "Weekly Digests",
                  desc: "One email summarizing your memories and actions.",
                  key: "digests",
                },
                {
                  title: "Memory Alerts",
                  desc: "Push notifications when yield stores something important.",
                  key: "memoryAlerts",
                },
              ].map((pref) => (
                <div
                  key={pref.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 p-4"
                >
                  <div>
                    <p className="text-sm text-white">{pref.title}</p>
                    <p className="text-xs text-gray-500">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                    onCheckedChange={(checked) =>
                      setNotificationPrefs((prev) => ({ ...prev, [pref.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Danger Zone</h3>
              <p className="text-xs text-gray-500">
                Export or purge personal data. These actions are irreversible.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-white/20 text-white/80 hover:bg-white/5">
                  Export .json
                </Button>
                <Button variant="destructive" className="bg-red-600/80 hover:bg-red-600 text-white">
                  Clear memories
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

