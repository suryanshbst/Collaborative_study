import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function DirectRoomRedirect({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/room/${resolvedParams.roomId}`);
}
