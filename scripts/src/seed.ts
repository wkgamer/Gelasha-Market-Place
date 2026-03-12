import { db, usersTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gelasha_salt").digest("hex");
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const OPERATOR_EMAIL = "gelashaengineers@yahoo.co.in";
const OPERATOR_PASSWORD = "prakash@9879818915";

const PRODUCTS = [
  {
    id: "prod_001",
    name: "Industrial Hydraulic Pump - 5HP",
    description: "High-performance hydraulic pump suitable for industrial machinery. Features pressure relief valve, dual-stage system, and heavy-duty construction for continuous operation.",
    price: "45999.00",
    originalPrice: "52000.00",
    category: "Pumps & Motors",
    imageUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=80",
      "https://images.unsplash.com/photo-1581092921461-39b9d08a9f03?w=600&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    ],
    rating: "4.7",
    reviewCount: 128,
    inStock: true,
    brand: "Gelasha Engineering",
    discount: 12,
  },
  {
    id: "prod_002",
    name: "Heavy Duty Gear Box 50:1 Ratio",
    description: "Precision-engineered gear box with 50:1 reduction ratio. Ideal for conveyors, mixers, and other heavy industrial applications. Oil bath lubrication for extended service life.",
    price: "18500.00",
    originalPrice: "22000.00",
    category: "Gearboxes",
    imageUrl: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    ],
    rating: "4.5",
    reviewCount: 84,
    inStock: true,
    brand: "PowerTech India",
    discount: 16,
  },
  {
    id: "prod_003",
    name: "Three Phase AC Motor 10HP",
    description: "Energy-efficient three-phase AC induction motor. IE3 efficiency class. Suitable for pumps, compressors, fans, and conveyor systems. IP55 protection rating.",
    price: "28750.00",
    originalPrice: "32000.00",
    category: "Pumps & Motors",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    ],
    rating: "4.8",
    reviewCount: 203,
    inStock: true,
    brand: "ElectroMax",
    discount: 10,
  },
  {
    id: "prod_004",
    name: "Industrial Safety Helmet ISI Marked",
    description: "Certified industrial safety helmet with ISI marking. High-density polyethylene shell with foam liner. Suitable for construction sites, factories, and mining operations.",
    price: "850.00",
    originalPrice: "1200.00",
    category: "Safety Equipment",
    imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80",
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&q=80",
    ],
    rating: "4.6",
    reviewCount: 456,
    inStock: true,
    brand: "SafeGuard Pro",
    discount: 29,
  },
  {
    id: "prod_005",
    name: "Stainless Steel Ball Valve 2 inch",
    description: "Full bore stainless steel ball valve with PTFE seats. Suitable for corrosive liquids, gases, and high-temperature applications. Pressure rated up to 150 PSI.",
    price: "2350.00",
    originalPrice: "2800.00",
    category: "Valves & Fittings",
    imageUrl: "https://images.unsplash.com/photo-1609265024655-88e16f41a27d?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1609265024655-88e16f41a27d?w=600&q=80",
    ],
    rating: "4.4",
    reviewCount: 167,
    inStock: true,
    brand: "ValveMaster",
    discount: 16,
  },
  {
    id: "prod_006",
    name: "Pneumatic Air Compressor 2HP",
    description: "Oil-free reciprocating air compressor with 24L tank. Max pressure 8 bar. Thermal overload protection. Suitable for spray painting, cleaning, and air tools.",
    price: "12500.00",
    originalPrice: "15000.00",
    category: "Compressors",
    imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=80",
    ],
    rating: "4.3",
    reviewCount: 89,
    inStock: true,
    brand: "AirForce Industrial",
    discount: 17,
  },
  {
    id: "prod_007",
    name: "Bearing Set SKF Type 6205",
    description: "Deep groove ball bearing - SKF standard quality. Single row, open type. Suitable for electric motors, pumps, fans, and general industrial machinery.",
    price: "450.00",
    originalPrice: "550.00",
    category: "Bearings",
    imageUrl: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=600&q=80",
    ],
    rating: "4.9",
    reviewCount: 834,
    inStock: true,
    brand: "SKF India",
    discount: 18,
  },
  {
    id: "prod_008",
    name: "Digital Pressure Gauge 0-100 PSI",
    description: "High-accuracy digital pressure gauge with LCD display. Stainless steel wetted parts. Suitable for water, oil, gas, and hydraulic applications. Battery powered.",
    price: "3200.00",
    originalPrice: "3800.00",
    category: "Instrumentation",
    imageUrl: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=600&q=80",
    ],
    rating: "4.6",
    reviewCount: 112,
    inStock: true,
    brand: "PrecisionTech",
    discount: 16,
  },
  {
    id: "prod_009",
    name: "V-Belt Set B Section B50",
    description: "Standard V-belt for industrial drives. Oil and heat resistant rubber compound. Suitable for agricultural machinery, compressors, and general drive applications.",
    price: "280.00",
    originalPrice: "350.00",
    category: "Belts & Chains",
    imageUrl: "https://images.unsplash.com/photo-1564890369478-c89ca3d9cde7?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1564890369478-c89ca3d9cde7?w=600&q=80",
    ],
    rating: "4.2",
    reviewCount: 298,
    inStock: true,
    brand: "DriveMax",
    discount: 20,
  },
  {
    id: "prod_010",
    name: "Diesel Engine Oil 15W-40 5L",
    description: "High-performance diesel engine oil. API CI-4 Plus rated. Superior wear protection, extended drain intervals, and excellent oxidation stability for heavy-duty diesel engines.",
    price: "1450.00",
    originalPrice: "1700.00",
    category: "Lubricants",
    imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80",
    ],
    rating: "4.5",
    reviewCount: 621,
    inStock: true,
    brand: "LubeMax Pro",
    discount: 15,
  },
  {
    id: "prod_011",
    name: "Welding Machine ARC 200A",
    description: "Inverter-based ARC welding machine. Anti-stick and hot-start features. Suitable for MMA welding with electrodes from 1.6mm to 4.0mm. Lightweight and portable.",
    price: "8500.00",
    originalPrice: "10000.00",
    category: "Welding Equipment",
    imageUrl: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600&q=80",
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=80",
    ],
    rating: "4.7",
    reviewCount: 445,
    inStock: true,
    brand: "WeldPro India",
    discount: 15,
  },
  {
    id: "prod_012",
    name: "Industrial Chain Hoist 1 Ton",
    description: "Manual chain hoist with 1-ton capacity. Robust steel body with heat-treated load chain. Safety latch hook. Suitable for workshops, warehouses, and construction sites.",
    price: "5800.00",
    originalPrice: "7000.00",
    category: "Material Handling",
    imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
    ],
    rating: "4.4",
    reviewCount: 73,
    inStock: true,
    brand: "LiftMaster",
    discount: 17,
  },
];

