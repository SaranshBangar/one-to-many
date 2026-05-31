import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { ProjectView } from "@/components/project-view";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const db = await getDb();
  const project = await db.getProject(id);
  if (!project || project.userId !== user.id) notFound();

  return (
    <ProjectView initial={project} toneEnabled={PLANS[user.plan].toneSelector} />
  );
}
