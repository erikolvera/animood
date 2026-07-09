import NavBar from "@/components/layout/NavBar";

// Every route in the (main) group shares this layout; auth screens live
// in the (auth) group and render without the NavBar.
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
