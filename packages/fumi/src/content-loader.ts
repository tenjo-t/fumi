import { PageData } from "./client/data";

export type DataLoader<T> =
  | {
      watch?: never;
      load(): Promise<T>;
    }
  | {
      watch: string[];
      load(watchFiles: string[], loadMarkdown: (path: string) => Promise<PageData>): Promise<T>;
    };

export type LoadedData<T extends DataLoader<unknown>> = T extends DataLoader<infer U> ? U : never;

export function defineLoader<T>(dataLoader: DataLoader<T>): DataLoader<T> {
  return dataLoader;
}
