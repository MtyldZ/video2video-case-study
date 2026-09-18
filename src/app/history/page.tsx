import type { Metadata } from "next";
import { HistoryList } from "@/components/HistoryList";

export const metadata: Metadata = { title: "History · Video to Video" };

export default function HistoryPage() {
  return <HistoryList />;
}
