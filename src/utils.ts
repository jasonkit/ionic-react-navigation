export function generateUniqueId() {
  return (
    [1e7].toString() +
    -(1e3).toString() +
    -(4e3).toString() +
    -(8e3).toString() +
    -(1e11).toString()
  ).replace(/[018]/g, function(c: any) {
    const random = crypto.getRandomValues(new Uint8Array(1));
    return (c ^ ((random ? random[0] : 0) & (15 >> (c / 4)))).toString(16);
  });
}

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
