"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Link2, Upload, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { PlatformGlyph, Eyebrow } from "@/components/ui/platform";
import { useToast } from "@/components/ui/toast";
import { TONES, TONE_KEYS, PLATFORMS, PLATFORM_KEYS } from "@/lib/content";
import type { Platform, SourceType, Tone } from "@/lib/db/types";
import { cn } from "@/lib/utils";

type Tab = SourceType;
const TABS: { id: Tab; label: string; icon: typeof Link2 }[] = [
  { id: "youtube", label: "YouTube link", icon: Link2 },
  { id: "file", label: "Upload file", icon: Upload },
  { id: "transcript", label: "Paste transcript", icon: FileText },
];

export function UploadForm({
  defaultTone,
  toneEnabled,
  maxPlatforms,
}: {
  defaultTone: Tone;
  toneEnabled: boolean;
  maxPlatforms: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("youtube");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [tone, setTone] = useState<Tone>(defaultTone);
  const [platforms, setPlatforms] = useState<Platform[]>([...PLATFORM_KEYS]);
  const [submitting, setSubmitting] = useState(false);

  function togglePlatform(p: Platform) {
    setPlatforms((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    );
  }

  const ready =
    platforms.length > 0 &&
    ((tab === "youtube" && /youtu/.test(url)) ||
      (tab === "file" && !!fileName) ||
      (tab === "transcript" && transcript.trim().length >= 20));

  async function submit() {
    if (platforms.length > maxPlatforms) {
      toast(`Your plan allows up to ${maxPlatforms} platforms.`, "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: tab,
          sourceRef: tab === "youtube" ? url : tab === "file" ? fileName : "",
          transcript: tab === "transcript" ? transcript : undefined,
          tone,
          platforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/projects/${data.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Eyebrow>Step 1 of 2</Eyebrow>
        <h1 className="display text-3xl">
          Upload your episode, webinar, or video
        </h1>
        <p className="text-muted">
          Paste a link, drop a file, or bring your own transcript. We handle the
          rest.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
              tab === id
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <Card>
        {tab === "youtube" && (
          <div className="space-y-2">
            <Label>Paste YouTube link</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              inputMode="url"
            />
            <p className="text-xs text-muted">
              We pull the audio and transcribe it locally.
            </p>
          </div>
        )}

        {tab === "file" && (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-12 text-center transition-colors hover:border-accent",
              fileName && "border-accent",
            )}
          >
            <Upload size={28} className="text-muted" />
            <span className="text-sm">
              {fileName || "Drag a MP4, MP3, or audio file here"}
            </span>
            <span className="text-xs text-muted">or click to browse</span>
            <input
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <span className="mt-1 text-xs text-muted-2">
              MP4 · MP3 · WAV · M4A
            </span>
          </label>
        )}

        {tab === "transcript" && (
          <div className="space-y-2">
            <Label>Paste your transcript or blog post</Label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the episode transcript here…"
              className="min-h-[200px]"
            />
            <p className="text-right text-xs text-muted">
              {transcript.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}
      </Card>

      {/* Tone */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">How do you sound?</h2>
          {!toneEnabled && (
            <span className="text-xs text-muted">
              Tone selector is a Pro feature
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {TONE_KEYS.map((t) => (
            <button
              key={t}
              disabled={!toneEnabled && t !== "authentic"}
              onClick={() => setTone(t)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors disabled:opacity-40",
                tone === t
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-muted-2",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{TONES[t].label}</span>
                {tone === t && <Check size={16} className="text-accent" />}
              </div>
              <p className="mt-1 text-xs text-muted">{TONES[t].description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <h2 className="mb-2 text-sm font-semibold">Platforms</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLATFORM_KEYS.map((p) => {
            const on = platforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  on ? "border-accent bg-accent/10" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border",
                    on ? "border-accent bg-accent text-accent-fg" : "border-muted-2",
                  )}
                >
                  {on && <Check size={14} />}
                </span>
                <PlatformGlyph id={p} size={24} />
                <span className="text-sm font-medium">{PLATFORMS[p].short}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={!ready || submitting}
        onClick={submit}
      >
        Process content
      </Button>
    </div>
  );
}
