import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

export function getFileName(url) {
  return fileURLToPath(url);
}

export function getDirName(url) {
  return path.dirname(getFileName(url));
}

export function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export const __filename = getFileName(import.meta.url);
export const __dirname = getDirName(import.meta.url);
