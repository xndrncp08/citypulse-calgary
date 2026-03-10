// Append to bikesApi — this file adds the usage method that BikesPage needs
// The full bikesApi is defined in services/api.ts
// This is a type augmentation — the actual implementation is in the main api.ts

export interface BikeReading {
  id: string;
  counterId: string;
  date: string;
  bikeCount: number;
  counter?: { locationName: string };
}
