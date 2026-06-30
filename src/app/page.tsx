import { redirect } from "next/navigation";

/** Landing → builder. The builder is the app's home surface. */
export default function Home() {
  redirect("/builder");
}
