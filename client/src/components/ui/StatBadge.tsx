interface StatBadgeProps {
  needed: number;
  committed: number;
  unit: string;
}

export function StatBadge({ needed, committed, unit }: StatBadgeProps) {
  const color =
    committed >= needed ? 'text-green-600 bg-green-50' :
    committed > 0 ? 'text-orange-600 bg-orange-50' :
    'text-red-500 bg-red-50';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium ${color}`}>
      {committed} / {needed} {unit}
    </span>
  );
}
