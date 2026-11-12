import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { SeatMapEntry, SeatTier } from "@/api/types";
import { computeRowZPositions } from "@/components/seats/layout";
import { SeatRow } from "@/components/seats/SeatRow";
import { TierZones } from "@/components/seats/TierZones";
import { TrailerScreen } from "@/components/seats/TrailerScreen";
import { Spinner } from "@/components/common/Card";

const SCREEN_Z = -2.2;

interface SeatCanvasProps {
  seats: SeatMapEntry[];
  cols: number;
  selectedIds: Set<number>;
  takenIds: Set<number>;
  trailerYoutubeId: string;
  priceByTier: Record<SeatTier, number>;
  onToggleSeat: (seatId: number) => void;
}

export function SeatCanvas({
  seats,
  cols,
  selectedIds,
  takenIds,
  trailerYoutubeId,
  priceByTier,
  onToggleSeat,
}: SeatCanvasProps) {
  const rows = useMemo(() => {
    const byRow = new Map<string, SeatMapEntry[]>();
    for (const seat of seats) {
      const list = byRow.get(seat.row_label) ?? [];
      list.push(seat);
      byRow.set(seat.row_label, list);
    }
    return [...byRow.entries()];
  }, [seats]);

  const rowZ = useMemo(() => computeRowZPositions(rows), [rows]);
  const backRowZ = rowZ.length > 0 ? rowZ[rowZ.length - 1] : 0;

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-md border border-ink/10 bg-black">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-ink-soft">
            <Spinner />
          </div>
        }
      >
        <Canvas shadows camera={{ position: [0, backRowZ * 0.6 + 3, backRowZ + 5], fov: 42 }}>
          <color attach="background" args={["#050505"]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[4, 6, 3]} intensity={0.6} castShadow />
          <pointLight position={[0, 2, SCREEN_Z + 0.5]} intensity={1.4} color="#f5f1e8" distance={6} />

          <TrailerScreen trailerYoutubeId={trailerYoutubeId} position={[0, 2.4, SCREEN_Z]} />

          <group position={[0, 0, 0]}>
            <TierZones rows={rows} cols={cols} rowZ={rowZ} priceByTier={priceByTier} />
            {rows.map(([rowLabel, rowSeats], index) => (
              <SeatRow
                key={rowLabel}
                rowLabel={rowLabel}
                z={rowZ[index]}
                seats={rowSeats}
                totalCols={cols}
                selectedIds={selectedIds}
                takenIds={takenIds}
                onToggleSeat={onToggleSeat}
              />
            ))}
          </group>

          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={backRowZ + 10}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.3}
            target={[0, 0.5, backRowZ / 2]}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
