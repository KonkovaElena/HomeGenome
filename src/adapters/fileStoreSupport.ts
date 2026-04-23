import fs from "node:fs/promises";
import path from "node:path";

const FILE_LOCK_TIMEOUT_MS = 2_000;
const FILE_LOCK_RETRY_DELAY_MS = 25;
const FILE_LOCK_STALE_MS = 30_000;

type FileLockRecord = {
  pid: number;
  acquiredAt: string;
};

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
      await handle.writeFile(
        `${JSON.stringify({
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
        } satisfies FileLockRecord)}\n`,
        "utf8",
      );
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code !== "EEXIST") {
        throw error;
      }

      if (await shouldRecoverStaleLock(lockPath)) {
        await fs.rm(lockPath, { force: true });
        continue;
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

async function shouldRecoverStaleLock(lockPath: string): Promise<boolean> {
  try {
    const [raw, stats] = await Promise.all([
      fs.readFile(lockPath, "utf8"),
      fs.stat(lockPath),
    ]);

    const lockAgeMs = Date.now() - stats.mtimeMs;
    const record = parseFileLockRecord(raw);

    if (!record) {
      return lockAgeMs >= FILE_LOCK_STALE_MS;
    }

    return !isProcessAlive(record.pid);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function parseFileLockRecord(raw: string): FileLockRecord | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<FileLockRecord>;

    if (
      typeof parsed.pid === "number" &&
      Number.isInteger(parsed.pid) &&
      typeof parsed.acquiredAt === "string" &&
      parsed.acquiredAt.length > 0
    ) {
      return {
        pid: parsed.pid,
        acquiredAt: parsed.acquiredAt,
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ESRCH") {
      return false;
    }

    return true;
  }
}