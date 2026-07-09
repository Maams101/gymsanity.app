import { redirect } from "next/navigation";
import { CheckoutPoller } from "@/components/CheckoutPoller";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";

export default async function PostCheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/post-checkout");

  const active = await getActiveMembership(session.sub);
  if (active) {
    redirect("/today?checkout=success");
  }

  return <CheckoutPoller />;
}
