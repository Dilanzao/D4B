try {
  const { build } = await import('vite');
  await build();
  await import('./postbuild.js');
} catch (error) {
  const missingVite = error?.code === 'ERR_MODULE_NOT_FOUND' && String(error?.message || '').includes("package 'vite'");
  if (!missingVite) throw error;
  console.warn('Vite não está instalado neste ambiente. Gerando o build estático de contingência.');
  await import('./static-build.js');
}
