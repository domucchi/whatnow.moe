import { Avatar } from './avatar';

type Props = {
  // Usernames in the full user-set ordering, filtered to those matched on this
  // anime. The `colorIndex` should be the user's original position in the list
  // so the palette stays stable regardless of who matched.
  entries: { username: string; colorIndex: number }[];
  size?: number;
  overlap?: number;
  title?: string;
};

export function AvatarStack({ entries, size = 22, overlap = 7, title }: Props) {
  return (
    <div className="inline-flex items-center" title={title}>
      {entries.map((e, i) => (
        <div
          key={e.username}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            position: 'relative',
            zIndex: entries.length - i,
          }}
        >
          <Avatar username={e.username} colorIndex={e.colorIndex} size={size} ring />
        </div>
      ))}
    </div>
  );
}
