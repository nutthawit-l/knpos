# Design Spec: PWA & Favicon App Icon Update

Update the Point of Sale application's browser favicon and Progressive Web App (PWA) manifest launcher icons to use the new mascot logo.

## Goal

Change the current abstract gradient favicon and generic PWA launcher icons to use the dog mascot logo image, ensuring the icons look professional and render correctly across devices (including modern Android/iOS adaptive launchers that require safe-zone padding for maskable icons).

## Proposed Changes

### Source Image
The source image has been downloaded from the user's provided URL and saved locally as:
*   `public/new_app_icon_source.jpg` (512x512 px JPEG, RGB, with solid background)

### Generated Assets
We will run a script utilizing the `sharp` library to generate the following assets inside the `public/` directory:
1.  **`favicon.png`** (32x32 px): Resized for standard browser tabs.
2.  **`pwa-192x192.png`** (192x192 px): Standard icon with `any` purpose.
3.  **`pwa-512x512.png`** (512x512 px): Standard icon with `any` purpose.
4.  **`pwa-192x192-maskable.png`** (192x192 px): Maskable icon with 10% padding added around the source image, with the background filled using the logo's background color.
5.  **`pwa-512x512-maskable.png`** (512x512 px): Maskable icon with 10% padding added around the source image, with the background filled using the logo's background color.

### Configuration Updates

#### [index.html](file:///home/tie/Projects/knpos/index.html)
Update the icon link tag to point to the new PNG favicon:
```diff
-    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
+    <link rel="icon" type="image/png" href="/favicon.png" />
```

#### [vite.config.ts](file:///home/tie/Projects/knpos/vite.config.ts)
Update `vite-plugin-pwa` configuration to bundle the PNG favicon and map the new `any` and `maskable` icon sets:
```diff
       registerType: 'autoUpdate',
-      includeAssets: ['favicon.svg'],
+      includeAssets: ['favicon.png'],
       manifest: {
         name: 'Charni POS',
         short_name: 'Charni POS',
         description: 'Progressive Web App Point of Sale',
         theme_color: '#ffffff',
         background_color: '#ffffff',
         display: 'standalone',
         orientation: 'portrait',
         start_url: '/',
         icons: [
           {
             src: 'pwa-192x192.png',
             sizes: '192x192',
             type: 'image/png',
             purpose: 'any',
           },
           {
-            src: 'pwa-192x192.png',
-            sizes: '192x192',
-            type: 'image/png',
-            purpose: 'maskable',
-          },
-          {
-            src: 'pwa-512x512.png',
-            sizes: '512x512',
-            type: 'image/png',
-            purpose: 'any',
-          },
-          {
-            src: 'pwa-512x512.png',
-            sizes: '512x512',
-            type: 'image/png',
-            purpose: 'maskable',
-          },
+            src: 'pwa-192x192-maskable.png',
+            sizes: '192x192',
+            type: 'image/png',
+            purpose: 'maskable',
+          },
+          {
+            src: 'pwa-512x512.png',
+            sizes: '512x512',
+            type: 'image/png',
+            purpose: 'any',
+          },
+          {
+            src: 'pwa-512x512-maskable.png',
+            sizes: '512x512',
+            type: 'image/png',
+            purpose: 'maskable',
+          },
         ],
       },
```

## Verification Plan

### Automated/Build Verification
1.  **File Generation:** Run the generation script and verify all target image files exist with expected dimensions.
2.  **App Build:** Run `pnpm build` to verify PWA configuration compiling successfully and outputting the generated manifest.

### Manual Verification
1.  Verify `/favicon.png` displays correctly in the browser tab.
2.  Verify the manifest JSON includes correct icons and matches the PWA spec.
