r"""Generate six beginner-friendly SpaceFit 3D furniture assets with Blender.

Run from Windows PowerShell (from the SpaceFit project root):
  blender --background --python .\blender\make_furniture.py

Outputs:
  public/models/furniture/*.glb
  blender/spacefit_furniture_library.blend

All dimensions are in meters. The GLB files are designed as starter assets,
not production-grade architectural furniture models.
"""
from pathlib import Path
import bpy

# The script is expected to live in <project root>/blender/make_furniture.py.
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
GLB_DIR = PROJECT_ROOT / "public" / "models" / "furniture"
BLEND_FILE = SCRIPT_DIR / "spacefit_furniture_library.blend"

GLB_DIR.mkdir(parents=True, exist_ok=True)


def clear_previous_generated_scene():
    """Remove scene objects and collections created by a previous run."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    scene = bpy.context.scene
    for col in list(bpy.data.collections):
        if col.name.startswith("SPACEFIT_"):
            # Unlink it from any parent collection first.
            for parent in list(bpy.data.collections):
                if col.name in parent.children:
                    parent.children.unlink(col)
            bpy.data.collections.remove(col)

    # Keep materials: the palette is created at module load time, before main().
    # The script reuses these named materials on subsequent runs.

    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def make_material(name, color, roughness=0.72, metallic=0.0):
    material = bpy.data.materials.get(name)
    if material is None:
        material = bpy.data.materials.new(name=name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return material


# Simple, reusable palette.
WOOD = make_material("SF_Warm_Oak", (0.48, 0.25, 0.10))
WOOD_LIGHT = make_material("SF_Light_Oak", (0.70, 0.47, 0.25))
WOOD_DARK = make_material("SF_Dark_Wood", (0.20, 0.085, 0.035))
FABRIC = make_material("SF_Warm_White_Fabric", (0.82, 0.78, 0.68))
FABRIC_BLUE = make_material("SF_Soft_Blue_Fabric", (0.20, 0.38, 0.55))
FABRIC_GREEN = make_material("SF_Sage_Fabric", (0.34, 0.48, 0.36))
METAL = make_material("SF_Dark_Metal", (0.10, 0.12, 0.15), metallic=0.45, roughness=0.32)
WHITE = make_material("SF_Off_White", (0.88, 0.87, 0.82))
BOOK_RED = make_material("SF_Book_Terracotta", (0.56, 0.18, 0.12))
BOOK_GREEN = make_material("SF_Book_Green", (0.18, 0.38, 0.25))
BOOK_BLUE = make_material("SF_Book_Blue", (0.12, 0.25, 0.48))


def link_object_to_collection(obj, collection):
    """Move an operator-created object from the active collection to this one."""
    for old_collection in list(obj.users_collection):
        old_collection.objects.unlink(obj)
    collection.objects.link(obj)


def add_root(name, collection):
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.18
    collection.objects.link(root)
    root.location = (0.0, 0.0, 0.0)
    return root


def add_box(name, dimensions, location, material, collection, root, bevel=0.015):
    """Create a beveled cuboid. Location/dimensions are local meters."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    link_object_to_collection(obj, collection)

    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    if material:
        obj.data.materials.append(material)

    bevel_amount = min(bevel, min(dimensions) * 0.18)
    if bevel_amount > 0:
        bevel_mod = obj.modifiers.new(name="Soft_Edges", type="BEVEL")
        bevel_mod.width = bevel_amount
        bevel_mod.segments = 2
        bevel_mod.limit_method = "ANGLE"
        bevel_mod.angle_limit = 0.35
        normal_mod = obj.modifiers.new(name="Weighted_Normals", type="WEIGHTED_NORMAL")
        normal_mod.keep_sharp = True

    # Each asset's root stays at the origin while the GLB is exported.
    obj.parent = root
    obj.matrix_parent_inverse = root.matrix_world.inverted()
    return obj


def add_asset_collection(name):
    collection = bpy.data.collections.new(f"SPACEFIT_{name.upper()}")
    bpy.context.scene.collection.children.link(collection)
    root = add_root(f"{name}_ROOT", collection)
    return collection, root


