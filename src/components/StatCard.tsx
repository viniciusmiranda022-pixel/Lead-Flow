import React from "react";
import { getStageMeta } from "../theme/meta";

type Props = {
  title: string;
  value: number | string;
  stage?: string | null;
  subtitle?: string;
};

export function StatCard({ title, value, stage, subtitle }: Props) {
  const meta = stage ? getStageMeta(stage) : null;

  const wrapper: React.CSSProperties = {
    padding: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  };

  const left: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const titleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" };
  const valueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 900, color: "#0F172A", lineHeight: "30px" };
  const subStyle: React.CSSProperties = { fontSize: 12, color: "#64748B" };

  const iconBox: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: meta ? meta.tint : "#E2E8F0",
    color: meta ? meta.strong : "#334155",
    fontSize: 18,
    fontWeight: 900,
  };

  return (
    <div className="lf-card lf-card-hover" style={{ width: "100%" }}>
      <div style={wrapper}>
        <div style={left}>
          <div style={titleStyle}>{title}</div>
          <div style={valueStyle}>{value}</div>
          {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
        </div>

        <div style={iconBox} aria-hidden="true">
          {meta ? meta.emoji : "👥"}
        </div>
      </div>
    </div>
  );
}
