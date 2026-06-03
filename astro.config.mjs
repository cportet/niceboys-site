import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://niceboys.pages.dev",
  vite: {
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".css")) {
              return "_astro/site.[hash][extname]";
            }

            return "_astro/[name].[hash][extname]";
          }
        }
      }
    }
  }
});
