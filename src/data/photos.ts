// Sample photos for the prototype (supplied by the team from Canva). Pets and people without a photo fall back
// to a neutral placeholder. In the real app these would be uploaded images stored with each record.
import type { ImageSourcePropType } from 'react-native';

export const PET_PHOTOS: Record<string, ImageSourcePropType> = {
  p1: require('../../assets/photos/p1.jpg'),
  p2: require('../../assets/photos/p2.jpg'),
  p3: require('../../assets/photos/p3.jpg'),
  p4: require('../../assets/photos/p4.jpg'),
  p5: require('../../assets/photos/p5.jpg'),
  p6: require('../../assets/photos/p6.jpg'),
  p7: require('../../assets/photos/p7.jpg'),
  p8: require('../../assets/photos/p8.jpg'),
  p9: require('../../assets/photos/p9.jpg'),
  p10: require('../../assets/photos/p10.jpg'),
};

/** 4:3 versions with headroom, used for the pet profile header. */
export const PET_COVERS: Record<string, ImageSourcePropType> = {
  p1: require('../../assets/photos/p1_wide.jpg'),
  p2: require('../../assets/photos/p2_wide.jpg'),
  p3: require('../../assets/photos/p3_wide.jpg'),
  p4: require('../../assets/photos/p4_wide.jpg'),
  p5: require('../../assets/photos/p5_wide.jpg'),
  p6: require('../../assets/photos/p6_wide.jpg'),
  p7: require('../../assets/photos/p7_wide.jpg'),
  p8: require('../../assets/photos/p8_wide.jpg'),
  p9: require('../../assets/photos/p9_wide.jpg'),
  p10: require('../../assets/photos/p10_wide.jpg'),
};

export const PEOPLE_PHOTOS: Record<string, ImageSourcePropType> = {
  'Maria Santos': require('../../assets/photos/maria.jpg'),
  'Dr. Elena Ybañez': require('../../assets/photos/elena.jpg'),
};

export const SCENES = {
  welcome: require('../../assets/photos/welcome.jpg') as ImageSourcePropType,
  welcomePets: require('../../assets/photos/welcome_pets.png') as ImageSourcePropType,
  clinic: require('../../assets/photos/clinic.jpg') as ImageSourcePropType,
  heroDog: require('../../assets/photos/hero_dog.png') as ImageSourcePropType,
};

/** Sample files used by the demo documents, chat photos and payment proofs. PDFs use an image of their first page. */
export const SAMPLE_FILES: Record<string, ImageSourcePropType> = {
  vaccCard: require('../../assets/samples/vaccination-card.jpg'),
  labPage: require('../../assets/samples/lab-result-page.png'),
  ewalletProof: require('../../assets/samples/ewallet-proof.png'),
  bankProof: require('../../assets/samples/bank-proof.png'),
  bingoEar: require('../../assets/photos/p1.jpg'),
};

/** A pet's photo: the one uploaded for it, else the sample photo. `cover` picks the wide header version. */
export function petPhoto(pet: { id?: string; photo?: string }, cover?: boolean): ImageSourcePropType | undefined {
  if (pet.photo) return { uri: pet.photo };
  if (!pet.id) return undefined;
  return (cover ? PET_COVERS : PET_PHOTOS)[pet.id];
}
