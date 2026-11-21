// Node 26 expone localStorage sin almacenamiento funcional si falta --localstorage-file.
const datos = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    get length() { return datos.size; },
    clear: () => datos.clear(),
    getItem: (key: string) => datos.get(key) ?? null,
    key: (index: number) => [...datos.keys()][index] ?? null,
    removeItem: (key: string) => datos.delete(key),
    setItem: (key: string, value: string) => { datos.set(key, String(value)); },
  } satisfies Storage,
});
