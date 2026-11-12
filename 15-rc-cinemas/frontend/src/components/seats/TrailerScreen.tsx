import { Html } from "@react-three/drei";

interface TrailerScreenProps {
  trailerYoutubeId: string;
  position: [number, number, number];
}

/**
 * A live YouTube trailer "playing on the cinema screen" inside the 3D scene.
 * A real YouTube iframe can't be used as a WebGL texture (cross-origin canvas
 * restriction), so this anchors an ordinary HTML iframe at a 3D position via
 * drei's `Html transform`, which keeps it perspective-matched to the camera --
 * the standard technique for "real" video inside a three.js scene.
 */
export function TrailerScreen({ trailerYoutubeId, position }: TrailerScreenProps) {
  const [x, y, z] = position;

  return (
    <group>
      {/* Screen bezel, sits just behind the iframe plane */}
      <mesh position={[x, y, z - 0.05]}>
        <planeGeometry args={[9.4, 5.4]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {trailerYoutubeId && (
        <Html transform position={position} distanceFactor={2.4} style={{ pointerEvents: "none" }}>
          <iframe
            width="960"
            height="540"
            src={`https://www.youtube.com/embed/${trailerYoutubeId}?autoplay=1&mute=1&loop=1&playlist=${trailerYoutubeId}&controls=0&modestbranding=1`}
            title="Trailer"
            allow="autoplay; encrypted-media"
            style={{ border: "none", display: "block" }}
          />
        </Html>
      )}
    </group>
  );
}
