import { getSession } from "@/lib/auth";
import { activeLicense } from "@/lib/license";

export async function GET() {
  const session = await getSession();
  const pro = session ? Boolean(await activeLicense(session.user.id)) : false;
  return Response.json(
    { signedIn: Boolean(session), pro },
    { headers: { "cache-control": "private, no-store" } },
  );
}