async function seed() {
  console.log("Starting seed...");

  // Seed operator user
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, OPERATOR_EMAIL));
  if (existing.length === 0) {
    await db.insert(usersTable).values({
      id: "operator_001",
      username: "Gelasha Admin",
      email: OPERATOR_EMAIL,
      passwordHash: hashPassword(OPERATOR_PASSWORD),
      siteName: "Gelasha Engineers",
      siteAddress: "Plot No. 12, GIDC Estate, Ahmedabad, Gujarat - 382421",
      transportAddress: "Plot No. 12, GIDC Estate, Ahmedabad, Gujarat - 382421",
      gstNumber: "24AAACG1234F1ZV",
      mobile1: "9879818915",
      mobile2: null,
      appUsage: "Industrial Equipment",
      fuelType: "Diesel",
      role: "operator",
    });
    console.log("Operator user created");
  } else {
    console.log("Operator user already exists");
  }

  // Seed test user
  const testUserExisting = await db.select().from(usersTable).where(eq(usersTable.email, "test@gelasha.com"));
  if (testUserExisting.length === 0) {
    await db.insert(usersTable).values({
      id: "test_user_001",
      username: "Test User",
      email: "test@gelasha.com",
      passwordHash: hashPassword("test123"),
      siteName: "Test Site",
      siteAddress: "123 Test Street, Mumbai",
      transportAddress: "123 Test Street, Mumbai",
      gstNumber: "27AAACT1234F1ZV",
      mobile1: "9999999999",
      mobile2: null,
      appUsage: "Manufacturing",
      fuelType: "Petrol",
      role: "customer",
    });
    console.log("Test user created");
  } else {
    console.log("Test user already exists");
  }

  // Seed products
  for (const product of PRODUCTS) {
    const existing = await db.select().from(productsTable).where(eq(productsTable.id, product.id));
    if (existing.length === 0) {
      await db.insert(productsTable).values(product);
      console.log(`Product created: ${product.name}`);
    } else {
      console.log(`Product already exists: ${product.name}`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
