"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fill, formatCount } from "@/lib/i18n";

/** The Saved page's lots and searches behind two tabs. Both lists are server-rendered and stay mounted. */
export function SavedTabs({ lots, searches, counts }: { lots: ReactNode; searches: ReactNode; counts: { lots: number; searches: number } }) {
  const { locale, m } = useI18n();
  const words = m.saved;
  return (
    <Tabs defaultValue="lots" className="mt-6">
      <TabsList variant="line" aria-label={words.tabs}>
        <TabsTrigger value="lots">{fill(words.lotsTab, { count: formatCount(locale, counts.lots) })}</TabsTrigger>
        <TabsTrigger value="searches">{fill(words.searchesTab, { count: formatCount(locale, counts.searches) })}</TabsTrigger>
      </TabsList>
      <TabsContent value="lots" keepMounted className="mt-4">
        {lots}
      </TabsContent>
      <TabsContent value="searches" keepMounted className="mt-4">
        {searches}
      </TabsContent>
    </Tabs>
  );
}
