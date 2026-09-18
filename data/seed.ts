import type { StaffShipment, Cargo, Truck, DemoRoute } from "@/types";

// ─── Seed Shipments ─────────────────────────────────────────────
export const SEED_SHIPMENTS: StaffShipment[] = [
  { id: "SHP-2048", code: "PGB-HYD-2048-X7", cargoId: "CRG-78431", origin: "Hyderabad", destination: "Chennai", priority: "High", weight: 42, volume: 0.8, deadline: "2026-09-18T20:00:00+05:30", status: "Recovery Found", assignedTruck: "TS 09 AB 2048", assignedRoute: "RT-01", currentLocation: "Bengaluru Transfer Hub" },
  { id: "SHP-2049", code: "PGB-MUM-2049-K3", cargoId: "CRG-78432", origin: "Mumbai", destination: "Bengaluru", priority: "Medium", weight: 120, volume: 2.4, deadline: "2026-09-19T14:00:00+05:30", status: "In Transit", assignedTruck: "MH 04 CD 1122", assignedRoute: "RT-03", currentLocation: "Pune Hub" },
  { id: "SHP-2050", code: "PGB-DEL-2050-R1", cargoId: "CRG-78433", origin: "Delhi", destination: "Mumbai", priority: "Low", weight: 18, volume: 0.3, deadline: "2026-09-20T10:00:00+05:30", status: "Created", assignedTruck: null, assignedRoute: null, currentLocation: "Delhi" },
  { id: "SHP-2051", code: "PGB-HYD-2051-M5", cargoId: "CRG-78434", origin: "Hyderabad", destination: "Kolkata", priority: "High", weight: 65, volume: 1.2, deadline: "2026-09-19T08:00:00+05:30", status: "Misplaced", assignedTruck: null, assignedRoute: null, currentLocation: "Hyderabad" },
  { id: "SHP-2052", code: "PGB-CHN-2052-A9", cargoId: "CRG-78435", origin: "Chennai", destination: "Delhi", priority: "Medium", weight: 30, volume: 0.6, deadline: "2026-09-21T18:00:00+05:30", status: "Recovered", assignedTruck: "TN 07 EF 3344", assignedRoute: "RT-05", currentLocation: "Chennai" },
  { id: "SHP-2053", code: "PGB-PUN-2053-B2", cargoId: "CRG-78436", origin: "Pune", destination: "Hyderabad", priority: "Low", weight: 8, volume: 0.15, deadline: "2026-09-22T12:00:00+05:30", status: "Pending", assignedTruck: null, assignedRoute: null, currentLocation: "Pune" },
  { id: "SHP-2054", code: "PGB-BLR-2054-D6", cargoId: "CRG-78437", origin: "Bengaluru", destination: "Mumbai", priority: "High", weight: 55, volume: 1.0, deadline: "2026-09-19T16:00:00+05:30", status: "Assigned", assignedTruck: "KA 01 GH 5566", assignedRoute: "RT-06", currentLocation: "Bengaluru" },
  { id: "SHP-2055", code: "PGB-KOL-2055-F8", cargoId: "CRG-78438", origin: "Kolkata", destination: "Chennai", priority: "Medium", weight: 90, volume: 1.8, deadline: "2026-09-20T22:00:00+05:30", status: "In Transit", assignedTruck: "WB 02 IJ 7788", assignedRoute: "RT-07", currentLocation: "Hyderabad Hub" },
];

// ─── Seed Cargo ─────────────────────────────────────────────────
export const SEED_CARGO: Cargo[] = [
  { id: "CRG-78431", shipmentId: "SHP-2048", description: "Consumer Electronics", weight: 42, volume: 0.8, origin: "Hyderabad", destination: "Chennai", priority: "High", specialHandling: "Fragile", status: "In Transit" },
  { id: "CRG-78432", shipmentId: "SHP-2049", description: "Textile Rolls", weight: 120, volume: 2.4, origin: "Mumbai", destination: "Bengaluru", priority: "Medium", specialHandling: "None", status: "In Transit" },
  { id: "CRG-78433", shipmentId: "SHP-2050", description: "Office Supplies", weight: 18, volume: 0.3, origin: "Delhi", destination: "Mumbai", priority: "Low", specialHandling: "None", status: "Pending" },
  { id: "CRG-78434", shipmentId: "SHP-2051", description: "Medical Equipment", weight: 65, volume: 1.2, origin: "Hyderabad", destination: "Kolkata", priority: "High", specialHandling: "Temperature Controlled", status: "Pending" },
  { id: "CRG-78435", shipmentId: "SHP-2052", description: "Auto Parts", weight: 30, volume: 0.6, origin: "Chennai", destination: "Delhi", priority: "Medium", specialHandling: "None", status: "Delivered" },
  { id: "CRG-78436", shipmentId: "SHP-2053", description: "Books & Stationery", weight: 8, volume: 0.15, origin: "Pune", destination: "Hyderabad", priority: "Low", specialHandling: "None", status: "Pending" },
];

