import { redirect } from "next/navigation";

export default function CoachMemberProgramsPage() {
  redirect("/coach/programs?scope=tailored");
}
