'use client';

import { useState, type ComponentType } from 'react';
import { Dice6 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AnimeWithMatchInfo } from '@/features/match/types';

type Props = {
  candidates: AnimeWithMatchInfo[];
  usernames: string[];
};

type RandomPickDialogComponent = ComponentType<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: AnimeWithMatchInfo[];
  usernames: string[];
}>;

export function RandomPickButton({ candidates, usernames }: Props) {
  const [open, setOpen] = useState(false);
  const [DialogComponent, setDialogComponent] = useState<RandomPickDialogComponent | null>(null);
  const disabled = candidates.length === 0;

  const openDialog = async () => {
    if (disabled) return;
    const mod = await import('./random-pick-dialog');
    setDialogComponent(() => mod.RandomPickDialog);
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        size="lg"
        className="h-11 w-full"
        onClick={openDialog}
        disabled={disabled}
      >
        <Dice6 data-icon="inline-start" className="size-4" />
        Random pick
      </Button>
      {open && DialogComponent && (
        <DialogComponent
          open={open}
          onOpenChange={setOpen}
          candidates={candidates}
          usernames={usernames}
        />
      )}
    </>
  );
}
