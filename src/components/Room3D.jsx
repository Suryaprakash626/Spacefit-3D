import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges, Html } from '@react-three/drei'
import { useStore } from '../store'
import { getBox, getFront, getDoor, getStatus } from '../geometry'

const S = 0.01 // cm -> scene units (1 unit = 1 metre)
const WALL_H = 250
const WALL_T = 10

// flat translucent rectangle lying on the floor (cm coordinates)
function Slab({ box, y, color, opacity }) {
  const [x0, y0, x1, y1] = box
  return (
    <mesh position={[((x0 + x1) / 2) * S, y * S, ((y0 + y1) / 2) * S]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[(x1 - x0) * S, (y1 - y0) * S]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function Walls({ W, L }) {
  const wall = (key, pos, size) => (
    <mesh key={key} position={pos.map((v) => v * S)}>
      <boxGeometry args={size.map((v) => v * S)} />
      <meshStandardMaterial color="#9fb3c8" transparent opacity={0.28} />
    </mesh>
  )
  return (
    <>
      {wall('t', [W / 2, WALL_H / 2, -WALL_T / 2], [W + 2 * WALL_T, WALL_H, WALL_T])}
      {wall('b', [W / 2, WALL_H / 2, L + WALL_T / 2], [W + 2 * WALL_T, WALL_H, WALL_T])}
      {wall('l', [-WALL_T / 2, WALL_H / 2, L / 2], [WALL_T, WALL_H, L])}
      {wall('r', [W + WALL_T / 2, WALL_H / 2, L / 2], [WALL_T, WALL_H, L])}
    </>
  )
}

function Piece({ item, status, selected, onSelect }) {
  const [x0, y0, x1, y1] = getBox(item)
  const ht = item.ht ?? 80
  const color =
    status === 'bad' ? '#d6336c' : status === 'warn' ? '#e67700' : `hsl(${item.h}, 55%, 55%)`
  return (
    <mesh
      position={[((x0 + x1) / 2) * S, (ht / 2) * S, ((y0 + y1) / 2) * S]}
      castShadow
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onSelect(item.id) }}
    >
      <boxGeometry args={[(x1 - x0) * S, ht * S, (y1 - y0) * S]} />
      <meshStandardMaterial color={color} />
      {selected && <Edges color="white" />}
      <Html position={[0, (ht / 2) * S + 0.08, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="tag">{item.name}</div>
      </Html>
    </mesh>
  )
}

export default function Room3D() {
  const { room, items, selectedId, showClearance, select } = useStore()
  const { W, L } = room
  const d = Math.max(W, L) * S
  const door = getDoor(room)
  const status = Object.fromEntries(items.map((i) => [i.id, getStatus(i, items, room)]))

  return (
    <div className="card view3d">
      <div className="canvas3d">
        <Canvas
          shadows
          camera={{ position: [d * 0.7, d * 1.1, d * 1.2], fov: 45 }}
          onPointerMissed={() => select(null)}
        >
          <ambientLight intensity={0.9} />
          <directionalLight
            position={[d * 0.6, d * 1.4, d * 0.4]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-d}
            shadow-camera-right={d}
            shadow-camera-top={d}
            shadow-camera-bottom={-d}
          />

          {/* plan coordinates (cm) live inside this group, centred on the origin */}
          <group position={[(-W * S) / 2, 0, (-L * S) / 2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(W / 2) * S, 0, (L / 2) * S]} receiveShadow>
              <planeGeometry args={[W * S, L * S]} />
              <meshStandardMaterial color="#f4f6f9" />
            </mesh>
            <Walls W={W} L={L} />
            <Slab box={door.box} y={0.3} color="#0f7ea8" opacity={0.25} />
            {showClearance &&
              items
                .filter((i) => i.clr > 0)
                .map((i) => (
                  <Slab
                    key={'c' + i.id}
                    box={getFront(i)}
                    y={0.6}
                    color={status[i.id] === 'warn' ? '#e67700' : '#0f7ea8'}
                    opacity={0.3}
                  />
                ))}
            {items.map((i) => (
              <Piece key={i.id} item={i} status={status[i.id]} selected={i.id === selectedId} onSelect={select} />
            ))}
          </group>

          <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} target={[0, 0, 0]} />
        </Canvas>
      </div>
      <p className="note">
        Drag to orbit, scroll to zoom, right-drag to pan. Click a piece to select it. Move pieces in the 2D plan.
      </p>
    </div>
  )
}