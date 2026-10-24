export interface SampleTranscript {
  id: string;
  title: string;
  category: 'Dating' | 'Workplace' | 'Ex / Past Flame' | 'Friendship';
  scenario: string;
  transcript: string;
  context: string;
}

export const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    id: 'dating-hot-cold',
    title: 'Hot & Cold / Mixed Signals',
    category: 'Dating',
    scenario: 'Met on Hinge 2 weeks ago, had one amazing drinks date, but text energy shifted noticeably afterwards.',
    context: 'Went on one great date on Friday. Chemistry was 9/10 in person. Since Sunday, they take 8+ hours to respond with short answers, but still use friendly exclamation marks.',
    transcript: `[Sun 2:15 PM] User: Hey! Had such a great time the other night :) Hope your Sunday is relaxing!
[Sun 8:42 PM] Other: Heyyy sorry crazy busy day!! Yes was so fun!! Hope you're doing well!
[Mon 11:10 AM] User: Haha all good! Did you ever end up checking out that indie bookstore in the Mission?
[Mon 7:55 PM] Other: No not yet! Too much work this week 💀
[Tue 6:30 PM] User: Know that feeling haha. Would love to grab that matcha or a drink again when you come up for air later this week?
[Wed 9:15 AM] Other: Aw definitely! This week is super slammed with quarterly reviews but let's see how things shake out toward the weekend!
[Fri 3:45 PM] User: Happy Friday! Still drowning or did you survive the review sprint?
[Fri 11:20 PM] Other: Made it alive barely haha. Hope you have a fun weekend!`,
  },
  {
    id: 'workplace-passive-aggressive',
    title: 'Workplace Slack Tension',
    category: 'Workplace',
    scenario: 'Cross-functional project lead subtly withholding sign-off and shifting blame over Slack.',
    context: 'Senior Product Manager collaborating with Engineering Lead. Launch deadline is next Tuesday. Other person is subtly dodging accountability while appearing hyper-polite in public channels.',
    transcript: `[10:04 AM] User: Morning Marcus! Just pushed the finalized API schema doc to Notion. Could you review section 4 by 3 PM so we stay on track for QA?
[11:45 AM] Other: Saw the ping. A bit surprised this was finalized without the architecture sync we touched on briefly last Thursday?
[11:52 AM] User: We integrated the two caching notes from that chat into 4.2. Happy to hop on a quick 5-min huddle if you want to walk through them?
[1:30 PM] Other: Per my earlier comments on Slack, calendars are packed today. As long as you're comfortable owning any edge case regressions during sprint demo, go ahead with what you have.
[1:38 PM] User: We definitely want aligned sign-off rather than risking regressions. Which specific edge cases are you concerned about?
[4:05 PM] Other: Let's discuss in the all-hands tomorrow morning in front of the team. Thanks!`,
  },
  {
    id: 'ex-late-night-ping',
    title: 'Ex Re-Emerging Late at Night',
    category: 'Ex / Past Flame',
    scenario: 'Broke up 4 months ago due to their commitment hesitations. Suddenly sending nostalgic breadcrumbs.',
    context: 'Mutual breakup 4 months ago. Minimal contact since. Other person initiated no contact initially, but now drops random low-effort pings after midnight.',
    transcript: `[Thu 12:48 AM] Other: Random but I just walked past that ramen spot in Hayes Valley and immediately thought of you haha
[Thu 8:30 AM] User: Oh yeah, great tonkotsu. Hope you've been doing alright.
[Thu 2:15 PM] Other: Yeah surviving! Crazy how fast this year went. Do you ever miss our little Sunday morning routines?
[Thu 5:20 PM] User: Those were sweet times, but grateful for how things worked out. How is the new puppy doing?
[Fri 11:58 PM] Other: He's huge now! We should catch up properly sometime soon... if you're not seeing someone new? 😉`,
  },
  {
    id: 'friend-pulling-away',
    title: 'Close Friend Pulling Away',
    category: 'Friendship',
    scenario: 'Longtime friend making one-sided plans and leaving messages on delivered for days.',
    context: 'Friends for 5 years. Over the last 3 months, user initiates 90% of check-ins. Friend is active on Instagram stories but unresponsive to direct texts.',
    transcript: `[Oct 4] User: Hey! Miss you! Free for brunch or a walk this Sunday?
[Oct 6] Other: Hey babe! Ahhh so slammed this weekend with family stuff! Next week for sure!!
[Oct 12] User: Hey! How did the family visit go? Thinking of doing trivia at the pub on Thursday if you want to join our table!
[Oct 16] Other: Omg so sorry just seeing this!! Trivia looked so fun on your story!! We have to hang soon promise
[Oct 20] User: No worries! Let me know whenever a day works for you next week.
[Oct 27] Other: (Liked message)
[Nov 2] Other: Omg look at this meme it's literally us 💀💀`,
  },
];
