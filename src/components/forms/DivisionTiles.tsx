import { DIVISIONS } from "../../constants/divisions";
import type { DivisionId } from "../../constants/divisions";

interface DivisionTilesProps {
  selectedId: string;
  onChange: (id: DivisionId | "all") => void;
  label?: string;
  error?: string;
  showAll?: boolean;
  allowedIds?: string[];
}

export default function DivisionTiles({ selectedId, onChange, label, error, showAll, allowedIds }: DivisionTilesProps) {
  let items = showAll 
    ? [{ id: "all", label: "All Sectors", icon: "🏢", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", color: "#64748b" }, ...DIVISIONS]
    : DIVISIONS;

  if (allowedIds && allowedIds.length > 0) {
    items = items.filter(div => allowedIds.includes(div.id));
  }

  return (
    <div className="space-y-3">
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>}
      <div className={`grid grid-cols-1 md:grid-cols-${showAll ? '4' : '3'} gap-4`}>
        {items.map((div: any) => {
          const isSelected = selectedId === div.id;
          return (
            <button
              key={div.id}
              type="button"
              onClick={() => onChange(div.id)}
              className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-300 group ${
                isSelected
                  ? `${div.bg} ${div.border} scale-[1.02] shadow-md ring-4 ring-offset-2 ring-opacity-10`
                  : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
              }`}
              style={{
                "--ring-color": div.color,
              } as any}
            >
              <div
                className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl mb-4 transition-transform duration-300 ${
                  isSelected ? "scale-110 rotate-3" : "group-hover:scale-110"
                }`}
                style={{ backgroundColor: isSelected ? "white" : `${div.bg}`, filter: isSelected ? "none" : "grayscale(0.5)" }}
              >
                {div.icon}
              </div>
              <span className={`font-bold text-sm ${isSelected ? div.text : "text-slate-600"}`}>
                {div.label}
              </span>
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: div.color }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
