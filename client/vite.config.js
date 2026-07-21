import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins:[react()],
  build:{
    sourcemap:false,
    target:'es2022',
    rollupOptions:{
      output:{
        manualChunks(id){
          if(!id.includes('node_modules'))return;
          if(id.includes('recharts')||id.includes('d3-'))return 'charts';
          if(id.includes('lucide-react'))return 'icons';
          if(id.includes('react'))return 'react';
          return;
        }
      }
    }
  }
});
