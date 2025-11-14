import { Buffer } from "buffer";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";

function hexToColor(hex) {
  const value = hex.replace("#", "");
  const bigint = parseInt(value, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b];
}

function mixColor(hex, intensity) {
  const base = hexToColor(hex);
  if (intensity === 0) {
    return base;
  }
  const target = intensity > 0 ? 1 : 0;
  const amount = Math.min(Math.abs(intensity), 1);
  return base.map((channel) => channel + (target - channel) * amount);
}

function withColor(geometry, color) {
  const resolved = Array.isArray(color) ? color : hexToColor(color);
  const colors = [];
  const count = geometry.positions.length / 3;
  for (let i = 0; i < count; i += 1) {
    colors.push(resolved[0], resolved[1], resolved[2]);
  }
  return { ...geometry, colors };
}

function createCylinder({ segments, radiusTop, radiusBottom, height, yOffset = 0 }) {
  const positions = [];
  const normals = [];
  const indices = [];
  const topRingIndices = [];
  const bottomRingIndices = [];
  const sideTopIndices = [];
  const sideBottomIndices = [];

  for (let i = 0; i < segments; i += 1) {
    const theta = (i / segments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    const topIndex = positions.length / 3;
    positions.push(radiusTop * cos, height / 2 + yOffset, radiusTop * sin);
    normals.push(cos, 0, sin);
    sideTopIndices.push(topIndex);

    const bottomIndex = positions.length / 3;
    positions.push(radiusBottom * cos, -height / 2 + yOffset, radiusBottom * sin);
    normals.push(cos, 0, sin);
    sideBottomIndices.push(bottomIndex);
  }

  for (let i = 0; i < segments; i += 1) {
    const currentTop = sideTopIndices[i];
    const currentBottom = sideBottomIndices[i];
    const nextTop = sideTopIndices[(i + 1) % segments];
    const nextBottom = sideBottomIndices[(i + 1) % segments];

    indices.push(currentTop, currentBottom, nextBottom);
    indices.push(currentTop, nextBottom, nextTop);
  }

  const topCenterIndex = positions.length / 3;
  positions.push(0, height / 2 + yOffset, 0);
  normals.push(0, 1, 0);

  for (let i = 0; i < segments; i += 1) {
    const theta = (i / segments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const index = positions.length / 3;
    positions.push(radiusTop * cos, height / 2 + yOffset, radiusTop * sin);
    normals.push(0, 1, 0);
    topRingIndices.push(index);
  }

  for (let i = 0; i < segments; i += 1) {
    const current = topRingIndices[i];
    const next = topRingIndices[(i + 1) % segments];
    indices.push(topCenterIndex, next, current);
  }

  const bottomCenterIndex = positions.length / 3;
  positions.push(0, -height / 2 + yOffset, 0);
  normals.push(0, -1, 0);

  for (let i = 0; i < segments; i += 1) {
    const theta = (i / segments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const index = positions.length / 3;
    positions.push(radiusBottom * cos, -height / 2 + yOffset, radiusBottom * sin);
    normals.push(0, -1, 0);
    bottomRingIndices.push(index);
  }

  for (let i = 0; i < segments; i += 1) {
    const current = bottomRingIndices[i];
    const next = bottomRingIndices[(i + 1) % segments];
    indices.push(bottomCenterIndex, current, next);
  }

  return { positions, normals, indices };
}

function createBox({ width, height, depth, yOffset = 0 }) {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;
  const faces = [
    {
      normal: [0, 0, 1],
      corners: [
        [-w, -h, d],
        [w, -h, d],
        [w, h, d],
        [-w, h, d],
      ],
    }, // front
    {
      normal: [0, 0, -1],
      corners: [
        [w, -h, -d],
        [-w, -h, -d],
        [-w, h, -d],
        [w, h, -d],
      ],
    }, // back
    {
      normal: [0, 1, 0],
      corners: [
        [-w, h, d],
        [w, h, d],
        [w, h, -d],
        [-w, h, -d],
      ],
    }, // top
    {
      normal: [0, -1, 0],
      corners: [
        [-w, -h, -d],
        [w, -h, -d],
        [w, -h, d],
        [-w, -h, d],
      ],
    }, // bottom
    {
      normal: [1, 0, 0],
      corners: [
        [w, -h, d],
        [w, -h, -d],
        [w, h, -d],
        [w, h, d],
      ],
    }, // right
    {
      normal: [-1, 0, 0],
      corners: [
        [-w, -h, -d],
        [-w, -h, d],
        [-w, h, d],
        [-w, h, -d],
      ],
    }, // left
  ];

  const positions = [];
  const normals = [];
  const indices = [];
  let vertexIndex = 0;

  for (const face of faces) {
    const startIndex = vertexIndex;
    for (const corner of face.corners) {
      positions.push(corner[0], corner[1] + yOffset, corner[2]);
      normals.push(...face.normal);
      vertexIndex += 1;
    }
    indices.push(
      startIndex,
      startIndex + 1,
      startIndex + 2,
      startIndex,
      startIndex + 2,
      startIndex + 3,
    );
  }

  return { positions, normals, indices };
}

function createDome({ radius, segments = 24, rings = 12, yOffset = 0 }) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let ring = 0; ring <= rings; ring += 1) {
    const v = ring / rings;
    const phi = (v * Math.PI) / 2;
    const y = Math.cos(phi) * radius + yOffset;
    const radial = Math.sin(phi) * radius;

    for (let seg = 0; seg < segments; seg += 1) {
      const u = seg / segments;
      const theta = u * Math.PI * 2;
      const x = Math.cos(theta) * radial;
      const z = Math.sin(theta) * radial;

      positions.push(x, y, z);
      const length = Math.sqrt(x * x + (y - yOffset) * (y - yOffset) + z * z) || 1;
      normals.push(x / length, (y - yOffset) / length, z / length);
    }
  }

  for (let ring = 0; ring < rings; ring += 1) {
    for (let seg = 0; seg < segments; seg += 1) {
      const current = ring * segments + seg;
      const next = current + segments;
      const nextSeg = ring * segments + ((seg + 1) % segments);
      const nextSegNextRing = nextSeg + segments;

      indices.push(current, nextSeg, next);
      indices.push(nextSeg, nextSegNextRing, next);
    }
  }

  return { positions, normals, indices };
}

function cloneGeometry(geometry) {
  return {
    positions: geometry.positions.slice(),
    normals: geometry.normals.slice(),
    indices: geometry.indices.slice(),
    colors: geometry.colors ? geometry.colors.slice() : undefined,
  };
}

function mergeGeometries(geometries) {
  const merged = { positions: [], normals: [], indices: [], colors: [] };
  let offset = 0;

  for (const geometry of geometries) {
    const positions = geometry.positions ?? [];
    const normals = geometry.normals ?? [];
    const indices = geometry.indices ?? [];
    const colors =
      geometry.colors && geometry.colors.length === positions.length
        ? geometry.colors
        : Array(positions.length).fill(1);

    merged.positions.push(...positions);
    merged.normals.push(...normals);
    merged.colors.push(...colors);
    merged.indices.push(...indices.map((index) => index + offset));
    offset += positions.length / 3;
  }

  return merged;
}

function translateGeometry(geometry, [tx, ty, tz]) {
  const clone = cloneGeometry(geometry);
  for (let i = 0; i < clone.positions.length; i += 3) {
    clone.positions[i] += tx;
    clone.positions[i + 1] += ty;
    clone.positions[i + 2] += tz;
  }
  return clone;
}

function rotateGeometryY(geometry, angle) {
  const clone = cloneGeometry(geometry);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  for (let i = 0; i < clone.positions.length; i += 3) {
    const x = clone.positions[i];
    const z = clone.positions[i + 2];
    clone.positions[i] = x * cos - z * sin;
    clone.positions[i + 2] = x * sin + z * cos;
  }

  for (let i = 0; i < clone.normals.length; i += 3) {
    const x = clone.normals[i];
    const z = clone.normals[i + 2];
    clone.normals[i] = x * cos - z * sin;
    clone.normals[i + 2] = x * sin + z * cos;
  }

  return clone;
}

function leanGeometry(geometry, factor) {
  const positions = geometry.positions.slice();
  const normals = geometry.normals.slice();
  let maxHeight = -Infinity;
  let minHeight = Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    const y = positions[i];
    maxHeight = Math.max(maxHeight, y);
    minHeight = Math.min(minHeight, y);
  }
  const heightRange = maxHeight - minHeight || 1;

  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const tilt = ((y - minHeight) / heightRange) * factor;
    positions[i] += tilt;
  }

  for (let i = 0; i < normals.length; i += 3) {
    normals[i] += factor * 0.4;
    const length = Math.sqrt(
      normals[i] * normals[i] + normals[i + 1] * normals[i + 1] + normals[i + 2] * normals[i + 2],
    );
    if (length > 0) {
      normals[i] /= length;
      normals[i + 1] /= length;
      normals[i + 2] /= length;
    }
  }

  return { ...geometry, positions, normals };
}

