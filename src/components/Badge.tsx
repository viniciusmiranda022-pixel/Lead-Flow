import React from "react";
import { getInterestMeta, getStageMeta } from "../theme/meta";

type Props = {
  kind: "status" | "interest";
  value?: string | null;
  className?: string;
};

export function Badge({ kind, value, className }: Props) {
  const meta =
    kind === "status"
      ? getStageMeta(value)
      : getInterestMeta(value);

  if (!meta) return null;

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: meta.tint,
    color: meta.strong,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: "14px",
    whiteSpace: "nowrap",
  };

  return (
    <span style={style} className={className}>
      <span aria-hidden="true">{meta.emoji}</span>
      <span>{meta.label}</span>
    </span>
  );
}
