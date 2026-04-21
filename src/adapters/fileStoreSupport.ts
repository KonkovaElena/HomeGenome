import fs from "node:fs/promises";
import path from "node:path";

const FILE_LOCK_TIMEOUT_MS = 2_000;
const FILE_LOCK_RETRY_DELAY_MS = 25;

async function ensureStoreFile(
  filePath: string,
  initialContent: string,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, initialContent, "utf8");
  }
}

export async function readJsonStore<T>(
  filePath: string,
  fallbackValue: T,
): Promise<T> {
  await ensureStoreFile(
    filePath,
    `${JSON.stringify(fallbackValue, null, 2)}\n`,
  );

  const raw = await fs.readFile(filePath, "utf8");
  if (!raw.trim()) {
    return fallbackValue;
  }

  return JSON.parse(raw) as T;
}

export async function writeJsonStoreAtomic<T>(
  filePath: string,
  value: T,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const tempFilePath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );

  await fs.writeFile(tempFilePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");

  try {
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code !== "EEXIST" && nodeError.code !== "EPERM") {
      throw error;
    }

    await fs.rm(filePath, { force: true });
    await fs.rename(tempFilePath, filePath);
  }
}

export async function withFileLock<T>(
  filePath: string,
  operation: () => Promise<T>,
): Promise<T> {
  const lockPath = `${filePath}.lock`;
  const deadline = Date.now() + FILE_LOCK_TIMEOUT_MS;
  let handle: fs.FileHandle | undefined;

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  while (!handle) {
    try {
      handle = await fs.open(lockPath, "wx");
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code !== "EEXIST") {
        throw error;
      }

      if (Date.now() >= deadline) {
        throw new Error(`Timed out acquiring file lock for ${filePath}`);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, FILE_LOCK_RETRY_DELAY_MS),
      );
    }
  }

  try {
    return await operation();
  } finally {
    await handle.close();
    await fs.rm(lockPath, { force: true });
  }
}

export function defaultStatePath(fileName: string): string {
  return path.resolve(process.cwd(), "state", fileName);
}