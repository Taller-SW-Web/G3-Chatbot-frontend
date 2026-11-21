import { AppShell } from "@/shared/ui/shell/AppShell";
import { ChatPage } from "@/modules/mod-chat/public";

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
