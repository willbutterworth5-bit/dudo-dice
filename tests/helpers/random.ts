export async function withMockedRandom<T>(
  values: number[],
  run: () => Promise<T> | T
): Promise<T> {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => values[Math.min(index++, values.length - 1)] ?? 0;

  try {
    return await run();
  } finally {
    Math.random = originalRandom;
  }
}
