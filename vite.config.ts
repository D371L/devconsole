import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Для GitHub Pages: если репозиторий не является персональной страницей,
    // нужен base path в виде /repository-name/
    // GITHUB_REPOSITORY имеет формат: username/repository-name
    const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
    const base = (mode === 'production' && repositoryName) ? `/${repositoryName}/` : '/';
    
    return {
      base: base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      envPrefix: 'VITE_',
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
