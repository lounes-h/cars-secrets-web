"use client";

import { useState, type ReactNode } from "react";

/**
 * The lot's photos and its damage map, one at a time behind two tabs. Both panels are
 * server-rendered; only the switch between them runs in the browser.
 */
export function GalleryTabs({ photos, damageMap }: { photos: ReactNode; damageMap: ReactNode }) {
  const [tab, setTab] = useState<"photos" | "damage-map">("photos");
  const tabs = [
    { id: "photos", label: "Photos", panel: photos },
    { id: "damage-map", label: "Damage map", panel: damageMap },
  ] as const;

  return (
    <div className="min-w-0">
      <div role="tablist" aria-label="Gallery" className="mb-3 flex gap-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`btn ${tab === id ? "btn-primary" : "btn-outline"}`}
          >
            {id === "damage-map" && <span aria-hidden="true">✦</span>}
            {label}
          </button>
        ))}
      </div>
      {tabs.map(({ id, panel }) => (
        <div key={id} role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={tab !== id}>
          {panel}
        </div>
      ))}
    </div>
  );
}
