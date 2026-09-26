import { AnatomyLayer } from '@/types/anatomy';

/** Shared visual key. These colors distinguish tissues; they are not diagnostic. */
export const layerPresentation: Record<AnatomyLayer, { label: string; color: string }> = {
  [AnatomyLayer.Skin]: { label: 'Skin & nails', color: '#c69c85' },
  [AnatomyLayer.Fat]: { label: 'Fat pads', color: '#e6c378' },
  [AnatomyLayer.Fascia]: { label: 'Fascia', color: '#b9b8cb' },
  [AnatomyLayer.Muscle]: { label: 'Muscles', color: '#d7807d' },
  [AnatomyLayer.Tendon]: { label: 'Tendons', color: '#c6d6dc' },
  [AnatomyLayer.Ligament]: { label: 'Ligaments', color: '#95bcb5' },
  [AnatomyLayer.Nerve]: { label: 'Nerves', color: '#f6cf65' },
  [AnatomyLayer.Artery]: { label: 'Arteries', color: '#ee6262' },
  [AnatomyLayer.Vein]: { label: 'Veins', color: '#719ae1' },
  [AnatomyLayer.Bone]: { label: 'Bones', color: '#e8ddc6' },
};

export function categoryLabel(category: string) {
  return layerPresentation[category as AnatomyLayer]?.label ?? category;
}
