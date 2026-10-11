// The app's tsconfig has no Node types; the test setup only needs Node's File.
declare module "node:buffer" {
  export const File: typeof globalThis.File;
}