function padBuffer(buffer, padByte = 0x00) {
  const padding = (4 - (buffer.length % 4)) % 4;
  if (padding === 0) {
    return buffer;
  }
  return Buffer.concat([buffer, Buffer.alloc(padding, padByte)]);
}

function minMax(positions) {
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    mins[0] = Math.min(mins[0], x);
    mins[1] = Math.min(mins[1], y);
    mins[2] = Math.min(mins[2], z);
    maxs[0] = Math.max(maxs[0], x);
    maxs[1] = Math.max(maxs[1], y);
    maxs[2] = Math.max(maxs[2], z);
  }
  return { min: mins, max: maxs };
}

function writeGlb(targetPath, geometry) {
  const positionsArray = new Float32Array(geometry.positions);
  const normalsArray = new Float32Array(geometry.normals);
  const colorsArray = new Float32Array(geometry.colors);
  const indicesArray = new Uint16Array(geometry.indices);

  const positionBuffer = padBuffer(
    Buffer.from(positionsArray.buffer, positionsArray.byteOffset, positionsArray.byteLength),
  );
  const normalBuffer = padBuffer(
    Buffer.from(normalsArray.buffer, normalsArray.byteOffset, normalsArray.byteLength),
  );
  const colorBuffer = padBuffer(
    Buffer.from(colorsArray.buffer, colorsArray.byteOffset, colorsArray.byteLength),
  );
  const indexBuffer = padBuffer(
    Buffer.from(indicesArray.buffer, indicesArray.byteOffset, indicesArray.byteLength),
  );

  const positionOffset = 0;
  const normalOffset = positionOffset + positionBuffer.length;
  const colorOffset = normalOffset + normalBuffer.length;
  const indexOffset = colorOffset + colorBuffer.length;
  const totalBinaryLength = indexOffset + indexBuffer.length;

  const { min, max } = minMax(geometry.positions);

  const json = {
    asset: { version: "2.0", generator: "ItalySpot Model Generator" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: {
              POSITION: 0,
              NORMAL: 1,
              COLOR_0: 2,
            },
            indices: 3,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: "LowPolyMaterial",
        doubleSided: true,
        pbrMetallicRoughness: {
          baseColorFactor: [1, 1, 1, 1],
          metallicFactor: 0.05,
          roughnessFactor: 0.75,
        },
      },
    ],
    buffers: [{ byteLength: totalBinaryLength }],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: positionOffset,
        byteLength: positionsArray.byteLength,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: normalOffset,
        byteLength: normalsArray.byteLength,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: colorOffset,
        byteLength: colorsArray.byteLength,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: indexOffset,
        byteLength: indicesArray.byteLength,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positionsArray.length / 3,
        type: "VEC3",
        min,
        max,
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normalsArray.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: colorsArray.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 3,
        componentType: 5123,
        count: indicesArray.length,
        type: "SCALAR",
      },
    ],
  };

  const jsonString = JSON.stringify(json);
  const jsonBuffer = padBuffer(Buffer.from(jsonString, "utf8"), 0x20);

  const headerLength = 12;
  const chunkHeaderLength = 8;
  const totalLength =
    headerLength + chunkHeaderLength + jsonBuffer.length + chunkHeaderLength + totalBinaryLength;

  const header = Buffer.alloc(headerLength);
  header.write("glTF", 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(chunkHeaderLength);
  jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonChunkHeader.write("JSON", 4);

  const binChunkHeader = Buffer.alloc(chunkHeaderLength);
  binChunkHeader.writeUInt32LE(totalBinaryLength, 0);
  binChunkHeader.write("BIN\0", 4);

  const payload = Buffer.concat([
    header,
    jsonChunkHeader,
    jsonBuffer,
    binChunkHeader,
    positionBuffer,
    normalBuffer,
    colorBuffer,
    indexBuffer,
  ]);

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, payload);
}

