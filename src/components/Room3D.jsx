import { Component, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges, Html, useGLTF } from '@react-three/drei'
import { useStore } from '../store'
import { getBox, getFront, getDoor, getStatus } from '../geometry'

const S = 0.01 // cm -> scene units (1 unit = 1 metre)
const WALL_H = 250
const WALL_T = 10

// catalog name -> model in public/models/furniture, and `turn` (degrees) so the
// model's front matches the plan's front. If a piece faces the wrong way, change its turn.
const MODEL = {
  'Single bed': { file: 'bed', turn: -90 },
  'Double bed': { file: 'bed', turn: -90 },
  Desk: { file: 'desk', turn: 0 },
  Chair: { file: 'chair', turn: 0 },
  Wardrobe: { file: 'wardrobe', turn: 180 },
  'Bedside table': { file: 'bedside_table', turn: 180 },
  Bookshelf: { file: 'bookshelf', turn: 180 },
  Sofa: { file: 'sofa', turn: 0 },
  Table: { file: 'dining_table', turn: 0 },
  'Coffee table': { file: 'coffee_table', turn: 0 },
  'TV unit': { file: 'tv_unit', turn: 0 },
  Armchair: { file: 'armchair', turn: 0 },
  Dresser: { file: 'dresser', turn: 0 },
}

// if a model file is missing or fails to load, show the fallback box instead
class Safe extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

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

// box in the item's own (unrotated) frame, standing on the floor
function LocalBox({ item, ht, color, opacity = 1, edges = false }) {
  const k = opacity < 1 ? 1.01 : 1
  return (
    <mesh position={[0, (ht / 2) * S, 0]} castShadow={opacity === 1} receiveShadow>
      <boxGeometry args={[item.w * S * k, ht * S * k, item.d * S * k]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} depthWrite={opacity === 1} />
      {edges && <Edges color="white" />}
    </mesh>
  )
}

// loads a .glb and stretches it to exactly w x ht x d (cm), centred, feet on the floor
function Model({ file, turn, w, d, ht }) {
  const { scene } = useGLTF(`/models/furniture/${file}.glb`)
  const { obj, scale, offset } = useMemo(() => {
    const obj = scene.clone(true)
    obj.rotation.y = (turn * Math.PI) / 180
    obj.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true }
    })
    obj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.getSize(new THREE.Vector3())
    const c = box.getCenter(new THREE.Vector3())
    return {
      obj,
      scale: [(w * S) / size.x, (ht * S) / size.y, (d * S) / size.z],
      offset: [-c.x, -box.min.y, -c.z],
    }
  }, [scene, turn, w, d, ht])

  return (
    <group scale={scale}>
      <group position={offset}>
        <primitive object={obj} />
      </group>
    </group>
  )
}

function Piece({ item, status, selected, onSelect }) {
  const ht = item.ht ?? 80
  const [x0, y0, x1, y1] = getBox(item)
  const m = MODEL[item.name]
  const color =
    status === 'bad' ? '#d6336c' : status === 'warn' ? '#e67700' : `hsl(${item.h}, 55%, 55%)`
  const solid = <LocalBox item={item} ht={ht} color={color} />

  return (
    <group
      position={[((x0 + x1) / 2) * S, 0, ((y0 + y1) / 2) * S]}
      rotation={[0, (-item.rot * Math.PI) / 180, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(item.id) }}
    >
      {m ? (
        <Safe fallback={solid}>
          <Suspense fallback={solid}>
            <Model file={m.file} turn={m.turn} w={item.w} d={item.d} ht={ht} />
          </Suspense>
        </Safe>
      ) : solid}
      {m && status !== 'ok' && <LocalBox item={item} ht={ht} color={color} opacity={0.35} />}
      {selected && <LocalBox item={item} ht={ht} color="white" opacity={0} edges />}
      <Html position={[0, ht * S + 0.08, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="tag">{item.name}</div>
      </Html>
    </group>
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