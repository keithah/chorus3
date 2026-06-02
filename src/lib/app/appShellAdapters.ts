import type {
  ActiveHostSummary,
  ConnectionStoreSnapshot,
  LocalPlayerStoreSnapshot,
  PlayerStoreSnapshot,
  SavedKodiHost
} from '$lib/stores';
import { optionalKodiImageUrl } from '$lib/media/kodiImageUrl';
import type { TranslationContext } from '$lib/i18n';
import type { AppShellPlayerSnapshot } from '$lib/app-shell/appShellTypes';

export function formatKodiVersion(version: ConnectionStoreSnapshot['kodiVersion']): string | null {
  if (version === null) {
    return null;
  }

  if (typeof version === 'string') {
    return version.trim() || null;
  }

  const parts = [version.major, version.minor, version.patch].filter(
    (part) => part !== undefined && part !== null
  );

  return parts.length > 0 ? parts.join('.') : null;
}

export function connectionTone(
  snapshot: ConnectionStoreSnapshot
): 'neutral' | 'success' | 'warning' | 'danger' {
  if (snapshot.status === 'failed') {
    return 'danger';
  }

  if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
    return 'warning';
  }

  if (snapshot.status === 'connected') {
    return 'success';
  }

  return 'neutral';
}

export function connectionStatusText(
  snapshot: ConnectionStoreSnapshot,
  i18n: TranslationContext
): string {
  if (snapshot.status === 'idle') {
    return i18n.t('app.connection.noHost');
  }

  if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
    return i18n.t('app.connection.degraded');
  }

  return snapshot.status;
}

export function connectionDescription(
  snapshot: ConnectionStoreSnapshot,
  i18n: TranslationContext
): string {
  const version = formatKodiVersion(snapshot.kodiVersion);
  const versionText = version ? i18n.t('app.connection.version', { version }) : '';
  const lastConnectedText = snapshot.lastConnectedAt
    ? i18n.t('app.connection.lastConnected', { lastConnectedAt: snapshot.lastConnectedAt })
    : '';

  if (snapshot.status === 'idle') {
    return i18n.t('app.connection.idleDescription');
  }

  if (snapshot.status === 'checking') {
    return i18n.t('app.connection.checkingDescription');
  }

  if (snapshot.webSocketDegraded || snapshot.status === 'degraded') {
    return i18n.t('app.connection.degradedDescription', {
      attempt: snapshot.reconnectAttempt,
      version: versionText,
      lastConnected: lastConnectedText
    });
  }

  if (snapshot.status === 'failed') {
    return snapshot.lastError
      ? i18n.t('app.connection.failedDescription', {
          source: snapshot.lastError.source,
          code: snapshot.lastError.code,
          message: snapshot.lastError.message
        })
      : i18n.t('app.connection.failedFallback');
  }

  const transportText = snapshot.webSocketEndpoint
    ? i18n.t('app.connection.connectedHttpWs')
    : i18n.t('app.connection.connectedHttp');

  return `${transportText}${versionText}${lastConnectedText}`;
}

export function createActiveHostSummary(host: SavedKodiHost): ActiveHostSummary {
  return {
    id: host.id,
    label: host.label,
    host: host.host,
    port: host.port ?? (host.useTls ? 443 : 8080),
    useTls: host.useTls,
    useWebSocket: host.useWebSocket,
    hasCredentials: Boolean(host.username || host.password)
  };
}

export function toAppShellPlayerSnapshot(
  value: PlayerStoreSnapshot,
  connectionStatus: ConnectionStoreSnapshot['status']
): AppShellPlayerSnapshot {
  return {
    title: dashboardMediaTitle(value),
    subtitle: dashboardMediaCreator(value, connectionStatus),
    currentTime: dashboardTime(value.time.currentSeconds),
    totalTime: dashboardTime(value.time.totalSeconds),
    progressPercent: dashboardProgress(value),
    isPlaying: (value.properties?.speed ?? 0) > 0,
    isShuffled: value.properties?.shuffled === true,
    thumbnailUrl: optionalKodiImageUrl(value.item?.thumbnail)
  };
}

export function toAppShellLocalPlayerSnapshot(
  value: LocalPlayerStoreSnapshot,
  localShuffleEnabled: boolean
): AppShellPlayerSnapshot {
  const title = firstDashboardText(value.item?.title, value.item?.label, 'Nothing playing');
  const subtitle =
    value.status === 'idle'
      ? 'Local player is ready'
      : `${value.mediaKind === 'video' ? 'Local video' : 'Local audio'} - ${value.status}`;
  const durationSeconds = value.durationSeconds;
  const progressPercent =
    typeof durationSeconds === 'number' && durationSeconds > 0
      ? Math.min(100, Math.max(0, (value.currentSeconds / durationSeconds) * 100))
      : 0;

  return {
    title,
    subtitle,
    currentTime: dashboardTime(value.currentSeconds),
    totalTime: dashboardTime(durationSeconds),
    progressPercent,
    isPlaying: value.status === 'playing',
    isShuffled: localShuffleEnabled,
    thumbnailUrl: optionalKodiImageUrl(value.item?.thumbnail)
  };
}

function dashboardMediaTitle(value: PlayerStoreSnapshot): string {
  return firstDashboardText(
    value.item?.title,
    value.item?.label,
    value.item?.showtitle,
    value.item?.channel,
    'Nothing playing'
  );
}

function dashboardMediaCreator(
  value: PlayerStoreSnapshot,
  connectionStatus: ConnectionStoreSnapshot['status']
): string {
  return firstDashboardText(
    joinDashboardText(value.item?.artist),
    joinDashboardText(value.item?.albumartist),
    value.item?.album,
    value.item?.showtitle,
    connectionStatus === 'connected' ? 'Kodi is ready' : 'Waiting for Kodi'
  );
}

function dashboardProgress(value: PlayerStoreSnapshot): number {
  const percentage = value.properties?.percentage;
  return typeof percentage === 'number' && Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;
}

function dashboardTime(seconds: number | null): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return '--:--';
  }

  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function firstDashboardText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return 'Unknown media';
}

function joinDashboardText(value: unknown): string | null {
  if (Array.isArray(value)) {
    const joined = value.filter((entry) => typeof entry === 'string' && entry.trim()).join(', ');
    return joined || null;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
