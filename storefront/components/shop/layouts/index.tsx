import { FieldManualCatalog, FieldManualHome } from "./FieldManual";
import { GarrisonCatalog, GarrisonHome } from "./Garrison";
import { QuartermasterCatalog, QuartermasterHome } from "./Quartermaster";
import { ShowroomCatalog, ShowroomHome } from "./Showroom";
import type { CatalogProps, HomeProps } from "./types";

// To add a layout: write a FooHome and FooCatalog, add them here, and list it in LAYOUTS (lib/themes.ts).
const VIEWS: Record<string, { Home: (p: HomeProps) => React.ReactNode; Catalog: (p: CatalogProps) => React.ReactNode }> = {
  garrison: { Home: GarrisonHome, Catalog: GarrisonCatalog },
  "field-manual": { Home: FieldManualHome, Catalog: FieldManualCatalog },
  showroom: { Home: ShowroomHome, Catalog: ShowroomCatalog },
  quartermaster: { Home: QuartermasterHome, Catalog: QuartermasterCatalog },
};

export const viewsFor = (layout: string) => VIEWS[layout] ?? VIEWS.garrison;
