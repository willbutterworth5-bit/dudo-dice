import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RoomManager } from './RoomManager.js';
import { RatingStore } from './RatingStore.js';
import { setupSocketHandlers } from './SocketHandlers.js';
import { getSupabaseClient } from './SupabaseClient.js';
import { MemoryRoomStore } from './store/MemoryRoomStore.js';
import { RedisRoomStore } from './store/RedisRoomStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "script-src 'self' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: ws: wss:",
    "frame-src 'self' https://accounts.google.com https://*.supabase.co",
    "form-action 'self' https://accounts.google.com",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join('; ');
}

app.use((_req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Content-Security-Policy', buildContentSecurityPolicy());

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
});

app.use(express.json());
const httpServer = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://dudodice.com',
      'https://www.dudodice.com',
      ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
      ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
    ]
  : '*' as const;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// --- Redis adapter (env-gated) ---
// Requires: npm install ioredis @socket.io/redis-adapter
// Only activated when REDIS_URL is set AND packages are installed.
if (process.env.REDIS_URL) {
  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const adapterMod: any = await import('@socket.io/redis-adapter' as any);
    const redisMod: any = await import('ioredis' as any);
    const Redis = redisMod.default ?? redisMod;
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(adapterMod.createAdapter(pubClient, subClient));
    /* eslint-enable @typescript-eslint/no-explicit-any */
    console.log('✅ Socket.io Redis adapter enabled');
  } catch (err) {
    console.warn('⚠️  Redis adapter packages not installed, falling back to in-memory:', (err as Error).message);
  }
}

// --- Room store (Redis-backed when REDIS_URL set) ---
const store = process.env.REDIS_URL ? new RedisRoomStore() : new MemoryRoomStore();
const roomManager = new RoomManager(store);
const ratingStore = new RatingStore();
const supabase = getSupabaseClient();

if (supabase) {
  console.log('✅ Supabase client initialised');
} else {
  console.log('ℹ️  Supabase not configured — running in guest-only mode');
}

// JWT verification middleware — extracts supabaseUserId from socket auth token
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (token && supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        socket.data.supabaseUserId = user.id as string;
      }
    } catch {
      // Invalid token — proceed as guest
    }
  }
  next();
});

// Setup socket handlers
setupSocketHandlers(io, roomManager, ratingStore, supabase);

// In production, serve the frontend build
if (process.env.NODE_ENV === 'production') {
  const frontendPath = join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
  });
}

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  const { message, category, email } = req.body as { message?: string; category?: string; email?: string };
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }
  const entry = {
    message: message.trim(),
    category: (typeof category === 'string' && category.trim()) ? category.trim() : 'general',
    email: (typeof email === 'string' && email.trim()) ? email.trim() : undefined,
  };
  console.log('📝 Feedback received:', JSON.stringify(entry));

  // Save to Supabase
  if (supabase) {
    const { error } = await supabase.from('feedback').insert(entry);
    if (error) console.error('Failed to save feedback to Supabase:', error.message);
  }

  // Send email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const fromEmail = process.env.RESEND_FROM ?? 'Dudo Dice <onboarding@resend.dev>';
    const body = [
      `Category: ${entry.category}`,
      `From: ${entry.email ?? '(no email provided)'}`,
      '',
      entry.message,
    ].join('\n');
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: ['willbutterworth5@gmail.com'],
          subject: `[Dudo Dice Feedback] ${entry.category}`,
          text: body,
        }),
      });
      if (!r.ok) console.error('Resend error:', await r.text());
    } catch (err) {
      console.error('Failed to send feedback email:', (err as Error).message);
    }
  }

  res.json({ ok: true });
});

// Account deletion endpoint
app.delete('/api/account', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'No token' }); return; }
  if (!supabase) { res.status(503).json({ error: 'Auth not configured' }); return; }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) { res.status(401).json({ error: 'Invalid token' }); return; }

  // Delete all user data rows (RLS bypassed via service key)
  await supabase.from('player_achievements').delete().eq('user_id', user.id);
  await supabase.from('player_ratings').delete().eq('id', user.id);
  await supabase.from('player_stats').delete().eq('id', user.id);
  await supabase.from('profiles').delete().eq('id', user.id);

  // Delete the auth user
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Failed to delete auth user:', deleteError.message);
    res.status(500).json({ error: 'Failed to delete account' });
    return;
  }

  console.log(`🗑️ Account deleted: ${user.id}`);
  res.json({ ok: true });
});

// Health check
app.get('/api/health', async (_req, res) => {
  const rooms = await roomManager.getPublicRooms();
  res.json({ status: 'ok', rooms: rooms.length });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`🎲 Dudo Dice server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await roomManager.destroy();
  httpServer.close();
});
