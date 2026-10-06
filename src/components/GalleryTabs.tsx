import { SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The lot's photos and its damage map, one at a time behind two tabs. Both panels are
 * server-rendered and stay mounted; only the switch between them runs in the browser.
 */
export function GalleryTabs({ photos, damageMap }: { photos: ReactNode; damageMap: ReactNode }) {
  return (
    <Tabs defaultValue="photos" className="min-w-0">
      <TabsList variant="line" aria-label="Gallery">
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="damage-map">
          <SparklesIcon aria-hidden="true" />
          Damage map
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
