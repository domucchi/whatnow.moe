'use client';

import { useState } from 'react';
import { Dice6 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AnimeWithMatchInfo } from '@/features/match/types';

import { RandomPickDialog } from './random-pick-dialog';

type Props = {
  candidates: AnimeWithMatchInfo[];
  usernames: string[];
};

export function RandomPickButton({ candidates, usernames }: Props) {
  const [open, setOpen] = useState(false);
  const disabled = candidates.length === 0;
  return (
    <>
      <Button
        type="button"
        size="lg"
        className="h-11 w-full"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Dice6 data-icon="inline-start" className="size-4" />
        Random pick
      </Button>
      <RandomPickDialog
        open={open}
        onOpenChange={setOpen}
        candidates={candidates}
        usernames={usernames}
      />
    </>
  );
}