function createArchRing({ segments, radius, height, width, depth, yOffset, color, platformColor }) {
  const columns = [];
  const bandHeight = 0.08;
  const columnHeight = height - bandHeight;
  const platform = withColor(
    createCylinder({
      segments: segments * 2,
      radiusTop: radius + depth / 2,
      radiusBottom: radius + depth / 2,
      height: bandHeight,
      yOffset: yOffset + columnHeight,
    }),
    platformColor,
  );

  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const column = withColor(
      createBox({
        width,
        height: columnHeight,
        depth,
        yOffset: columnHeight / 2,
      }),
      color,
    );
    const rotated = rotateGeometryY(column, angle);
    const positioned = translateGeometry(rotated, [
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    ]);
    const lifted = translateGeometry(positioned, [0, yOffset, 0]);
    columns.push(lifted);
  }

  return mergeGeometries([...columns, platform]);
}

function createColosseum() {
  const palette = {
    base: "#b27a46",
    mid: "#c6965d",
    light: "#dec4a0",
    pale: "#f0e3d2",
    shadow: "#8e6235",
  };

  const lower = withColor(
    createCylinder({
      segments: 32,
      radiusTop: 1.4,
      radiusBottom: 1.48,
      height: 0.4,
      yOffset: -0.5,
    }),
    palette.base,
  );
  const podium = withColor(
    createCylinder({
      segments: 32,
      radiusTop: 1.32,
      radiusBottom: 1.35,
      height: 0.25,
      yOffset: -0.2,
    }),
    mixColor(palette.base, 0.2),
  );
  const middle = withColor(
    createCylinder({
      segments: 32,
      radiusTop: 1.22,
      radiusBottom: 1.25,
      height: 0.4,
      yOffset: 0.15,
    }),
    palette.light,
  );
  const upper = withColor(
    createCylinder({
      segments: 32,
      radiusTop: 1.05,
      radiusBottom: 1.1,
      height: 0.32,
      yOffset: 0.6,
    }),
    palette.pale,
  );
  const rim = withColor(
    createCylinder({
      segments: 32,
      radiusTop: 1.15,
      radiusBottom: 1.15,
      height: 0.12,
      yOffset: 0.85,
    }),
    mixColor(palette.pale, 0.15),
  );
  const archRingLower = createArchRing({
    segments: 18,
    radius: 1.18,
    height: 0.45,
    width: 0.18,
    depth: 0.32,
    yOffset: -0.05,
    color: mixColor(palette.light, -0.15),
    platformColor: mixColor(palette.light, 0.08),
  });

  const archRingUpper = createArchRing({
    segments: 16,
    radius: 1.0,
    height: 0.35,
    width: 0.16,
    depth: 0.28,
    yOffset: 0.4,
    color: mixColor(palette.pale, -0.12),
    platformColor: mixColor(palette.pale, 0.05),
  });

  const crown = withColor(
    createCylinder({
      segments: 32,
      radiusTop: 0.6,
      radiusBottom: 0.75,
      height: 0.18,
      yOffset: 0.95,
    }),
    mixColor(palette.pale, -0.2),
  );

  return mergeGeometries([lower, podium, middle, upper, rim, archRingLower, archRingUpper, crown]);
}

