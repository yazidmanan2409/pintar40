// Review tooling: next/navigation outside Next, for the language control.
export function useRouter() {
  return { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
}
export function usePathname() {
  return "/aktifkan";
}
export function useSearchParams() {
  return new URLSearchParams();
}
export function redirect(): never {
  throw new Error("redirect is not available in the review harness");
}
