import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import {fileURLToPath} from 'node:url';
export default defineConfig({base:'/engi/',resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},plugins:[react(),VitePWA({registerType:'prompt',injectRegister:false,includeAssets:['favicon.svg','icon-192.png','icon-512.png'],manifest:{name:'Энги — тренажёр знаний',short_name:'Энги',lang:'ru',display:'standalone',start_url:'/engi/',scope:'/engi/',theme_color:'#184be7',background_color:'#f6f8fa',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},workbox:{cacheId:'engi-shell-v1',globPatterns:['**/*.{js,css,html,png,svg,woff2,webmanifest}'],navigateFallback:'index.html',cleanupOutdatedCaches:true,skipWaiting:false,clientsClaim:true,maximumFileSizeToCacheInBytes:4*1024*1024}})]});
