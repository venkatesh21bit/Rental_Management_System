import { Navbar } from '@/components/end-user/nav_bar';

export default function EndUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="py-6">
        {children}
      </main>
    </div>
  );
}
