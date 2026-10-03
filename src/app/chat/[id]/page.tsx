import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { ChatPage } from "@/adapters/inbound/pages/ChatPage";

export default async function ChatRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell initialScreen="chat" conversationId={id}>
      <ChatPage conversationId={id} />
    </AppShell>
  );
}
