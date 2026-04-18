import { UsernameListForm } from '@/features/match/components/username-list-form';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">whatnow.moe</h1>
        <p className="text-muted-foreground text-lg">
          Find anime you and your friends all want to watch.
        </p>
      </div>
      <UsernameListForm />
    </main>
  );
}
