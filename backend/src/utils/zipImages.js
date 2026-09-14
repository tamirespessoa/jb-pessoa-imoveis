const fs = require("fs");
const path = require("path");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function makeLocalHeader(nameBuffer, crc, size, modifiedAt) {
  const { time, date } = dosDateTime(modifiedAt);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6); // UTF-8
  header.writeUInt16LE(0, 8); // sem compressão; fotos já são comprimidas
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(size, 18);
  header.writeUInt32LE(size, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function makeCentralHeader(nameBuffer, crc, size, offset, modifiedAt) {
  const { time, date } = dosDateTime(modifiedAt);
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8); // UTF-8
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(time, 12);
  header.writeUInt16LE(date, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(size, 20);
  header.writeUInt32LE(size, 24);
  header.writeUInt16LE(nameBuffer.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return header;
}

function makeEndRecord(entries, centralSize, centralOffset) {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries, 8);
  end.writeUInt16LE(entries, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return end;
}

async function writeZipResponse(res, files) {
  const centralEntries = [];
  let offset = 0;

  for (const file of files) {
    const data = await fs.promises.readFile(file.absolutePath);
    const stats = await fs.promises.stat(file.absolutePath);
    const nameBuffer = Buffer.from(file.zipName, "utf8");
    const crc = crc32(data);
    const localHeader = makeLocalHeader(nameBuffer, crc, data.length, stats.mtime);

    res.write(localHeader);
    res.write(nameBuffer);
    res.write(data);

    centralEntries.push({
      nameBuffer,
      crc,
      size: data.length,
      offset,
      modifiedAt: stats.mtime
    });

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;

  for (const entry of centralEntries) {
    const centralHeader = makeCentralHeader(
      entry.nameBuffer,
      entry.crc,
      entry.size,
      entry.offset,
      entry.modifiedAt
    );
    res.write(centralHeader);
    res.write(entry.nameBuffer);
    centralSize += centralHeader.length + entry.nameBuffer.length;
  }

  res.end(makeEndRecord(centralEntries.length, centralSize, centralOffset));
}

function resolveUploadImage(imagePath, uploadDir) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/uploads/")) {
    return null;
  }

  const filename = path.basename(imagePath);
  const absolutePath = path.join(uploadDir, filename);
  const resolvedUploadDir = path.resolve(uploadDir) + path.sep;
  const resolvedFile = path.resolve(absolutePath);

  if (!resolvedFile.startsWith(resolvedUploadDir)) return null;
  if (!fs.existsSync(resolvedFile) || !fs.statSync(resolvedFile).isFile()) return null;

  return resolvedFile;
}

module.exports = {
  writeZipResponse,
  resolveUploadImage
};
