import type { PropsWithChildren } from "react";
import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";

export default function Layout({ children }: PropsWithChildren<unknown>) {
  return (
    <div>
      <Header />
      {children}
      <Footer></Footer>
    </div>
  );
}
