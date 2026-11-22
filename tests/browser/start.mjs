/**
 * Where the lab checks start: the Computer Lab.
 *
 * The site's bare address used to open the Computer Lab. Since the School
 * home took that address, `?lab=computer` opens the lab directly. A URL that
 * already carries a query is left alone, and a separately built version that
 * does not know the address simply ignores it.
 */
export function computerLab(url) {
  const address = new URL(url);
  if (!address.search) address.search = '?lab=computer';
  return address.toString();
}
