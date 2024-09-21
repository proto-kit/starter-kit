export interface ChainProps {
  height?: string;
}

export function Chain({ height }: ChainProps) {
  return (
    <div className="flex items-center">
      <div className={"mr-1 h-2 w-2 rounded-full bg-green-400 dark:bg-green-400"}></div>
      <div className="text-xs text-slate-600 dark:text-white">{height ?? "-"}</div>
    </div>
  );
}
