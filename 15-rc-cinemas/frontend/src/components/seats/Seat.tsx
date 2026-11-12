import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SeatMapEntry, SeatTier } from "@/api/types";

export type SeatStatus = "available" | "selected" | "taken";

const STATUS_COLOR: Record<SeatStatus, string> = {
  available: "#2F7A6D",
  selected: "#D4AF37",
  taken: "#55555E",
};

const FRAME_COLOR = "#17171b";
const PREMIUM_TRIM_COLOR = "#D4AF37";

// Seat geometry — a pedestal, a cushioned seat pan, a reclined backrest with
// a headrest cap, and two armrests, built from simple rounded primitives.
// Dimensions scale up by tier: premium seats are a little bigger with a gold
// trim strip, recliners are a noticeably wider lounge chair with wing-back
// headrest panels and a footrest.
interface TierConfig {
  seatW: number;
  cushionD: number;
  backH: number;
  armW: number;
  armH: number;
  trim: boolean;
  wings: boolean;
  footrest: boolean;
}

const TIER_CONFIG: Record<SeatTier, TierConfig> = {
  classic: { seatW: 0.56, cushionD: 0.46, backH: 0.42, armW: 0.06, armH: 0.07, trim: false, wings: false, footrest: false },
  premium: { seatW: 0.6, cushionD: 0.48, backH: 0.45, armW: 0.07, armH: 0.075, trim: true, wings: false, footrest: false },
  recliner: { seatW: 0.68, cushionD: 0.54, backH: 0.5, armW: 0.085, armH: 0.08, trim: false, wings: true, footrest: true },
};

const CUSHION_H = 0.12;
const PED_H = 0.18;
const PED_W = 0.12;
const PED_D = 0.26;
const BACK_D = 0.08;
const BACK_TILT = 0.22; // radians, slight recline
const HEAD_H = 0.07;

const CUSHION_TOP_Y = PED_H + CUSHION_H;

interface SeatProps {
  seat: SeatMapEntry;
  status: SeatStatus;
  position: [number, number, number];
  onToggle: () => void;
}

export function Seat({ seat, status, position, onToggle }: SeatProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const interactive = status !== "taken";
  const color = STATUS_COLOR[status];
  const emissiveIntensity =
    status === "selected" ? 0.6 : status === "taken" ? 0.25 : hovered && interactive ? 0.35 : 0.12;

  const tier = TIER_CONFIG[seat.tier];
  const armD = tier.cushionD + 0.02;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const lifted = (hovered && interactive) || status === "selected";
    const targetY = lifted ? position[1] + 0.12 : position[1];
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 8, delta);
    const targetScale = hovered && interactive ? 1.08 : 1;
    const s = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 10, delta);
    groupRef.current.scale.setScalar(s);
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Invisible hit area covering the whole seat silhouette — keeps click/hover detection simple regardless of the visible part count. */}
        <mesh
          position={[0, 0.44, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (interactive) onToggle();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (interactive) {
              setHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <boxGeometry args={[tier.seatW + tier.armW * 2 + 0.04, 0.9, tier.cushionD + 0.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Pedestal */}
        <mesh position={[0, PED_H / 2, 0]}>
          <boxGeometry args={[PED_W, PED_H, PED_D]} />
          <meshStandardMaterial color={FRAME_COLOR} roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Footrest (recliner only) */}
        {tier.footrest && (
          <mesh position={[0, PED_H * 0.3, -(tier.cushionD / 2 + 0.07)]}>
            <boxGeometry args={[tier.seatW * 0.78, PED_H * 0.5, 0.12]} />
            <meshStandardMaterial color={FRAME_COLOR} roughness={0.5} metalness={0.3} />
          </mesh>
        )}

        {/* Seat cushion */}
        <RoundedBox
          args={[tier.seatW, CUSHION_H, tier.cushionD]}
          radius={0.045}
          smoothness={2}
          position={[0, PED_H + CUSHION_H / 2, 0]}
        >
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.85}
            metalness={0.05}
          />
        </RoundedBox>

        {/* Backrest, reclined slightly, pivoting from the rear edge of the cushion */}
        <group position={[0, CUSHION_TOP_Y, tier.cushionD / 2 - BACK_D / 2]} rotation={[-BACK_TILT, 0, 0]}>
          <RoundedBox args={[tier.seatW, tier.backH, BACK_D]} radius={0.04} smoothness={2} position={[0, tier.backH / 2, 0]}>
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={emissiveIntensity}
              roughness={0.85}
              metalness={0.05}
            />
          </RoundedBox>
          {/* Headrest cap */}
          <RoundedBox
            args={[tier.seatW * 0.92, HEAD_H, BACK_D * 1.5]}
            radius={0.035}
            smoothness={2}
            position={[0, tier.backH + HEAD_H / 2 - 0.01, 0]}
          >
            <meshStandardMaterial color={FRAME_COLOR} roughness={0.5} metalness={0.3} />
          </RoundedBox>
          {/* Wing-back headrest panels (recliner only) — the lounge-chair silhouette cue */}
          {tier.wings &&
            [-1, 1].map((side) => (
              <RoundedBox
                key={side}
                args={[0.07, tier.backH * 0.55, BACK_D * 1.8]}
                radius={0.03}
                smoothness={2}
                position={[side * (tier.seatW / 2 + 0.02), tier.backH * 0.72, 0]}
                rotation={[0, side * -0.42, 0]}
              >
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={emissiveIntensity}
                  roughness={0.85}
                  metalness={0.05}
                />
              </RoundedBox>
            ))}
        </group>

        {/* Armrests */}
        {[-1, 1].map((side) => (
          <RoundedBox
            key={side}
            args={[tier.armW, tier.armH, armD]}
            radius={0.025}
            smoothness={2}
            position={[side * (tier.seatW / 2 + tier.armW / 2 - 0.01), CUSHION_TOP_Y + tier.armH / 2, 0]}
          >
            <meshStandardMaterial color={FRAME_COLOR} roughness={0.4} metalness={0.35} />
          </RoundedBox>
        ))}

        {/* Premium trim — a thin gold accent strip along the top of each armrest */}
        {tier.trim &&
          [-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (tier.seatW / 2 + tier.armW / 2 - 0.01), CUSHION_TOP_Y + tier.armH + 0.005, 0]}
            >
              <boxGeometry args={[tier.armW * 0.7, 0.01, armD * 0.9]} />
              <meshStandardMaterial color={PREMIUM_TRIM_COLOR} roughness={0.3} metalness={0.6} />
            </mesh>
          ))}
      </group>

      {hovered && interactive && (
        <Html position={[0, 1.05, 0]} center distanceFactor={8} occlude>
          <div className="pointer-events-none w-max rounded-sm border border-gold/30 bg-surface/95 px-2 py-1 text-center shadow-md">
            <p className="text-[11px] font-semibold text-ink">{seat.label}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
