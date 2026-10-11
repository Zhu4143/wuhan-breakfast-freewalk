import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {reviewServer} from './tools/review-server.ts';
export default defineConfig({
  plugins:[react(),reviewServer()],base:'./',
  build:{target:'es2022',rollupOptions:{output:{
    // Split shared vendors while keeping the main street entry lazy.
    codeSplitting:{includeDependenciesRecursively:false,groups:[{debugName:'project-vendors',name(id){
      if(id.includes('node_modules/three/'))return 'three';
      if(id.includes('node_modules/gsap/'))return 'gsap';
      if(/node_modules\/(react|react-dom|scheduler)\//.test(id))return 'react';
    }}]},
  }}},
});
