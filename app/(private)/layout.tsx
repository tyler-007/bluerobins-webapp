export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-row min-h-screen">
      <div className="w-[256px] bg-gray-200">{/* <Sidebar /> */}</div>
      <main className="flex-1 overflow-auto px-4 pb-20">{children}</main>
    </div>
  );
}
