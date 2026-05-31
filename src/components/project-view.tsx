"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Pencil,
  RefreshCw,
  Plus,
  AlertCircle,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Badge, Spinner } from "@/components/ui/misc";
import { PlatformGlyph } from "@/components/ui/platform";
import { useToast } from "@/components/ui/toast";
import {
  PLATFORMS,
  TONES,
  TONE_KEYS,
  STATUS_STEPS,
  statusIndex,
} from "@/lib/content";
import type { Output, Project, Tone } from "@/lib/db/types";
import { cn, formatDate } from "@/lib/utils";

const TIPS = [
  "LinkedIn posts with 3–5 short paragraphs get ~2x the engagement.",
  "Threads that hook in the first line keep 40% more readers to the end.",
  "The best founder content sounds like a DM, not a press release.",
];

export function ProjectView({
  initial,
  toneEnabled,
}: {
  initial: Project;
  toneEnabled: boolean;
}) {
  const [project, setProject] = useState(initial);
  const toast = useToast();
  const done = project.status === "ready" || project.status === "failed";

  // Poll until terminal.
  useEffect(() => {
    if (done) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/projects/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    }, 1200);
    return () => clearInterval(t);
  }, [done, project.id]);

  const updateOutput = useCallback((o: Output) => {
    setProject((p) => ({
      ...p,
      outputs: p.outputs.some((x) => x.platform === o.platform)
        ? p.outputs.map((x) => (x.platform === o.platform ? o : x))
        : [...p.outputs, o],
    }));
  }, []);

  if (project.status === "failed") {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <AlertCircle size={28} className="mx-auto text-error" />
        <h1 className="mt-3 text-lg font-bold">Processing failed</h1>
        <p className="mt-2 text-sm text-muted">{project.error}</p>
        <Link href="/upload" className="mt-6 inline-block">
          <Button>Try again</Button>
        </Link>
      </Card>
    );
  }

  if (project.status !== "ready") {
    return <Processing project={project} />;
  }

  async function copyAll() {
    const text = project.outputs
      .map((o) => `=== ${PLATFORMS[o.platform].label} ===\n${o.content}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    toast("All posts copied to clipboard", "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{project.title}</h1>
          <p className="text-xs text-muted">
            {formatDate(project.createdAt)} · {project.sourceRef}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success">
            <Check size={12} /> Ready to share
          </Badge>
          <Button variant="secondary" size="sm" onClick={copyAll}>
            <Copy size={14} /> Copy all
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {project.outputs.map((o) => (
          <OutputCard
            key={o.platform}
            projectId={project.id}
            output={o}
            toneEnabled={toneEnabled}
            onChange={updateOutput}
          />
        ))}
      </div>

      <Card className="flex items-center justify-between">
        <span className="text-sm text-muted">Got another episode?</span>
        <Link href="/upload">
          <Button>
            <Plus size={16} /> Upload another
          </Button>
        </Link>
      </Card>
    </div>
  );
}

function Processing({ project }: { project: Project }) {
  const current = statusIndex(project.status);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  return (
    <div className="mx-auto max-w-lg py-10">
      <h1 className="text-center text-xl font-bold">Repurposing your content…</h1>
      <p className="mt-1 text-center text-sm text-muted">
        Typically takes 30–90 seconds.
      </p>

      <Card className="mt-8">
        <ol className="space-y-4">
          {STATUS_STEPS.map((step, i) => {
            const state =
              i < current ? "done" : i === current ? "active" : "todo";
            return (
              <li key={step.status} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs",
                    state === "done" &&
                      "border-success bg-success/15 text-success",
                    state === "active" && "border-accent text-accent",
                    state === "todo" && "border-border text-muted-2",
                  )}
                >
                  {state === "done" ? (
                    <Check size={14} />
                  ) : state === "active" ? (
                    <Spinner size={14} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    state === "todo" ? "text-muted" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>

      <p className="mt-6 rounded-lg border border-border bg-surface/50 p-4 text-center text-sm text-muted">
        💡 {tip}
      </p>
    </div>
  );
}

function OutputCard({
  projectId,
  output,
  toneEnabled,
  onChange,
}: {
  projectId: string;
  output: Output;
  toneEnabled: boolean;
  onChange: (o: Output) => void;
}) {
  const toast = useToast();
  const meta = PLATFORMS[output.platform];
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(output.content);
  const [tone, setTone] = useState<Tone>(output.tone);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    await navigator.clipboard.writeText(output.content);
    setCopied(true);
    toast("Post copied to clipboard", "success");
    setTimeout(() => setCopied(false), 1000);
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: output.platform, content: draft }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onChange({ ...output, content: draft });
      setEditing(false);
      toast("Saved", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(nextTone: Tone) {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: output.platform, tone: nextTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.output);
      setDraft(data.output.content);
      setTone(nextTone);
      toast("Regenerated", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const words = output.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Card className="overflow-hidden p-0">
      {/* head */}
      <div className="flex items-center gap-3.5 border-b border-border px-[22px] py-[18px]">
        <PlatformGlyph id={output.platform} size={40} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15.5px] font-semibold">{meta.label}</span>
          <span className="font-mono text-[11.5px] text-muted-2">
            {meta.blurb}
          </span>
        </div>
        <Badge>
          <Sparkle size={11} className="text-accent" fill="currentColor" strokeWidth={0} />
          {TONES[output.tone].label}
        </Badge>
      </div>

      {/* body */}
      {editing ? (
        <div className="p-[22px]">
          <Textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[180px] text-[14.5px]"
          />
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words px-[22px] py-5 text-[14.5px] leading-[1.62] text-foreground">
          {output.content}
        </div>
      )}

      {/* foot */}
      <div className="flex flex-wrap items-center gap-2.5 border-t border-border px-[22px] py-3.5">
        {editing ? (
          <>
            <Button size="sm" loading={busy} onClick={save}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(output.content);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant={copied ? "secondary" : "primary"}
              onClick={copy}
            >
              {copied ? (
                <Check size={14} className="text-success" />
              ) : (
                <Copy size={14} />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={busy}
              onClick={() => regenerate(tone)}
            >
              <RefreshCw size={14} /> Regenerate
            </Button>
            {toneEnabled && (
              <select
                value={tone}
                disabled={busy}
                onChange={(e) => regenerate(e.target.value as Tone)}
                className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface-3 px-2 font-mono text-[11px] uppercase tracking-[0.06em] text-foreground"
                aria-label="Regenerate with tone"
              >
                {TONE_KEYS.map((t) => (
                  <option key={t} value={t}>
                    {TONES[t].label}
                  </option>
                ))}
              </select>
            )}
            <span className="ml-auto font-mono text-[11px] text-muted-2">
              {words} words
            </span>
          </>
        )}
      </div>
    </Card>
  );
}
