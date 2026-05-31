import { redirect } from "next/navigation";

// The validated releases catalog now lives on /movies (with filters and
// pagination). Keep this route as a permanent redirect for old links/bookmarks.
export default function NowPlayingPage() {
  redirect("/movies");
}
