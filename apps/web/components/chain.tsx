import clsx from "clsx";

export interface ChainProps {
  error?: boolean;
}
export function Chain({ error }: ChainProps) {
  return (
    <div className="flex items-center">
      <div
        className={clsx("mr-1 h-2 w-2 rounded-full bg-green-400", {
          "bg-rose-500": error,
        })}
      ></div>
      <div className="text-xs text-slate-600">0</div>
    </div>
  );
}
