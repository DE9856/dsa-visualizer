/**
 * A GIF89a writer — palette, LZW and all — because no browser ships a GIF
 * encoder and this project keeps its dependency list to React.
 *
 * Three things do the work:
 *
 * - **Median cut** reduces the run's colours to a 255-entry table. The table
 *   is built from frames sampled across the whole run rather than from the
 *   first one, because a sort's palette changes as bars turn green.
 * - **Frame differencing** writes only the rectangle that actually changed
 *   since the previous frame, with unchanged pixels left transparent and the
 *   disposal method set to "leave in place". A sorting run moves two bars per
 *   step, so this is the difference between a file of a few hundred kilobytes
 *   and one of many megabytes.
 * - **LZW** is the compression GIF mandates: variable-width codes, packed
 *   least-significant-bit first, in sub-blocks of at most 255 bytes.
 *
 * The slot straight after the last real colour is reserved for transparency,
 * so a transparent pixel can never be mistaken for a colour that is genuinely
 * in the picture. That index moves with the palette rather than sitting at a
 * fixed 255: the colour table is only as large as the run needs, and on a
 * two-colour picture index 255 is not in the table at all — writing it there
 * produces a file every decoder gives up on after the first pixel.
 */

const MAX_COLORS = 255;

class ByteWriter {
  constructor() {
    this.buffer = new Uint8Array(1 << 16);
    this.length = 0;
  }

  ensure(extra) {
    if (this.length + extra <= this.buffer.length) return;
    let size = this.buffer.length;
    while (size < this.length + extra) size *= 2;
    const grown = new Uint8Array(size);
    grown.set(this.buffer.subarray(0, this.length));
    this.buffer = grown;
  }

  byte(value) {
    this.ensure(1);
    this.buffer[this.length++] = value & 0xff;
  }

  /** GIF stores multi-byte numbers little-endian. */
  short(value) {
    this.byte(value);
    this.byte(value >> 8);
  }

  bytes(values) {
    this.ensure(values.length);
    this.buffer.set(values, this.length);
    this.length += values.length;
  }

  ascii(text) {
    for (let i = 0; i < text.length; i++) this.byte(text.charCodeAt(i));
  }

  toUint8Array() {
    return this.buffer.subarray(0, this.length);
  }
}

/* ---------------------------------------------------------------- palette */

/**
 * Median cut: repeatedly split the colour box with the most spread along its
 * widest channel, until there are as many boxes as colours wanted. Each box
 * then contributes its average. It beats a fixed palette badly here because
 * the app's colours are a handful of tightly clustered hues, and an even cube
 * would spend most of its entries on colours that never appear.
 */
function medianCut(samples, count, maxColors) {
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;

  const boxes = [{ start: 0, end: count }];

  const spread = (box) => {
    const lo = [255, 255, 255];
    const hi = [0, 0, 0];
    for (let i = box.start; i < box.end; i++) {
      const p = order[i] * 3;
      for (let c = 0; c < 3; c++) {
        const value = samples[p + c];
        if (value < lo[c]) lo[c] = value;
        if (value > hi[c]) hi[c] = value;
      }
    }
    let channel = 0;
    let width = -1;
    for (let c = 0; c < 3; c++) {
      if (hi[c] - lo[c] > width) {
        width = hi[c] - lo[c];
        channel = c;
      }
    }
    return { channel, width };
  };

  while (boxes.length < maxColors) {
    let target = -1;
    let best = 0;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.end - box.start < 2) continue;
      const { width } = spread(box);
      if (width > best) {
        best = width;
        target = i;
      }
    }
    // Every remaining box is a single colour: splitting further would only
    // produce duplicate palette entries.
    if (target < 0) break;

    const box = boxes[target];
    const { channel } = spread(box);
    const slice = Array.from(order.subarray(box.start, box.end));
    slice.sort((a, b) => samples[a * 3 + channel] - samples[b * 3 + channel]);
    order.set(slice, box.start);

    const mid = box.start + ((box.end - box.start) >> 1);
    boxes.splice(target, 1, { start: box.start, end: mid }, { start: mid, end: box.end });
  }

  const palette = new Uint8Array(boxes.length * 3);
  boxes.forEach((box, i) => {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let j = box.start; j < box.end; j++) {
      const p = order[j] * 3;
      r += samples[p];
      g += samples[p + 1];
      b += samples[p + 2];
    }
    const n = Math.max(1, box.end - box.start);
    palette[i * 3] = Math.round(r / n);
    palette[i * 3 + 1] = Math.round(g / n);
    palette[i * 3 + 2] = Math.round(b / n);
  });
  return palette;
}

/**
 * A palette for the whole run, from frames spread across it. Pixels are
 * sampled rather than counted exhaustively — the picture is large and flat,
 * and every fourth pixel finds the same colours far faster.
 */
export function buildPalette(frames, maxColors = MAX_COLORS) {
  const stride = 4;
  let count = 0;
  for (const frame of frames) count += Math.ceil(frame.data.length / 4 / stride);

  const samples = new Uint8Array(count * 3);
  let at = 0;
  for (const frame of frames) {
    const { data } = frame;
    for (let i = 0; i < data.length; i += 4 * stride) {
      samples[at++] = data[i];
      samples[at++] = data[i + 1];
      samples[at++] = data[i + 2];
    }
  }
  return medianCut(samples, at / 3, maxColors);
}

/* -------------------------------------------------------------------- LZW */

