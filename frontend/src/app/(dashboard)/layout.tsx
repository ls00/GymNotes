import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen text-white">
      <BottomNav />
      <div className="mx-auto w-full max-w-7xl pb-28 md:px-8 md:pb-12 md:pt-8">
        {children}
      </div>
    </div>
  );
}
