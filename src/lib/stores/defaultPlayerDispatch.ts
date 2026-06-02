import { queueStore } from './queue.svelte';
import { createPlayerDispatch, type PlayerCommandName } from './playerDispatch.svelte';

const PLAYER_COMMANDS_THAT_REFRESH_QUEUE = new Set<PlayerCommandName>([
  'playMusicItem',
  'playMovieItem',
  'playEpisodeItem',
  'playMusicVideoItem',
  'playFileItem',
  'playPlaylistItem',
  'playChannelItem'
]);

export const playerDispatch = createPlayerDispatch({
  afterSuccessfulCommand: (command) => {
    if (!PLAYER_COMMANDS_THAT_REFRESH_QUEUE.has(command)) {
      return;
    }

    return queueStore.refresh(`command:${command}`);
  }
});
