import { getSessionUser } from "@/lib/session";
import { PLANS } from "@/lib/plans";
import { UploadForm } from "@/components/upload-form";

export default async function UploadPage() {
  const user = (await getSessionUser())!;
  const plan = PLANS[user.plan];
  return (
    <UploadForm
      defaultTone={user.defaultTone}
      toneEnabled={plan.toneSelector}
      maxPlatforms={plan.maxPlatforms}
    />
  );
}
