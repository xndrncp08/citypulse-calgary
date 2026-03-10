/**
 * Development seed — populates the database with realistic Calgary data
 * for local development without requiring the data pipeline to be running.
 *
 * Usage: npx tsx src/database/seed.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { addHours, subDays, subHours } from "date-fns";

const prisma = new PrismaClient();

const INCIDENT_TYPES = ["ACCIDENT", "STALL", "CONSTRUCTION", "HAZARD", "ROAD_CLOSURE", "CONGESTION"];
const LOCATIONS = [
  { lat: 51.0447, lng: -114.0719, desc: "Downtown Core" },
  { lat: 51.0784, lng: -114.1319, desc: "University District" },
  { lat: 51.1215, lng: -114.1627, desc: "Northwest Calgary" },
  { lat: 50.9615, lng: -113.9808, desc: "Southeast Calgary" },
  { lat: 51.0712, lng: -114.0467, desc: "Beltline" },
  { lat: 51.0899, lng: -114.0714, desc: "Kensington" },
  { lat: 51.0542, lng: -114.0681, desc: "Mission" },
  { lat: 51.1238, lng: -114.0100, desc: "Calgary Airport" },
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function seedTrafficIncidents() {
  const incidents = [];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const loc = pick(LOCATIONS);
    const type = pick(INCIDENT_TYPES);
    const startTime = subHours(now, randomBetween(0, 72));
    const ended = Math.random() > 0.3;

    incidents.push({
      incidentId: `SEED-${i}-${Date.now()}`,
      description: `${type} reported on ${loc.desc}`,
      latitude: loc.lat + randomBetween(-0.02, 0.02),
      longitude: loc.lng + randomBetween(-0.02, 0.02),
      incidentType: type,
      startTime,
      endTime: ended ? addHours(startTime, randomBetween(0.5, 4)) : null,
      locationDescription: loc.desc,
    });
  }

  await prisma.trafficIncident.createMany({ data: incidents, skipDuplicates: true });
  console.log(`Seeded ${incidents.length} traffic incidents`);
}

async function seedWeather() {
  const readings = [];
  const now = new Date();

  for (let i = 0; i < 48; i++) {
    readings.push({
      timestamp: subHours(now, i),
      temperature: randomBetween(-5, 25),
      windSpeed: randomBetween(0, 50),
      precipitation: Math.random() > 0.8 ? randomBetween(0, 10) : 0,
      humidity: randomBetween(40, 90),
    });
  }

  await prisma.weatherReading.createMany({ data: readings, skipDuplicates: true });
  console.log(`Seeded ${readings.length} weather readings`);
}

async function seedAirQuality() {
  const stations = ["Calgary Central", "Calgary Northwest", "Calgary Southeast"];
  const readings = [];
  const now = new Date();

  for (const station of stations) {
    for (let i = 0; i < 24; i++) {
      readings.push({
        timestamp: subHours(now, i),
        aqhi: randomBetween(1, 8),
        stationName: station,
        latitude: 51.0447 + randomBetween(-0.1, 0.1),
        longitude: -114.0719 + randomBetween(-0.1, 0.1),
      });
    }
  }

  await prisma.airQualityReading.createMany({ data: readings, skipDuplicates: true });
  console.log(`Seeded ${readings.length} air quality readings`);
}

async function seedTransit() {
  const routes = [
    { routeId: "1", routeName: "Bowness/Forest Lawn" },
    { routeId: "2", routeName: "University/Erlton" },
    { routeId: "3", routeName: "Whitehorn/Killarney" },
    { routeId: "7", routeName: "Kingsland/Dalhousie" },
    { routeId: "9", routeName: "Bridgeland/Ramsay" },
    { routeId: "17", routeName: "Centre Street South" },
    { routeId: "301", routeName: "MAX Yellow" },
    { routeId: "302", routeName: "MAX Orange" },
    { routeId: "305", routeName: "MAX Red" },
  ];

  await prisma.transitRoute.createMany({ data: routes, skipDuplicates: true });
  console.log(`Seeded ${routes.length} transit routes`);

  const stops = LOCATIONS.map((loc, i) => ({
    stopId: `STOP-${i + 1}`,
    stopName: `${loc.desc} Station`,
    latitude: loc.lat,
    longitude: loc.lng,
  }));

  await prisma.transitStop.createMany({ data: stops, skipDuplicates: true });
  console.log(`Seeded ${stops.length} transit stops`);
}

async function seedBikeCounters() {
  for (const loc of LOCATIONS.slice(0, 5)) {
    const counter = await prisma.bikeCounter.upsert({
      where: { counterId: `BC-${loc.desc.replace(/\s+/g, "-")}` },
      create: {
        counterId: `BC-${loc.desc.replace(/\s+/g, "-")}`,
        locationName: `${loc.desc} Bike Counter`,
        latitude: loc.lat,
        longitude: loc.lng,
      },
      update: {},
    });

    const readings = [];
    for (let d = 0; d < 30; d++) {
      readings.push({
        counterId: counter.id,
        date: subDays(new Date(), d),
        bikeCount: Math.floor(randomBetween(50, 800)),
      });
    }
    await prisma.bikeReading.createMany({ data: readings, skipDuplicates: true });
  }
  console.log("Seeded bike counters and readings");
}

async function main() {
  console.log("Seeding database...\n");
  await seedTrafficIncidents();
  await seedWeather();
  await seedAirQuality();
  await seedTransit();
  await seedBikeCounters();
  console.log("\nSeed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