function lzwEncode(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  const out = new ByteWriter();
  let bitBuffer = 0;
  let bitCount = 0;
  const chunk = [];

  const flushChunk = () => {
    if (!chunk.length) return;
    out.byte(chunk.length);
    out.bytes(Uint8Array.from(chunk));
    chunk.length = 0;
  };

  const emit = (code, size) => {
    bitBuffer |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      chunk.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
      if (chunk.length === 255) flushChunk();
    }
  };

  let dictionary = new Map();
  let next = eoiCode + 1;
  let codeSize = minCodeSize + 1;

  const reset = () => {
    dictionary = new Map();
    next = eoiCode + 1;
    codeSize = minCodeSize + 1;
  };

  emit(clearCode, codeSize);

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    // Packing the pair into one number keeps the dictionary a flat integer
    // map: string keys here cost more than the compression saves.
    const key = prefix * 256 + k;
    const found = dictionary.get(key);
    if (found !== undefined) {
      prefix = found;
      continue;
    }

    emit(prefix, codeSize);
    dictionary.set(key, next);
    // The width grows on the code being *assigned*, not on the count after
    // it. The decoder adds no entry for the first code it reads — it has no
    // previous string to extend yet — so its table trails the encoder's by
    // exactly one, and testing the incremented count here would widen a code
    // too late and turn every byte after it into noise.
    if (next === 1 << codeSize && codeSize < 12) codeSize++;
    next++;
    // 4095 is the largest code GIF allows; past it the dictionary is thrown
    // away and rebuilt, which the decoder mirrors when it sees the clear code.
    if (next > 4095) {
      emit(clearCode, codeSize);
      reset();
    }
    prefix = k;
  }

  emit(prefix, codeSize);
  emit(eoiCode, codeSize);
  if (bitCount > 0) chunk.push(bitBuffer & 0xff);
  flushChunk();
  out.byte(0);
  return out.toUint8Array();
}

/* ------------------------------------------------------------------- GIF */

function colorTableSize(colors) {
  let bits = 1;
  while (1 << bits < colors) bits++;
  return Math.min(8, Math.max(1, bits));
}

/**
 * Starts a GIF. `delayCs` is the per-frame delay in hundredths of a second,
 * which is the only resolution the format has — a delay under 2 is treated as
 * 10 by most viewers, so the caller should keep frame rates at or under 50fps
 * and expect browsers to clamp very fast ones.
 */
export function createGifEncoder({ width, height, palette, delayCs = 8, loop = 0 }) {
  const colors = palette.length / 3;
  const transparentIndex = colors;
  const bits = colorTableSize(colors + 1); // +1 for the transparent slot
  const tableEntries = 1 << bits;

  const out = new ByteWriter();
  out.ascii("GIF89a");
  out.short(width);
  out.short(height);
  out.byte(0x80 | (7 << 4) | (bits - 1)); // global table present, 8-bit colour
  out.byte(0);
  out.byte(0);

  const table = new Uint8Array(tableEntries * 3);
  table.set(palette.subarray(0, Math.min(palette.length, tableEntries * 3)));
  out.bytes(table);

  // NETSCAPE2.0 is the de-facto extension that makes a GIF loop.
  out.byte(0x21);
  out.byte(0xff);
  out.byte(11);
  out.ascii("NETSCAPE2.0");
  out.byte(3);
  out.byte(1);
  out.short(loop);
  out.byte(0);

  const nearest = new Map();
  const indexOf = (r, g, b) => {
    const key = (r << 16) | (g << 8) | b;
    const cached = nearest.get(key);
    if (cached !== undefined) return cached;
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < colors; i++) {
      const dr = r - palette[i * 3];
      const dg = g - palette[i * 3 + 1];
      const db = b - palette[i * 3 + 2];
      const distance = dr * dr + dg * dg + db * db;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
        if (distance === 0) break;
      }
    }
    nearest.set(key, best);
    return best;
  };

  let previous = null;
  const pixels = width * height;

  const addFrame = (imageData, { delay = delayCs } = {}) => {
    const { data } = imageData;
    const current = new Uint8Array(pixels);
    for (let i = 0, p = 0; i < pixels; i++, p += 4) {
      current[i] = indexOf(data[p], data[p + 1], data[p + 2]);
    }

    let left = 0;
    let top = 0;
    let w = width;
    let h = height;
    let frameIndices = current;

    if (previous) {
      // The changed rectangle, so an unchanged border costs nothing at all.
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
          if (current[row + x] !== previous[row + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < 0) {
        // Nothing moved. A one-pixel frame keeps the timeline honest without
        // repeating the picture.
        minX = 0;
        minY = 0;
        maxX = 0;
        maxY = 0;
      }

      left = minX;
      top = minY;
      w = maxX - minX + 1;
      h = maxY - minY + 1;

      frameIndices = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) {
        const from = (top + y) * width + left;
        const to = y * w;
        for (let x = 0; x < w; x++) {
          const index = from + x;
          frameIndices[to + x] =
            current[index] === previous[index] ? transparentIndex : current[index];
        }
      }
    }

    // Graphic control: disposal 1 (leave the frame in place), transparency on.
    out.byte(0x21);
    out.byte(0xf9);
    out.byte(4);
    out.byte((1 << 2) | 1);
    out.short(Math.max(2, Math.round(delay)));
    out.byte(transparentIndex);
    out.byte(0);

    out.byte(0x2c);
    out.short(left);
    out.short(top);
    out.short(w);
    out.short(h);
    out.byte(0);

    const minCodeSize = Math.max(2, bits);
    out.byte(minCodeSize);
    out.bytes(lzwEncode(frameIndices, minCodeSize));

    previous = current;
  };

  const finish = () => {
    out.byte(0x3b);
    return new Blob([out.toUint8Array()], { type: "image/gif" });
  };

  return { addFrame, finish };
}
