import { getChannelStats } from "@/lib/db/queries";
import { ChannelCard } from "@/components/channel-card";

export default async function ChannelsPage() {
  const channels = await getChannelStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Channels</h1>
        <p className="mt-1 text-muted-foreground">
          Compare sentiment across tracked YouTube channels
        </p>
      </div>

      {channels.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No channels tracked yet. Run the pipeline to get started.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => (
            <ChannelCard
              key={ch.handle}
              handle={ch.handle}
              title={ch.title}
              totalComments={ch.totalComments}
              positive={ch.positive}
              neutral={ch.neutral}
              negative={ch.negative}
            />
          ))}
        </div>
      )}
    </div>
  );
}