// ─── Seed Trucks ────────────────────────────────────────────────
export const SEED_TRUCKS: Truck[] = [
  { id: "TRK-001", numberPlate: "TS 09 AB 2048", driverName: "Ravi Kumar", driverMobile: "+91 98765 43210", copassengerName: "Arjun Rao", copassengerMobile: "+91 98765 43211", destination: "Chennai Distribution Hub", currentLocation: "Bengaluru", capacity: 500, availableCapacity: 120, status: "In Transit" },
  { id: "TRK-002", numberPlate: "MH 04 CD 1122", driverName: "Suresh Patil", driverMobile: "+91 87654 32109", copassengerName: "Vikram Desai", copassengerMobile: "+91 87654 32110", destination: "Bengaluru Warehouse", currentLocation: "Pune", capacity: 800, availableCapacity: 200, status: "In Transit" },
  { id: "TRK-003", numberPlate: "TN 07 EF 3344", driverName: "Karthik Rajan", driverMobile: "+91 76543 21098", copassengerName: "Mohan Subramanian", copassengerMobile: "+91 76543 21099", destination: "Delhi Hub", currentLocation: "Chennai", capacity: 400, availableCapacity: 350, status: "Available" },
  { id: "TRK-004", numberPlate: "KA 01 GH 5566", driverName: "Praveen Shetty", driverMobile: "+91 65432 10987", copassengerName: "Anand Gowda", copassengerMobile: "+91 65432 10988", destination: "Mumbai Central", currentLocation: "Bengaluru", capacity: 600, availableCapacity: 100, status: "Assigned" },
  { id: "TRK-005", numberPlate: "WB 02 IJ 7788", driverName: "Amit Ghosh", driverMobile: "+91 54321 09876", copassengerName: "Debashish Roy", copassengerMobile: "+91 54321 09877", destination: "Chennai Port", currentLocation: "Hyderabad", capacity: 700, availableCapacity: 300, status: "In Transit" },
];

// ─── Seed Routes ────────────────────────────────────────────────
export const SEED_ROUTES: DemoRoute[] = [
  { id: "RT-01", origin: "Hyderabad", destination: "Chennai", distance: 630, duration: 660, hubs: ["Hyderabad Hub", "Bengaluru Hub", "Chennai Hub"], truckId: "TRK-001", status: "Active" },
  { id: "RT-02", origin: "Bengaluru", destination: "Chennai", distance: 350, duration: 360, hubs: ["Bengaluru Hub", "Chennai Hub"], truckId: null, status: "Scheduled" },
  { id: "RT-03", origin: "Mumbai", destination: "Bengaluru", distance: 980, duration: 840, hubs: ["Mumbai Hub", "Pune Hub", "Bengaluru Hub"], truckId: "TRK-002", status: "Active" },
  { id: "RT-04", origin: "Delhi", destination: "Hyderabad", distance: 1500, duration: 1200, hubs: ["Delhi Hub", "Nagpur Hub", "Hyderabad Hub"], truckId: null, status: "Scheduled" },
  { id: "RT-05", origin: "Chennai", destination: "Delhi", distance: 2200, duration: 1800, hubs: ["Chennai Hub", "Hyderabad Hub", "Nagpur Hub", "Delhi Hub"], truckId: "TRK-003", status: "Active" },
  { id: "RT-06", origin: "Bengaluru", destination: "Mumbai", distance: 980, duration: 780, hubs: ["Bengaluru Hub", "Pune Hub", "Mumbai Hub"], truckId: "TRK-004", status: "Active" },
  { id: "RT-07", origin: "Kolkata", destination: "Chennai", distance: 1660, duration: 1320, hubs: ["Kolkata Hub", "Hyderabad Hub", "Chennai Hub"], truckId: "TRK-005", status: "Active" },
];

// ─── Demo Staff Credentials ────────────────────────────────────
export const DEMO_CREDENTIALS = { staffId: "supervisor", password: "piggyback2026" };
