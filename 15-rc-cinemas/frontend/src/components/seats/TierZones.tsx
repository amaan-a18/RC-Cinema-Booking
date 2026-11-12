import { Text } from "@react-three/drei";
import { SEAT_TIER_COLOR, SEAT_TIER_LABEL, type SeatMapEntry, type SeatTier } from "@/api/types";
import { COL_SPACING, ROW_SPACING, xForCol } from "@/components/seats/layout";

interface Zone {
  tier: Extract<SeatTier, "premium" | "recliner">;
  minCol: number;
  maxCol: number;
  firstZ: number;
  lastZ: number;
}

function computeZones(rows: [string, SeatMapEntry[]][], cols: number, rowZ: number[]): Zone[] {
  let premium: Omit<Zone, "tier"> | null = null;
  let recliner: Omit<Zone, "tier"> | null = null;

  rows.forEach(([, rowSeats], rowIndex) => {
    const z = rowZ[rowIndex];
    if (rowSeats.length > 0 && rowSeats.every((s) => s.tier === "recliner")) {
      const prev = recliner;
      recliner = prev
        ? { ...prev, firstZ: Math.min(prev.firstZ, z), lastZ: Math.max(prev.lastZ, z) }
        : { minCol: 1, maxCol: cols, firstZ: z, lastZ: z };
    }

    const premiumCols = rowSeats.filter((s) => s.tier === "premium").map((s) => s.col_number);
    if (premiumCols.length > 0) {
      const minCol = Math.min(...premiumCols);
      const maxCol = Math.max(...premiumCols);
      const prev = premium;
      premium = prev
        ? {
            minCol: Math.min(prev.minCol, minCol),
            maxCol: Math.max(prev.maxCol, maxCol),
            firstZ: Math.min(prev.firstZ, z),
            lastZ: Math.max(prev.lastZ, z),
          }
        : { minCol, maxCol, firstZ: z, lastZ: z };
    }
  });

  const zones: Zone[] = [];
  const premiumZone = premium as Omit<Zone, "tier"> | null;
  const reclinerZone = recliner as Omit<Zone, "tier"> | null;
  if (premiumZone) zones.push({ tier: "premium", ...premiumZone });
  if (reclinerZone) zones.push({ tier: "recliner", ...reclinerZone });
  return zones;
}

interface TierZonesProps {
  rows: [string, SeatMapEntry[]][];
  cols: number;
  rowZ: number[];
  priceByTier: Record<SeatTier, number>;
}

/** Tinted floor patches + floating category labels under the premium and
 * recliner blocks -- the "named, priced seating zone" treatment used by
 * mainstream booking sites, adapted for the 3D hall. */
export function TierZones({ rows, cols, rowZ, priceByTier }: TierZonesProps) {
  const zones = computeZones(rows, cols, rowZ);

  return (
    <>
      {zones.map((zone) => {
        const color = SEAT_TIER_COLOR[zone.tier];
        const xLo = xForCol(zone.minCol, cols);
        const xHi = xForCol(zone.maxCol, cols);
        const centerX = (xLo + xHi) / 2;
        const width = xHi - xLo + COL_SPACING * 1.15;
        const centerZ = (zone.firstZ + zone.lastZ) / 2;
        const depth = zone.lastZ - zone.firstZ + ROW_SPACING * 1.15;
        const labelZ = zone.firstZ - ROW_SPACING * 0.62;

        return (
          <group key={zone.tier}>
            <mesh position={[centerX, 0.004, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width, depth]} />
              <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} toneMapped={false} />
            </mesh>
            <Text
              position={[centerX, 0.92, labelZ]}
              fontSize={0.22}
              letterSpacing={0.08}
              color={color}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {SEAT_TIER_LABEL[zone.tier].toUpperCase()} · ₹{priceByTier[zone.tier].toFixed(0)}
            </Text>
          </group>
        );
      })}
    </>
  );
}
