import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const png = await sharp("app/icon.svg").resize(48, 48).png().toBuffer();
const ico = Buffer.alloc(22 + png.length);

ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // icon resource
ico.writeUInt16LE(1, 4); // image count
ico.writeUInt8(48, 6); // width
ico.writeUInt8(48, 7); // height
ico.writeUInt8(0, 8); // palette colors
ico.writeUInt8(0, 9); // reserved
ico.writeUInt16LE(1, 10); // color planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18); // image offset
png.copy(ico, 22);

await writeFile("app/favicon.ico", ico);