function createDuomo() {
  const palette = {
    base: "#dcd4c5",
    accent: "#c2b6a1",
    dome: "#94a28f",
    domeLight: "#aeb9a5",
    roof: "#c57c4a",
  };

  const base = withColor(
    createBox({ width: 2.0, depth: 1.4, height: 0.3, yOffset: -0.65 }),
    palette.base,
  );
  const nave = withColor(
    createBox({ width: 1.2, depth: 1.0, height: 0.8, yOffset: -0.1 }),
    palette.accent,
  );
  const transept = translateGeometry(
    withColor(createBox({ width: 0.6, depth: 1.3, height: 0.7, yOffset: -0.05 }), palette.accent),
    [0, 0.05, 0],
  );
  const facade = translateGeometry(
    withColor(createBox({ width: 1.0, depth: 0.3, height: 0.9, yOffset: -0.05 }), palette.base),
    [0, 0, 0.65],
  );

  const drum = withColor(
    createCylinder({
      segments: 24,
      radiusTop: 0.62,
      radiusBottom: 0.72,
      height: 0.5,
      yOffset: 0.45,
    }),
    mixColor(palette.dome, -0.1),
  );
  const dome = withColor(
    createDome({ radius: 0.85, segments: 24, rings: 14, yOffset: 0.8 }),
    palette.dome,
  );
  const lanternBase = withColor(
    createCylinder({
      segments: 18,
      radiusTop: 0.24,
      radiusBottom: 0.28,
      height: 0.25,
      yOffset: 1.4,
    }),
    palette.domeLight,
  );
  const lantern = withColor(
    createCylinder({
      segments: 12,
      radiusTop: 0.12,
      radiusBottom: 0.18,
      height: 0.35,
      yOffset: 1.6,
    }),
    palette.domeLight,
  );
  const spire = withColor(
    createCylinder({
      segments: 12,
      radiusTop: 0.02,
      radiusBottom: 0.08,
      height: 0.35,
      yOffset: 1.85,
    }),
    mixColor(palette.domeLight, -0.3),
  );

  const sideChapel = translateGeometry(
    withColor(createBox({ width: 0.5, depth: 0.6, height: 0.5, yOffset: -0.25 }), palette.base),
    [0.9, -0.05, 0],
  );
  const sideChapel2 = translateGeometry(sideChapel, [-1.8, 0, 0]);

  const frontRoof = translateGeometry(
    withColor(createBox({ width: 1.0, depth: 0.6, height: 0.2, yOffset: 0.35 }), palette.roof),
    [0, 0.4, 0.5],
  );
  const sideRoof = translateGeometry(
    withColor(createBox({ width: 0.6, depth: 1.0, height: 0.18, yOffset: 0.2 }), palette.roof),
    [0.6, 0.3, 0],
  );
  const sideRoof2 = translateGeometry(sideRoof, [-1.2, 0, 0]);

  return mergeGeometries([
    base,
    nave,
    transept,
    facade,
    drum,
    dome,
    lanternBase,
    lantern,
    spire,
    sideChapel,
    sideChapel2,
    frontRoof,
    sideRoof,
    sideRoof2,
  ]);
}

