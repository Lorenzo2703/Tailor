export type Species = "dog" | "cat";
export type Size = "small" | "medium" | "large";
export type Sex = "M" | "F";

export interface Shelter {
  id: string;
  name: string;
  city: string;
  region: string;
  description: string;
  adoptionsCompleted: number;
  verified: boolean;
}

export interface Animal {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  birthDate: string;
  size: Size;
  shelterId: string;
  photos: string[];
  photoAlt: string;
  story: string;
  traits: {
    kids: boolean;
    dogs: boolean;
    cats: boolean;
    apartment: boolean;
  };
  health: {
    microchip: string;
    vaccinated: boolean;
    sterilized: boolean;
    documentsVerified: boolean;
  };
}