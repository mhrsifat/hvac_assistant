import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';
import { configureEcho, echo, useConnectionStatus } from '@laravel/echo-react';
import { useCallback, useEffect, useRef, useState } from 'react';



type LogEntry = {
  id: number;
  type: 'info' | 'success' | 'error' | 'event';
  message: string;
  details?: string;
  timestamp: string;
};

type ListenerStatus = {
  connectionStatus: string;
  socketId: string;
};

function createLogEntry(
  id: number,
  type: LogEntry['type'],
  message: string,
  details?: string,
): LogEntry {
  return {
    id,
    type,
    message,
    details,
    timestamp: new Date().toLocaleTimeString(),
  };
}

function ChannelListener({
  channelName,
  onEvent,
  onStatus,
  appendLog,
}: {
  channelName: string;
  onEvent: (payload: any, eventName: string) => void;
  onStatus: (status: ListenerStatus) => void;
  appendLog: (type: LogEntry['type'], message: string, details?: string) => void;
}) {
  const connectionStatus = useConnectionStatus();
  const lastStatusRef = useRef<string>('');

  useEffect(() => {
    if (!channelName) {
return;
}

    appendLog('info', 'Attempting to subscribe...', channelName);

    const channel = echo().private(channelName);

    channel.subscribed(() => {
      appendLog('success', 'Subscription confirmed by Reverb.', channelName);
    });

    channel.error((error: any) => {
      appendLog('error', 'Subscription failed.', JSON.stringify(error));
    });

    channel.listen('.App\\Events\\NewMessageReceived', (payload: any) => {
      onEvent(payload, 'NewMessageReceived');
    });

    channel.listen('.App\\Events\\ChatTitleUpdated', (payload: any) => {
      onEvent(payload, 'ChatTitleUpdated');
    });

    channel.listen('.App\\Events\\ChatStatusUpdated', (payload: any) => {
      onEvent(payload, 'ChatStatusUpdated');
    });

    return () => {
      echo().leave(channelName);
      appendLog('info', 'Left channel.', channelName);
    };
  }, [channelName, appendLog, onEvent]);

  useEffect(() => {
    const socketId = echo().socketId() ?? 'not connected';
    const statusKey = `${connectionStatus}:${socketId}`;

    if (lastStatusRef.current === statusKey) {
      return;
    }

    lastStatusRef.current = statusKey;
    onStatus({
      connectionStatus,
      socketId,
    });
  }, [connectionStatus, onStatus]);

  return null;
}

function EchoStatusWatcher({
  onStatus,
}: {
  onStatus: (status: ListenerStatus) => void;
}) {
  const connectionStatus = useConnectionStatus();
  const lastStatusRef = useRef<string>('');

  useEffect(() => {
    const socketId = echo().socketId() ?? 'not connected';
    const statusKey = `${connectionStatus}:${socketId}`;

    if (lastStatusRef.current === statusKey) {
      return;
    }

    lastStatusRef.current = statusKey;
    onStatus({
      connectionStatus,
      socketId,
    });
  }, [connectionStatus, onStatus]);

  return null;
}

