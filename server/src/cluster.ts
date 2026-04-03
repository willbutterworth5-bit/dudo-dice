import cluster from 'node:cluster';
import os from 'node:os';

const workerCount = parseInt(process.env.CLUSTER_WORKERS || '0', 10);

if (workerCount > 0 && cluster.isPrimary) {
  const count = Math.min(workerCount, os.cpus().length);
  console.log(`🔧 Primary process ${process.pid} starting ${count} workers...`);

  for (let i = 0; i < count; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    console.log(`⚠️  Worker ${worker.process.pid} exited (code ${code}), restarting...`);
    cluster.fork();
  });
} else {
  // Single-process mode (CLUSTER_WORKERS=0 or unset) or worker process
  await import('./index.js');
}