def build_bed(collection, root):
    # A single bed: approx. 2.0 m long x 1.0 m wide.
    add_box("Bed_Frame", (1.96, 1.02, 0.13), (0, 0, 0.25), WOOD, collection, root, 0.025)
    for x in (-0.87, 0.87):
        for y in (-0.42, 0.42):
            add_box("Bed_Leg", (0.09, 0.09, 0.20), (x, y, 0.10), WOOD_DARK, collection, root, 0.012)
    add_box("Bed_Mattress", (1.88, 0.94, 0.19), (0.02, 0, 0.405), FABRIC, collection, root, 0.055)
    add_box("Bed_Headboard", (0.075, 1.06, 0.55), (-0.98, 0, 0.405), WOOD, collection, root, 0.025)
    add_box("Bed_Footboard", (0.06, 1.02, 0.25), (0.98, 0, 0.32), WOOD, collection, root, 0.018)
    add_box("Bed_Bedspread", (0.98, 0.90, 0.035), (0.40, 0, 0.52), FABRIC_BLUE, collection, root, 0.012)
    for y in (-0.23, 0.23):
        add_box("Bed_Pillow", (0.34, 0.30, 0.075), (-0.63, y, 0.535), WHITE, collection, root, 0.025)


def build_desk(collection, root):
    # Desk top is around 0.75 m above the floor.
    add_box("Desk_Top", (1.20, 0.60, 0.055), (0, 0, 0.735), WOOD_LIGHT, collection, root, 0.018)
    for x in (-0.53, 0.53):
        for y in (-0.24, 0.24):
            add_box("Desk_Leg", (0.055, 0.055, 0.71), (x, y, 0.355), METAL, collection, root, 0.008)
    add_box("Desk_Back_Panel", (1.08, 0.035, 0.18), (0, 0.255, 0.62), WOOD, collection, root, 0.008)
    add_box("Desk_Drawer", (0.35, 0.43, 0.12), (-0.29, 0.02, 0.64), WOOD, collection, root, 0.012)
    add_box("Desk_Drawer_Handle", (0.10, 0.025, 0.018), (-0.29, -0.205, 0.65), METAL, collection, root, 0.004)


def build_chair(collection, root):
    # Chair facing toward negative Y. Overall height is about 0.85 m.
    add_box("Chair_Seat", (0.45, 0.44, 0.065), (0, 0, 0.455), WOOD_LIGHT, collection, root, 0.025)
    for x in (-0.17, 0.17):
        for y in (-0.16, 0.16):
            add_box("Chair_Leg", (0.045, 0.045, 0.43), (x, y, 0.215), WOOD_DARK, collection, root, 0.008)
    add_box("Chair_Back", (0.45, 0.055, 0.43), (0, 0.19, 0.70), WOOD, collection, root, 0.018)
    add_box("Chair_Back_Cushion", (0.37, 0.035, 0.30), (0, 0.155, 0.72), FABRIC_GREEN, collection, root, 0.018)
    add_box("Chair_Seat_Cushion", (0.41, 0.39, 0.045), (0, -0.005, 0.505), FABRIC_GREEN, collection, root, 0.018)


def build_wardrobe(collection, root):
    # Approx. 1.2 m wide x 0.6 m deep x 2.0 m tall.
    add_box("Wardrobe_Carcass", (1.18, 0.58, 1.96), (0, 0, 0.98), WOOD, collection, root, 0.025)
    add_box("Wardrobe_Back", (1.12, 0.025, 1.88), (0, -0.295, 0.99), WOOD_DARK, collection, root, 0.006)
    for x in (-0.295, 0.295):
        add_box("Wardrobe_Door", (0.575, 0.035, 1.84), (x, 0.305, 0.99), WOOD_LIGHT, collection, root, 0.012)
    for x in (-0.045, 0.045):
        add_box("Wardrobe_Handle", (0.018, 0.025, 0.13), (x, 0.329, 1.00), METAL, collection, root, 0.005)
    add_box("Wardrobe_Base", (1.22, 0.60, 0.07), (0, 0, 0.055), WOOD_DARK, collection, root, 0.01)


