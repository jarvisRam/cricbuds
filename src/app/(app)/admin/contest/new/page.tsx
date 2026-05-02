import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewContestForm } from "@/components/admin/new-contest-form";

export default async function NewContestPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Create Contest</h1>
      <NewContestForm />
    </div>
  );
}
