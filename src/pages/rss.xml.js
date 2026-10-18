import rss from '@astrojs/rss';
import { getTimelineItems } from '../utils/timelineItems';
import { stableRssGuid } from '../utils/rssGuid.mjs';

export async function GET(context) {
  const items = await getTimelineItems();

  return rss({
    title: 'Audiofool',
    description: 'Projects, notes, photography, AudioShow, and timeline updates.',
    site: context.site,
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.date,
      description: item.description || (item.kind === 'audioshow' ? 'A batch of episodes from the AudioShow music journal.' : item.title),
      link: item.href,
      customData: stableRssGuid(item.kind === 'project' ? `/projects/${item.sourceId}/` : item.href),
    })),
    customData: `<language>en-us</language>`,
  });
}