def build_bedside_table(collection, root):
    # Small bedside cabinet around 0.5 m high.
    add_box("Bedside_Cabinet", (0.43, 0.39, 0.40), (0, 0, 0.25), WOOD, collection, root, 0.018)
    add_box("Bedside_Top", (0.47, 0.43, 0.055), (0, 0, 0.4775), WOOD_LIGHT, collection, root, 0.018)
    for z in (0.18, 0.34):
        add_box("Bedside_Drawer_Front", (0.37, 0.025, 0.12), (0, 0.205, z), WOOD_LIGHT, collection, root, 0.01)
        add_box("Bedside_Drawer_Handle", (0.08, 0.022, 0.018), (0, 0.222, z), METAL, collection, root, 0.004)
    for x in (-0.16, 0.16):
        for y in (-0.14, 0.14):
            add_box("Bedside_Foot", (0.045, 0.045, 0.08), (x, y, 0.04), WOOD_DARK, collection, root, 0.006)


def build_bookshelf(collection, root):
    # Open bookshelf approx. 0.8 m wide x 0.3 m deep x 1.5 m tall.
    add_box("Bookshelf_Left_Side", (0.045, 0.30, 1.48), (-0.38, 0, 0.74), WOOD, collection, root, 0.012)
    add_box("Bookshelf_Right_Side", (0.045, 0.30, 1.48), (0.38, 0, 0.74), WOOD, collection, root, 0.012)
    add_box("Bookshelf_Back", (0.74, 0.025, 1.42), (0, -0.14, 0.74), WOOD_DARK, collection, root, 0.006)
    for z in (0.04, 0.40, 0.76, 1.12, 1.46):
        add_box("Bookshelf_Shelf", (0.78, 0.29, 0.035), (0, 0, z), WOOD_LIGHT, collection, root, 0.008)

    book_materials = (BOOK_RED, BOOK_GREEN, BOOK_BLUE, FABRIC, WOOD_DARK)
    rows = (0.23, 0.59, 0.95, 1.30)
    for row_index, z in enumerate(rows):
        x = -0.27
        for book_index in range(4):
            width = (0.075, 0.09, 0.07, 0.085)[book_index]
            height = (0.19, 0.22, 0.17, 0.20)[(book_index + row_index) % 4]
            add_box(
                "Bookshelf_Book",
                (width, 0.19, height),
                (x + width / 2, 0.035, z + height / 2),
                book_materials[(book_index + row_index) % len(book_materials)],
                collection,
                root,
                0.004,
            )
            x += width + 0.025


ASSETS = [
    ("bed", build_bed),
    ("desk", build_desk),
    ("chair", build_chair),
    ("wardrobe", build_wardrobe),
    ("bedside_table", build_bedside_table),
    ("bookshelf", build_bookshelf),
]


def export_selected_glb(filepath):
    # Export only the already-selected active asset, including its root empty
    # and all selected child meshes. The caller prepares the selection.
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )


def main():
    clear_previous_generated_scene()
    scene = bpy.context.scene
    built_assets = []

    for index, (asset_name, builder) in enumerate(ASSETS):
        collection, root = add_asset_collection(asset_name)
        # The builder creates one model around the origin, so each individual
        # GLB receives a clean local coordinate system with its feet at Z=0.
        builder(collection, root)
        asset_objects = list(collection.objects)

        for obj in bpy.context.selected_objects:
            obj.select_set(False)
        for obj in asset_objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = root

        output_path = GLB_DIR / f"{asset_name}.glb"
        export_selected_glb(output_path)
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError(f"GLB export failed or produced an empty file: {output_path}")
        print(f"[SpaceFit] Exported {output_path} ({output_path.stat().st_size:,} bytes)")

        # Spread the models out after export so the saved .blend file is easy
        # to inspect. This preview offset does not affect individual GLBs.
        column = index % 3
        row = index // 3
        root.location = ((column - 1) * 3.5, row * 3.2, 0.0)
        built_assets.append((asset_name, root))

    # Make the saved Blender project open with all six furniture pieces visible.
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    for _, root in built_assets:
        root.select_set(True)
    if built_assets:
        bpy.context.view_layer.objects.active = built_assets[0][1]

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_FILE))
    print("\n[SpaceFit] Furniture generation complete.")
    print(f"[SpaceFit] GLB assets: {GLB_DIR}")
    print(f"[SpaceFit] Blender source: {BLEND_FILE}")
    print("[SpaceFit] Assets: " + ", ".join(f"{name}.glb" for name, _ in built_assets))


if __name__ == "__main__":
    main()
