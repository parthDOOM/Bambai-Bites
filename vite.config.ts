import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repo = process.env.GITHUB_REPOSITORY;
let base = '/';
if (repo) {
  const repoName = repo.split('/')[1];
  if (!repoName.includes('.github.io')) {
    base = `/${repoName}/`;
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