function createTower() {
  const palette = {
    base: "#d9cdbb",
    stripe: "#c4b49f",
    highlight: "#f0e6d9",
    roof: "#c48a4f",
    shadow: "#ae8f6b",
  };

  const base = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.72,
      radiusBottom: 0.78,
      height: 0.35,
      yOffset: -0.85,
    }),
    palette.shadow,
  );
  const lower = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.55,
      radiusBottom: 0.6,
      height: 0.6,
      yOffset: -0.45,
    }),
    palette.base,
  );
  const middle = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.5,
      radiusBottom: 0.55,
      height: 0.6,
      yOffset: 0.05,
    }),
    palette.highlight,
  );
  const upper = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.45,
      radiusBottom: 0.5,
      height: 0.5,
      yOffset: 0.5,
    }),
    palette.base,
  );
  const bellChamber = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.48,
      radiusBottom: 0.48,
      height: 0.28,
      yOffset: 0.85,
    }),
    palette.stripe,
  );
  const cap = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.3,
      radiusBottom: 0.45,
      height: 0.28,
      yOffset: 1.05,
    }),
    palette.roof,
  );
  const spire = withColor(
    createCylinder({
      segments: 16,
      radiusTop: 0.05,
      radiusBottom: 0.2,
      height: 0.45,
      yOffset: 1.25,
    }),
    mixColor(palette.roof, -0.15),
  );

  const stripe1 = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.6,
      radiusBottom: 0.6,
      height: 0.08,
      yOffset: -0.2,
    }),
    palette.stripe,
  );
  const stripe2 = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.55,
      radiusBottom: 0.55,
      height: 0.08,
      yOffset: 0.3,
    }),
    palette.stripe,
  );
  const stripe3 = withColor(
    createCylinder({
      segments: 20,
      radiusTop: 0.5,
      radiusBottom: 0.5,
      height: 0.08,
      yOffset: 0.7,
    }),
    palette.stripe,
  );
  const windows = createArchRing({
    segments: 12,
    radius: 0.54,
    height: 0.32,
    width: 0.12,
    depth: 0.18,
    yOffset: 0.78,
    color: mixColor(palette.shadow, -0.2),
    platformColor: mixColor(palette.shadow, 0.1),
  });

  const merged = mergeGeometries([
    base,
    lower,
    middle,
    upper,
    bellChamber,
    cap,
    spire,
    stripe1,
    stripe2,
    stripe3,
    windows,
  ]);

  return leanGeometry(merged, 0.3);
}

const outputDir = join(process.cwd(), "public", "models");

writeGlb(join(outputDir, "colosseum.glb"), createColosseum());
writeGlb(join(outputDir, "duomo.glb"), createDuomo());
writeGlb(join(outputDir, "tower.glb"), createTower());

console.log(`Generated GLB models in ${outputDir}`);
