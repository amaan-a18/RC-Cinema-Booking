import { Text } from "@react-three/drei";
import type { SeatMapEntry } from "@/api/types";
import { Seat, type SeatStatus } from "@/components/seats/Seat";
import { COL_SPACING, xForCol } from "@/components/seats/layout";

interface SeatRowProps {
  rowLabel: string;
  z: number;
  seats: SeatMapEntry[];
  totalCols: number;
  selectedIds: Set<number>;
  takenIds: Set<number>;
  onToggleSeat: (seatId: number) => void;
}

export function SeatRow({
  rowLabel,
  z,
  seats,
  totalCols,
  selectedIds,
  takenIds,
  onToggleSeat,
}: SeatRowProps) {
  return (
    <group>
      <Text
        position={[xForCol(0, totalCols) - COL_SPACING * 1.3, 0.25, z]}
        fontSize={0.28}
        color="#A8A29A"
        anchorX="center"
        anchorY="middle"
      >
        {rowLabel}
      </Text>
      {seats.map((seat) => {
        const status: SeatStatus = takenIds.has(seat.id)
          ? "taken"
          : selectedIds.has(seat.id)
            ? "selected"
            : "available";
        return (
          <Seat
            key={seat.id}
            seat={seat}
            status={status}
            position={[xForCol(seat.col_number, totalCols), 0, z]}
            onToggle={() => onToggleSeat(seat.id)}
          />
        );
      })}
    </group>
  );
}