export default function ChatBroadcastTester() {
  const [username, setUsername] = useState('');
  const [reverbAppKey, setReverbAppKey] = useState(
    import.meta.env.VITE_REVERB_APP_KEY ?? '',
  );
  const [reverbHost, setReverbHost] = useState(
    import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
  );
  const [reverbPort, setReverbPort] = useState(
    String(import.meta.env.VITE_REVERB_PORT ?? '443'),
  );
  const [reverbScheme, setReverbScheme] = useState(
    import.meta.env.VITE_REVERB_SCHEME ?? 'https',
  );
  const [bearerToken, setBearerToken] = useState('');
  const [broadcastAuthEndpoint, setBroadcastAuthEndpoint] = useState('/api/broadcasting/auth');
  const [isConfigured, setIsConfigured] = useState(false);
  const [subscribedChannel, setSubscribedChannel] = useState('');
  const [listenerStatus, setListenerStatus] = useState<ListenerStatus>({
    connectionStatus: 'not connected',
    socketId: 'not connected',
  });
  const [logs, setLogs] = useState<LogEntry[]>([
    createLogEntry(1, 'info', 'Reverb test page ready (Laravel Echo).'),
  ]);
  const connectionFailureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoggedStatusRef = useRef<string>('');

  const privateChannelName = username.trim() ? `user.${username.trim()}` : '';

  const appendLog = (
    type: LogEntry['type'],
    message: string,
    details?: string,
  ): void => {
    setLogs((currentLogs) => [
      ...currentLogs,
      createLogEntry(currentLogs.length + 1, type, message, details),
    ]);
  };

  const handleStatusChange = useCallback(
    (status: ListenerStatus): void => {
      setListenerStatus(status);

      const statusKey = `${status.connectionStatus}:${status.socketId}`;

      if (lastLoggedStatusRef.current === statusKey) {
        return;
      }

      lastLoggedStatusRef.current = statusKey;

      if (connectionFailureTimerRef.current) {
        clearTimeout(connectionFailureTimerRef.current);
        connectionFailureTimerRef.current = null;
      }

      if (status.connectionStatus === 'connected') {
        appendLog('success', 'Echo connected.', `Socket ID: ${status.socketId}`);

        return;
      }

      if (status.connectionStatus === 'connecting') {
        appendLog('info', 'Echo connecting.', `Socket ID: ${status.socketId}`);

        connectionFailureTimerRef.current = setTimeout(() => {
          appendLog('error', 'Echo connection timed out.', 'Reverb did not report a connected socket. Check host, port, scheme, and Reverb service status.');
        }, 10000);

        return;
      }

      if (status.connectionStatus === 'reconnecting') {
        appendLog('info', 'Echo reconnecting.', `Socket ID: ${status.socketId}`);

        return;
      }

      if (status.connectionStatus === 'disconnected') {
        appendLog('error', 'Echo disconnected.', `Socket ID: ${status.socketId}`);

        return;
      }

      appendLog('error', `Echo ${status.connectionStatus}.`, `Socket ID: ${status.socketId}`);
    },
    [],
  );

  const handleConnectEcho = (): void => {
    try {
      configureEcho({
        broadcaster: 'reverb',
        key: reverbAppKey,
        wsHost: reverbHost,
        wsPort: Number(reverbPort),
        wssPort: Number(reverbPort),
        forceTLS: reverbScheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: broadcastAuthEndpoint,
        bearerToken,
      });

      setIsConfigured(true);
      appendLog('success', 'Echo configured.', `${reverbHost}:${reverbPort} via ${reverbScheme}`);
    } catch (error) {
      setIsConfigured(false);
      appendLog('error', 'Echo configuration failed.', String(error));
    }
  };

  const handleSubscribe = (): void => {
    if (!isConfigured) {
      appendLog('error', 'Configure Echo first before subscribing.');

      return;
    }

    if (!privateChannelName.trim()) {
      appendLog('error', 'Channel username is required.');

      return;
    }

    setSubscribedChannel(privateChannelName.trim());
    appendLog('success', 'Subscribed to private channel.', privateChannelName.trim());
  };

  const handleUnsubscribe = (): void => {
    setSubscribedChannel('');
    appendLog('info', 'Unsubscribed from private channel.');
  };

  const handleDisconnect = (): void => {
    try {
      echo().disconnect();
    } catch {
      // No active Echo instance yet.
    }

    setIsConfigured(false);
    setSubscribedChannel('');
    handleStatusChange({
      connectionStatus: 'disconnected',
      socketId: 'not connected',
    });
    appendLog('info', 'Echo disconnected.');
  };

  const handleEvent = (payload: any, eventName: string): void => {
    appendLog('event', `${eventName} received.`, JSON.stringify(payload));
  };

  return (
    <AdminLayout title="Chat Broadcast Tester">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Use Laravel Echo to verify private-channel auth and confirm ConversationUpdated events.
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure Reverb, subscribe to a private conversation channel, then send a message API request and watch the logs update.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle>Connection + Channel</CardTitle>
              <CardDescription>
                Connect to Reverb, subscribe to a private channel, and trigger message events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="username">Channel Username</Label>
                  <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="user.username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reverb-key">Reverb App Key</Label>
                  <Input id="reverb-key" value={reverbAppKey} onChange={(event) => setReverbAppKey(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reverb-host">Reverb Host</Label>
                  <Input id="reverb-host" value={reverbHost} onChange={(event) => setReverbHost(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reverb-port">Reverb Port</Label>
                  <Input id="reverb-port" value={reverbPort} onChange={(event) => setReverbPort(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reverb-scheme">Scheme (http or https)</Label>
                  <Input id="reverb-scheme" value={reverbScheme} onChange={(event) => setReverbScheme(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bearer-token">Bearer Token (JWT)</Label>
                <Input
                  id="bearer-token"
                  value={bearerToken}
                  onChange={(event) => setBearerToken(event.target.value)}
                  placeholder="Paste auth token used by auth:api"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-endpoint">Broadcast Auth Endpoint</Label>
                <Input id="auth-endpoint" value={broadcastAuthEndpoint} onChange={(event) => setBroadcastAuthEndpoint(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="private-channel">Private Channel Name</Label>
                <Input id="private-channel" value={privateChannelName} readOnly placeholder="user.your-username" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleConnectEcho}>
                  Connect Echo
                </Button>
                <Button type="button" variant="secondary" onClick={handleSubscribe}>
                  Subscribe Channel
                </Button>
                <Button type="button" variant="outline" onClick={handleUnsubscribe}>
                  Unsubscribe
                </Button>
                <Button type="button" variant="destructive" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-950">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  Socket ID: <span className="font-normal">{listenerStatus.socketId}</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  Connection: <span className="font-normal">{listenerStatus.connectionStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white/90 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle>Live Logs</CardTitle>
              <CardDescription>
                Monitor incoming WebSocket events and connection status in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setLogs([])}>
                  Clear Logs
                </Button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-slate-950 p-4 text-xs text-slate-50 dark:border-gray-800">
                <div className="mb-3 font-semibold text-slate-200">Live Logs</div>
                <div className="max-h-[22rem] overflow-auto space-y-2 font-mono leading-5">
                  {logs.length === 0 ? (
                    <div className="text-slate-400">No logs yet.</div>
                  ) : (
                    logs.map((entry) => (
                      <div key={entry.id} className="whitespace-pre-wrap break-words">
                        <span className="text-slate-400">[{entry.timestamp}]</span>{' '}
                        <span className={entry.type === 'error' ? 'text-red-300' : entry.type === 'success' ? 'text-emerald-300' : entry.type === 'event' ? 'text-cyan-300' : 'text-slate-200'}>
                          {entry.message}
                        </span>
                        {entry.details ? (
                          <div className="mt-1 text-slate-400">{entry.details}</div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {subscribedChannel ? (
          <ChannelListener
            key={subscribedChannel}
            channelName={subscribedChannel}
            onEvent={handleEvent}
            onStatus={handleStatusChange}
            appendLog={appendLog}
          />
        ) : null}

        {isConfigured ? (
          <EchoStatusWatcher
            onStatus={handleStatusChange}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
}