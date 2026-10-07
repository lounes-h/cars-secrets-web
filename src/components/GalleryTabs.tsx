"use client";

import { SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The lot's photos and its damage map, one at a time behind two tabs. Both panels are
 * server-rendered and stay mounted; only the switch between them runs in the browser.
 */
export function GalleryTabs({ photos, damageMap }: { photos: ReactNode; damageMap: ReactNode }) {
  const words = useI18n().m.lotPage;
  return (
    <Tabs defaultValue="photos" className="min-w-0">
      <TabsList variant="line" aria-label={words.gallery}>
        <TabsTrigger value="photos">{words.photosTab}</TabsTrigger>
        <TabsTrigger value="damage-map">
          <SparklesIcon aria-hidden="true" />
          {words.damageMapTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="photos" keepMounted>
        {photos}
      </TabsContent>
      <TabsContent value="damage-map" keepMounted>
        {damageMap}
      </TabsContent>
    </Tabs>
  );
}
