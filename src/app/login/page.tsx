import type { Metadata } from "next";
import { Card } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { LoginForm } from "@/features/auth/login-form";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.auth.title, robots: { index: false } };
}

export default async function LoginPage() {
  const t = (await getI18n()).m.auth;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
      <h1 className="text-xl font-semibold tracking-tight">{site.name}</h1>
      <p className="mt-1 mb-5 text-muted">{t.intro}</p>
      <Card className="p-5">
        <LoginForm />
      </Card>
    </main>
  );
}
