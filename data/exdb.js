const EXDB_DATA = 
[
{
  slug: 'netflix-recommendations',
  company: 'Netflix',
  problem: 'Recommendations',
  oneLiner: 'Netflix (300M users, 80% of viewing from recommendations) moved from batch daily recs to a real-time system that reacts to what you do mid-session',
  addedOn: '30 May 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Real-Time ML', 'Post-Training'],
  sections: {
    problem: `Netflix serves 300M+ users. 80% of all viewing is driven by recommendations — not search. The original system ran batch jobs once a day: recommendations were pre-computed, stored in a key-value store, and served via lookup.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Batch job runs once a day. If you spent 40 minutes browsing thrillers on Tuesday evening, the system still showed you the same recommendations it generated that morning. No awareness of what you did in the current session.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    Reranking happens on the device in real time. Every scroll, every hover, every pause is a signal. Rows below the fold update before you reach them. 15 reranking events per session vs. 3 with batch.
  </div>
</div>

Two deeper problems sat underneath this: (1) Generic LLMs trained on the internet know what Netflix is but have never seen the inside of it — they don't know which titles are trending this week, which actors appear in which series, or whether a specific user finishes thrillers but abandons documentaries. (2) The model architecture used at the time stored all user history in a single vector — meaning recent behaviour could overwrite older preferences. A user who watched one horror film could suddenly see their entire homepage shift to horror.`,

    howSolved: `Netflix tackled this across two layers — post-training the LLM to understand their catalogue, and moving reranking to the client device for real-time signal capture.

<strong>Layer 1 — Post-training the model</strong>
Netflix built an internal post-training framework with four methods applied in sequence:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Method</div><div>What it does</div><div>When to use it</div>
  </div>
  <div class="ex-table-row">
    <div>SFT</div>
    <div>Fed the model viewing history → next title pairs. Teaches which titles are relevant.</div>
    <div>Always first — builds base capability</div>
  </div>
  <div class="ex-table-row">
    <div>Preference Optimisation</div>
    <div>Showed model two candidate recommendations, told it which was preferred.</div>
    <div>When there's no single right answer — only better and worse</div>
  </div>
  <div class="ex-table-row">
    <div>Reinforcement Learning</div>
    <div>Let model try recommendations, rewarded it when users actually watched.</div>
    <div>Only after SFT + preference optimisation hit a ceiling</div>
  </div>
  <div class="ex-table-row">
    <div>Knowledge Distillation</div>
    <div>Used large expensive model as teacher for a smaller cheaper one.</div>
    <div>When you need production-grade speed at scale</div>
  </div>
</div>

Llama 3.1 8B trained on 110K data points showed 3–5% improvement over Netflix's production model.

<strong>Layer 2 — Real-time reranking on the client device</strong>

<div class="ex-flow">
  <div class="ex-flow-step">User scrolls past a row</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Implicit signal captured on-device</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Lightweight model reranks next rows</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Updated rows appear before user scrolls to them</div>
</div>

No server roundtrip = no latency penalty. Devices can be low-powered (TVs), so lightweight probabilistic models are used — not deep neural nets.

<strong>Infrastructure lesson learned the hard way:</strong>
Netflix built a custom tokeniser for more control. Tiny differences between training and production split caused quality to degrade months later with no obvious cause. Switching to the standard HuggingFace tokeniser fixed it. Departing from ecosystem conventions creates debt repaid in mysterious bugs.`,

    users: `Streaming users who open Netflix needing to find something in roughly 90 seconds — after that they either leave or default to rewatching something familiar.

<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Long-term taste user (3+ years of history)</div>
  Failure mode: system shows what they watched last month, not what they're in the mood for tonight. Batch systems fail this user because they can't distinguish "my all-time preferences" from "what I want right now."
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Cold-start user (just signed up)</div>
  Failure mode: homepage full of generic popular titles that feel like they could have been shown to anyone. Real-time signals from the first click (genre, language, actor) allow immediate personalisation before the user loses patience.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">80%</div>
    <div class="ex-stat-label">Of Netflix viewing driven by recommendations, not search</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">15×</div>
    <div class="ex-stat-label">Reranking events per session with real-time vs. 3× with batch</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3–5%</div>
    <div class="ex-stat-label">Improvement over production model from post-trained Llama 3.1 8B</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">110K</div>
    <div class="ex-stat-label">Data points used to train, evaluated on 5K held-out user-title pairs</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Fine-tuning requires evals first.</strong> Fine-tuning without an eval system means you can't measure whether it worked or made things worse. Netflix had internal evals before post-training. Teams that skip this step often don't know if their fine-tuning degraded the model.</p>

<p style="margin-bottom:0.75rem;"><strong>B. RL adds reasoning capability but is expensive.</strong> Use only when SFT and preference optimisation have hit a ceiling. RL training is computationally heavy and harder to debug when something goes wrong.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Real-time reranking sacrifices candidate generation.</strong> Moving reranking to the device means you can't run the full candidate generation pipeline on-device — that stays in the cloud. You're reranking a fixed candidate set generated server-side. If the candidate set is stale, real-time reranking helps but can't fully compensate.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Lightweight models have a quality ceiling.</strong> The probabilistic models used on-device for TV reranking are fast but less accurate than deep neural nets. Netflix accepted this tradeoff for latency. On mobile (more compute available), heavier models are feasible.</p>

<p style="margin-bottom:0.75rem;"><strong>E. Ecosystem conventions matter more than you think.</strong> The tokeniser incident is the clearest example: a seemingly harmless customisation caused months of quality degradation with no obvious cause. In production AI systems, invisible mismatches between training and serving are the most dangerous bugs.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you improve Netflix recommendations?"</div>
  <div class="ex-interview-answer">Don't jump to "use a better model." Structure in two layers:
<br><br><strong>Layer 1 — Post-training architecture:</strong>
<br>• SFT for base capability
<br>• Preference optimisation for nuanced taste signals
<br>• RL for multi-step reasoning (expensive — use only after SFT hits ceiling)
<br>• Distillation for production economics at 300M user scale
<br><br><strong>Layer 2 — Real-time signal capture:</strong>
<br>• Reranking on the device, not the server
<br>• Horizontal scroll = implicit negative signal
<br>• Rows below the fold update before the user reaches them
<br><br>The key insight interviewers want: real-time recommendations are not just faster batch — they capture a fundamentally different signal (what the user does right now vs. what they did historically).</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a recommendation system for Hotstar / JioCinema / Zee5"</div>
  <div class="ex-interview-answer">Use Netflix as your north star. Same post-training stack:
<br>• SFT → preference optimisation → distillation
<br><br>Add two India-specific layers:
<br>• <strong>Cold-start is more acute</strong> — users arrive for one IPL match with no streaming history. First-session signals matter more than anywhere else.
<br>• <strong>Multilingual preference signals</strong> — Tamil on Sundays, Hindi on weekdays is a pattern a single-language model misses entirely.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you fine-tune vs. use RAG vs. prompt engineer?"</div>
  <div class="ex-interview-answer">Netflix is the clearest production answer. Fine-tune when:
<br>• Stable domain (their catalogue doesn't change structurally)
<br>• Specific task (recommendation ranking, not open-ended Q&A)
<br>• Sufficient labelled data (110K examples)
<br><br>RAG wouldn't help here — the problem is preference learning, not knowledge gaps. The model doesn't need to look things up; it needs to learn what "light and funny on a Tuesday" means for a specific user's taste profile.
<br><br>Prompting alone can't encode that level of personalisation.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates say "use a better model" or "switch to GPT-4." Two things wrong with this:
  <br><br>• <strong>Wrong diagnosis.</strong> Netflix's problem wasn't model capability. The model had never seen Netflix's catalogue — it didn't know which titles exist, which actors appear in which series, or what a specific user's taste looks like. Switching model versions doesn't fix a domain knowledge gap. Post-training fixes it.
  <br><br>• <strong>Wrong fix.</strong> Even with the right model, batch recommendations can't react to what a user does mid-session. A better model running on yesterday's data still shows yesterday's recommendations. The architecture must change — not just the model.
  <br><br>The right answer: post-training architecture first (teach the model your domain), real-time signal capture second (react to session behaviour). Model selection is third.
</div>`,

    sources: [
      { id: 27, title: 'How Netflix Turns Generic LLMs into Recommendation Engines', url: 'https://www.newsletter.justanotherpm.com/p/how-netflix-turns-generic-llms-into-recommendation-engines' },
      { id: 41, title: 'The Future of E-commerce Personalization — EdgeRec', url: 'https://www.technomanagers.com/p/the-future-of-e-commerce-personalization' },
      { id: 59, title: 'Real-time Machine Learning For Recommendations', url: 'https://eugeneyan.com/writing/real-time-recommendations/' },
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' }
    ]
  }
},

{
  slug: 'alibaba-real-time-recommendations',
  company: 'Alibaba',
  problem: 'Real-Time Recommendations',
  oneLiner: 'Alibaba 1688 (B2B platform, billions of daily interactions) built a 4-component real-time architecture that reacts to every click in under 1 second and invented Swing to fix the Harry Potter problem in collaborative filtering',
  addedOn: '30 May 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Real-Time ML'],
  sections: {
    problem: `Alibaba's B2B platform 1688 (and consumer platform Taobao) faced the classic batch recommendation problem at extreme scale.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Batch job runs once a day. A buyer spending 20 minutes browsing industrial fasteners still sees apparel recommendations — because the batch job ran last night. Standard collaborative filtering makes it worse: popular items appear "similar" to everything because they share users with everything. Harry Potter gets recommended to everyone.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    4-component real-time pipeline: user click → updated ranking in under 1 second. Swing algorithm fixes the Harry Potter problem by weighting item similarity based on how discriminative the shared users are — not just how many.
  </div>
</div>

The Harry Potter problem explained: any item that millions of people click ends up appearing "similar" to everything, simply because it shares users with everything. At Alibaba's scale (billions of interactions daily), this noise completely drowns out genuine item-item relationships.`,

    howSolved: `Alibaba built a four-component real-time recommendation architecture for 1688, and invented the Swing algorithm to fix the Harry Potter problem.

<strong>The four-component pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">User clicks item</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">ABFS computes real-time features</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">BE retrieves 1,000 candidates via ANN</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">RTP ranks top 600 shown to user</div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>iGraph</div>
    <div>Distributed graph DB storing user preference weights and item metadata</div>
    <div>Updated asynchronously per interaction — allows graph queries like "what did users who clicked this item buy next?"</div>
  </div>
  <div class="ex-table-row">
    <div>ABFS</div>
    <div>Real-time feature server — computes statistical features on interactions as they happen</div>
    <div>Knows what you did 10 seconds ago, not 10 hours ago</div>
  </div>
  <div class="ex-table-row">
    <div>BE</div>
    <div>Candidate retrieval — narrows millions of items to ~1,000 using ANN embeddings</div>
    <div>Fast and coarse — trades precision for speed. Swing runs here.</div>
  </div>
  <div class="ex-table-row">
    <div>RTP</div>
    <div>Ranking layer — scores 1,000 candidates using logistic regression + Wide & Deep + BST</div>
    <div>Top 600 shown to user. Full pipeline completes in under 1 second.</div>
  </div>
</div>

<strong>The Swing algorithm — fixing the Harry Potter problem</strong>

Standard CF counts how many users interacted with both items. Problem: power users who click everything inflate similarity between unrelated items.

Swing fixes this: item-pair similarity is weighted by how <em>different</em> the users who co-clicked both items are from each other. Two selective users who rarely agree both clicking Item A and Item B = strong signal. Two power users who click everything co-clicking them = weak signal.

The intuition: a discriminative user co-clicking two items is worth far more than a promiscuous user doing the same. At Alibaba's scale, this surfaces genuine relationships that standard CF buries under noise.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Mission-centric B2B buyer</div>
  Needs 10,000 fasteners of a specific grade, right now. Failure mode: batch system shows apparel because that dominated their history. Real-time signals from the current session tell the system exactly which procurement category they're in within seconds of the first click.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Discovery buyer</div>
  Exploring suppliers across categories. Failure mode: standard CF floods recommendations with popular items (the Harry Potter problem) instead of genuinely related products. Swing-based i2i similarity surfaces relevant items rather than just popular ones.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">72%</div>
    <div class="ex-stat-label">Of users click the "Recommended For You" widget — primary engagement signal</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">&lt;1s</div>
    <div class="ex-stat-label">End-to-end pipeline latency — user click to updated ranking</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">4.5%</div>
    <div class="ex-stat-label">CTR improvement from BST over mean pooling of behavioural sequences</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+5ms</div>
    <div class="ex-stat-label">Latency cost of BST upgrade (15ms → 20ms) — a deliberate PM tradeoff</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Latency vs. model quality tradeoff is explicit.</strong> BST improves CTR by 4.5% but costs 5ms more latency per request. At Alibaba's scale, 5ms compounds into real infrastructure cost. This is a PM decision: accept higher cost for better ranking, or use a cheaper model for tighter latency SLA.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Real-time requires 24/7 infrastructure.</strong> Batch recommendations decouple computation from serving — if the compute job fails, the cache still serves yesterday's recommendations. Real-time systems have no cache buffer. If RTP goes down, the user gets no ranking. Ops burden is significantly higher. This is the primary reason most products shouldn't default to real-time recommendations.</p>

<p style="margin-bottom:0.75rem;"><strong>C. The Swing algorithm requires tuning.</strong> The weighting function that penalises promiscuous users has a hyperparameter controlling how aggressively popular users are down-weighted. Too aggressive and you lose valid signals from high-activity users who genuinely share preferences.</p>

<p style="margin-bottom:0.75rem;"><strong>D. iGraph asynchronous updates mean slight staleness.</strong> ABFS computes features in real time, but iGraph (which stores graph weights) is updated asynchronously. Graph-level similarity scores are slightly behind the freshest interaction signals. The ABFS real-time features compensate for most use cases.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a recommendation system for Flipkart / Meesho"</div>
  <div class="ex-interview-answer">Alibaba's architecture is the direct reference. Map the four components:
<br>• iGraph → graph DB (Neo4j)
<br>• ABFS → real-time feature server (Kafka + Flink)
<br>• BE → ANN retrieval (ScaNN or FAISS)
<br>• RTP → ranking model (start Wide & Deep, upgrade to BST when sequence data is available)
<br><br>For Meesho specifically: Tier 2/3 users have strong mission-centric sessions ("kurta for a wedding this weekend"). Real-time signals from that session should override historical preference immediately — batch systems fail exactly this user.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the Swing algorithm and why does it matter?"</div>
  <div class="ex-interview-answer">Standard CF inflates popular item similarity — the Harry Potter problem. Swing fixes this by down-weighting item-pair similarity when the users who co-clicked both items are themselves similar to each other (they click everything). Discriminative users — the selective ones — carry more weight. Practical result: "Related Items" shows genuinely related products, not just popular ones.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use real-time vs. batch recommendations?"</div>
  <div class="ex-interview-answer">Use <strong>real-time</strong> when:
<br>• Sessions are mission-centric (user has a specific need that fades fast if unmet)
<br>• Cold-start users dominate (no history to batch-compute from)
<br><br>Use <strong>batch</strong> when:
<br>• Sessions are exploratory and preferences are stable
<br>• Infrastructure cost of 24/7 real-time serving is not justified
<br><br>The decision is about whether stale recommendations cause the user to leave — not about model quality.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe collaborative filtering and stop there. Two mistakes layered on top of each other:
  <br><br>• <strong>Not knowing why standard CF fails at scale.</strong> The Harry Potter problem makes popular items appear "similar" to everything — popularity inflates co-occurrence counts and buries genuine item-item relationships under noise. If you can't name this problem, you haven't studied recsys seriously.
  <br><br>• <strong>Not knowing the fix.</strong> The Swing algorithm down-weights co-occurrences shared by promiscuous users (those who click everything) and up-weights co-occurrences shared by discriminative users (those who are selective). Knowing this algorithm exists — and why it works — is what separates a candidate who has studied production recsys from one who has only read textbooks.
  <br><br>Standard CF answer gets you to the door. Swing gets you into the room.
</div>`,

    sources: [
      { id: 58, title: 'System Design for Recommendations and Search', url: 'https://eugeneyan.com/writing/system-design-for-discovery/' },
      { id: 59, title: 'Real-time Machine Learning For Recommendations', url: 'https://eugeneyan.com/writing/real-time-recommendations/' },
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' }
    ]
  }
},

{
  slug: 'grab-real-time-personalisation',
  company: 'Grab',
  problem: 'Real-Time Personalisation',
  oneLiner: 'Grab (800 cities, 8 SE Asian countries) moved from once-a-day batch profiles to a self-serve system where marketers — not engineers — configure real-time personalisation that fires within 15 seconds of a user action',
  addedOn: '30 May 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Real-Time ML', 'Personalisation'],
  sections: {
    problem: `Grab operates across 800 cities in 8 Southeast Asian countries — ride-hailing, food delivery, payments, and more under one app.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    User profiles updated once a day via batch jobs — 1,000+ data points per user but always yesterday's data. Every new real-time personalisation idea required an engineer to build a custom pipeline from scratch. Weeks of wait time. Marketing backlog growing faster than engineering could clear it.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    Marketers configure a Scenario in a GUI — no code, no engineering ticket. Personalised action (push notification, in-app banner, ad) fires within 15 seconds of a user action. New Scenario live in under 1 hour.
  </div>
</div>

The Grab Unlimited case study: user starts subscription signup → doesn't complete → Scenario fires within 15 minutes → 3% increase in subscriber conversions vs. batch campaigns. The window to re-engage is minutes, not hours.`,

    howSolved: `Grab built CDP Scenarios — a self-serve, real-time personalisation framework.

<strong>What a Scenario is — three ingredients combined</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Ingredient</div><div>What it is</div><div>Example</div>
  </div>
  <div class="ex-table-row">
    <div>Real-time trigger</div>
    <div>Something the user just did in the app</div>
    <div>Started signup, completed ride, abandoned checkout, opened app at airport</div>
  </div>
  <div class="ex-table-row">
    <div>Historical context (optional)</div>
    <div>User's past behaviour pulled from StarRocks</div>
    <div>Average spend, visit frequency, subscription status</div>
  </div>
  <div class="ex-table-row">
    <div>Live AI prediction (optional)</div>
    <div>Pre-trained model scoring what the user is likely to do next</div>
    <div>Churn probability, conversion likelihood, upgrade readiness</div>
  </div>
</div>

<strong>The three-component infrastructure</strong>

<div class="ex-flow">
  <div class="ex-flow-step">User action → Scribe event</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Flink evaluates Scenario rules + enriches with StarRocks history</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Kafka delivers output to notification / ad / in-app layer</div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Analogy</div>
  </div>
  <div class="ex-table-row">
    <div>Scribe</div>
    <div>Internal event tracker — every meaningful in-app action creates an event</div>
    <div>The raw material. No events = no real-time signals.</div>
  </div>
  <div class="ex-table-row">
    <div>Flink</div>
    <div>Stream processing engine — evaluates Scenario rules as each event arrives</div>
    <div>Assembly line, not warehouse. Handles each event the moment it arrives.</div>
  </div>
  <div class="ex-table-row">
    <div>Kafka</div>
    <div>Delivery system — carries Scenario outputs to notification systems, ad platforms, in-app layers</div>
    <div>High-speed courier. For on-demand lookup: routes to Amphawa (internal DynamoDB store).</div>
  </div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Time-sensitive transactional user</div>
  Mid-journey (at an airport, mid-checkout, just completed a ride). Intent is clear and urgent. Failure mode: batch system sends a re-engagement push the next morning when the user has already moved on. The window to capture this user is minutes, not hours.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Abandoning high-value user</div>
  Started a valuable action (Grab Unlimited signup, first GrabFood order) and stopped. Failure mode: no re-engagement at all, or a generic campaign 24 hours later. Grab Unlimited case: Scenario fires within 15 minutes → 3% lift in conversions vs. batch campaigns.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">15s</div>
    <div class="ex-stat-label">End-to-end latency from user action to personalised output</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3%</div>
    <div class="ex-stat-label">Increase in Grab Unlimited subscriber conversions from real-time re-engagement vs. batch</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1hr</div>
    <div class="ex-stat-label">Time to deploy a new Scenario vs. weeks for a custom engineering build</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">12+</div>
    <div class="ex-stat-label">Live production Scenario implementations at time of writing</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Self-serve creates governance risk.</strong> When anyone can configure a Scenario, the risk is poorly designed ones — overly aggressive notification triggers, conflicting Scenarios firing simultaneously, prediction models applied to segments they weren't trained on. Grab mitigated this with a pre-approved model library and Scenario validation using synthetic data before going live.</p>

<p style="margin-bottom:0.75rem;"><strong>B. StarRocks query adds latency.</strong> Fetching historical context mid-Flink-processing adds time. If the StarRocks query is slow, the 15-second target slips. PM decision: what historical data is worth fetching (adds accuracy) vs. what to pre-compute and cache (saves latency).</p>

<p style="margin-bottom:0.75rem;"><strong>C. Kafka delivery is not guaranteed to end-user.</strong> Kafka delivers reliably to the notification system, but whether the push actually reaches the user depends on device connectivity, notification permissions, and app state. The 3% conversion lift is net of all these gaps.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Real-time personalisation can feel intrusive.</strong> Reacting too fast (within seconds) can feel surveillance-like. Grab's Unlimited abandonment Scenario waited 15 minutes — not 15 seconds — deliberately. Technical capability to react in 15 seconds doesn't mean you should. This is a product judgment call, not a technical one.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you improve personalisation for Tata Neu / PhonePe / Swiggy?"</div>
  <div class="ex-interview-answer">Grab's architecture is the direct answer for any Indian super-app. Three infrastructure layers:
<br>• <strong>Event tracker</strong> — every in-app action becomes a Scribe-equivalent event
<br>• <strong>Stream processor</strong> — Flink applies rules, enriches with historical data, runs prediction model
<br>• <strong>Delivery layer</strong> — Kafka → notification system or in-app personalisation
<br><br>The fourth layer — self-serve GUI — is what makes it a product vs. a one-off engineering build. Without it, every new use case is an engineering ticket.
<br><br>Highest-value Indian use cases to start:
<br>• Checkout abandonment (PhonePe payment drop-off, Swiggy cart abandonment)
<br>• Location-triggered offers (Ola ride upsell at airport)
<br>• Subscription upgrade prompts (Tata Neu+ when user hits a behaviour threshold)</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a real-time notification system for a super-app"</div>
  <div class="ex-interview-answer">A Scenario = trigger event + optional historical context + optional prediction model → personalised action within 15 seconds.
<br><br>Three infrastructure components (non-negotiable):
<br>• <strong>Event tracker</strong> (Scribe equivalent) — every meaningful in-app action becomes an event
<br>• <strong>Stream processor</strong> (Flink) — evaluates rules, enriches with StarRocks history, runs prediction model
<br>• <strong>Delivery layer</strong> (Kafka) — high-speed output to notification system, ad platform, or in-app layer
<br><br>The fourth component — self-serve configuration GUI — is what makes it a scalable product. Without it, every new Scenario is an engineering ticket and the system stops scaling with the business.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you balance real-time personalisation with user privacy?"</div>
  <div class="ex-interview-answer">Grab's answer: every Scenario is logged and auditable. User data in Scenarios is governed by the same policy as batch data — real-time doesn't mean unregulated. The PM's job is to ensure Scenario guardrails prevent personalisation from crossing into feeling intrusive or manipulative.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe real-time personalisation as a technology problem — faster pipelines, streaming instead of batch. Grab's real insight is that it's an organisational problem. The technology was solvable. The bottleneck was that every new use case required engineering time, which meant marketing couldn't move fast enough to capture time-sensitive moments. The self-serve GUI is the actual product innovation — not Flink or Kafka.
</div>`,

    sources: [
      { id: 33, title: 'How Grab Built Real-Time Personalisation That Reacts in Under 15 Seconds', url: 'https://www.newsletter.justanotherpm.com/p/grab-personalisation' }
    ]
  }
},

{
  slug: 'spotify-multi-agent-ad-campaigns',
  company: 'Spotify',
  problem: 'Multi-Agent Ad Campaign Creation',
  oneLiner: 'Spotify (millions of advertisers across 3 channels) replaced 20+ form fields and 30 minutes of manual campaign creation with a 6-agent system that returns a complete optimised media plan from one plain-English sentence in 5–10 seconds',
  addedOn: '30 May 2025',
  important: false,
  hidden: false,
  topics: ['Agents', 'AI Design'],
  sections: {
    problem: `Spotify sells advertising across three channels: Direct (large brands), Self-Serve (small/mid advertisers), and Programmatic (automated bidding).

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Same core decisions (who, budget, format, schedule) built separately by three teams, at three different times. Constant drift. A campaign optimisation insight had to be manually applied to each channel separately. Advertisers faced 20+ form fields and 15–30 minutes of work requiring platform expertise most didn't have.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    One plain-English sentence → complete optimised media plan in 5–10 seconds. All three channels unified under one agent system. One update propagates everywhere instantly.
  </div>
</div>

The root cause: the decisions are too combinatorial to hard-code into a state machine. Planning, forecasting, audience selection, pacing, and optimisation all depend on each other simultaneously. A rule-based system can't handle that. An agent-based system can.`,

    howSolved: `Spotify built Ads AI — a 6-agent system using Google's Agent Development Kit (ADK) and Vertex AI.

<strong>Why 6 agents instead of 1?</strong>
One big model doing everything can't be improved in parts. If audience extraction breaks, it's tangled with budget parsing. Six specialised agents can each be tested, improved, and deployed independently. They run in parallel — making the system faster than any sequential approach.

<strong>The 6-agent architecture</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Agent</div><div>Job</div><div>Runs</div>
  </div>
  <div class="ex-table-row">
    <div>Coordinator</div>
    <div>Reads input, checks what's present vs. missing, decides which specialists to activate. Does NOT call all agents every time.</div>
    <div>First — routes everything</div>
  </div>
  <div class="ex-table-row">
    <div>GoalResolverAgent</div>
    <div>Maps plain-language objective to structured campaign type (REACH, CLICKS, APP_INSTALLS) + ad categories</div>
    <div>In parallel</div>
  </div>
  <div class="ex-table-row">
    <div>AudienceResolverAgent</div>
    <div>"18–24 year olds who like hip-hop in Brazil" → age range + interest category + geography, mapped to Spotify's taxonomy</div>
    <div>In parallel</div>
  </div>
  <div class="ex-table-row">
    <div>BudgetAgent</div>
    <div>Normalises any money format: "$5,000", "5k", "around fifteen grand" → single consistent number</div>
    <div>In parallel</div>
  </div>
  <div class="ex-table-row">
    <div>ScheduleAgent</div>
    <div>"Starting next month" or "for the next 30 days" → concrete start and end dates</div>
    <div>In parallel</div>
  </div>
  <div class="ex-table-row">
    <div>MediaPlannerAgent</div>
    <div>Takes all resolved parameters, queries thousands of historical Spotify campaigns, returns optimised media plan. Output is data-driven, not a guess.</div>
    <div>Last — waits for all specialists</div>
  </div>
</div>

<div class="ex-flow">
  <div class="ex-flow-step">Advertiser types one sentence</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Coordinator reads + routes to needed specialists</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Specialists run in parallel</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">MediaPlannerAgent synthesises → complete plan in 5–10s</div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Small/mid-size self-serve advertiser</div>
  Knows their product and audience, doesn't know platform mechanics. Failure mode: abandons campaign creation at field 8 of 20+ because they don't know what CPM to enter. Ads AI removes the expertise barrier entirely — they describe what they want, system fills in the rest.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Large brand via Direct</div>
  Sophisticated team, still spending 15–30 minutes per campaign setup. Failure mode: Spotify's data team discovers a campaign optimisation insight (e.g. Latin America budgets perform 30% better split across 3 ad sets) but it takes weeks to propagate across all three channels. Ads AI applies it everywhere instantly.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">5–10s</div>
    <div class="ex-stat-label">Campaign creation time — down from 15–30 minutes</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1</div>
    <div class="ex-stat-label">Plain-English sentence needed — down from 20+ form fields</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3</div>
    <div class="ex-stat-label">Buying channels unified under one agent system (Direct, Self-Serve, Programmatic)</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Parallel agents require more coordination overhead.</strong> Specialists run simultaneously for speed, but the coordinator must correctly identify which agents to activate. A misclassification at coordinator level cascades into wrong parameters downstream. Coordinator quality is the single most important component.</p>

<p style="margin-bottom:0.75rem;"><strong>B. MediaPlannerAgent runs last — sequential bottleneck.</strong> The five specialists run in parallel, but MediaPlannerAgent must wait for all of them. If any specialist is slow, the entire pipeline waits. End-to-end latency is gated by the slowest parallel agent.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Pre-computed historical data trades freshness for speed.</strong> MediaPlannerAgent queries historical performance kept in memory — not a live database. Recommendations are based on slightly stale campaign data. For a platform where inventory and pricing changes daily, there's a gap between recommendation and current conditions.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Natural language inputs create edge cases.</strong> "Around fifteen grand" is fine. "I want to spend some money" is not. The system returns a complete plan without asking clarifying questions — a product choice (speed over completeness) that occasionally produces suboptimal plans for vague inputs.</p>

<p style="margin-bottom:0.75rem;"><strong>E. Independent agents = independent failure modes.</strong> If AudienceResolverAgent misclassifies an interest, the MediaPlannerAgent builds an optimised plan for the wrong audience — and the plan looks completely correct. Errors don't fail loudly. Evals must cover each agent independently, not just the final plan.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a multi-agent AI system for [product]"</div>
  <div class="ex-interview-answer">Use Spotify's pattern: coordinator reads input → activates only needed specialists in parallel → planner synthesises outputs last.
<br><br>Applied to India — Zomato restaurant ad creation:
<br>• Small owner types: "more dinner orders from families near Koramangala on weekends"
<br>• GoalAgent → footfall/orders
<br>• AudienceAgent → family + location + time of day
<br>• BudgetAgent → ₹5,000
<br>• PlannerAgent → queries historical Zomato ad performance → returns optimised plan</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use agents vs. a single LLM?"</div>
  <div class="ex-interview-answer">Agents when decisions are too combinatorial to hard-code, when different parts improve at different rates (update audience extraction without touching budget parsing), and when parallel execution is needed for speed. Single LLM when the task is linear and failure modes are easy to catch.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you prevent silent failures in a multi-agent system?"</div>
  <div class="ex-interview-answer">Each agent is independently testable. Run evals on GoalResolverAgent alone — 50 test inputs, check REACH/CLICKS/APP_INSTALLS are correctly identified. If it fails, fix it without touching the other 5. Errors in agents don't fail loudly — they produce plausible-but-wrong outputs. Cover each agent separately, not just the final plan.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe multi-agent systems as "one AI for each step in the workflow." The mistake is thinking the coordinator is just a router. The coordinator is the most critical component — it decides which agents to activate based on what's present and what's missing in the input. A weak coordinator that always calls all 6 agents wastes compute and adds latency. A strong coordinator that reads the input and activates only the needed agents is what makes the system fast and economical.
</div>`,

    sources: [
      { id: 32, title: 'Spotify Is Using 6 AI Agents For Building Ad Campaigns', url: 'https://www.newsletter.justanotherpm.com/p/spotify-is-using-6-ai-agents-for-building-ad-campaigns' }
    ]
  }
},

{
  slug: 'ubereats-graph-recommendations',
  company: 'Uber Eats',
  problem: 'Graph-Based Food Recommendations',
  oneLiner: 'Uber Eats (millions of users, sparse order history) used graph neural networks to recommend dishes and restaurants even when a user has barely any order history — by learning from the full network of who ordered what',
  addedOn: '30 May 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Search'],
  sections: {
    problem: `Standard collaborative filtering for food delivery breaks in a specific way: it requires enough order history per user to find similar users.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Standard CF</div>
    A user with 3 orders has almost no signal. A new restaurant with 50 orders is nearly invisible. The user-restaurant relationship is binary — ordered or didn't. A user who ordered once looks identical to one who ordered 50 times.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Graph Neural Network</div>
    A user with 3 orders still gets a rich embedding by borrowing signal from similar users in the graph. Order frequency is captured as edge weight — ordering 50 times produces a much closer embedding than ordering once. New restaurants connect via cuisine metadata before accumulating order history.
  </div>
</div>

Food discovery is also different from content discovery. When Netflix recommends a film, it has rich metadata — genre, cast, director. When Uber Eats recommends a dish, it's "Paneer Butter Masala at Spice Garden, Koramangala" — a hyper-local item with no metadata beyond a name and a photo. Standard embedding approaches that rely on item text descriptions fail here.`,

    howSolved: `Uber Eats built a Graph Neural Network (GNN) recommendation system using a modified version of GraphSAGE — the same architecture Pinterest uses at scale (PinSage).

<strong>Two bipartite graphs</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Graph</div><div>Nodes</div><div>Edge meaning</div>
  </div>
  <div class="ex-table-row">
    <div>User-Dish</div>
    <div>Users and dishes</div>
    <div>Edge weight = number of times user ordered that dish</div>
  </div>
  <div class="ex-table-row">
    <div>User-Restaurant</div>
    <div>Users and restaurants</div>
    <div>Edge weight = number of times user ordered from that restaurant</div>
  </div>
</div>

<strong>Why GraphSAGE works here</strong>
A node's embedding captures information from its neighbours. User A's embedding combines their own features with aggregated information from every restaurant and dish they've ordered from. A user with only 3 orders still gets a rich embedding — it borrows signal from other users who ordered the same dishes.

<strong>The modified hinge loss — handling edge weights</strong>
Standard GraphSAGE uses binary edges. Uber Eats added a weighted hinge loss with a low-rank positive term:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>State</div><div>Embedding relationship</div>
  </div>
  <div class="ex-table-row">
    <div>User never ordered this dish</div>
    <div>Strongly dissimilar — pushed far apart</div>
  </div>
  <div class="ex-table-row">
    <div>User ordered 2 times</div>
    <div>Moderately similar</div>
  </div>
  <div class="ex-table-row">
    <div>User orders regularly</div>
    <div>Highly similar — pulled close together</div>
  </div>
</div>

<strong>What the graph reveals that standard models miss</strong>
<br>• <strong>Homogenous clusters</strong> — items that are genuinely similar (biryani restaurants cluster together because the same users order from all of them)
<br>• <strong>Serendipitous connections</strong> — a healthy salad place and a gym protein shake café cluster together because fitness-oriented users order from both. These are the high-value discovery recommendations — the "you might also like this" that actually surprises.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — New user (1–5 orders)</div>
  Failure mode with standard CF: shown popular restaurants nearby — feels generic and untailored. With GNN: their 3 orders connect to a graph of similar users, borrowing signal from users who made the same first orders. Recommendations feel personalised much sooner.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Loyal user (50+ orders, concentrated)</div>
  Failure mode: recommendations are just variations of what they always order. With GNN: the graph reveals serendipitous connections — other things the same loyal cohort orders — creating genuine discovery beyond their established habits.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — New restaurant (few orders, rich menu)</div>
  Failure mode with standard CF: invisible because it has no order history. With GNN: cuisine type, menu categories, and price range are used as node features, connecting it to similar restaurants in the graph before it has collaborative signal.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">2</div>
    <div class="ex-stat-label">Bipartite graphs — user-dish and user-restaurant — both with weighted edges</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1–2 hop</div>
    <div class="ex-stat-label">Neighbourhood sampling constraint — scalable to billions of nodes</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Graph construction and maintenance is expensive.</strong> Every new user, restaurant, and dish is a new node. Every order is a new or updated edge. Keeping the graph current at Uber Eats' transaction volume requires a real-time graph update pipeline. Static graphs go stale fast — restaurants close, dishes get removed, users move cities.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Cold-start is improved but not eliminated.</strong> A new restaurant with zero orders has no edges — only node features. GraphSAGE can use those features but can't borrow collaborative signal. The graph helps cold-start users more than cold-start restaurants, because users connect immediately on their first order.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Serendipitous recommendations can misfire.</strong> If a fitness user orders from a salad bar and a cake shop (cheat day), the graph may cluster those two restaurants together and recommend the cake shop to other fitness users. Behavioural clustering is powerful but doesn't understand intent — only co-occurrence.</p>

<p style="margin-bottom:0.75rem;"><strong>D. GraphSAGE requires neighbourhood sampling tuning.</strong> Too few neighbours = weak embeddings. Too many = computation explodes. The right sampling parameters depend on graph density and vary across cities — a dense metro vs. a sparse Tier 3 city have very different graph structures.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a recommendation system for Swiggy / Zomato"</div>
  <div class="ex-interview-answer">Uber Eats is the direct template:
<br>• Build two bipartite graphs — user-dish and user-restaurant, with weighted edges (order count)
<br>• Use GraphSAGE with weighted hinge loss
<br><br>India-specific consideration: food preference is highly city-specific and cuisine-specific. A South Indian user in Bengaluru has a fundamentally different graph structure than a North Indian user in Delhi. The graph captures this naturally from actual order behaviour — not demographic assumptions.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you handle cold-start for a new restaurant on Swiggy?"</div>
  <div class="ex-interview-answer">Three layers — applied in sequence as orders accumulate:
<br>• <strong>Node features</strong> — cuisine type, menu categories, price range, location. Connect the restaurant to similar restaurants in the graph without any order history.
<br>• <strong>Graph proximity</strong> — new restaurant in Koramangala gets initial embeddings boosted by proximity to well-ordered restaurants in that neighbourhood.
<br>• <strong>Early order signal</strong> — first 10–20 orders update edge weights and the restaurant starts accumulating collaborative signal.
<br><br>The graph transitions from feature-based to behaviour-based as orders accumulate — automatically, without any manual intervention.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use graph-based recommendations vs. standard embeddings?"</div>
  <div class="ex-interview-answer">Use <strong>graphs</strong> when:
<br>• Data is sparse (new users, new items dominate)
<br>• Items have rich relational structure (cuisine → restaurant → dish is a natural hierarchy)
<br>• You want to capture both direct preference and serendipitous discovery
<br><br>Use <strong>standard embeddings</strong> when:
<br>• Data is dense and items are largely independent
<br>• Computational simplicity matters more than structural signal
<br><br>For food delivery, the relational structure is inherent — graphs are the right tool.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates recommend collaborative filtering for food delivery and stop there. Two mistakes:
  <br><br>• <strong>CF requires dense history — food delivery is sparse by default.</strong> New users have 1–3 orders. New restaurants have fewer. Standard CF produces near-random recommendations for the majority of your user base. Graph-based approaches are specifically designed for sparse relational data — they borrow signal from the network rather than requiring it per user.
  <br><br>• <strong>Treating the user-restaurant relationship as binary.</strong> "Ordered or didn't" loses the strongest preference signal available: frequency. A user who orders biryani from the same place every Friday is fundamentally different from one who tried it once. The weighted hinge loss exists precisely to encode this — ordered once, ordered regularly, and never ordered are three distinct states, not two.
  <br><br>CF answer shows you know the basics. Graph + weighted edges shows you understand the actual failure modes of food delivery recsys.
</div>`,

    sources: [
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' }
    ]
  }
},

{
  slug: 'doordash-knowledge-graph-search',
  company: 'DoorDash',
  problem: 'Knowledge Graph Search',
  oneLiner: 'DoorDash (food delivery, millions of queries) replaced bag-of-words lexical search with a 3-layer system — lexical + knowledge graph + embeddings — so "KFC" returns fried chicken restaurants and "California rolls" finds sushi, not Mexican food',
  addedOn: '31 May 2025',
  important: false,
  hidden: false,
  topics: ['Search', 'Query Matching', 'Knowledge Graph'],
  sections: {
    problem: `DoorDash's search system faced a fundamental mismatch: users search in human concepts, but lexical systems only match raw tokens.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Lexical only</div>
    A user searching "California rolls" gets Mexican restaurant results — because tokens "California" and "roll" appear in Mexican menus. A user searching "KFC" gets only the KFC store, not similar fried chicken restaurants. "Chick'n" (a valid restaurant name) gets autocorrected to "Chicken" and returns wrong results. The system reads words, not intent.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Lexical + Graph + Embeddings</div>
    "KFC" returns KFC first, then expands via the knowledge graph to restaurants tagged fried_chicken_tag and wings_tag. "California rolls" maps to sushi via embeddings — no token match needed. "Asian" expands to Thai and Chinese subcategories. Three layers work together: lexical handles exact matches, graph handles concepts and hierarchy, embeddings handle semantics and synonyms.
  </div>
</div>

The root problem: lexical search treats every query as a bag of words. It cannot understand that "KFC" is a concept (fried chicken restaurant chain), that "California rolls" is a dish category (sushi), or that "Asian" is a hypernym with subcategories (Chinese, Thai, Japanese). Three different failure modes — each requiring a different fix.`,

    howSolved: `DoorDash built a 3-layer search architecture: lexical preprocessing first, knowledge graph for concept expansion, embeddings for semantic matching. All three run together in production — each layer compensates for the others' weaknesses.

<strong>Layer 1 — Lexical preprocessing</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Raw query ("KFZ")</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Normalise (lowercase, remove whitespace)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Spell-correct via SymSpell → "kfc"</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Synonym dictionary → standardised token</div>
</div>

Key insight: spell correction only fires if the initial query returns no results — preventing aggressive correction of valid names like "Chick'n" being changed to "Chicken."

<strong>Layer 2 — Knowledge graph (Neo4j) for concept expansion</strong>

DoorDash's graph has exactly 3 node types and 3 relationship types:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Node type</div><div>What it represents</div><div>Example</div>
  </div>
  <div class="ex-table-row">
    <div>Store (_biz)</div>
    <div>Where food is sold</div>
    <div>ihop_biz, kfc_biz</div>
  </div>
  <div class="ex-table-row">
    <div>Food category (_cat)</div>
    <div>Coarse-grained cuisine or food type</div>
    <div>breakfast_cat, chicken_cat, asian_cat</div>
  </div>
  <div class="ex-table-row">
    <div>Food tag (_tag)</div>
    <div>Fine-grained popular item descriptor</div>
    <div>fried_chicken_tag, dim_sum_tag, sandwich_tag</div>
  </div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Relationship</div><div>Rule</div><div>Example</div>
  </div>
  <div class="ex-table-row">
    <div>Store → category</div>
    <div>Each store belongs to exactly one primary category</div>
    <div>ihop_biz → breakfast_cat</div>
  </div>
  <div class="ex-table-row">
    <div>Category → parent category</div>
    <div>At most one parent — enforces strict hierarchy</div>
    <div>deli_cat → sandwich_cat → breakfast_cat</div>
  </div>
  <div class="ex-table-row">
    <div>Tag → category</div>
    <div>Each tag belongs to one category</div>
    <div>fried_chicken_tag → chicken_cat</div>
  </div>
</div>

<strong>Query expansion at runtime — two worked examples:</strong>

<br>• <strong>"KFC"</strong> → maps to kfc_biz → graph expands to chicken_cat → retrieves all restaurants tagged fried_chicken_tag, wings_tag in the same category → Popeyes and Bonchon surface alongside KFC
<br>• <strong>"Asian"</strong> → maps to asian_cat → graph traverses to subcategories thai_cat and chinese_cat → Charm Thai (thai_tag) and HI Peninsula (dim_sum_tag) both retrieved

<strong>Layer 3 — Embeddings for semantic matching</strong>

Graph-based expansion is built offline (store tagging) and expanded online (query time), but it cannot handle semantics it was never manually given. Embeddings fill this gap:
<br>• "handphone" and "cellphone" sit close in embedding space — no synonym dictionary entry needed
<br>• "halal" expands to Middle Eastern and South-East Asian cuisines via co-click signal
<br>• GloVe-based query embeddings trained so that two queries sharing the same restaurant context are pulled close together — the restaurant is the training signal`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Intent-based searcher ("KFC")</div>
  Knows the brand, wants the category. Failure mode with lexical-only: returns exactly KFC and nothing else — user who can't find KFC nearby gets zero results instead of Popeyes. Knowledge graph fixes this by expanding KFC to fried_chicken_tag restaurants in the area.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Dish searcher ("California rolls")</div>
  Knows the dish, not the restaurant. Failure mode with lexical-only: "California" and "roll" match Mexican food menu tokens — user searching for sushi gets completely wrong results. Embeddings fix this by placing "California rolls" close to sushi concepts in vector space.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Broad category searcher ("Asian")</div>
  Open to discovery, just knows the cuisine type. Failure mode with lexical-only: only returns restaurants whose name literally contains "Asian." Knowledge graph fixes this by traversing asian_cat → thai_cat, chinese_cat → all tagged restaurants in those subcategories.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">3</div>
    <div class="ex-stat-label">Node types in the knowledge graph — Store, Category, Tag</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3</div>
    <div class="ex-stat-label">Relationship types — store→category, category→parent, tag→category</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1 in 10</div>
    <div class="ex-stat-label">Queries are misspelled — making spell correction essential but risky</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Neo4j</div>
    <div class="ex-stat-label">Graph database used — offline tagging, real-time query expansion</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Spell correction.</strong> Apply it only after the raw query returns zero results — never upfront. Restaurant and menu names like "Chick'n" sit dangerously close to common dictionary words. An aggressive corrector changes the user's intent with high confidence. The safe default: trust the raw query first, correct only on failure.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Knowledge graph.</strong> The hidden cost isn't building it — it's that it never stops needing maintenance. Ontology design, data ingestion, node deduplication, edge validation, and quality checks are all ongoing. More critically: the graph is a shared dependency. Search, homepage carousels, and recommendations all read from it. A wrong edge doesn't just break one feature — it returns confidently wrong results everywhere, simultaneously. Garbage in, garbage out at scale.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Embeddings.</strong> The embedding learned co-occurrence, not meaning. "Halal" expands to Middle Eastern cuisine because users who search halal click Middle Eastern restaurants — but that doesn't mean those restaurants are actually halal certified. Worse: "latex free gloves" and "latex gloves" share almost identical tokens and sit close in vector space despite opposite intent. Embeddings are strong on synonyms and hypernyms, unreliable on negations, exclusions, and certifications.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Each layer breaks differently — that's the point.</strong> Lexical fails on concepts ("California rolls" → Mexican food). Graph fails on anything it wasn't explicitly taught ("halal" → uncertified restaurants). Embeddings fail on negations ("latex free" vs "latex"). No single layer covers all failure modes. The PM decision is sequencing, not replacement: start with lexical (works immediately, no data needed), add graph when concept recall gaps become clear, add embeddings when long-tail semantic quality plateaus.</p>`,

        pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Search is not just token matching — it's intent understanding. DoorDash is the clearest production example of this: the same search system needs to handle exact brand queries (KFC), dish queries (California rolls), and broad category queries (Asian) — each requiring a different mechanism. The 3-layer architecture is the answer to "design a search system" for any food or e-commerce platform.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a search system for Swiggy / Zomato"</div>
  <div class="ex-interview-answer">Use DoorDash's 3-layer architecture directly.
<br><br><strong>Layer 1 — Lexical preprocessing:</strong>
<br>• SymSpell equivalent for spell correction (only on zero-result queries)
<br>• Synonym dictionary — standardise "Dosa" and "Dosai", "Paneer" and "Cottage Cheese"
<br><br><strong>Layer 2 — Knowledge graph (Neo4j):</strong>
<br>• 3 node types: restaurant, cuisine_cat, dish_tag
<br>• India-specific expansion: "Biryani" → biryani_tag → Hyderabadi, Lucknowi, Kolkata biryani restaurants
<br>• "South Indian" → idli_tag, dosa_tag, sambhar_tag
<br><br><strong>Layer 3 — Embeddings:</strong>
<br>• GloVe trained on order co-occurrence
<br>• "Paneer Butter Masala" and "Shahi Paneer" pulled close together because the same users order both</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you improve search quality for long-tail queries?"</div>
  <div class="ex-interview-answer">Long-tail queries are exactly where lexical fails hardest — no click history, no synonym entry, tokens that don't match the catalogue. The DoorDash playbook:
<br><br>• <strong>Query translation</strong> — translate tail queries into head queries using a bipartite click graph (Yahoo's approach). "Konkani fish curry" → maps to users who also searched "coastal seafood" → a known head query with results.
<br>• <strong>Self-supervised embeddings</strong> — train on order co-occurrence data. No labels needed. Handles zero-click queries automatically.
<br>• <strong>Graph expansion</strong> — "Konkani fish curry" traverses to seafood_cat → coastal_cuisine_tag → surfaces relevant restaurants even with no exact match.
<br><br>GrubHub showed that self-supervised embeddings can capture knowledge graph-like semantics without manual curation — worth trying before building a full graph.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use a knowledge graph vs embeddings in search?"</div>
  <div class="ex-interview-answer">Use a <strong>knowledge graph</strong> when:
<br>• Relationships are structured and hierarchical (cuisine → subcuisine → dish)
<br>• Correctness matters more than coverage (dietary restrictions, certifications)
<br>• Domain is small and well-understood
<br><br>Use <strong>embeddings</strong> when:
<br>• Synonyms are the main problem (handphone = cellphone)
<br>• Behavioural data is abundant
<br>• Long-tail queries need to be handled at scale without manual curation
<br><br>In practice: graph for the core taxonomy (fast to build, high precision), embeddings to extend beyond it — they handle everything the graph wasn't explicitly taught.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates say "use semantic search" or "use embeddings" when asked to improve search quality. Two mistakes:
  <br><br>• <strong>Treating embeddings as a replacement, not a complement.</strong> Embeddings fail on exact queries (SKUs, model numbers, branded items like "Chick'n"). Lexical search handles these perfectly. DoorDash's lesson: all three layers fail in distinct ways — lexical on concepts, graph on semantics it wasn't taught, embeddings on negations. Dropping any layer takes a quality hit.
  <br><br>• <strong>Skipping sequencing.</strong> Most candidates jump straight to the most complex solution. The right answer is sequencing: start with lexical (no data needed, works immediately), add graph when concept recall gaps become clear, add embeddings when long-tail semantic gaps remain. Jumping to embeddings first means building the most expensive, data-hungry layer before validating that simpler layers can't solve the problem.
  <br><br>The PM's job is to diagnose which layer is the bottleneck before deciding which to build next.
</div>`,

    sources: [
      { id: 61, title: 'Search: Query Matching via Lexical, Graph, and Embedding Methods', url: 'https://eugeneyan.com/writing/search-query-matching/' },
      { id: 58, title: 'System Design for Recommendations and Search', url: 'https://eugeneyan.com/writing/system-design-for-discovery/' }
    ]
  }
},

{
  slug: 'doordash-search-things-not-strings',
  company: 'DoorDash',
  problem: 'Search: Things Not Strings',
  oneLiner: 'DoorDash (4,000+ cities, 100M+ items in index) rebuilt search to treat queries as "things not strings" — understanding that "California Roll" means sushi, not Mexican food near California',
  addedOn: '31 May 2025',
  important: false,
  hidden: false,
  topics: ['Search'],
  sections: {
    problem: `DoorDash's out-of-the-box search engine treated every query as a bag of words — each word matched independently against menu text. At small scale this was fine. At 4,000 cities and 100M+ items, it broke in specific, frustrating ways.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Bag of Words</div>
    User searches "California Roll" → sees Mexican restaurants because "California" and "Roll" appear somewhere in their menus. User searches "salsas" → sees 4 stores. User searches "salsa" → sees 83 stores. Same intent, completely different results. Non-branded searches like "pizza" or "noodles" return poor results because string matching favours store names, not food concepts.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Knowledge Graph + Intent</div>
    "California Roll" maps to the sushi concept. "KFC", "KFZ", "Poulet Frit Kentucky" all canonicalise to the same entity. "Salsas" and "salsa" return the same 83 stores. Non-branded food searches surface restaurants by cuisine concept, not just name matching.
  </div>
</div>

Two compounding problems: (1) DoorDash's query data is long-tailed — the top 100 queries account for 20%+ of all search volume, so errors on popular queries hurt a lot of users. (2) Food item names don't follow the English dictionary — "Chick'n" is a real branded item, not a misspelling of chicken. Overcorrecting spell-checking creates its own failures.`,

    howSolved: `DoorDash built a three-part recall pipeline and a knowledge graph to treat queries as concepts (things) rather than character strings.

<strong>The knowledge graph structure</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Entity</div><div>What it is</div><div>Example</div>
  </div>
  <div class="ex-table-row">
    <div>Store</div>
    <div>Where food is sold — associated with a primary cuisine category</div>
    <div>Joe's Sushi — primary category: Japanese</div>
  </div>
  <div class="ex-table-row">
    <div>Store Category</div>
    <div>Coarse-grained cluster of food concepts — groups stores with related tags</div>
    <div>"Japanese" contains tags: Sushi, Ramen, Tempura</div>
  </div>
  <div class="ex-table-row">
    <div>Store Tag</div>
    <div>Fine-grained descriptor of popular items sold — belongs to exactly one category</div>
    <div>"California Roll" → tag → Sushi → Japanese category</div>
  </div>
</div>

Each store belongs to one primary category. Each tag belongs to exactly one category. Each category can have a parent category. This hierarchy lets the system traverse from a specific query ("California Roll") up to a concept ("Sushi") and across to related stores.

<strong>The three-part recall pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Standardise query → canonical form (spell correction + synonyms)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Entity linking → map canonical query to concept in knowledge graph</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Graph traversal → expand to related concepts and retrieve matching stores</div>
</div>

<strong>Step 1 — Standardisation:</strong> Symmetric Delete spell correction + a manually created synonym map converts "Poulet Frit Kentucky", "KFZ", and "KFC" all to the canonical form "kfc". Critically: spell correction only activates when the query finds zero matches in the corpus — this prevents overcorrecting branded items like "Chick'n" into "chicken".

<strong>Step 2 — Entity linking:</strong> Maps the canonical query to the right concept node in the knowledge graph. "kfc" → KFC entity. "california roll" → California Roll tag → Sushi concept.

<strong>Step 3 — Graph traversal:</strong> Once the concept is identified, the graph expands to related concepts. "Sushi" traverses to related tags (Maki, Nigiri, Temaki) and surfaces all stores tagged with any of them — not just stores whose name contains "sushi".

<strong>Precision layer — learn-to-rank ranking model:</strong>
After recall retrieves candidates, a pointwise learn-to-rank model reorders them using search context beyond string similarity: user location, time of day, historical preferences, store popularity in that area. This replaced the out-of-the-box relevance score which only knew how to rank brand name matches.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Concept searcher (non-branded queries)</div>
  Searches "pizza", "noodles", "healthy bowls" — not a specific brand. Failure mode: out-of-the-box search ranks stores by name match, so "Pizza Hut" ranks above a local pizza place with better food because "Pizza" is literally in the brand name. Knowledge graph fixes this by matching on cuisine concept, not store name string.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Specific dish searcher</div>
  Searches "California Roll" or "Pad Thai". Failure mode: bag-of-words breaks the concept into individual tokens and matches restaurants that contain those words anywhere in their menu — producing completely irrelevant results. Knowledge graph maps the dish to the correct cuisine concept and surfaces only relevant stores.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Brand searcher with typos</div>
  Searches "KFZ", "McDonalds" (missing apostrophe), "Poulet Frit Kentucky". Failure mode: exact string match finds nothing or the wrong result. Canonicalisation + synonym map collapses all variants to the same entity, making the search robust to spelling variation without breaking branded item names.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">20%+</div>
    <div class="ex-stat-label">Of all search volume from the top 100 queries — fixing these had outsized impact</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">83 vs 4</div>
    <div class="ex-stat-label">Stores returned for "salsa" vs "salsas" before fix — same intent, 20× difference in results</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">↑ CVR</div>
    <div class="ex-stat-label">Statistically significant increase in overall conversion rate after knowledge graph recall improvements</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Manual knowledge graph creation doesn't scale.</strong> The first version of DoorDash's knowledge graph was manually created by engineers. This works for the top 100 queries but breaks when you have millions of items across grocery, alcohol, convenience, and pet food. DoorDash had to later move to LLM-powered attribute extraction to scale graph construction — manual curation is the bootstrap, not the end state.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Spell correction must be conservative in food search.</strong> Branded food items routinely violate dictionary rules — "Chick'n", "LYFE Kitchen", "Krispie Kreme" are all intentional. An aggressive spell corrector that treats these as errors will change the query and return wrong results with high confidence. DoorDash only activates spell correction when the query produces zero corpus matches — accepting some false negatives to prevent confident wrong corrections.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Focusing on head queries first creates a coverage gap.</strong> Improving the top 100 queries gives outsized impact (20%+ of volume) but leaves the long tail unaddressed. A user searching "bánh mì" or "Okonomiyaki" gets the old bag-of-words experience while "pizza" users get the improved one. This is a deliberate sequencing choice — iterate on the head, then expand — but it creates visible inconsistency in search quality across query types.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Knowledge graph quality gates homepage quality.</strong> If a restaurant is tagged incorrectly (e.g. a Thai restaurant tagged as Chinese), every downstream system — search, homepage carousels, recommendations — surfaces it to the wrong users. Garbage in, garbage out. The knowledge graph is a shared dependency; its errors compound across all features that use it.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you improve search for Swiggy / Zomato?"</div>
  <div class="ex-interview-answer">DoorDash's "things not strings" framework is the direct answer. Current food search is bag-of-words — searching "Biryani" returns restaurants whose name or menu contains the word "Biryani."
<br><br>The upgrade:
<br>• Build a food knowledge graph — Dish → Cuisine → Store Category hierarchy
<br>• Canonicalise queries — "Biriyani", "Biriani", "Biryani" all map to the same concept
<br>• Traverse the graph to retrieve all relevant restaurants, not just name matches
<br><br>India-specific complexity: the same dish has dramatically different regional names. "Kosha Mangsho" is a type of mutton curry — a bag-of-words search for "mutton curry" won't surface it. The knowledge graph must encode these regional mappings explicitly.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you prioritise which search improvements to make first?"</div>
  <div class="ex-interview-answer">DoorDash's answer: focus on head queries first.
<br><br>• Top 100 queries = 20%+ of all search volume
<br>• Fixing those gives outsized impact with a narrow scope — iterate quickly before scaling
<br>• Primary metric: conversion rate (did the user place an order after searching?) — not CTR
<br><br>A user clicking a wrong result and leaving is not a success. CTR hides this. Order rate doesn't.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the difference between recall and precision in search?"</div>
  <div class="ex-interview-answer"><strong>Recall</strong> — did you retrieve all the relevant results?
<br>• "California Roll" search — are all the sushi places in the result set at all?
<br>• DoorDash improved recall by building the knowledge graph
<br><br><strong>Precision</strong> — of what you retrieved, how many are actually relevant?
<br>• Are the top results actually good sushi places near this specific user?
<br>• DoorDash improved precision by building a learn-to-rank model
<br><br>Most search failures are either recall failures (right results not retrieved at all) or precision failures (right results retrieved but ranked wrong). Diagnosing which one before building the solution is the PM's job.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates say "improve search relevance" and jump straight to ML ranking models. The mistake is skipping the recall problem. If the right restaurants are never retrieved in the first place, no ranking model can fix it — you're reordering the wrong set. DoorDash's insight: fix recall first (get the right candidates using the knowledge graph), then fix precision (rank them correctly using learn-to-rank). Jumping to ranking without fixing recall is like optimising the order of a list that doesn't contain what the user is looking for.
</div>`,

    sources: [
      { id: 113, title: 'Things Not Strings: Understanding Search Intent with Better Recall', url: 'https://doordash.engineering/2020/12/15/understanding-search-intent-with-better-recall/' }
    ]
  }
},

{
  slug: 'doordash-llm-homepage',
  company: 'DoorDash',
  problem: 'LLM-Powered Homepage Personalisation',
  oneLiner: 'DoorDash replaced 300 fixed homepage carousels with LLM-generated ones — moving from "reorder fixed categories" to "generate new categories per user per time of day", precomputed offline to keep costs and latency in check',
  addedOn: '31 May 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'AI Design', 'Post-Training'],
  sections: {
    problem: `DoorDash's homepage is its front door. If it works, users find food fast, explore more, and return. If it fails, they open a competitor app. The original system used a Food Knowledge Graph (FKG) with 300 manually created themed carousels — "Breakfast Burritos", "Salads", "Baked Goods" — matched to user tags.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — 300 Fixed Carousels</div>
    Algorithm studies past orders → extracts food tags → matches to one of 300 carousel tags → selects most relevant rows. A user who orders pho, bánh mì, and boba gets labelled "Asian Food" — correct but too broad. "Salads" carousel doesn't distinguish a Caesar salad lover from a quinoa bowl person. If a restaurant is tagged wrong, it never appears for the right user. Engineers must manually create every new carousel concept.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — LLM-Generated Carousels</div>
    LLM generates carousel themes per user per time of day: "Late-Night Noodle Cravings", "Bangkok Street Heat", "Cozy Italian Comfort Food". No engineer created these rows. Breakfast, lunch, dinner, and late night look different for the same person. Generated offline — fast to serve, not expensive per page load.
  </div>
</div>

Three structural limitations of the fixed-carousel system: (1) Fixed vocabulary — if a concept wasn't pre-defined by engineers, it didn't exist. (2) Carousels too general — "Salads" doesn't reflect actual user intent. (3) Dependent on tagging quality — wrong restaurant tag = wrong carousel = wrong user. The ceiling was too low to represent the real preferences of millions of users.`,

    howSolved: `DoorDash built a five-stage offline pipeline. Key design choice: LLM runs offline (precomputed), not at request time. This separates generation cost from serving cost — homepage loads fast even though generation was expensive.

<strong>The five-stage pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Consumer Profile → LLM generates carousel themes</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Embeddings match themes to real restaurants</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">AI moderation filters unsafe/irrelevant carousels</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Ranking model orders carousels for each user</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">A/B testing validates which themes drive orders</div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Stage</div><div>What happens</div><div>Why it matters</div>
  </div>
  <div class="ex-table-row">
    <div>1. Profile → Carousel Generation</div>
    <div>Structured consumer profile (past orders, cuisine patterns, dish preferences, time of day) fed into LLM → generates carousel titles + structured metadata</div>
    <div>Unlocks infinite carousel vocabulary. "Late-Night Noodle Cravings" can exist without an engineer creating it.</div>
  </div>
  <div class="ex-table-row">
    <div>2. Embedding Matching</div>
    <div>Each generated carousel theme converted to an embedding and matched against the restaurant catalogue via vector similarity</div>
    <div>Connects LLM-generated abstract themes to real, orderable restaurants near the user. Without this, carousels are just text — no actual food.</div>
  </div>
  <div class="ex-table-row">
    <div>3. AI Moderation</div>
    <div>Filters out carousels that are low quality, culturally insensitive, repetitive, or don't map to enough real restaurants</div>
    <div>LLMs hallucinate. Without moderation, a carousel like "Authentic Martian Cuisine" could appear. Moderation is the quality gate between generation and serving.</div>
  </div>
  <div class="ex-table-row">
    <div>4. Ranking</div>
    <div>Ranking model orders surviving carousels for each user — balancing relevance, novelty, and business priorities</div>
    <div>Even good carousels need to appear in the right order. A great dinner option ranked below a breakfast carousel at 8pm is wasted.</div>
  </div>
  <div class="ex-table-row">
    <div>5. A/B Testing</div>
    <div>LLM-generated carousels tested against fixed carousels to validate which themes actually drive orders — not just clicks</div>
    <div>Relevance feels good but doesn't always convert. A/B testing on order rate ensures the system optimises for the right outcome.</div>
  </div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Niche taste user</div>
  Orders pho, bánh mì, and boba regularly. Failure mode with fixed carousels: labelled "Asian Food" — too broad. With LLM generation: system creates "Vietnamese Street Food" or "Boba & Banh Mi Picks" — specific enough to feel personal.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Time-of-day variable user</div>
  Orders healthy bowls for lunch, comfort food for dinner, late-night snacks after 10pm. Failure mode with fixed carousels: same carousel order regardless of when the user opens the app. With LLM generation: breakfast, lunch, dinner, and late-night carousels generated separately — homepage looks genuinely different based on when you open it.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — New cuisine explorer</div>
  Just tried Ethiopian food for the first time. Failure mode: fixed carousel system has "Ethiopian" as a category but won't surface it without explicit order history. With LLM generation + embeddings: system connects existing taste profile (spiced, communal eating, lentils) to suggest Ethiopian restaurants before explicit history exists.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">300</div>
    <div class="ex-stat-label">Fixed carousels replaced by unlimited LLM-generated ones per user per time of day</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">5</div>
    <div class="ex-stat-label">Pipeline stages: generate → embed → moderate → rank → A/B test</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Offline generation trades freshness for cost and speed.</strong> Precomputing carousels offline means there's a lag between what the user did last night and what their homepage shows this morning. Real-time LLM generation per page load would be fresher but would add latency and cost at scale. DoorDash chose offline explicitly: separate generation cost from serving cost.</p>

<p style="margin-bottom:0.75rem;"><strong>B. LLM moderation is a quality gate, not a guarantee.</strong> The AI moderation step filters hallucinated or irrelevant carousels — but moderation itself is probabilistic. A carousel that passes moderation may still feel off for a subset of users. The A/B testing stage exists because moderation + ranking don't perfectly predict what drives orders.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Embedding matching depends on catalogue quality.</strong> If a restaurant has wrong cuisine metadata, embedding matching will connect a "Thai Street Food" carousel to the wrong restaurants. The LLM generates themes, but embeddings match them to real restaurants using existing catalogue data — garbage catalogue data produces garbage matches.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Novelty vs. familiarity tension.</strong> LLM-generated carousels can surface genuinely new ideas — "Cozy Rainy Day Comfort Food" — but users don't always want to be surprised. The ranking model must balance novel carousels (increase exploration) with familiar ones (increase conversion). Optimising only for novelty tanks conversion; optimising only for familiarity kills discovery.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you redesign the Zomato / Swiggy homepage using AI?"</div>
  <div class="ex-interview-answer">DoorDash's architecture is the direct answer. Move from fixed category carousels (Biryani, Pizza, Chinese) to LLM-generated themes per user per meal time.
<br><br>Five-stage pipeline:
<br>• Structured user profile from order history + time of day
<br>• LLM generates carousel themes — "Late Night Paratha Cravings", "South Indian Comfort Food"
<br>• Embed themes and match to real restaurants via vector similarity
<br>• Moderate to filter hallucinations and irrelevant themes
<br>• Rank and A/B test on order rate (not CTR)
<br><br>India-specific insight: meal time preferences are very strong — breakfast is idli/dosa/paratha, lunch is thali/rice meals, dinner is more varied. Time-of-day carousel generation is especially high-value here.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use offline vs. online AI generation?"</div>
  <div class="ex-interview-answer">Use <strong>offline</strong> when:
<br>• Generation is expensive (LLM calls at scale)
<br>• Preferences are relatively stable within a day (carousel themes don't need to change minute-to-minute)
<br>• Page load speed is a hard constraint
<br><br>Use <strong>online</strong> when:
<br>• Signal is highly time-sensitive (current session behaviour, real-time inventory changes)
<br>• The cost of staleness is higher than the cost of latency
<br><br>The key principle: separate generation cost from serving cost. Expensive generation should never be on the critical path of a page load.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you measure whether a personalisation improvement is working?"</div>
  <div class="ex-interview-answer">DoorDash measures on <strong>order rate, not click-through rate</strong>.
<br><br>A carousel that gets clicks but no orders is not a success — it's a distraction. Engagement metrics (clicks, time in app) look good on dashboards but don't validate that the system helps users find food they actually want to order.
<br><br>The DoorDash evaluation stack:
<br>• Precision@10 — how many of the top 10 retrieved stores match the carousel theme (improved from 68% → 85%)
<br>• Human labellers — set the quality bar for relevance
<br>• LLM-as-judge — scale evaluation to volumes human labellers can't cover
<br>• A/B test — validate that relevance improvements translate to actual order rate lift
<br><br>Never skip the A/B test. Precision@10 tells you about relevance, not whether users click and order.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates redesigning a homepage say "use ML to personalise the ranking of existing categories." DoorDash's insight is that ranking fixed categories is the wrong level of intervention — the categories themselves are the constraint. Real personalisation means generating the right categories for each user, not reordering the wrong ones. If the answer to "how would you improve the homepage?" doesn't question what's in the inventory of choices, it's optimising the wrong thing.
</div>`,

    sources: [
      { id: 114, title: 'DoorDash Used LLMs to Rebuild Its Homepage', url: 'https://www.newsletter.justanotherpm.com/p/doordash-used-llms-to-rebuild-its-homepage' },
      { id: 113, title: 'Things Not Strings: Understanding Search Intent with Better Recall', url: 'https://doordash.engineering/2020/12/15/understanding-search-intent-with-better-recall/' }
    ]
  }
},
{
  slug: 'facebook-two-tower-retrieval',
  company: 'Facebook',
  problem: 'Two-Tower Embedding Retrieval for Search',
  oneLiner: 'Facebook (billions of users, trillions of documents) built a two-tower neural network that puts search queries and documents into the same embedding space — so "find my college roommate" retrieves the right person even if none of the words match their profile',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Search', 'Recommendations'],
  sections: {
    problem: `Facebook Search handles queries across people, groups, pages, events, and posts. At Facebook's scale — billions of users, trillions of documents — exact string matching is not just inadequate, it's architecturally impossible. You can't scan every document for every query in real time.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Boolean / Lexical Search</div>
    Query "find my college roommate John" matches documents containing those exact words. A profile named "Jon" with no mention of "college" or "roommate" is invisible. Relevant documents that don't share tokens with the query are never retrieved — the system doesn't know what it doesn't know.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Two-Tower Embedding Retrieval</div>
    Query "find my college roommate John" is converted to a vector. Every document on Facebook is also a vector. ANN search finds the nearest document vectors to the query vector in milliseconds — regardless of exact token overlap. "Jon" with college affiliation and mutual friends surfaces because it's semantically close in embedding space.
  </div>
</div>

The core problem: queries and documents live in different vocabularies. A user's mental model of a person ("my roommate from Berkeley") doesn't match how that person describes themselves in their profile. Bridging this gap requires a shared semantic space — not string matching.`,

    howSolved: `Facebook built a two-tower neural network for embedding-based retrieval, deployed across their full search index.

<strong>The two-tower architecture</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Tower</div><div>Input</div><div>Output</div>
  </div>
  <div class="ex-table-row">
    <div>Query encoder (left tower)</div>
    <div>Search query + user context (location, social graph, query history)</div>
    <div>Query embedding vector</div>
  </div>
  <div class="ex-table-row">
    <div>Document encoder (right tower)</div>
    <div>Document content (profile, group, page, post) + attributes</div>
    <div>Document embedding vector</div>
  </div>
</div>

Both towers output vectors in the same embedding space. Similarity = dot product or cosine similarity between query vector and document vector. The model is trained so that relevant query-document pairs have high similarity scores and irrelevant pairs have low scores.

<strong>Why two separate towers — not one model?</strong>
If query and document were passed through a single model together, you'd need to run that model for every query-document pair at serving time — computationally impossible at Facebook's scale. Two separate towers mean document embeddings can be pre-computed offline. At serving time, only the query embedding is computed fresh — then ANN retrieves the nearest pre-computed document embeddings instantly.

<strong>The offline → online pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Train two-tower model on query-document pairs</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Embed all documents via Spark batch jobs (offline)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Quantize embeddings → publish to Faiss ANN index</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">At query time: embed query → ANN retrieves top-k candidates</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Ranking model scores and reorders candidates</div>
</div>

<strong>Two indices, two purposes</strong>
<br>• <strong>ANN index (quantized)</strong> — lossy compression of embeddings for fast approximate retrieval. Used in the retrieval stage. Speed over precision.
<br>• <strong>Forward index (full precision)</strong> — uncompressed embeddings + profile and group attributes. Used in the ranking stage. Precision over speed. The same document is stored twice — once for fast lookup, once for accurate scoring.

<strong>Training signal — what counts as a relevant pair?</strong>
Facebook used click data as the positive training signal: a query that resulted in a click on a document = relevant pair. This is behavioral supervision — no human labelling required, but it encodes whatever biases exist in click behaviour (popular documents get clicked more, creating a feedback loop).

<strong>Hard negative mining — the critical training trick</strong>
Random negatives (random non-clicked documents) are too easy for the model to learn from — any clicked document is obviously more relevant than a completely random document. Facebook used hard negatives: documents that were retrieved by the model but not clicked. These are the near-misses — close in embedding space but wrong. Training on hard negatives forces the model to make finer distinctions and dramatically improves retrieval quality.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Social graph searcher</div>
  Searches for a specific person using context ("my college roommate John from Berkeley 2015"). Failure mode with lexical: profile must contain "John", "Berkeley", "2015" — if the person didn't fill out their education field, they're invisible. With two-tower: mutual friends, college affiliation, location, and name similarity all fold into the document embedding — the person surfaces even with incomplete profile data.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Group / community searcher</div>
  Searches "running groups near me" or "Bengali community London". Failure mode with lexical: only groups whose names contain those exact words appear. With two-tower: groups about marathon training, 5K running, and local jogging clubs all have embeddings close to "running groups" — they surface even if their group name is "Fleet Feet Runners" with no generic "running group" label.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Event / post searcher</div>
  Searches for an event they half-remember — "that concert in the park last July". Failure mode: requires exact token overlap with the event post. With two-tower: the semantic intent of "outdoor concert" maps close to posts about park performances, live music events, and summer festivals even if none contain all those words.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">2</div>
    <div class="ex-stat-label">Separate indices — ANN (fast, quantized) and forward index (precise, full embeddings)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Faiss</div>
    <div class="ex-stat-label">ANN library used — fine-tuned by Facebook specifically for their index structure</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Spark</div>
    <div class="ex-stat-label">Batch embedding pipeline — all Facebook documents embedded offline, not at query time</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Two towers can't model query-document interaction directly.</strong> Because the query and document encoders run separately, the model never sees the query and document together during encoding. This means it can't learn fine-grained interaction patterns (e.g., "this specific word in the query is particularly important for this type of document"). Cross-encoder models can, but they're too slow for retrieval at scale. Facebook accepts this limitation at the retrieval stage and compensates with a more powerful ranking model that does see query-document pairs together.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Click-based training creates a popularity bias.</strong> Training on click data means the model learns what users historically clicked, not what was actually most relevant. Popular documents get more clicks, get trained on more, rank higher, get more clicks — a compounding feedback loop. New documents and less popular content are systematically disadvantaged. Facebook mitigated this partially with hard negative mining, but the bias is structural.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Quantization trades precision for speed.</strong> The ANN index uses quantized (compressed) embeddings to fit a trillion-document index in memory and enable fast retrieval. Quantization introduces approximation error — the nearest neighbours in quantized space are not always the nearest in full-precision space. Facebook fine-tuned Faiss specifically for their data distribution to minimise this error, but some precision loss is unavoidable.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Document embeddings go stale.</strong> All documents are embedded offline via Spark batch jobs. A profile updated an hour ago has a stale embedding in the index until the next batch run. For slowly changing documents (profiles, groups) this is acceptable. For fast-changing content (posts, breaking news), stale embeddings mean the freshest content is underrepresented in retrieval. This is the fundamental tension in any offline embedding pipeline.</p>

<p style="margin-bottom:0.75rem;"><strong>E. Hard negative mining can destabilise training.</strong> Hard negatives are near-misses — documents the model thought were relevant but weren't. Too many hard negatives in training can cause the model to collapse (push everything far apart in embedding space) or oscillate. The ratio of hard to easy negatives needs careful tuning. Facebook found this to be one of the most sensitive hyperparameters in the system.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">The two-tower model solves the most fundamental problem in search at scale: queries and documents use different vocabularies. A user searching for their college roommate doesn't use the same words that person used to describe themselves. Two-tower puts both in the same semantic space — so relevance is measured by meaning, not token overlap. This is the architecture behind search at Facebook, YouTube, Pinterest, and most large-scale recommendation systems today.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a search system for LinkedIn / Naukri / Foundit"</div>
  <div class="ex-interview-answer">Facebook's two-tower architecture is the direct reference for professional search.
<br><br><strong>Query tower inputs:</strong>
<br>• Search query text
<br>• Searcher's own profile (industry, role, skills)
<br>• Social graph proximity to candidate
<br><br><strong>Document tower inputs (candidate profiles):</strong>
<br>• Job title, skills, experience, education
<br>• Mutual connections count
<br>• Activity signals (recent posts, endorsements)
<br><br><strong>India-specific consideration:</strong> Naukri / Foundit users often search in Hindi-English code-mix ("software engineer Bangalore freshers"). The query encoder must handle multilingual input — train on actual user query logs, not just English text.
<br><br>Two indices: ANN for fast retrieval, forward index with full profile attributes for ranking.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the difference between retrieval and ranking in a search system?"</div>
  <div class="ex-interview-answer"><strong>Retrieval</strong> — fast and coarse. Narrows billions of documents to hundreds of candidates.
<br>• Speed is the constraint — must complete in milliseconds
<br>• Uses ANN on pre-computed embeddings
<br>• Optimises for recall: don't miss relevant documents
<br><br><strong>Ranking</strong> — slow and precise. Scores and orders the retrieved candidates.
<br>• Quality is the constraint — can afford more compute per document
<br>• Sees query and document together — can model interactions
<br>• Optimises for precision: put the best documents at the top
<br><br>Facebook's forward index (full-precision embeddings + profile attributes) exists specifically for the ranking stage — it gives the ranker richer signal than the quantized ANN index.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you train a retrieval model without human labels?"</div>
  <div class="ex-interview-answer">Facebook's answer: use click data as behavioral supervision.
<br>• Positive pair = query + document the user clicked
<br>• Easy negative = random document from the corpus
<br>• Hard negative = document retrieved by the model but not clicked (near-miss)
<br><br>Hard negatives are the key insight. Easy negatives make training too simple — the model learns to trivially distinguish clicked from completely irrelevant. Hard negatives force finer distinctions and produce embeddings that are much better at separating near-misses from true positives.
<br><br>The PM implication: click data is cheap but biased. You inherit whatever biases exist in user click behaviour — popular content, recency, position bias. Budget for debiasing work when clicks are your training signal.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe a single model that takes the query and document together and scores them — a cross-encoder. Two things wrong with this:
  <br><br>• <strong>Cross-encoders don't scale to retrieval.</strong> Running a joint model for every query against every document at serving time is computationally impossible at Facebook's scale. You'd need billions of model calls per second. Cross-encoders are correct for ranking (you have hundreds of candidates, not billions) but wrong for retrieval.
  <br><br>• <strong>Confusing retrieval architecture with ranking architecture.</strong> Two towers exist not for modelling elegance — they exist because only the query is available at serving time. Documents must be pre-encoded offline. The split is forced by the latency constraint, not by choice. Candidates who don't understand this distinction will design systems that can't serve at production scale.
  <br><br>The right mental model: retrieval = pre-compute everything you can offline, serve only what's unavoidable at query time. Ranking = both query and candidates are known, spend more compute per candidate.
</div>`,

    sources: [
      { id: 58, title: 'System Design for Recommendations and Search', url: 'https://eugeneyan.com/writing/system-design-for-discovery/' },
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' }
    ]
  }
}
,
{
  slug: 'linkedin-hybrid-ranking',
  company: 'LinkedIn',
  problem: 'Hybrid Ranking for Talent Search',
  oneLiner: 'LinkedIn (1B+ users, recruiter search across millions of candidates) built a two-stage ranking system combining XGBoost for feature generation with GLMix for entity-level personalisation — so the same candidate ranks differently for each recruiter based on their individual hiring patterns',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Search', 'Recommendations', 'Personalisation'],
  sections: {
    problem: `LinkedIn Recruiter is a search product used by recruiters to find candidates. The challenge is fundamentally different from consumer search: the same candidate profile must rank differently depending on who is searching.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Global Ranking Model</div>
    A single global model ranks candidates the same way for every recruiter. A Java engineer with 5 years of experience ranks the same whether the recruiter historically hires senior engineers from top-tier universities or junior engineers from bootcamps. The model has no memory of what each recruiter, company, or contract actually responds to. Every search starts from scratch.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — XGBoost + GLMix Hybrid</div>
    XGBoost generates rich nonlinear features and a model score. GLMix takes those features and adds entity-level random effects — separate learned adjustments for each recruiter and each company contract. The same candidate now ranks differently for Recruiter A (who responds to bootcamp grads) vs. Recruiter B (who prefers FAANG alumni). Personalisation is encoded at the entity level, not just at the global level.
  </div>
</div>

Two entities matter in LinkedIn Recruiter: the recruiter (individual person making the search) and the contract (the company's LinkedIn subscription, which often has shared hiring patterns). Both need their own personalisation layer — a recruiter has personal preferences, and a company contract reflects the organisation's hiring culture.`,

    howSolved: `LinkedIn built a two-stage offline-online pipeline. XGBoost handles nonlinear feature interaction. GLMix handles entity-level personalisation. Neither alone solves the problem — the hybrid is the insight.

<strong>Why two models instead of one?</strong>
XGBoost is excellent at learning complex nonlinear interactions between features (seniority × skills × location × response history) but treats every recruiter the same — it has no mechanism for entity-level personalisation. GLMix is a linear model that can learn separate coefficients per entity (per recruiter, per company) but can't model nonlinear interactions on its own. Combining them gives you both: nonlinear feature power from XGBoost, entity-level personalisation from GLMix.

<strong>The offline pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Impression + label data combined into training data</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Pre-trained XGBoost generates model score + tree interaction features</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Augmented data (original features + XGBoost features) used to train GLMix</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">GLMix learns global weights + per-recruiter + per-contract random effects</div>
</div>

Labels = instances where a recruiter sent a message to a candidate AND the candidate responded positively. This is a high-quality signal — not just a click, but an actual two-way hiring intent signal.

<strong>The online pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Recruiter submits search query</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Search engine retrieves candidates</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">First-level XGBoost scores all candidates</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Top 1,000 candidates augmented with additional features + second XGBoost tree features</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">GLMix ranks using global weights + recruiter random effect + contract random effect</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Top 125 results shown to recruiter</div>
</div>

<strong>What GLMix actually does — the intuition</strong>
GLMix = Global model + Local adjustments per entity.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it learns</div><div>Example</div>
  </div>
  <div class="ex-table-row">
    <div>Global coefficients</div>
    <div>Weights that apply to every recruiter and every search</div>
    <div>Skill match is always important across all recruiters</div>
  </div>
  <div class="ex-table-row">
    <div>Recruiter random effect</div>
    <div>Adjustment specific to this individual recruiter's response history</div>
    <div>Recruiter A has historically responded to bootcamp graduates — boost candidates with bootcamp background for A</div>
  </div>
  <div class="ex-table-row">
    <div>Contract random effect</div>
    <div>Adjustment specific to this company's hiring patterns across all their recruiters</div>
    <div>Company X consistently hires from Tier-1 engineering colleges — boost IIT/NIT graduates for all Company X recruiters</div>
  </div>
</div>

XGBoost's tree interaction features act as a bridge: they convert raw features into richer representations that GLMix's linear model can use effectively. XGBoost does the heavy nonlinear lifting; GLMix adds the personalisation layer on top.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Individual recruiter with established patterns</div>
  Has made 200+ hires over 3 years, consistently preferring candidates with startup experience over corporate backgrounds. Failure mode with global model: ranks candidates the same as all other recruiters — startup experience is not systematically boosted. With GLMix recruiter random effect: the system learns from their 200 positive responses and adjusts rankings for future searches accordingly.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — New recruiter with no history</div>
  Just joined the company, no past hiring decisions on LinkedIn. Failure mode with entity-level personalisation alone: no data → no random effect → falls back to global model, same as before. With GLMix + contract random effect: even a new recruiter benefits from their company's historical hiring patterns — the contract-level effect fills the cold-start gap.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Candidate with non-standard background</div>
  Strong skills, unconventional career path — career switcher, non-English education, bootcamp graduate. Failure mode with global model: ranks lower because global model is trained on average recruiter behaviour, which skews toward conventional credentials. With entity-level GLMix: recruiter A who specifically values unconventional backgrounds will see this candidate ranked higher due to their personal random effect — the model has learned their individual preference.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">1,000</div>
    <div class="ex-stat-label">Candidates retrieved by first-level XGBoost — then passed to GLMix ranking</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">125</div>
    <div class="ex-stat-label">Final results shown to recruiter after GLMix ranking</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2</div>
    <div class="ex-stat-label">Entity-level random effects — recruiter-level and contract-level personalisation</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Entity-level personalisation requires sufficient history per entity.</strong> A recruiter's random effect is only meaningful if they have enough positive responses in the training data. A recruiter with 5 hires has a noisy random effect — the model has too little data to distinguish their real preferences from noise. LinkedIn mitigated this by defaulting to contract-level effects when recruiter-level data is sparse. But the cold-start problem exists at every entity level.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Two XGBoost passes add latency.</strong> The online pipeline runs XGBoost twice — once to score all retrieved candidates (first-level), once to generate tree interaction features for the top 1,000 (second-level). Each pass adds latency. LinkedIn accepted this because recruiter search is a deliberate, high-value action — millisecond latency matters less than ranking quality. For a consumer feed that refreshes constantly, this two-pass approach would be prohibitive.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Labels encode social bias.</strong> The training signal is "recruiter messaged candidate AND candidate responded positively." This encodes whoever recruiters historically chose to message — which may reflect credential bias, name bias, or university prestige bias. GLMix learns and amplifies these patterns at the entity level. A recruiter who has historically messaged only IIT graduates gets a random effect that boosts IIT candidates further. The model personalises real behaviour — including biased behaviour.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Contract-level effects aggregate across diverse recruiters.</strong> A company contract may cover 50 recruiters with different individual preferences. The contract random effect averages across all of them, which can wash out meaningful individual differences. Two recruiters at the same company — one hiring for product roles, one for engineering — have very different preferences, but both get the same contract-level adjustment. LinkedIn uses recruiter-level effects to compensate, but the contract effect remains a blunt instrument.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">LinkedIn Recruiter is the clearest production example of entity-level personalisation in search. The insight: the same candidate profile should rank differently for different recruiters based on their individual hiring patterns. Global ranking models treat every user the same — GLMix is LinkedIn's answer to making ranking personal at scale.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a ranking system for Naukri / Foundit / LinkedIn India"</div>
  <div class="ex-interview-answer">LinkedIn's XGBoost + GLMix stack is the direct reference.
<br><br><strong>Retrieval:</strong>
<br>• Search engine retrieves candidate pool
<br>• First-level XGBoost scores and narrows to top 1,000
<br><br><strong>Ranking:</strong>
<br>• Second-level XGBoost generates tree interaction features
<br>• GLMix ranks with three components: global weights + recruiter random effect + company random effect
<br><br><strong>India-specific consideration:</strong> Indian hiring has strong company-level biases — certain companies exclusively hire from IITs/NIITs, others value tier-2 college graduates with strong skills. The contract-level random effect captures this organisational preference automatically from historical hiring data, without anyone manually encoding it.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you personalise search results for different users?"</div>
  <div class="ex-interview-answer">LinkedIn's GLMix is the answer. Three layers:
<br>• <strong>Global model</strong> — features that matter for everyone (skill match, location, experience level)
<br>• <strong>User-level random effect</strong> — adjustments from this individual's interaction history
<br>• <strong>Group-level random effect</strong> — adjustments from the organisation or cohort this user belongs to
<br><br>The group-level effect solves cold start: a new user benefits from their organisation's patterns even before they've built personal history. The user-level effect refines further as they accumulate interactions.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use XGBoost vs. a deep learning model for ranking?"</div>
  <div class="ex-interview-answer">LinkedIn's answer: use XGBoost when:
<br>• Interpretability matters (can explain why a candidate ranked high)
<br>• Feature engineering is the bottleneck (XGBoost is less data-hungry than deep models)
<br>• You need tree interaction features as input to a downstream model (XGBoost as feature transformer)
<br><br>Use deep learning when:
<br>• You have abundant behavioural data (clicks, dwell time, sequences)
<br>• Raw inputs are unstructured (text, images)
<br>• The interaction space is too complex for manual feature engineering
<br><br>LinkedIn used both — XGBoost for structured feature interaction and feature generation, GLMix for the personalisation layer. Hybrid beats either alone.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe personalisation as "add user features to the model." The mistake is thinking that including user features in a global model is the same as entity-level personalisation. It isn't. A global model with user features still learns one set of weights — it adjusts predictions based on user features, but it doesn't learn separate preference weights per user. GLMix is fundamentally different: it learns a separate random effect coefficient for each recruiter, meaning the model literally has different parameters for each entity. The practical difference: a global model can't learn that Recruiter A systematically prefers bootcamp graduates — it can only learn that bootcamp graduates perform a certain way on average across all recruiters.
</div>`,

    sources: [
      { id: 58, title: 'System Design for Recommendations and Search', url: 'https://eugeneyan.com/writing/system-design-for-discovery/' },
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' }
    ]
  }
}
,
{
  slug: 'amazon-semantic-product-search',
  company: 'Amazon',
  problem: 'Semantic Product Search',
  oneLiner: 'Amazon (hundreds of millions of products) built a two-tower semantic search model with a 3-part hinge loss that teaches the model to treat "impressed but not purchased" products very differently from random irrelevant ones — dramatically improving what surfaces for long-tail queries',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Search', 'Recommendations'],
  sections: {
    problem: `Amazon's search must handle queries across hundreds of millions of products in dozens of categories. Lexical search works well when the user knows the exact product name. It breaks badly on everything else.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Lexical Search</div>
    User searches "water resistant running shoes" — returns products whose descriptions contain those exact words. A product listed as "trail running footwear, splash-proof" is invisible despite being exactly what the user wants. Long-tail queries (uncommon, niche, or descriptive) consistently return poor results because token overlap is sparse or zero.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Semantic Two-Tower</div>
    Query "water resistant running shoes" is embedded into a vector. Product embeddings are pre-computed. ANN retrieves products whose embeddings are semantically close — "splash-proof trail footwear" surfaces because it sits near "water resistant running shoes" in embedding space, not because of token overlap.
  </div>
</div>

The deeper problem: standard two-tower training with random negatives doesn't work well for e-commerce. A random negative (a completely unrelated product) is too easy for the model to reject — it learns to distinguish clicked products from obviously irrelevant ones, but fails on the hard case: products that appeared in search results and were seen but not purchased. These "impressed negatives" look very similar to positives in embedding space, and standard training doesn't handle them separately.`,

    howSolved: `Amazon built a two-tower semantic search model with a critical training innovation: a 3-part hinge loss that explicitly handles three categories of products differently.

<strong>The two-tower architecture</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Tower</div><div>Input</div><div>Output</div>
  </div>
  <div class="ex-table-row">
    <div>Query tower</div>
    <div>Search query text (tokenised, embedded)</div>
    <div>Query vector in shared embedding space</div>
  </div>
  <div class="ex-table-row">
    <div>Product tower</div>
    <div>Product title, description, category, attributes</div>
    <div>Product vector in shared embedding space</div>
  </div>
</div>

Similarity = cosine similarity between query and product vectors. Products are embedded offline. At query time, only the query is embedded fresh — ANN retrieves nearest product vectors instantly.

<strong>The 3-part hinge loss — the key innovation</strong>

Standard training uses two categories: positives (purchased/clicked) and negatives (random products). Amazon identified a third category that changes everything.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Category</div><div>What it is</div><div>How it's treated</div>
  </div>
  <div class="ex-table-row">
    <div>Positive</div>
    <div>Product the user purchased after this query</div>
    <div>Pulled close to the query embedding — maximise similarity</div>
  </div>
  <div class="ex-table-row">
    <div>Impressed negative</div>
    <div>Product shown in search results but not purchased — user saw it and rejected it</div>
    <div>Pushed moderately away — separate threshold from random negatives</div>
  </div>
  <div class="ex-table-row">
    <div>Random negative</div>
    <div>Random product from the catalogue — user never saw it for this query</div>
    <div>Pushed far away — very different threshold from impressed negatives</div>
  </div>
</div>

<strong>Why treating impressed negatives separately matters</strong>
Impressed negatives are the hardest training signal. A product that appeared in search results for "running shoes" and wasn't purchased is semantically close to the query — it's a running shoe, just not the right one. Lumping it with random negatives (a kitchen appliance) tells the model to push it as far away as a completely unrelated product. This is wrong — the model ends up pushing genuinely related products too far from the query.

The 3-part hinge loss says: push impressed negatives moderately away (they're relevant but wrong), push random negatives far away (they're irrelevant). This creates a more accurate embedding space where genuine relevance is preserved and rejection signals are properly calibrated.

<strong>Why L2 over L1</strong>
Amazon tested both L1 and L2 variants of the hinge loss. L2 consistently outperformed L1. Hypothesis: L2 is more robust to outliers in cosine similarity — extreme similarity scores (very close or very far) don't dominate training as aggressively as they do with L1.

<strong>The offline-online pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Train two-tower model on purchase + impressed negative + random negative data</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Embed all products offline via batch jobs</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Build ANN index over product embeddings</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">At query time: embed query → ANN retrieves top-k candidates → ranking model reorders</div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Long-tail query user</div>
  Searches "ergonomic lumbar support cushion for gaming chair" — a specific, descriptive, low-frequency query. Failure mode with lexical: few products contain all those exact tokens — returns near-zero results or completely unrelated items. With semantic search: the query embedding captures the intent (back support, gaming, sitting) and retrieves products that satisfy the intent even if they don't share exact tokens.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Multilingual / non-native English searcher</div>
  Searches "water proof jacket for rain" instead of "waterproof rain jacket." Failure mode with lexical: hyphenation and phrasing differences cause misses. With semantic search: both phrasings produce similar query embeddings — the semantic intent is the same, so results are the same.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Browsing user with vague intent</div>
  Searches "gift for dad who likes outdoors" — no specific product in mind. Failure mode with lexical: "gift" matches gift wrap, "dad" matches children's books, "outdoors" matches patio furniture — zero coherent results. With semantic search: the combined embedding captures "outdoor enthusiast gift" and surfaces camping gear, hiking equipment, and adventure accessories.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">3-part</div>
    <div class="ex-stat-label">Hinge loss — positive, impressed negative, random negative treated with separate thresholds</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">L2</div>
    <div class="ex-stat-label">Loss variant used — outperforms L1 consistently due to robustness to cosine similarity outliers</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">NDCG + MRR</div>
    <div class="ex-stat-label">Evaluation metrics — 3-part hinge outperforms 2-part on NDCG and MRR in all experiments</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Impressed negatives require impression logging infrastructure.</strong> To identify impressed negatives (products shown but not purchased), you need to log every impression — every product displayed in search results for every query. This is significant infrastructure. Many teams skip impressed negatives because they don't have this logging in place, defaulting to random negatives and accepting worse model quality. The infrastructure cost is real but the quality gain justifies it for high-volume search systems.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Semantic retrieval and lexical retrieval have complementary failure modes.</strong> Semantic search fails on queries that require exact matching — product SKUs, ISBN numbers, highly specific model numbers ("Sony WH-1000XM5"). Lexical search handles these perfectly. Most production systems run both in parallel and merge results — semantic for concept queries, lexical for exact queries. Running only semantic search is not the right architecture for e-commerce.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Product embeddings go stale.</strong> All products are embedded offline in batch. A new product listed 2 hours ago has no embedding in the ANN index until the next batch run. In a marketplace with thousands of new listings per hour (like Amazon's third-party sellers), freshness of the product index is a real constraint. Amazon runs batch embedding jobs frequently, but there's always a window where new products are invisible to semantic search.</p>

<p style="margin-bottom:0.75rem;"><strong>D. The 3-part hinge loss threshold is a sensitive hyperparameter.</strong> The thresholds controlling how far impressed negatives vs. random negatives are pushed must be tuned carefully. Too aggressive on impressed negatives and you push genuinely related products too far from queries. Too lenient and the model doesn't learn to distinguish between purchased and rejected products. These thresholds are dataset and category dependent — what works for electronics may not work for fashion.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Amazon's semantic search is the clearest production example of why training data quality matters more than model architecture. The 3-part hinge loss isn't a model innovation — it's a training signal innovation. The insight: not all negatives are equally negative. A product the user saw and rejected is a very different signal from a random product they never encountered. Getting this distinction right is what separates good semantic search from mediocre semantic search.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a search system for Flipkart / Meesho / Amazon India"</div>
  <div class="ex-interview-answer">Two-tower semantic search with Amazon's 3-part hinge loss is the retrieval layer.
<br><br><strong>Architecture:</strong>
<br>• Query tower — handles Hindi-English code-mix queries ("red kurta for wedding under 1000")
<br>• Product tower — title + description + category + seller attributes
<br>• 3-part hinge loss: purchases as positives, impressed-not-purchased as impressed negatives, random catalogue items as random negatives
<br><br><strong>India-specific considerations:</strong>
<br>• Meesho Tier 2/3 queries are highly descriptive and price-sensitive — semantic search handles "cheap warm jacket for winter" far better than lexical
<br>• Regional language queries (Tamil, Hindi, Bengali) need multilingual embeddings — mBERT or IndicBERT as the encoder backbone
<br>• Run lexical search in parallel for exact SKU and brand queries — merge results before ranking</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is negative sampling and why does it matter in training?"</div>
  <div class="ex-interview-answer">Negative sampling = choosing which non-positive examples to train the model to reject.
<br><br>Why it matters: if you only train on random negatives (completely unrelated products), the model learns a trivially easy task — distinguish clicked items from totally irrelevant ones. In production, the hard cases are near-misses — products that are semantically similar to the query but weren't purchased.
<br><br>Amazon's 3 categories:
<br>• <strong>Positives</strong> — purchased: pull close
<br>• <strong>Impressed negatives</strong> — seen but not purchased: push moderately away (separate threshold)
<br>• <strong>Random negatives</strong> — never seen: push far away
<br><br>The PM implication: improving negative sampling is often higher ROI than improving model architecture. If your negatives are too easy, your model won't learn the hard distinctions that matter in production.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use semantic search vs. lexical search?"</div>
  <div class="ex-interview-answer">Use <strong>semantic search</strong> when:
<br>• Queries are descriptive or long-tail ("comfortable office chair for bad back")
<br>• Users may not know exact product terminology
<br>• Multilingual or non-standard phrasings are common
<br><br>Use <strong>lexical search</strong> when:
<br>• Queries are exact — SKUs, model numbers, ISBNs, brand names
<br>• Precision matters more than recall (medical, legal, financial products)
<br><br>Best practice: run both in parallel, merge at ranking stage. Semantic for concept queries, lexical for exact queries. Neither alone covers all cases in e-commerce.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe semantic search as "replace BM25 with a two-tower model." Two mistakes:
  <br><br>• <strong>Architecture-first thinking.</strong> The model architecture (two-tower) is standard and well-understood. What makes or breaks the model is the training signal. Most teams default to random negatives because they're easy to generate. Amazon's lesson: random negatives make training too easy — the model learns to distinguish purchased items from completely unrelated ones, but fails on the hard case (items shown but not purchased).
  <br><br>• <strong>Treating all negatives as equally negative.</strong> A product the user saw and didn't purchase is a very different signal from a random product they never encountered. Lumping them together tells the model to push a semantically related-but-wrong product as far away as a kitchen appliance from a shoe query. The 3-part hinge loss (positive / impressed negative / random negative) is the correction — each category gets its own distance threshold.
  <br><br>Improving negative sampling is often higher ROI than improving model architecture. If your negatives are too easy, your model won't learn the distinctions that matter in production.
</div>`,

    sources: [
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' },
      { id: 58, title: 'System Design for Recommendations and Search', url: 'https://eugeneyan.com/writing/system-design-for-discovery/' }
    ]
  }
}
,
{
  slug: 'pinterest-pinsage',
  company: 'Pinterest',
  problem: 'Graph-Based Pin Recommendations (PinSage)',
  oneLiner: 'Pinterest (200M+ users, 100B+ pins, 18B graph edges) built PinSage — the largest graph neural network ever deployed — to generate pin embeddings that use graph context to disambiguate visually similar but semantically different content',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Search'],
  sections: {
    problem: `Pinterest is a visual discovery platform — users save Pins (visual bookmarks) to boards. The core recommendation challenge: two pins can look visually identical but mean completely different things.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Visual Embeddings Only</div>
    A bed rail pin looks visually identical to a garden fence pin — same horizontal bars, same image structure. A visual-only model embeds them close together and recommends garden fences to users who saved bed rails. Context is completely lost. At 100B+ pins, these visual ambiguities are everywhere: a red dress and a red tablecloth, a dog toy and a baby toy, a hiking boot and a fashion boot.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — PinSage (Graph + Visual)</div>
    The bed rail pin's embedding now incorporates its graph neighbourhood — boards it's saved alongside (bedroom furniture, nursery decor) and the other pins those boards contain. Beds and gates are rarely adjacent in the graph. PinSage uses this context to pull the bed rail embedding away from garden fences and toward bedroom furniture, even though they look the same visually.
  </div>
</div>

The scale challenge compounded the problem: existing graph convolutional networks required operating on the full graph Laplacian during training — computationally impossible with 3 billion nodes and 18 billion edges. No prior GCN had been deployed at this scale. PinSage had to solve both problems simultaneously: semantically richer embeddings AND an architecture that could train on a graph with billions of nodes.`,

    howSolved: `Pinterest built PinSage — a random-walk Graph Convolutional Network that generates pin embeddings by aggregating information from the local graph neighbourhood, using highly efficient random walks to make this feasible at web scale.

<strong>The Pinterest graph structure</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Node type</div><div>What it represents</div><div>Scale</div>
  </div>
  <div class="ex-table-row">
    <div>Pin</div>
    <div>Visual bookmark — image + title + description</div>
    <div>Billions</div>
  </div>
  <div class="ex-table-row">
    <div>Board</div>
    <div>Collection of pins curated by a user around a theme</div>
    <div>Billions</div>
  </div>
  <div class="ex-table-row">
    <div>Edge (Pin ↔ Board)</div>
    <div>User saved this pin to this board</div>
    <div>18 billion edges</div>
  </div>
</div>

A pin's neighbourhood = all the boards it's been saved to, and all the other pins on those boards. This neighbourhood encodes taste and context: a bed rail pin saved alongside mattresses, pillows, and duvets is semantically a bedroom item, regardless of its visual appearance.

<strong>How PinSage generates embeddings — the key innovations</strong>

<strong>1. Random walks instead of full graph traversal</strong>
Standard GCNs operate on the full graph Laplacian — impossible at 3 billion nodes. PinSage uses short random walks from each pin to identify its most important neighbours (nodes visited most frequently = most important context). This constrains computation to a local neighbourhood rather than the entire graph. Each pin only "sees" its immediate context, not the whole graph.

<strong>2. Importance-weighted neighbourhood aggregation</strong>
Not all neighbours are equally important. A pin saved to 10,000 boards is a much noisier signal than a pin saved to 3 highly curated boards. PinSage weights neighbours by visit count from the random walk — frequently visited neighbours contribute more to the embedding than rarely visited ones.

<strong>3. Node features as input + graph structure as context</strong>
Each pin starts with its raw features: image embedding (from a CNN) + text embedding (from title and description). PinSage then aggregates neighbour features via a learned aggregation function, concatenates with the pin's own features, and passes through a fully connected layer. The result: an embedding that combines what the pin looks like with what context it lives in.

<strong>4. Curriculum training — harder and harder negatives</strong>
Training uses a max-margin loss with positive pairs (pins co-saved to the same board) and negative pairs. Pinterest used curriculum learning: start with easy random negatives, progressively introduce harder negatives (pins that are visually similar but semantically different). This forces the model to learn fine-grained distinctions rather than coarse visual similarity.

<strong>5. MapReduce inference for web-scale deployment</strong>
At inference time, generating embeddings for 3 billion pins can't happen on a single machine. Pinterest built a MapReduce pipeline: pins are partitioned across machines, each machine generates embeddings for its partition using the trained model, results are aggregated. New pin embeddings are generated via batch jobs and stored in the ANN index.

<div class="ex-flow">
  <div class="ex-flow-step">Random walks identify top-k neighbours per pin</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Aggregate neighbour features (importance-weighted)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Concatenate with pin's own features → FC layer → pin embedding</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">MapReduce generates embeddings for all 3B pins</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">ANN index serves Related Pins, Search, Shopping, Ads</div>
</div>

<strong>One embedding serves multiple surfaces</strong>
PinSage embeddings power Related Pins, Search, Shopping recommendations, and Ads — all from the same embedding. This is architecturally significant: one model, trained once, serves every recommendation surface on Pinterest. The embedding is general-purpose because it captures both visual content and semantic context.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Visual explorer (saving home decor)</div>
  Saves a bed rail pin to a nursery board. Failure mode with visual-only model: gets recommended garden fences and metal railings because they look the same. With PinSage: graph shows the pin lives next to cribs, mobiles, and baby blankets — recommendations shift to nursery furniture and baby room decor.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Fashion discoverer</div>
  Saves a red dress to a wedding guest outfits board. Failure mode with visual-only model: gets recommended red tablecloths, red curtains, red Christmas decorations — same colour, completely wrong category. With PinSage: board context (wedding, cocktail dresses, formal wear) pulls the embedding toward fashion, not home decor.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Shopping user</div>
  Browsing hiking boots and saves a specific pair. Failure mode: visual model recommends fashion boots because they share similar shapes and colours. With PinSage: the hiking boot pin lives on boards with trail gear, outdoor clothing, and camping equipment — recommendations stay in the outdoor/functional category.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">3B</div>
    <div class="ex-stat-label">Nodes in the Pinterest graph (pins + boards) — largest GCN deployment at the time</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">18B</div>
    <div class="ex-stat-label">Edges in the graph — pin-board save relationships</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">7.5B</div>
    <div class="ex-stat-label">Training examples used to train PinSage</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1</div>
    <div class="ex-stat-label">Embedding model powering Related Pins, Search, Shopping, and Ads simultaneously</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Random walk neighbourhood is an approximation.</strong> PinSage identifies neighbours via random walks — pins visited most frequently are treated as most important. This is a sampling approximation of the true neighbourhood. A pin saved to one extremely active board may have its true neighbourhood underrepresented if the random walk doesn't sample that board frequently enough. The approximation is necessary for scale but introduces noise in neighbourhood estimation.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Graph structure requires active users to provide signal.</strong> PinSage's power comes from the boards users create and the pins they save together. Cold-start pins (newly uploaded, no saves yet) have no graph neighbourhood — they fall back to visual and text embeddings only. The model helps pins that users have already engaged with, not brand-new content. This is the fundamental cold-start limitation of any graph-based approach.</p>

<p style="margin-bottom:0.75rem;"><strong>C. One embedding trades specialisation for generality.</strong> The same PinSage embedding powers Related Pins, Search, Shopping, and Ads. This is efficient but means the embedding is optimised for the average across all surfaces, not perfectly optimised for any single one. A shopping-specific embedding might better capture purchase intent; a search-specific embedding might better capture query relevance. Pinterest accepted this tradeoff for operational simplicity — one model to maintain, one batch job to run.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Curriculum training requires careful scheduling.</strong> Starting with easy negatives and progressively introducing harder ones sounds intuitive but is sensitive in practice. Too fast a curriculum (hard negatives too early) and the model doesn't converge. Too slow (easy negatives too long) and the model learns coarse distinctions that don't transfer to production. The right curriculum schedule is empirical and dataset-specific.</p>

<p style="margin-bottom:0.75rem;"><strong>E. MapReduce inference adds latency to embedding freshness.</strong> Generating embeddings for 3 billion pins is a batch job — it takes hours. A pin saved to a new board right now won't have an updated embedding until the next MapReduce run. For a platform where trending content matters (viral recipes, trending fashion), this lag means the graph signal is always slightly behind real-time user behaviour.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">PinSage solves a problem that pure visual or text models cannot: visual ambiguity. A bed rail and a garden fence look identical to a CNN. PinSage knows they're different because of where they live in the graph — who saves them, alongside what, on which boards. Graph context is the signal that visual and text features can't provide. This is why graph-based recommendations exist: not because graphs are cool, but because some distinctions can only be learned from relational context.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a recommendation system for a visual platform (Instagram, Meesho, Myntra)"</div>
  <div class="ex-interview-answer">PinSage is the direct reference for any visual content platform.
<br><br><strong>Graph structure for Myntra:</strong>
<br>• Nodes: products + user wishlists/collections + outfit boards
<br>• Edges: user saved product to collection, products co-purchased, products in same outfit
<br><br><strong>Embedding inputs per product:</strong>
<br>• Visual: CNN embedding of product image
<br>• Text: title + description + category embedding
<br>• Graph: aggregated neighbourhood features via random walk
<br><br><strong>India-specific consideration:</strong> Meesho users in Tier 2/3 cities often save products to WhatsApp forwards and shared wishlists — a different graph structure than curated boards. The save-to-share behaviour encodes social taste signals that a pure visual model completely misses. Graph structure should capture this social dimension.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you handle cold-start for new content items?"</div>
  <div class="ex-interview-answer">PinSage's cold-start answer — three layers in sequence:
<br>• <strong>Day 0 (no graph signal):</strong> Use visual + text embedding only — the CNN and text encoder provide baseline relevance without any saves
<br>• <strong>After first saves:</strong> Graph neighbourhood begins forming — even 5–10 saves to real boards provide meaningful context about where the item belongs semantically
<br>• <strong>After sufficient saves:</strong> Full PinSage embedding replaces visual-only embedding — graph signal now dominates
<br><br>The transition from visual-only to graph-augmented is automatic as saves accumulate. The PM implication: new item quality improves naturally with engagement — no manual intervention needed, but initial placement (via visual similarity) must be good enough to generate the first saves.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use a graph-based model vs. a standard embedding model?"</div>
  <div class="ex-interview-answer">Use <strong>graph-based</strong> when:
<br>• Visual or text similarity is insufficient — items that look the same mean different things
<br>• Relational context (who saves what alongside what) contains signal unavailable in item features alone
<br>• Platform naturally produces a rich graph (saves, boards, co-purchases, follows)
<br><br>Use <strong>standard embeddings</strong> when:
<br>• Items are text-rich and semantically unambiguous (news articles, product descriptions with distinct vocabulary)
<br>• Graph is sparse or low-quality (few user interactions, low engagement platform)
<br>• Operational simplicity matters more than marginal quality gain
<br><br>Pinterest's key insight: the graph isn't a nice-to-have — for a visual platform where images are ambiguous, it's the only way to learn semantic meaning.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about visual recommendation systems, say "use a CNN to generate image embeddings and find visually similar items." The PinSage lesson is that visual similarity is not semantic similarity. A bed rail and a garden fence are visually similar but semantically opposite — no CNN will learn this distinction from images alone, because the images are genuinely similar. The only way to learn semantic context is from how users actually engage with items: what they save alongside what, on which boards, in which combinations. Graph structure encodes this human curation signal. Recommending visually similar items on a visual platform sounds right but produces a system that constantly surfaces the wrong category.
</div>`,

    sources: [
      { id: 60, title: 'Patterns for Personalization in Recommendations and Search', url: 'https://eugeneyan.com/writing/patterns-for-personalization/' },
      { id: 58, title: 'System Design for Recommendations and Search', url: 'https://eugeneyan.com/writing/system-design-for-discovery/' }
    ]
  }
}
,
{
  slug: 'voiceflow-intent-classification-evals',
  company: 'Voiceflow',
  problem: 'Evals for Intent Classification',
  oneLiner: 'Voiceflow (AI agent builder platform) discovered a silent 10% performance drop when upgrading GPT-3.5 versions — caught only because they had evals. Without them, the regression would have shipped to production undetected',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Evals & AI Quality'],
  sections: {
    problem: `Voiceflow builds conversational AI agents for enterprise customers. Their core feature: intent classification — routing user messages to the right response based on what the user intends. When a user says "I want to cancel my order," the system must classify this as CANCEL_ORDER and not TRACK_ORDER or SPEAK_TO_AGENT.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — No Evals</div>
    In late 2023, a customer's agent was running on gpt-3.5-turbo-0301 which was approaching end-of-life. Voiceflow upgraded it to gpt-3.5-turbo-1106 — a newer version of the same model family. Performance dropped ~10% on intent classification accuracy. Nobody noticed until users started complaining. They had to revert the upgrade and manually fix the issue retroactively.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Evals in Place</div>
    Voiceflow now runs benchmarks before and after every model upgrade. The 10% regression was discovered in the eval run, not in production. They iterated on the prompt until accuracy returned to baseline — and only then deployed. Same class of problem, completely different outcome.
  </div>
</div>

The root cause is structural: newer is not always better for specific tasks. gpt-3.5-turbo-1106 was a better general model than gpt-3.5-turbo-0301 — but for this specific customer's intent classification dataset, it performed significantly worse. Without evals, there is no way to know this before deployment. "Newer model version" feels like a safe, invisible upgrade — it almost never is.`,

    howSolved: `Voiceflow built a hybrid NLU + LLM intent classification architecture and paired it with a rigorous eval system to catch regressions before they ship.

<strong>The hybrid classification architecture</strong>

<div class="ex-flow">
  <div class="ex-flow-step">User utterance arrives</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">NLU encoder retrieves top 10 candidate intents + confidence scores</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">LLM receives candidates + their descriptions + utterance</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">LLM selects final intent from candidates (or returns None)</div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Layer</div><div>What it does</div><div>Why it matters</div>
  </div>
  <div class="ex-table-row">
    <div>NLU encoder</div>
    <div>Fast retrieval — narrows all intents to top 10 candidates using embedding similarity</div>
    <div>Cheap and fast. Handles the easy cases. Acts as safety net if LLM fails.</div>
  </div>
  <div class="ex-table-row">
    <div>LLM classifier</div>
    <div>Final classification — reads candidates + their descriptions + user utterance, picks the right intent</div>
    <div>Handles ambiguous cases where NLU alone isn't confident. Description quality directly affects accuracy.</div>
  </div>
  <div class="ex-table-row">
    <div>None intent</div>
    <div>Special intent for out-of-domain queries — when the user asks something the agent wasn't designed to handle</div>
    <div>Most important intent for production quality. A system that confidently misclassifies OOD queries is worse than one that escalates.</div>
  </div>
</div>

<strong>What the eval system tests</strong>
<br>• Accuracy per intent — which intents degrade most with model/prompt changes?
<br>• None intent precision — is the system correctly refusing out-of-domain queries or confidently misclassifying them?
<br>• False positive rate — is the system triggering intents it shouldn't?
<br>• Cross-model comparison — same dataset, same prompts, different model versions

<strong>What Voiceflow learned from 500+ eval runs on prompt variations</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Property tested</div><div>Finding</div>
  </div>
  <div class="ex-table-row">
    <div>Intent description quality</div>
    <div>The single biggest driver of LLM classification accuracy. Vague descriptions = poor accuracy. Specific, behavioural descriptions = strong accuracy.</div>
  </div>
  <div class="ex-table-row">
    <div>Description length</div>
    <div>Shorter, more specific descriptions outperform longer exhaustive ones. The LLM performs better with a clear decision boundary than an encyclopaedic explanation.</div>
  </div>
  <div class="ex-table-row">
    <div>Model version</div>
    <div>Newer ≠ better for specific tasks. gpt-3.5-turbo-1106 underperformed gpt-3.5-turbo-0301 on this customer's dataset by ~10%. Always run task-specific evals when upgrading models.</div>
  </div>
  <div class="ex-table-row">
    <div>Few-shot examples</div>
    <div>Adding examples helps on ambiguous intents but increases prompt token cost. Only worth it for intents where zero-shot accuracy is below acceptable threshold.</div>
  </div>
</div>

<strong>Intent splitting — a high-impact fix discovered through eval analysis</strong>
When Voiceflow analysed errors from a real enterprise customer (34 intents, poor accuracy), they found many intents were too broad. A "billing" intent was doing the work of 5 distinct user needs. After splitting billing into 5 sub-intents (billing query, payment failure, refund request, invoice download, payment method update), accuracy jumped 14%. The eval system made this discoverable — without it, the team would never have known which intents were causing failures.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Enterprise customer with production agent</div>
  Running a customer support agent with 30+ intents. Failure mode: model upgrade causes 10% accuracy drop on 3 high-traffic intents. Without evals, this goes undetected until customers complain or escalation rates spike — by which point hundreds or thousands of users have received wrong responses. With evals: regression caught in 20 minutes before deployment.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Agent builder with out-of-domain users</div>
  Built an agent for order tracking, but users also ask about returns, product specs, and store hours — things the agent wasn't designed to handle. Failure mode without None intent evals: agent confidently misclassifies "where is your store?" as TRACK_ORDER and responds with a tracking link. With None intent evals: system learns to escalate cleanly when the query is out of scope, preserving user trust.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">~10%</div>
    <div class="ex-stat-label">Accuracy drop from upgrading gpt-3.5-turbo-0301 → 1106 — caught by evals before shipping</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">500+</div>
    <div class="ex-stat-label">Prompt variations evaluated across 5 description properties and 2 model families</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">14%</div>
    <div class="ex-stat-label">Accuracy gain from splitting 34 intents into 52 — discovered through eval error analysis</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">34 → 52</div>
    <div class="ex-stat-label">Intents after splitting billing alone into 5 sub-intents — clearer decision boundaries = higher accuracy</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Hybrid architecture adds latency vs. NLU alone.</strong> Two-step pipeline (NLU retrieval → LLM classification) adds 100–300ms vs. NLU-only. For voice agents where response latency directly affects perceived quality, this is a real constraint. Voiceflow mitigates this by only calling the LLM for ambiguous cases — if the NLU returns very high confidence on one intent, the LLM step can be skipped entirely. The architecture is conditional, not always two-step.</p>

<p style="margin-bottom:0.75rem;"><strong>B. None intent is structurally hard to eval.</strong> None intent accuracy requires out-of-domain examples — queries the system was never designed to handle. These are hard to collect because you can't predict what users will ask outside your scope. Most teams under-invest in None intent evals, which means their system confidently misclassifies OOD queries rather than escalating. Voiceflow found None intent made up the majority of correct labels in their production dataset — it's the most important intent and the least evaluated one.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Intent splitting improves accuracy but increases maintenance.</strong> Going from 34 to 52 intents gained 14% accuracy but created 18 more intents to maintain, describe, and eval. Each new intent needs training examples, a clear description, and a place in the routing logic. This is ongoing work. The right granularity is "specific enough to have a clear decision boundary" — not "as granular as possible."</p>

<p style="margin-bottom:0.75rem;"><strong>D. Model evals are dataset-specific — results don't transfer.</strong> Voiceflow's finding (gpt-3.5-turbo-1106 underperforms 0301 on this dataset) does not generalise. On a different dataset or a different task, the newer model may be better. This is why benchmarks on standardised datasets (HWU64, Curekart) are necessary but not sufficient — you must always run evals on your own production data. Generic benchmark results are directionally useful, not decision-ready.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Voiceflow is the clearest real-world example of why evals are not optional — they're the only way to detect regressions before users do. "Newer model version" sounds like a safe upgrade. It almost never is. Without evals, you have no way to know what changed. With evals, you catch regressions in 20 minutes instead of after thousands of users experience them.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you ensure AI quality doesn't degrade over time?"</div>
  <div class="ex-interview-answer">Three layers — each catching a different class of failure:
<br><br>• <strong>Pre-deployment evals</strong> — run before every model upgrade, prompt change, or new feature. Fixed golden dataset (50–100 labelled examples). Binary pass/fail per case. If accuracy drops below threshold, don't ship.
<br>• <strong>Post-deployment monitoring</strong> — track None intent rate, escalation rate, user satisfaction scores in production. A spike in any of these is a signal that something regressed.
<br>• <strong>Periodic error analysis</strong> — look at real failure cases from production logs at least weekly. This is where intent splitting decisions come from — you can't know which intents need splitting until you've seen real misclassifications at scale.
<br><br>The Voiceflow lesson: evals without monitoring only catch regressions at deployment time. Monitoring without evals catches them too late. You need both.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you build an eval system for a chatbot at Swiggy / PhonePe / Tata Neu?"</div>
  <div class="ex-interview-answer">Apply Voiceflow's framework directly:
<br><br><strong>Step 1 — Define intents with clear boundaries:</strong>
<br>• Swiggy: ORDER_STATUS, CANCEL_ORDER, REFUND_REQUEST, REPORT_ISSUE, SPEAK_TO_AGENT, None
<br>• Each intent needs a specific description — not "questions about orders" but "user asking where their current delivery is and when it will arrive"
<br><br><strong>Step 2 — Build the golden dataset:</strong>
<br>• 10–20 examples per intent from real user logs
<br>• Include hard cases — ambiguous queries, regional language variations, code-mix Hindi-English
<br>• Include out-of-domain examples for None intent
<br><br><strong>Step 3 — Run before every change:</strong>
<br>• Model upgrade → run evals first
<br>• Prompt change → run evals first
<br>• New intent added → run evals on all existing intents (addition can cause misclassification of existing ones)</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you fine-tune vs. prompt engineer vs. change architecture?"</div>
  <div class="ex-interview-answer">Voiceflow's sequencing:
<br>• <strong>First — improve intent descriptions</strong> (highest ROI, zero cost, immediate). Specific behavioural descriptions outperform vague ones significantly.
<br>• <strong>Second — split broad intents</strong> into sub-intents with clearer decision boundaries. 14% accuracy gain from splitting alone.
<br>• <strong>Third — add few-shot examples</strong> for intents where zero-shot accuracy is still below threshold after the above steps.
<br>• <strong>Last — fine-tune</strong> only when the above exhausted and the model needs to learn syntax or domain knowledge that doesn't exist in its training data (Honeycomb's case).
<br><br>Most teams jump to fine-tuning first. Voiceflow's evidence: description quality and intent granularity account for most of the accuracy gap.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates treat model upgrades as safe, invisible infrastructure changes — "it's a newer version, it should be better." Two things wrong:
  <br><br>• <strong>Newer ≠ better for specific tasks.</strong> General benchmarks don't predict task-specific performance. gpt-3.5-turbo-1106 scored better on general benchmarks and worse on this specific customer's intent classification by ~10%. Task-specific evals are the only reliable signal — generic benchmarks are directionally useful, not decision-ready.
  <br><br>• <strong>Without evals, regression is invisible until users find it.</strong> A 10% accuracy drop doesn't produce error logs or 500 status codes. The system keeps running, keeps classifying, keeps returning confident wrong answers. The only way to catch this class of failure before users do is to have evals that run before every deployment.
  <br><br>The PM implication: "we'll upgrade the model" is never a low-risk change. It's a deployment that requires evals to validate.
</div>`,

    sources: [
      { id: 56, title: 'What Are Evals And Why Are They Important — A Guide For Product Managers', url: 'https://www.newsletter.justanotherpm.com/p/what-are-evals-and-why-are-they-important' },
      { id: 55, title: 'Is Fine-Tuning Still Valuable?', url: 'https://hamel.dev/blog/posts/fine_tuning_valuable.html' }
    ]
  }
}
,
{
  slug: 'linkedin-correct-not-helpful',
  company: 'LinkedIn',
  problem: 'Chatbot: Correct ≠ Helpful',
  oneLiner: 'LinkedIn built a skill fit assessment chatbot that was technically accurate — and users hated it. The lesson: correctness and helpfulness are two different product requirements, and confusing them is the most common AI product mistake',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Evals & AI Quality', 'AI Design'],
  sections: {
    problem: `LinkedIn built a chatbot to help users assess their fit for jobs. A user could ask "Am I a good fit for this role?" and the system would evaluate their profile against the job requirements and respond.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">First version — Correct but not helpful</div>
    User asks: "Am I a fit for this product manager role at Google?"
    Bot responds: "You're a terrible fit. You lack the required 5 years of experience and have no demonstrated technical background."
    Technically accurate. Completely unhelpful. Users felt judged, not helped. Engagement dropped. The eval system showed high accuracy — the bot was right. But the product was failing.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Helpful framing</div>
    Same assessment, different framing: "You're a partial fit. Your product background is strong. The main gaps are technical depth and experience length. Here's what you could do to close them: [specific suggestions]." Same underlying data. Completely different user experience. Users felt supported, not evaluated.
  </div>
</div>

The root problem: LinkedIn's evals were measuring accuracy — "was the fit assessment factually correct?" This is the wrong question. The right question is "did the user find this useful and did it help them take action?" Correct and useful are not the same metric, and optimising for one does not optimise for the other.

A second, separate problem compounded this. It took LinkedIn 1 month to reach 80% of the experience they wanted. It took 4 more months to go from 80% to 95%. The initial speed of progress made the team grossly underestimate how hard the remaining work would be. Each subsequent 1% gain was harder than the last — hallucinations, edge cases, tonal compliance — and the team found it discouraging. This is the 80/20 trap in AI products: the first 80% is fast and visible; the last 20% is slow and invisible to most stakeholders.`,

    howSolved: `LinkedIn made two distinct fixes — one for the correctness vs. helpfulness problem, one for the 80/20 progress trap.

<strong>Fix 1 — Redefine what the eval measures</strong>
The team moved from accuracy evals ("was the assessment correct?") to helpfulness evals ("did the user take a next step?"). This required:
<br>• Rewriting the eval criteria from factual correctness to actionability
<br>• Adding human evaluation of chatbot responses on a helpfulness dimension, not just accuracy
<br>• Changing the prompt to instruct the model to frame assessments as "here's your gap and here's how to close it" rather than "here's your verdict"

<strong>Fix 2 — Reframe the output format entirely</strong>
The chatbot was generating verdicts ("fit" or "not fit"). LinkedIn changed this to gap analysis + action steps:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Old output</div><div>New output</div>
  </div>
  <div class="ex-table-row">
    <div>"You're a terrible fit."</div>
    <div>"Strong match on X. Gaps on Y and Z. Here's how to close them."</div>
  </div>
  <div class="ex-table-row">
    <div>Binary verdict — pass/fail</div>
    <div>Partial fit + specific gap + actionable next step</div>
  </div>
  <div class="ex-table-row">
    <div>User feels judged</div>
    <div>User feels helped and informed</div>
  </div>
</div>

<strong>Fix 3 — Manage expectations on progress (the 80/20 trap)</strong>
LinkedIn restructured how they communicated progress internally. "80% done" was replaced with a more honest framing: "We've solved the easy 80%. The remaining 20% (hallucinations, edge cases, tonal compliance, out-of-scope handling) will take longer than the first 80% did." This changed how engineering resources were allocated and prevented premature launch pressure.

The Intuit parallel: Intuit built a tax chatbot that got lukewarm feedback. Investigation revealed users hated typing into a blank input — they didn't know what the bot could do. Adding 3 suggested questions per interaction dramatically increased engagement. Same underlying AI, same accuracy — the UX friction was the failure, not the model. Both LinkedIn and Intuit discovered the same thing: bad product feedback is often misdiagnosed as bad AI.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Job seeker assessing fit</div>
  Asks "Am I fit for this role?" hoping for guidance. Failure mode: bot says "You're a terrible fit" with no context or next steps. User feels dismissed, closes the feature, doesn't return. The bot was correct — and completely destroyed user trust. With new framing: same assessment delivered as actionable gap analysis. User understands what to work on and trusts the product.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Career switcher with non-linear background</div>
  Has transferable skills but not the exact credentials listed. Failure mode: binary verdict misses nuance — "not a fit" when reality is "partial fit with clear growth path." With gap analysis framing: transferable skills acknowledged, specific gaps named, concrete actions suggested. User leaves with a plan, not a rejection.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">1 month</div>
    <div class="ex-stat-label">To reach 80% of the target experience — felt like fast progress</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">4 months</div>
    <div class="ex-stat-label">To go from 80% → 95% — took 4x longer than the first 80%</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1%</div>
    <div class="ex-stat-label">Each subsequent gain beyond 80% — increasingly discouraging and time-consuming</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Helpfulness evals are harder to automate than accuracy evals.</strong> Accuracy is binary — the assessment was right or wrong. Helpfulness requires human judgment — did this response make the user feel supported and give them something to act on? LLM-as-judge can approximate this, but it needs to be validated against human labels regularly. Teams that skip human eval on helpfulness end up optimising for a metric that doesn't correlate with actual user satisfaction.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Gap analysis framing can feel patronising if poorly done.</strong> "Here's your gap and here's how to close it" is helpful when the suggestions are specific and achievable. It becomes condescending when the suggestions are generic ("get more experience") or when the gap is too large to close realistically ("you need 10 more years of experience"). The framing only works when the action steps are genuinely useful — which requires the model to reason about what's achievable, not just what's missing.</p>

<p style="margin-bottom:0.75rem;"><strong>C. The 80/20 trap is a stakeholder management problem as much as a technical one.</strong> When a team ships 80% of an experience in 1 month, executives and PMs often assume the remaining 20% will take proportionally less time. It takes 4x more. Setting this expectation early — before the first 80% is shipped — prevents launch pressure that forces teams to ship before the product is ready. This is a communication responsibility, not just a product management one.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">LinkedIn's chatbot teaches the most important AI product lesson that doesn't show up in any technical metric: correct and helpful are not the same thing. An AI product can pass every accuracy eval and still fail in production because it's optimising for the wrong outcome. The PM's job is to define what "good" means before building the eval — and "correct" is almost never the complete definition of good for a user-facing product.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you evaluate whether an AI feature is working?"</div>
  <div class="ex-interview-answer">Three levels — each measuring something different:
<br><br>• <strong>Technical accuracy</strong> — is the output factually correct? (Evals, golden dataset, LLM-as-judge)
<br>• <strong>Helpfulness</strong> — did the user find it useful? Did they take a next step? (Human eval, task completion rate, follow-up action rate)
<br>• <strong>Business outcome</strong> — did it move the metric that matters? (Engagement, conversion, retention, NPS)
<br><br>LinkedIn had strong technical accuracy and poor helpfulness. These are independent dimensions — you must measure both. A chatbot that gives correct but unhelpful responses will fail on business outcomes even if it aces accuracy evals.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a job fit assessment feature for Naukri / LinkedIn India"</div>
  <div class="ex-interview-answer">Apply LinkedIn's lesson directly — the output format is the product decision.
<br><br><strong>Wrong output:</strong> "You are not a fit for this role."
<br><br><strong>Right output structure:</strong>
<br>• <strong>Match summary</strong> — "Strong match on 3 of 5 required skills"
<br>• <strong>Specific gaps</strong> — "Missing: cloud infrastructure experience, team leadership"
<br>• <strong>Actionable next steps</strong> — "Add AWS certification to strengthen your profile. Your current projects show relevant work — highlight Project X specifically."
<br><br>India-specific: Naukri users often come from Tier 2/3 cities with non-linear career paths. A binary "fit/not fit" verdict is even more damaging here — many users are making career pivots with transferable but non-obvious skills. Gap analysis framing is essential, not optional.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you manage stakeholder expectations on AI product timelines?"</div>
  <div class="ex-interview-answer">LinkedIn's 80/20 trap is the answer. Two things to communicate upfront:
<br><br>• <strong>Progress is non-linear.</strong> The first 80% of an AI experience comes fast — demo quality is achievable in weeks. The last 20% (hallucinations, edge cases, tonal compliance, out-of-scope handling) takes longer than the first 80% did. Establish this expectation before shipping the first 80%, not after.
<br>• <strong>Define "done" before building.</strong> If stakeholders define success as "the demo looks good," you'll ship too early. Define success as "passes this specific eval set at this threshold" — a number, not a feeling. This gives the team cover to keep iterating and gives stakeholders a clear finish line.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to evaluate an AI product, default to accuracy metrics — "how often is the AI correct?" LinkedIn's lesson is that correctness is necessary but not sufficient. Two things wrong with stopping at accuracy:
  <br><br>• <strong>Correct answers can destroy user trust.</strong> "You're a terrible fit" is accurate and actively harmful. The eval passes, the product fails. Accuracy evals don't catch tone, framing, or emotional impact — which are often the primary drivers of whether users find a product valuable.
  <br><br>• <strong>Helpfulness requires a different eval entirely.</strong> You can't derive helpfulness from accuracy. You need separate human evaluation on whether responses give users something actionable. Most teams never build this second eval — they ship when accuracy looks good and wonder why engagement is low.
</div>`,

    sources: [
      { id: 81, title: 'Common Pitfalls When Building Generative AI Applications', url: 'https://huyenchip.com/2025/01/16/ai-engineering-pitfalls.html' }
    ]
  }
},
{
  slug: 'air-canada-chatbot-liability',
  company: 'Air Canada',
  problem: 'Chatbot Hallucination — Legal Liability',
  oneLiner: 'Air Canada\'s chatbot gave a grieving passenger incorrect bereavement refund policy information with full confidence — no disclaimer, no human escalation. A BC tribunal ruled Air Canada liable. First major legal precedent establishing that companies are responsible for what their AI says',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Evals & AI Quality', 'AI Design'],
  sections: {
    problem: `In November 2022, Jake Moffatt's grandmother died. He needed to book a last-minute flight from Vancouver to Toronto and wanted to know if Air Canada's bereavement fare policy would apply.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">What the chatbot said</div>
    "You can book your flight now and apply for the bereavement fare discount retroactively within 90 days of purchase." Moffatt trusted this, booked the flights at full price, and submitted a refund application after returning.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">What the actual policy said</div>
    Bereavement fares cannot be applied retroactively. The request must be made before travel. Air Canada refused the refund. Tribunal ruled: negligent misrepresentation. Air Canada ordered to pay the fare difference plus $125 in damages.
  </div>
</div>

The failure had three layers:
<br>• <strong>Wrong answer:</strong> The chatbot confidently stated a policy that was either outdated or fabricated — evidence suggests Air Canada may have previously had a 90-day retroactive policy that was discontinued, and the model was trained on the old version
<br>• <strong>No uncertainty signal:</strong> The chatbot gave no disclaimer, no "please verify with an agent," no confidence indicator. The user had no reason to doubt the response
<br>• <strong>No escalation path:</strong> For a policy question with real financial and emotional stakes — someone booking flights for a family funeral — there was no prompt to speak to a human agent

Air Canada's defence in the tribunal made legal history for the wrong reasons: they argued the chatbot was "a separate legal entity responsible for its own actions." The tribunal member called this defence "remarkable" and rejected it entirely. The ruling established that companies are responsible for all information on their website — whether from a static page or a chatbot.`,

    howSolved: `Air Canada did not publicly detail technical fixes post-ruling. But the case defines exactly what should have been in place — and what every AI PM building customer-facing products must now implement.

<strong>What should have existed — the three-layer fix</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Layer</div><div>What it does</div><div>How it would have changed this case</div>
  </div>
  <div class="ex-table-row">
    <div>Retrieval grounding (RAG)</div>
    <div>Chatbot answers pulled directly from live policy documents, not from model weights</div>
    <div>Current policy fetched at query time — stale training data becomes irrelevant. Chatbot can only say what the policy page actually says.</div>
  </div>
  <div class="ex-table-row">
    <div>Calibrated confidence + disclaimer</div>
    <div>For policy questions, always append: "Please confirm with an Air Canada agent before booking based on this information."</div>
    <div>Moffatt would have been prompted to verify. Even if the information was wrong, the disclaimer creates appropriate doubt.</div>
  </div>
  <div class="ex-table-row">
    <div>Human escalation for high-stakes queries</div>
    <div>Detect query categories with real financial or legal consequences (refunds, cancellations, bereavement, medical) and route to a human agent or verified page</div>
    <div>A bereavement policy question during a booking session is a clear high-stakes signal. Escalate automatically.</div>
  </div>
</div>

<strong>The calibration framework this case teaches</strong>
Article #43 from the reading list defines the 6-question calibration checklist every AI PM should apply before shipping any customer-facing feature:
<br>• What is the precision of this output? (Air Canada: unknown — no evals existed)
<br>• What intervention does this precision support? (80% → suggestions only. 40% → soft nudges. Never hard policy statements at any precision below 99%+)
<br>• What happens when it's wrong? (Air Canada: user makes irreversible financial decision based on wrong information)
<br>• Who pays the cost of being wrong? (Air Canada: the user paid financially, emotionally. Company paid legally.)
<br>• How do you make failure cheap? (Air Canada: didn't. No disclaimer, no escalation)
<br>• How do you detect it? (Air Canada: didn't. No monitoring, no evals)

None of these questions were answered before shipping. The result was predictable.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Grieving passenger under time pressure</div>
  Booking last-minute flights for a family funeral. Emotionally vulnerable, time-constrained, financially stressed. Failure mode: asks a direct policy question, gets a confident wrong answer, makes an irreversible financial decision. There is no way for this user to detect the error — the chatbot sounds authoritative, gives specific details (90 days), and provides no disclaimer. By the time the error surfaces, the flights are booked and travel is complete.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Any user asking about policies with financial consequences</div>
  Cancellation fees, refund eligibility, loyalty redemption, baggage rules. Failure mode: chatbot answers from training data that may be outdated, discontinued, or hallucinated. User acts on it. Policy is different. Company refuses. User has no recourse. The Air Canada ruling means the company is now liable — which means every policy-adjacent chatbot answer carries legal risk.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">Feb 2024</div>
    <div class="ex-stat-label">Date of BC Civil Resolution Tribunal ruling — first major AI chatbot liability precedent</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">$812.02</div>
    <div class="ex-stat-label">CAD ordered — fare difference + $125 in damages + $36 in tribunal fees</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">0</div>
    <div class="ex-stat-label">Disclaimers in the chatbot response — no "verify before booking," no escalation prompt</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. RAG grounding trades flexibility for accuracy on factual queries.</strong> Grounding chatbot answers in live policy documents means the chatbot can only answer what the documents contain. It can't synthesise, summarise creatively, or handle edge cases not covered by the documentation. For policy questions, this is the right tradeoff — accuracy on the narrow domain matters more than breadth. But it requires well-structured, current, retrievable policy documentation — which most companies don't have.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Escalation prompts reduce chatbot deflection rate but increase trust.</strong> Prompting users to speak to a human agent for high-stakes queries reduces the self-serve rate that chatbots are often measured on. An overly escalation-happy chatbot looks bad on "deflection rate" metrics. This is a metric design problem: if you measure chatbot success on deflection rate, you incentivise not escalating. Measure on customer satisfaction and claim rate instead.</p>

<p style="margin-bottom:0.75rem;"><strong>C. The "separate legal entity" defence is dead.</strong> Air Canada tried to argue the chatbot was responsible for its own actions — not the company. The tribunal rejected this with clear language: "Air Canada suggests the chatbot is a separate legal entity that is responsible for its own actions. This is a remarkable submission." Every PM shipping a customer-facing chatbot must internalise this: your company owns what the chatbot says, exactly as if a human employee said it.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Static page vs. chatbot are now legally equivalent.</strong> The tribunal explicitly ruled that Air Canada could not claim the static policy page was "more trustworthy" than the chatbot — they are both Air Canada's representations to customers. This means a chatbot that contradicts your official policy page creates legal exposure even if the correct information is one click away. You can't have two sources of truth.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Air Canada is not a story about a chatbot giving a wrong answer. It's a story about a product that was shipped without asking the most basic design question: "What happens when it's wrong?" The answer, in this case, was: a grieving user makes an irreversible financial decision, the company gets sued, and a legal precedent gets set that every AI PM now lives under. The Air Canada ruling means your company owns what your AI says — exactly as if a human employee said it.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you design an AI feature responsibly?"</div>
  <div class="ex-interview-answer">Apply the 6-question calibration checklist before shipping any customer-facing AI feature:
<br><br>• <strong>What is the precision?</strong> — If you don't know, you don't have evals. Build evals first.
<br>• <strong>What intervention does this precision support?</strong> — 99%+ precision → can automate. 80% → suggest only. 40% → soft nudge. Never hard policy statements below 99%.
<br>• <strong>What happens when it's wrong?</strong> — Describe the failure state as vividly as the success state. Air Canada's failure state: user books irreversible flights based on wrong policy. Unacceptable.
<br>• <strong>Who pays the cost?</strong> — If the user pays the cost of a wrong answer, the bar for shipping must be higher. Air Canada: user paid financially and emotionally.
<br>• <strong>How do you make failure cheap?</strong> — Disclaimer, escalation path, reversibility. Air Canada had none of these.
<br>• <strong>How do you detect it?</strong> — Monitoring, evals, error logging. Air Canada had none of these either.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a customer support chatbot for IndiGo / Air India / Vistara"</div>
  <div class="ex-interview-answer">Air Canada is your anti-pattern. Three non-negotiables:
<br><br>• <strong>Ground policy answers in RAG:</strong> All responses about fares, refunds, cancellations, and eligibility must be retrieved from live policy documents — not generated from model weights. Policy pages change. Training data doesn't.
<br><br>• <strong>Calibrate disclaimers by stakes:</strong>
<br>&nbsp;&nbsp;— Low stakes (flight status, check-in time) → direct answer
<br>&nbsp;&nbsp;— Medium stakes (baggage rules) → answer + "confirm at check-in"
<br>&nbsp;&nbsp;— High stakes (refunds, medical, bereavement) → answer + mandatory "speak to an agent to confirm before booking"
<br><br>• <strong>Auto-escalate high-stakes intents:</strong> Detect bereavement, medical, refund, cancellation queries and route to a human agent or verified self-service page. Not as a fallback — as the default for these categories.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the legal risk of deploying an AI chatbot?"</div>
  <div class="ex-interview-answer">The Air Canada ruling established three legal principles every PM must know:
<br><br>• <strong>Company liability extends to chatbot outputs.</strong> You cannot disclaim responsibility by saying "the chatbot is a separate system." Tribunal: "This is a remarkable submission." Your chatbot is your agent.
<br>• <strong>Chatbot and static page are equally authoritative.</strong> A correct policy page doesn't protect you if the chatbot contradicts it. You have one source of truth — make sure the chatbot reflects it.
<br>• <strong>Negligent misrepresentation applies.</strong> If a user relies on chatbot output to make a decision and the output is wrong, you owe them a duty of care. "We didn't know it would hallucinate" is not a defence.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about AI chatbot risks, say "hallucinations" and describe them as a technical problem to be solved with a better model. Two things wrong:
  <br><br>• <strong>Hallucinations are a design problem, not just a model problem.</strong> Air Canada's chatbot didn't fail because the model was bad. It failed because the product was designed with no verification layer, no disclaimer, no escalation path, and no evals. A better model might have hallucinated differently — not less. The fix is calibrated design, not model upgrade.
  <br><br>• <strong>"The AI is responsible" is not a defence.</strong> Air Canada explicitly tried this argument. The tribunal explicitly rejected it. Every PM shipping a customer-facing AI feature must design as if they will personally be asked "why did you ship this without a disclaimer?" — because legally, they might be.
</div>`,

    sources: [
      { id: 43, title: "You're Not Building an 'AI Product'", url: 'https://www.builderlab.ai/p/youre-not-building-an-ai-product' }
    ]
  }
},
{
  slug: 'intuit-suggested-questions',
  company: 'Intuit',
  problem: 'Chatbot UX — Blank Input Problem',
  oneLiner: 'Intuit built a tax chatbot that got lukewarm feedback despite being accurate — users hated facing a blank input and didn\'t know what to ask. Adding 3 suggested questions per interaction fixed engagement without changing the AI at all',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design', 'Evals & AI Quality'],
  sections: {
    problem: `Intuit built a chatbot to help users answer tax questions on TurboTax. The underlying AI was accurate. User feedback was lukewarm — low engagement, low return rate, poor satisfaction scores.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Blank input</div>
    User opens chatbot. Sees a blank text input. Doesn't know what the bot can do. Doesn't know what to type. Types nothing. Closes the chatbot. The AI never gets a chance to help. Engagement data looks like the product is failing — but the model was never the problem.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Suggested questions</div>
    User opens chatbot. Sees 3 clickable suggested questions relevant to their current context: "Can I deduct home office expenses?", "What counts as a business expense?", "How do I report freelance income?" User clicks one. Conversation starts. Trust builds incrementally. Engagement up significantly.
  </div>
</div>

The root cause: a blank input assumes the user knows what the AI can do. Most users don't. Tax questions are high-stakes and emotionally loaded — users are afraid of asking something wrong or revealing they don't understand something they feel they should. The blank input amplifies this anxiety. Suggested questions give users a safe entry point that requires no expertise and no vulnerability.`,

    howSolved: `The fix was entirely in the UX layer — zero changes to the AI model, zero changes to the underlying accuracy.

<strong>What changed</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Before</div><div>After</div>
  </div>
  <div class="ex-table-row">
    <div>Blank text input</div>
    <div>3 contextual suggested questions shown above the input</div>
  </div>
  <div class="ex-table-row">
    <div>User must know what to ask</div>
    <div>User sees what the bot can do immediately</div>
  </div>
  <div class="ex-table-row">
    <div>High cognitive load to start</div>
    <div>One click to begin — zero typing required</div>
  </div>
  <div class="ex-table-row">
    <div>Trust must be assumed</div>
    <div>Trust built incrementally through each answered question</div>
  </div>
</div>

<strong>Why suggested questions work — three mechanisms</strong>
<br>• <strong>Scope signalling:</strong> Users immediately understand what the bot can and can't do. "Can I deduct home office expenses?" tells users this bot handles deductions — they now know it's relevant to them.
<br>• <strong>Anxiety reduction:</strong> Tax questions feel high-stakes. Clicking a pre-written question requires no expertise and no vulnerability. The user didn't "ask a dumb question" — they clicked a button.
<br>• <strong>Incremental trust:</strong> Each correctly answered suggested question builds confidence. By question 3, the user is typing their own questions freely. The suggested questions are training wheels — necessary at the start, dropped naturally as trust develops.

<strong>The broader lesson from Chip Huyen's analysis</strong>
Intuit and LinkedIn reveal the same pattern: bad product feedback is routinely misdiagnosed as bad AI. Teams respond by upgrading the model, retraining, or adding more data — when the actual failure is UX friction, wrong output framing, or a missing escalation path. The diagnostic question before any model work: "Is the AI the bottleneck, or is the interface the bottleneck?"`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — First-time TurboTax user</div>
  No prior experience with AI chatbots for tax questions. Failure mode: opens chatbot, sees blank input, doesn't know if this bot handles simple questions or complex ones, doesn't want to reveal ignorance, closes without engaging. With suggested questions: immediately sees 3 relatable questions, realises the bot is accessible and useful, clicks one, starts building trust.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Anxious filer with specific concern</div>
  Has a specific question ("I worked from home this year, can I deduct anything?") but is unsure if it's too complex or too simple for the bot. Failure mode: types a vague question ("can you help me?"), gets a generic response, disengages. With suggested questions: sees "Can I deduct home office expenses?" — clicks it, gets a specific answer, asks their real follow-up.
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Suggested questions can anchor users to pre-defined topics.</strong> If the 3 suggested questions don't match what the user actually needs, they can narrow exploration rather than expand it. A user who needs help with cryptocurrency income but only sees deduction and freelance questions may assume the bot can't help with crypto — and leave. Question selection and rotation matters as much as the feature itself.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Context-aware suggestions are harder than static ones.</strong> Static suggested questions ("Can I deduct home office expenses?") work for all users. Context-aware ones ("You haven't entered any deductions yet — do you work from home?") work much better but require knowing where the user is in the filing flow. The easy version ships in a day. The good version requires product instrumentation and personalisation logic.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Suggested questions can mask underlying model quality issues.</strong> If the bot answers suggested questions well but fails on free-form questions, high engagement from suggestions can hide the real quality problem. Track free-form question rate and satisfaction separately from suggested question engagement — don't let one metric cover the other.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Intuit is the clearest example of a product failure that looked like an AI failure. Bad engagement on a chatbot is almost always interpreted as "the AI isn't good enough." Intuit's lesson: before touching the model, ask whether the interface is the bottleneck. A blank input assumes expertise the user doesn't have. Suggested questions lower the entry barrier to zero — and the AI gets a chance to do its job.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a tax / financial advisory chatbot for ClearTax / Zerodha / Groww"</div>
  <div class="ex-interview-answer">Intuit's lesson is non-negotiable for Indian financial products.
<br><br>Three UX requirements before launch:
<br>• <strong>Suggested questions, always:</strong> Indian users filing taxes or investing for the first time have high anxiety about financial questions. Blank input = abandoned session. Suggested questions = entry point. Start with 3 per context: filing screen, deductions screen, review screen.
<br>• <strong>India-specific suggestions:</strong> "Can I claim HRA deduction?", "How do I report my Zerodha P&L?", "Is my PPF contribution tax deductible?" — not generic tax questions.
<br>• <strong>Progress-aware context:</strong> Suggestions should change based on where the user is in the flow. User on the investments screen gets investment-related suggestions, not rent/HRA questions.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you diagnose why an AI feature has low engagement?"</div>
  <div class="ex-interview-answer">Before assuming the model is the problem, check three UX failure modes:
<br><br>• <strong>Discovery failure:</strong> Do users know the feature exists? (Placement, onboarding, discoverability)
<br>• <strong>Entry barrier failure:</strong> Can users start without expertise? (Intuit: blank input required knowing what to ask)
<br>• <strong>Trust failure:</strong> Do users believe the AI can help them with their specific problem? (Suggested questions signal scope immediately)
<br><br>Only after ruling out these three should you look at model quality. In Intuit's case, the model was never the problem — and the fix was a UX change that shipped in days, not months.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when told a chatbot has low engagement, immediately propose improving the model — better prompts, more training data, fine-tuning, RAG. The Intuit lesson: low engagement on a chatbot is almost never a model problem first. It's usually an interface problem. A blank input that requires users to know what to ask is a UX failure that will tank engagement regardless of model quality. The diagnostic question — "is the AI the bottleneck or is the interface the bottleneck?" — should always come before any model work. Shipping a better model into a broken interface produces a better model that nobody uses.
</div>`,

    sources: [
      { id: 81, title: 'Common Pitfalls When Building Generative AI Applications', url: 'https://huyenchip.com/2025/01/16/ai-engineering-pitfalls.html' }
    ]
  }
},
{
  slug: 'honeycomb-fine-tuning-query-language',
  company: 'Honeycomb',
  problem: 'Fine-Tuning for Domain-Specific Query Language',
  oneLiner: 'Honeycomb (observability platform) needed to translate plain English into their proprietary query syntax — prompting with the full manual worked but was fragile and expensive. Fine-tuning a smaller model learned the syntax rules permanently, achieving 94% query generation success rate',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Evals & AI Quality', 'Post-Training'],
  sections: {
    problem: `Honeycomb is an observability platform — engineers use it to query production telemetry data (latency, errors, database performance, user behaviour). The platform has its own proprietary query language with strict syntax rules. Writing queries required deep platform expertise, limiting the tool to senior engineers.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Prompting with the manual</div>
    Honeycomb dumped the entire "programming manual" for their query language into the prompt, along with many examples, and asked the LLM to translate natural language into valid queries. It worked — but it was fragile (prompt changes broke syntax adherence), expensive (massive context window per query), and inconsistent (the model's general knowledge sometimes overrode the syntax rules in subtle ways). The model was guessing from instructions rather than knowing the language.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Fine-tuned model</div>
    Fine-tuned a smaller model specifically on Honeycomb query syntax. The model learned the exact rules — not from a prompt it reads at inference time, but from weights trained on hundreds of valid query examples. 94% success rate on query generation. Smaller model, lower cost, more consistent output. Engineers at all levels can now query production data in plain English.
  </div>
</div>

The core problem was one that prompting fundamentally cannot solve: Honeycomb's query language is proprietary and doesn't exist in any public training data. No amount of prompting can teach a model to reliably produce syntax it has never seen before — it can only approximate from instructions. Fine-tuning bakes the syntax into the model's weights, making it a native capability rather than a runtime instruction.`,

    howSolved: `Honeycomb built a Query Assistant using fine-tuning, not prompting. The decision followed Hamel Husain's principle: fine-tune when the model needs to learn a new syntax or format that doesn't exist in its training data.

<strong>Why fine-tuning, not prompting or RAG</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Approach</div><div>Why it didn't work well enough</div>
  </div>
  <div class="ex-table-row">
    <div>Prompting with manual</div>
    <div>Fragile — prompt changes caused syntax regressions. Expensive — full manual in context every request. Inconsistent — model's general language knowledge occasionally overrode specific syntax rules.</div>
  </div>
  <div class="ex-table-row">
    <div>RAG</div>
    <div>RAG solves knowledge gaps (facts the model doesn't know). Honeycomb's problem wasn't missing knowledge — it was missing syntax capability. RAG retrieves information; it doesn't teach grammar.</div>
  </div>
  <div class="ex-table-row">
    <div>Fine-tuning</div>
    <div>Correct tool. Model trained on (natural language query → valid Honeycomb query) pairs. Learns the syntax as a native capability. Smaller model needed, lower cost, higher consistency.</div>
  </div>
</div>

<strong>What fine-tuning actually does here</strong>
The training data was pairs of: plain English question → valid Honeycomb query in their proprietary syntax. After fine-tuning, the model doesn't need the manual in the prompt — it knows the syntax the way a developer who has written 1,000 Honeycomb queries knows it. The rules are in the weights.

<strong>The production result</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Engineer types: "Show me p99 latency for the checkout service, last 24 hours"</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Fine-tuned model generates valid Honeycomb query in correct syntax</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Query runs against production telemetry data</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Engineer sees results — without knowing Honeycomb query syntax</div>
</div>

<strong>Observability as the quality system</strong>
Post-launch, Honeycomb applied their own product (observability) to the Query Assistant. They captured every request — user input, LLM response, whether a valid query was produced, whether it ran successfully. ~40 steps in the RAG pipeline each logged. When query generation failed, they could filter to every failure case, grouped by input pattern, and immediately see what the model was getting wrong. Their own observability infrastructure became their eval and debugging system.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Junior engineer unfamiliar with Honeycomb syntax</div>
  Needs to investigate a latency spike but doesn't know Honeycomb's query language. Failure mode before Query Assistant: spends 30 minutes reading documentation, writes a syntactically wrong query, gets an error, asks a senior engineer. Blocks investigation. With fine-tuned Query Assistant: types "show me what's slow in the payment service" in plain English, gets a valid query, runs it immediately. Investigation starts in seconds.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Senior engineer under incident pressure</div>
  Production incident. Every second counts. Knows Honeycomb well but needs to write complex queries fast. Failure mode with prompting: occasional syntax errors in generated queries under non-standard conditions (edge cases in the query language). With fine-tuned model: consistent 94% success rate — reliable enough to trust during an incident without manually verifying every output.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">94%</div>
    <div class="ex-stat-label">Query generation success rate — natural language to valid Honeycomb syntax</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2–3×</div>
    <div class="ex-stat-label">More likely to create complex queries and save to boards — teams using Query Assistant vs. not</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">~40</div>
    <div class="ex-stat-label">Steps in the RAG pipeline — each instrumented with observability for debugging</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Fine-tuning requires an eval system first.</strong> You cannot fine-tune without knowing if it worked. Honeycomb had to build eval infrastructure before training — a golden dataset of (input, expected query) pairs to measure accuracy before and after fine-tuning. Teams that skip evals end up fine-tuning blind: they don't know if the new model is better, worse, or just different. Fine-tuning without evals is not an improvement process — it's a guess.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Fine-tuning locks you to a model version.</strong> Once fine-tuned on GPT-3.5, upgrading to a new base model requires retraining. Honeycomb discovered this when new model versions became available — the fine-tuned weights don't transfer. This is the maintenance cost that prompting avoids: prompts are portable across model versions, fine-tuned weights are not.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Fine-tuning is only the right tool for syntax/style/rules.</strong> It taught Honeycomb's query language because the problem was "learn this specific grammar." It would not have helped if the problem was "know more facts about our product" (that's RAG) or "reason better about complex queries" (that's a bigger base model or chain-of-thought prompting). Misapplying fine-tuning to a knowledge problem wastes training cost and produces worse results than RAG.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Honeycomb is the clearest production example of when fine-tuning is the right tool — and why. The question to ask is not "should I fine-tune?" but "what kind of problem do I have?" Honeycomb had a syntax problem: a proprietary query language that no LLM had ever seen. Prompting can describe the syntax. Fine-tuning teaches it. For syntax, style, and domain-specific rules, fine-tuning is the correct tool. For knowledge gaps, RAG is correct. For reasoning, a bigger model or chain-of-thought is correct.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you fine-tune vs. use RAG vs. prompt engineer?"</div>
  <div class="ex-interview-answer">The decision tree:
<br><br>• <strong>Start with prompting</strong> — always. Not because it always works, but because it stress-tests your eval system and reveals what the model actually struggles with.
<br>• <strong>Use RAG</strong> when the model lacks knowledge — facts, documents, current information, proprietary data the model hasn't seen.
<br>• <strong>Fine-tune</strong> when the model lacks a capability — a new syntax (Honeycomb), a specific output format (ReChat's structured UI responses), a domain-specific style that prompting can't consistently reproduce.
<br>• <strong>Never fine-tune without evals</strong> — you need a golden dataset to know if training helped or hurt.
<br><br>India application: a Zerodha assistant that generates valid Kite API queries from plain English — same pattern as Honeycomb. Prompting with the API documentation is fragile. Fine-tuning on (natural language → valid API call) pairs produces consistent, reliable output.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you make a complex tool accessible to non-expert users?"</div>
  <div class="ex-interview-answer">Honeycomb's answer: natural language as the interface layer.
<br><br>The pattern applies anywhere there's a capability gap between what the tool requires and what the user knows:
<br>• Honeycomb: query language → plain English interface via fine-tuned model
<br>• SQL databases: complex joins → "show me top customers by revenue last quarter"
<br>• Jira/project tools: filter syntax → "show me all bugs assigned to me opened this sprint"
<br><br>The PM implication: when you have a powerful tool with a steep learning curve, the AI layer is not a chatbot — it's a translation layer. The output is structured, verifiable, and runs against real systems. This is more valuable and more reliable than a general conversational interface.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates treat fine-tuning as the default improvement when prompting isn't working well enough. Two things wrong:
  <br><br>• <strong>Fine-tuning solves the wrong problem most of the time.</strong> Most underperforming AI features fail because of knowledge gaps (use RAG), wrong output framing (use better prompts), or missing evals (you don't actually know what's failing). Fine-tuning is the right tool only when the model needs to learn a syntax, style, or format that genuinely can't be taught through prompting. This is a narrow category — Honeycomb's proprietary query language is a perfect example. Most product problems are not.
  <br><br>• <strong>Fine-tuning without evals is not an improvement process.</strong> You cannot know if fine-tuning helped without a golden dataset to measure before and after. Teams that fine-tune without evals often degrade their model in subtle ways they never detect — because they have no baseline to compare against.
</div>`,

    sources: [
      { id: 55, title: 'Is Fine-Tuning Still Valuable?', url: 'https://hamel.dev/blog/posts/fine_tuning_valuable.html' }
    ]
  }
},
{
  slug: 'booking-com-smart-filters',
  company: 'Booking.com',
  problem: 'Smart Filters — Intent Detection as UI',
  oneLiner: 'Booking.com (hundreds of millions of bookings) replaced 100s of manual filter checkboxes with an AI Smart Filter that reads a plain English description of what you want and auto-applies the right filters — turning intent detection into a UX feature, not a chatbot',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design', 'Search'],
  sections: {
    problem: `Booking.com had hundreds of filters — pool, breakfast included, free cancellation, pet-friendly, beachfront, spa, gym, parking. They were powerful but required users to know exactly what they wanted and navigate through checkboxes to express it.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Manual checkbox filters</div>
    User wants a romantic anniversary hotel in Amsterdam with canal views, a rooftop bar, and a great gym. They must: scroll through 100+ filter options, know what each filter covers, click 4–5 separate checkboxes, and hope the combination returns useful results. Users with nuanced intent ("make it cheesy — heart-shaped beds, that kind of thing") had no filters to express this at all. The platform was only useful if you knew what you were looking for.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Smart Filter</div>
    User types: "Hotels in Amsterdam with a great gym, a rooftop bar, and canal views from the room." GenAI reads the description, maps it to Booking.com's filter taxonomy, auto-applies the relevant filters, and returns a tailored property list. No checkboxes. No scrolling. No expertise required. The intent is captured from natural language and translated into structured search — instantly.
  </div>
</div>

Booking.com's CTO framed the core problem directly: "You might want to go on a romantic getaway, but make it cheesy — heart-shaped beds, Elvis impersonators. There's no filter for that. Traditional search just wasn't built to unlock that kind of intent." The failure wasn't the filter system — it was that the filter system required users to translate their intent into a taxonomy they didn't know. AI inverts this: the system learns the taxonomy, the user just describes what they want.`,

    howSolved: `Booking.com built Smart Filter as a pure intent detection → filter translation pipeline. No conversational chatbot. No back-and-forth. One input, one structured output.

<strong>Why not a chatbot?</strong>
A chatbot would have been the obvious choice — "just let users have a conversation about what they want." Booking.com deliberately didn't build a chatbot for this. The reason: users don't want to have a conversation about hotel filters. They want to see hotel results. A chatbot introduces back-and-forth, uncertainty about what to say, and a delay before results appear. Smart Filter takes one sentence and immediately shows filtered results — the user stays in the search/browse flow rather than entering a chat flow.

<strong>The architecture</strong>

<div class="ex-flow">
  <div class="ex-flow-step">User types plain English description of desired property</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">LLM reads description and maps to Booking.com filter taxonomy</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Filters auto-applied to search</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Tailored property list returned — filters visible and editable</div>
</div>

<strong>Three design decisions that made it work</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Decision</div><div>What it is</div><div>Why it matters</div>
  </div>
  <div class="ex-table-row">
    <div>Verifiable output</div>
    <div>Applied filters are shown to the user — they can see exactly what was interpreted and edit any filter</div>
    <div>User can verify the AI understood them correctly. If wrong, one click to fix. Failure is cheap.</div>
  </div>
  <div class="ex-table-row">
    <div>Stays in search flow</div>
    <div>Output is a filtered property list — not a chat response, not a recommendation, not a summary</div>
    <div>User never leaves the browse experience. AI is invisible infrastructure, not a visible chatbot.</div>
  </div>
  <div class="ex-table-row">
    <div>No required expertise</div>
    <div>User describes what they want in their own words — doesn't need to know Booking.com's filter names</div>
    <div>Unlocks users who couldn't navigate the filter system. Especially valuable for first-time or occasional travelers.</div>
  </div>
</div>

<strong>Broader AI architecture at Booking.com</strong>
Smart Filter is one layer of a larger system. Booking.com also built:
<br>• <strong>Property Q&A</strong> — ask a specific question about a property ("Does this hotel have soundproofed rooms?") and get an AI answer drawn from reviews, descriptions, and property data
<br>• <strong>Review Summaries</strong> — AI-generated summary of guest reviews per property, surfacing patterns across hundreds of reviews
<br>• <strong>Intent + topic detection for customer service</strong> — classifies customer queries to route to self-service vs. human agent. 2× lift in topic detection accuracy. 1.5–1.7× increase in human agent bandwidth as more issues shift to self-service
<br>• <strong>AI Trip Planner</strong> (with OpenAI) — conversational trip planning that influences discovery, though Booking.com notes it hasn't "drastically changed" travel planning yet — the last-mile booking flow remains the core value`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Nuanced intent traveller</div>
  Wants a specific vibe — "romantic but not stuffy, walking distance to old town, something with a terrace." Failure mode with checkboxes: no filter captures "romantic but not stuffy" or "good vibe terrace." Picks the closest approximations, gets results that don't feel right, books elsewhere or gives up. With Smart Filter: types the description, AI maps to the nearest available filters (terrace, historic district, boutique), returns relevant results immediately.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Infrequent traveller unfamiliar with filters</div>
  Opens Booking.com once a year for a holiday. Doesn't know what "superior room" vs. "deluxe room" means. Doesn't know which filter covers "near the beach." Failure mode: overwhelmed by options, applies no filters, browses 500 results, leaves. With Smart Filter: types "beachfront hotel with a pool for families in Goa," gets a short relevant list immediately.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">2×</div>
    <div class="ex-stat-label">Lift in topic detection accuracy — customer service intent classification</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1.5–1.7×</div>
    <div class="ex-stat-label">Increase in human agent bandwidth — more issues handled via self-service AI</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">10+ years</div>
    <div class="ex-stat-label">Of ML experience at Booking.com — hundreds of models across pricing, fraud, translation, recommendations</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Intent mapping fails on highly niche or subjective requests.</strong> "Heart-shaped beds" or "Elvis impersonators" can't be mapped to a filter that doesn't exist in Booking.com's taxonomy. Smart Filter can only surface filters the platform already has. Requests outside the taxonomy either return partial matches or nothing — and the user may not realise the system couldn't fully understand them. The verifiable filter display mitigates this: users see what was applied and can adjust. But the underlying limitation is real — AI can only translate intent into filters that exist.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Filter translation quality varies by query specificity.</strong> "Hotels with a gym and pool in Bangkok" is easy to map. "Somewhere cosy and not touristy near good food" is hard — "cosy," "not touristy," and "good food" don't map cleanly to any filter. The system returns a best-effort interpretation that may feel off. Booking.com's mitigation: show applied filters so users can see what was interpreted. The failure is visible and cheap to correct.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Chatbot vs. Smart Filter is a deliberate architectural choice with tradeoffs.</strong> Smart Filter is fast and stays in the browse flow — but it's one-shot. If the user wants to refine ("actually, skip the gym, I care more about the location"), they re-type or manually adjust filters. A chatbot could handle iterative refinement more naturally — but at the cost of pulling the user out of the browse flow and into a conversational interface. Booking.com chose the browse-first design. This works for most users but fails for complex multi-constraint queries that benefit from iteration.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Booking.com's Smart Filter is the clearest example of the right primitive for the right problem. The problem was intent expression — users couldn't translate what they wanted into checkbox filters. The right AI primitive was intent detection → structured output, not a chatbot. The output is verifiable (filters are shown), reversible (user can edit), and stays in the existing browse flow. This is what "AI as infrastructure" looks like — invisible to the user, transformative in capability.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design an AI feature for MakeMyTrip / Yatra / OYO"</div>
  <div class="ex-interview-answer">Smart Filter is the direct reference for Indian travel platforms.
<br><br><strong>MakeMyTrip Smart Filter equivalent:</strong>
<br>• User types: "Beach resort in Goa for a family of 4, budget ₹8,000/night, with a kids pool and AC rooms"
<br>• LLM maps to: beachfront filter, family rooms, price range ₹6,000–10,000, kids pool, AC
<br>• Filters applied, results shown, filters visible and editable
<br><br><strong>India-specific nuances to add:</strong>
<br>• Veg-only dining filter (common requirement, rarely surfaced prominently)
<br>• "Near temple / pilgrimage site" — common intent for religious travel
<br>• "Quiet / no DJ / no party crowd" — honeymoon and family travellers specifically seek this
<br><br><strong>Design principle:</strong> output is always a structured filter set the user can verify — never a chatbot response the user must trust blindly.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use a chatbot vs. AI-enhanced UI components?"</div>
  <div class="ex-interview-answer">Booking.com's answer — use AI-enhanced UI when:
<br>• The user's goal is to see results, not to have a conversation
<br>• Output can be made verifiable at a glance (filters shown, suggestions visible)
<br>• Failure is cheap — user can correct a misinterpreted filter in one click
<br>• The user is in a browse/search flow that a chat interface would interrupt
<br><br>Use a chatbot when:
<br>• The user's goal requires back-and-forth refinement (complex trip planning, multi-city itinerary)
<br>• Output is inherently prose-based (recommendations with context, explanations)
<br>• The interaction is exploratory and open-ended
<br><br>The PM's test: "Does the user want to talk to AI, or does the user want to see results faster?" Usually the latter. Build AI that accelerates the existing flow before building a new conversational flow.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you design an AI feature that users will actually trust?"</div>
  <div class="ex-interview-answer">Booking.com's three principles from Smart Filter:
<br>• <strong>Verifiable</strong> — show the user what the AI did. Applied filters are visible. User can see the AI's interpretation before trusting the results.
<br>• <strong>Reversible</strong> — user can edit any filter the AI applied. One click to correct a misinterpretation. Failure has no lasting cost.
<br>• <strong>Stays in the user's flow</strong> — AI output is a filtered property list, not a chat response. User never has to switch context or learn a new interaction pattern.
<br><br>Trust is built through predictability and reversibility — not through impressive capability. A feature that does less but is always correctable builds more trust than one that does more but occasionally fails in ways the user can't undo.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to add AI to a search or discovery feature, immediately propose a chatbot. Two things wrong:
  <br><br>• <strong>Chatbots solve the wrong problem for most search use cases.</strong> Users searching for hotels don't want to have a conversation — they want to see relevant results faster. A chatbot adds a conversational layer before results appear. Smart Filter removes the friction and delivers results immediately. The AI is invisible; the results are instant.
  <br><br>• <strong>Chatbot outputs are hard to verify.</strong> A chatbot says "I found some great romantic hotels for you" — the user must trust this. Smart Filter shows the applied filters — the user can verify in one glance. Verifiable output is a design requirement for AI features where failure has a cost. "Romantic hotels" is not verifiable. "Filters applied: boutique, couples, terrace, historic district" is.
</div>`,

    sources: [
      { id: 45, title: 'Most AI UX Is Lazy', url: 'https://www.builderlab.ai/p/most-ai-ux-is-lazy' }
    ]
  }
},
{
  slug: 'github-copilot-trust-reversibility',
  company: 'GitHub Copilot',
  problem: 'Building Trust Through Reversibility',
  oneLiner: 'GitHub Copilot (1.3M+ paid subscribers) solved developer skepticism of AI-generated code not by making the AI more accurate — but by making every suggestion dismissible with one keystroke and never surprising users with irreversible actions',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design'],
  sections: {
    problem: `When GitHub Copilot launched in 2021, the product faced a fundamental trust problem: developers were deeply skeptical of AI writing code they'd be responsible for shipping.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">The trust problem</div>
    Developers had strong professional identity around writing their own code. AI-generated code felt like an unknown collaborator silently inserting logic they'd be blamed for if it broke. Early autocomplete tools that were too aggressive — rewriting whole functions, applying suggestions automatically — felt invasive. Developers rejected them or turned them off. The capability was real; the trust wasn't.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Copilot's solution</div>
    Ghost text: suggestions appear as dimmed gray text alongside the cursor. Nothing changes until the developer presses Tab. Escape dismisses it instantly. The developer is always in control — the AI never acts without explicit permission. Copilot reached 1.3M+ paid subscribers by making trust the product, not just the capability.
  </div>
</div>

The core insight: developer skepticism of AI code wasn't about capability — it was about control. The question wasn't "is this suggestion correct?" It was "if I accept this and it's wrong, can I undo it easily?" Ghost text answered this: the suggestion is always visible before acceptance, always one Tab to accept, always one Escape to dismiss. The failure mode is cheap and immediate.`,

    howSolved: `GitHub Copilot built trust through four interlocking design principles — each making the AI feel like a collaborator rather than an autonomous agent.

<strong>The four trust principles</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Principle</div><div>How Copilot implements it</div><div>Why it builds trust</div>
  </div>
  <div class="ex-table-row">
    <div>1. Reversibility</div>
    <div>Ghost text is never applied until Tab is pressed. Escape dismisses instantly. No suggestion changes the codebase without explicit acceptance.</div>
    <div>Failure is always cheap. Developer can read, evaluate, and reject without consequence. No "undo" needed — rejection is the default.</div>
  </div>
  <div class="ex-table-row">
    <div>2. Familiar mental model</div>
    <div>Ghost text maps directly to existing IDE autocomplete behaviour every developer already uses — same interaction pattern, same Tab key, same dismissal, just extended from one word to full functions.</div>
    <div>Zero new UX to learn. Trust transfers from autocomplete (already trusted) to Copilot suggestions. Adoption friction drops to near zero.</div>
  </div>
  <div class="ex-table-row">
    <div>3. Stays in existing workflow</div>
    <div>No separate interface, no copy-pasting, no context switching. Suggestion appears inline in the editor the developer is already in.</div>
    <div>AI is invisible infrastructure — it doesn't ask the developer to change how they work, only augments the flow they're already in.</div>
  </div>
  <div class="ex-table-row">
    <div>4. Transparency of suggestion scope</div>
    <div>Developer can see the entire suggestion before accepting — whether it's one line or 20 lines. Nothing is hidden or applied in the background.</div>
    <div>Developer maintains professional ownership. They can read what Copilot wrote before it becomes their code. This preserves the developer identity that made skepticism so strong.</div>
  </div>
</div>

<strong>The ghost text UX — why it specifically worked</strong>
Ghost text (dimmed gray inline text) was not the obvious choice. Alternatives considered:
<br>• A sidebar panel with suggestions — requires eyes to leave the code
<br>• A popup dialog — interrupts flow, requires a decision before continuing
<br>• Auto-application — removes agency entirely

Ghost text wins because it's peripheral — the developer notices it without having to look at it directly. They can keep typing and ignore the suggestion, or pause and accept it. The suggestion is always present but never demanding.

<strong>The "inline pull request" mental model</strong>
Guillermo Rauch (Next.js creator) described Copilot as "GitHub providing a way of creating an inline pull request, where the submitter is an AI and you're constantly reviewing their proposals." This framing is significant: developers already know how to review a PR — they read it, evaluate it, and accept or reject it. Copilot maps to this exact workflow. The AI is a contributor, not an authority.

<strong>Accuracy acceptance: 43% on first try, 57% on 10th</strong>
GitHub reports Copilot correctly autocompletes function bodies ~43% of the time on the first suggestion, 57% after cycling through alternatives. This is lower than people expect. The ghost text design makes this acceptable — a wrong suggestion costs one Escape keypress. If the acceptance model required deleting code the AI had already inserted, 43% accuracy would feel like a disaster. With ghost text, 43% accuracy feels like a capable assistant.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Skeptical senior developer</div>
  Strong professional identity around code quality. Refuses to use AI that writes code they haven't read. Failure mode with auto-application: AI inserts a function body, developer doesn't notice, ships a bug, gets blamed. Trust destroyed permanently. With ghost text: suggestion is always visible before acceptance. Developer reads it, evaluates it, accepts or rejects on their terms. AI never bypasses their review.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Developer learning a new framework</div>
  Knows their domain but unfamiliar with specific APIs or patterns in a new language. Failure mode without AI: spends 30 minutes reading documentation for boilerplate. With Copilot: types a function signature or a comment describing intent, Copilot suggests the implementation. Developer reads and learns from the suggestion even when accepting it. AI accelerates learning, not just productivity.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">1.3M+</div>
    <div class="ex-stat-label">Paid subscribers by early 2024 — fastest AI coding tool to mainstream adoption</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">43%</div>
    <div class="ex-stat-label">Accuracy on first suggestion for Python functions — acceptable only because rejection is free</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">57%</div>
    <div class="ex-stat-label">Accuracy after cycling through 10 alternative suggestions</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">1</div>
    <div class="ex-stat-label">Keypress to accept (Tab) or dismiss (Escape) — cost of a wrong suggestion is one keystroke</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Ghost text only works when the suggestion scope is visible.</strong> For single-line completions, ghost text is perfect — developer sees the entire suggestion. For 20-line function completions, ghost text requires the developer to scroll down to see the full suggestion before accepting. Most developers Tab-accept without reading the full suggestion when it's long. This erodes the "always reviewed before accepted" principle at scale. GitHub's mitigation: highlight the suggestion scope, let developers scroll through it before accepting.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Staying in the existing workflow constrains what Copilot can do.</strong> By building as an editor extension rather than a standalone application, GitHub gained adoption but ceded control over the full UX. The extension API constrains what context Copilot can access and what interactions it can offer. Copilot Workspace (announced 2024) attempts to move beyond this constraint — but requires developers to leave their editor, which breaks the zero-friction principle that made Copilot successful.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Familiarity-first design limits innovation surface.</strong> Mapping to existing autocomplete mental models made adoption fast. It also means Copilot is constrained to where autocomplete already lives — inline in the editor, triggered by typing. More powerful workflows (multi-file refactoring, test generation from spec, architecture suggestions) require breaking the familiar model and introducing new interaction patterns. Every new pattern resets the trust curve.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">GitHub Copilot teaches the most important AI design lesson: trust is not a function of accuracy — it's a function of reversibility. Copilot is correct 43% of the time on the first suggestion. That would be unusable if rejection cost anything. Because rejection costs one keystroke, 43% accuracy is fine. The design question for every AI feature is not "how do we make it more accurate?" but "how do we make being wrong cheap?"</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design an AI coding assistant for developers at an Indian tech company"</div>
  <div class="ex-interview-answer">Copilot's four principles apply directly:
<br><br>• <strong>Ghost text, Tab to accept:</strong> Always suggest, never impose. Developer explicitly accepts every suggestion.
<br>• <strong>Map to existing mental model:</strong> If developers use VS Code, integrate as a VS Code extension — don't ask them to switch tools.
<br>• <strong>Stay in the workflow:</strong> Suggestions appear where code is being written — not in a sidebar, not in a separate tab.
<br>• <strong>India-specific consideration:</strong> Many Indian engineering teams work across multiple languages (Python for ML, Java for backend, React for frontend). Copilot's language-agnostic design is the correct approach — train on multilingual codebases, suggest in whatever language the developer is currently using.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you design an AI feature that sceptical users will adopt?"</div>
  <div class="ex-interview-answer">Copilot's adoption playbook — three steps:
<br><br>• <strong>Map to an existing trusted behaviour.</strong> Ghost text mapped to IDE autocomplete — already trusted by every developer. Users didn't need to learn new trust; they transferred existing trust. Ask: what behaviour does your target user already trust that your AI feature resembles?
<br>• <strong>Make failure cheap before launch.</strong> Define the worst-case failure mode. Make it reversible. Then make reversal trivially easy. Copilot: wrong suggestion → one Escape → nothing changed. Air Canada's chatbot: wrong policy → user makes irreversible booking decision. Design the failure mode first.
<br>• <strong>Don't ask users to change their workflow.</strong> Copilot lives in the editor the developer already uses. Every step away from the existing workflow is a trust barrier. AI should augment where users already are — not create new places they need to go.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the right level of AI autonomy for a product?"</div>
  <div class="ex-interview-answer">Copilot's answer: match autonomy to reversibility.
<br><br>• <strong>High autonomy is acceptable when failure is cheap and immediately visible.</strong> Ghost text: AI suggests a full function. Developer reads it. One Escape if wrong. High autonomy, cheap failure → acceptable.
<br>• <strong>Low autonomy is required when failure is expensive or irreversible.</strong> Air Canada chatbot giving policy advice: one wrong answer → user makes an irreversible financial decision. Should have had low autonomy — disclaimers, escalation, human review.
<br>• <strong>The autonomy question is always downstream of the reversibility question.</strong> Before deciding how much the AI should do, decide what happens when it's wrong and how easily that can be undone.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to design an AI feature for sceptical users, focus on improving accuracy — "make the AI better so users trust it more." Copilot's lesson is that this is the wrong lever. Two things wrong:
  <br><br>• <strong>Accuracy alone doesn't build trust — reversibility does.</strong> Copilot is correct 43% of the time on first suggestion. Users adopted it anyway because rejection costs one keystroke. A feature that's 90% accurate but applies suggestions automatically would feel worse — because when it's wrong, the user has to fix it. Trust is a function of the failure experience, not the success rate.
  <br><br>• <strong>New interaction models reset trust to zero.</strong> The fastest path to adoption is mapping to a behaviour users already trust. Ghost text mapped to existing autocomplete. Users didn't need to learn new trust — they transferred existing trust. Building a new interface (sidebar, chatbot, separate app) requires building trust from scratch, even if the AI is more capable.
</div>`,

    sources: [
      { id: 111, title: 'GitHub Copilot: Lessons in AI Product Design', url: 'https://www.builderlab.ai/p/github-copilot-lessons-in-ai-product-design' }
    ]
  }
},
{
  slug: 'attio-ai-cake-not-sprinkles',
  company: 'Attio',
  problem: 'AI as Core Architecture — Not a Feature',
  oneLiner: 'Attio built an AI-native CRM from scratch where AI is woven into the data model itself — not added on top of an existing CRM as a chatbot or button — arguing that legacy CRMs adding AI features are putting sprinkles on a cake that was baked wrong',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design', 'Strategy & Moats'],
  sections: {
    problem: `Salesforce, HubSpot, and every legacy CRM faced the same challenge when LLMs arrived: they had existing data models, existing schemas, existing architecture — all designed before AI existed. Their response was to add AI features on top: an AI assistant here, a summary button there, a chatbot in the sidebar.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Legacy CRM + AI sprinkles</div>
    Salesforce Einstein, HubSpot AI: AI features bolted onto an existing architecture. The data model stays the same — rigid objects, fixed fields, manual data entry. AI can summarise what's in those fields, but it can't change how data flows, can't automatically enrich records, can't eliminate the underlying manual work. The cake was baked without AI — the sprinkles are still just sprinkles.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Attio — AI baked into the cake</div>
    Built from scratch with AI in the foundation. The data model is flexible — no rigid templates, no fixed fields. AI Attributes let users define a column like "Find the Twitter profile of the founder" and the AI runs it across 10,000 records automatically. Every call is transcribed and synced. Records are enriched continuously without manual input. AI isn't a feature — it's the operating principle of how data moves through the system.
  </div>
</div>

The core problem Attio identified: legacy CRMs were built around manual data entry — humans inputting structured data into rigid schemas. AI is fundamentally incompatible with this model because AI's strongest capability is processing unstructured data (emails, calls, web data, documents) and turning it into structured insight. A CRM designed for manual structured input is the wrong substrate for AI to work on. You can add a chatbot to Salesforce — but the underlying data it reads from is still manually entered, incomplete, and stale.`,

    howSolved: `Attio rebuilt CRM architecture from scratch with three design principles: flexible data model, AI as a workflow step, and agents that work continuously rather than on-demand.

<strong>Principle 1 — Flexible data model (no rigid templates)</strong>
Legacy CRMs have fixed objects (Contact, Lead, Opportunity) with fixed fields. Attio uses a flexible schema: users define their own objects, relationships, and attributes. This matters for AI because AI can populate any attribute automatically — but only if the attribute can be defined freely. A fixed schema limits what AI can compute; a flexible schema lets AI become any data enrichment pipeline the user needs.

<strong>Principle 2 — AI Attributes: AI as a native column type</strong>
The most concrete expression of "AI as infrastructure." Instead of AI being a button you press, AI Attributes make AI a column type in your data model:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Example AI Attribute</div><div>What it does automatically</div><div>Old way</div>
  </div>
  <div class="ex-table-row">
    <div>"Find Twitter profile of founder"</div>
    <div>Runs web research across every company in your list, populates the column</div>
    <div>Hours of manual Google searching per record</div>
  </div>
  <div class="ex-table-row">
    <div>"Classify by ICP fit: High / Medium / Low"</div>
    <div>Evaluates each account against your ICP criteria, auto-categorises</div>
    <div>Sales rep manually scoring each account based on gut feel</div>
  </div>
  <div class="ex-table-row">
    <div>"Identify expansion opportunity"</div>
    <div>Analyses product usage patterns, flags accounts showing expansion signals</div>
    <div>CSM manually reviewing dashboards weekly</div>
  </div>
  <div class="ex-table-row">
    <div>"Summarise last 3 interactions"</div>
    <div>Reads email, call transcripts, meeting notes — generates a current status summary</div>
    <div>Account executive manually reading through notes before each call</div>
  </div>
</div>

<strong>Principle 3 — Agents woven into the platform, not personalised</strong>
Attio explicitly rejected the "personalised AI assistant" pattern (naming agents "Tom" or "Eva", giving them identities). Their reasoning: standalone AI assistants are limited by their separation from core business data. Attio's agents are embedded in the platform — they read and write to the same live CRM data, run in the background continuously, and trigger on data changes rather than on user prompts.

The contrast: HubSpot's AI assistant answers questions about your CRM. Attio's agents update your CRM automatically when conditions are met — no question required.

<strong>The "AI-native" architectural difference</strong>

<div class="ex-flow">
  <div class="ex-flow-step">New company added to Attio</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">AI Attributes run automatically: enriches with tech stack, funding, headcount, ICP score</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Call happens → transcribed and synced automatically</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Agent detects expansion signal → creates task for CSM with briefing</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">CSM opens record → context is already complete, no manual prep needed</div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Sales rep doing manual research</div>
  Spends 2 hours before a big prospect call: looking up company news, checking LinkedIn for new hires, reviewing past email threads, updating the CRM with notes from the last meeting. Failure mode with legacy CRM: all this work is manual, doesn't persist, and has to be repeated before every call. With Attio AI Attributes: company research is pre-populated automatically. Call is transcribed and synced. Rep walks into every call already briefed — no prep time.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — RevOps team maintaining data quality</div>
  Runs weekly audits to clean stale records, re-score leads, identify accounts that have gone dark. Failure mode: manual, time-consuming, always slightly behind. With Attio agents: ICP scoring runs continuously on new data. Accounts that haven't been contacted in 30 days are automatically flagged. Data quality is a background process, not a weekly sprint.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">130</div>
    <div class="ex-stat-label">Companies researched in seconds using AI Attributes — Twitter profiles, founder info, enrichment data</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">0</div>
    <div class="ex-stat-label">Manual data entry required for call transcription, enrichment, and ICP classification — fully automated</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Building from scratch means starting with zero legacy customers.</strong> Attio's architectural advantage requires rebuilding from the foundation — which means they couldn't upgrade Salesforce's 150,000+ customers, they had to win them from scratch. Legacy CRMs with large installed bases can afford to ship "good enough" AI features because switching costs are high. Attio has to be dramatically better to justify a migration — not just marginally better.</p>

<p style="margin-bottom:0.75rem;"><strong>B. AI Attributes introduce unpredictability into structured data.</strong> A column populated by AI is not as reliable as a column populated by a human entering a known fact. The Twitter profile finder works correctly most of the time — but sometimes it returns the wrong person, a stale link, or no result. Attio's flexible schema means users define their own attributes, which means the quality of AI output depends on how well the attribute is defined. Vague attribute definitions produce vague results.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Continuous background agents require careful trust design.</strong> An agent that automatically updates records, creates tasks, and triggers workflows is powerful but alarming to users who aren't sure what it's doing. Attio faces the same trust problem as GitHub Copilot — but harder, because agents act without being prompted. The design challenge: make agent actions visible, auditable, and reversible. An agent that creates a task incorrectly must be easy to identify and undo.</p>

<p style="margin-bottom:0.75rem;"><strong>D. "AI-native" is both a moat and a constraint.</strong> Being built from scratch for AI means Attio can't easily serve customers who need legacy integrations (old ERP systems, on-premise databases, compliance-heavy industries). The flexibility that makes AI powerful in Attio also makes it harder to enforce the rigid data structures that regulated industries require. The AI-native architecture is a moat against incumbents but a wall against certain enterprise segments.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Attio is the clearest production example of "AI as architecture vs. AI as feature." Every legacy CRM is adding AI features — summaries, assistants, chatbots. Attio's argument is that this is the wrong approach: if the underlying data model requires manual entry, AI can only summarise what humans already put in. The right substrate for AI is a flexible, continuously enriched data model where AI populates fields, not humans. This is what "AI-native" actually means — not "has AI features," but "AI is the operating principle of how data moves."</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you add AI to an existing product vs. build AI-native?"</div>
  <div class="ex-interview-answer">Attio's distinction is the answer:
<br><br><strong>Adding AI to existing product (sprinkles):</strong>
<br>• AI reads from existing data model — quality limited by what's already there
<br>• AI features are optional additions — users choose when to invoke them
<br>• Failure is isolated — AI feature fails, core product still works
<br>• Right for: products where AI is a convenience enhancement, not core value delivery
<br><br><strong>Building AI-native (cake):</strong>
<br>• Data model designed around AI enrichment from the start — flexible schema, AI as column type
<br>• AI runs continuously in the background — not invoked on demand
<br>• Failure has broader impact — AI quality directly affects core product quality
<br>• Right for: products where the core value proposition is AI-generated insight or automation
<br><br>The question for any AI PM: "Is AI how we deliver value, or is AI how we make an existing valuable thing faster?" The answer determines whether you retrofit or rebuild.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a CRM for Indian B2B SaaS companies (LeadSquared / Zoho alternative)"</div>
  <div class="ex-interview-answer">Attio's architecture applied to India:
<br><br><strong>AI Attributes for Indian B2B context:</strong>
<br>• "Find LinkedIn profile + designation" — Indian B2B contacts change jobs frequently; manual maintenance fails
<br>• "Classify by deal stage intent" — analyse last 3 WhatsApp/email threads, classify as hot/warm/cold
<br>• "Detect language preference" — identify if contact prefers Hindi or English communication based on past emails
<br><br><strong>Agent use cases specific to India:</strong>
<br>• Auto-detect follow-up gaps — Indian sales cycles have long gaps; agent flags accounts with no touch in 14 days
<br>• Festival/holiday context — agent notes upcoming Diwali, Eid, regional holidays and flags accounts for pre-holiday outreach
<br><br><strong>The Attio lesson for this design:</strong> Don't build a CRM with an AI assistant. Build a CRM where AI enriches every record automatically — Indian sales teams are small and overloaded; the biggest win is eliminating manual research, not adding a chatbot.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is a product moat and how would Attio defend against Salesforce adding better AI?"</div>
  <div class="ex-interview-answer">Attio's moat is architectural, not feature-based. Three layers:
<br><br>• <strong>Data model flexibility:</strong> Salesforce can't make its schema flexible without breaking 150,000 existing customers. Attio can because it was built flexible from day one. This isn't a feature — it's a structural constraint that Salesforce can't easily remove.
<br>• <strong>Data quality compound effect:</strong> Every day Attio runs, AI Attributes enrich records automatically. An Attio CRM 6 months old has dramatically richer data than a Salesforce CRM 6 months old — because Attio doesn't depend on humans to enter it. This compounds over time.
<br>• <strong>Migration cost of rich data:</strong> Once a company has 2 years of AI-enriched Attio records, migrating to Salesforce means losing that enrichment — Salesforce's rigid schema can't represent Attio's flexible AI attributes. The richer Attio's data gets, the harder it is to leave.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to add AI to a product, describe adding a chatbot or an AI summary button. Attio's lesson is that this is the lowest-value AI application pattern — and it's structurally limited by whatever data the existing product already has.
  <br><br>• <strong>AI features on bad data produce bad AI features.</strong> If your CRM has 40% complete records because sales reps don't fill in fields, an AI summary button summarises 40% complete records. The AI didn't fix the data problem — it inherited it. Attio's approach: AI populates the fields so humans don't have to. Fix the root cause, not the symptom.
  <br><br>• <strong>"We'll add AI later" is often not true.</strong> Adding AI meaningfully often requires rethinking the data model — what gets stored, how it's structured, how it flows. Retrofitting AI onto a rigid schema produces sprinkles. Products that want AI at their core need to ask the architectural question at the beginning: "What does our data model need to look like for AI to enrich it continuously?"
</div>`,

    sources: [
      { id: 112, title: 'Attio: AI as Architecture, Not a Feature', url: 'https://attio.com/blog/ai-and-the-next-generation-of-CRM' }
    ]
  }
},
{
  slug: 'google-search-moat',
  company: 'Google',
  problem: 'Search Moat in the AI Era',
  oneLiner: 'Google (90%+ search market share, 7 products with 2B+ users each) built a self-reinforcing moat from two interlocking circles — distribution and data — and used the AI era to deepen both rather than defend against disruption',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats'],
  sections: {
    problem: `When ChatGPT launched in late 2022, the universal narrative was "Google is finished." An AI that answers questions directly threatens a search engine that sends users to other websites. If users get answers without clicking links, Google's advertising model collapses.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">The threat as framed externally</div>
    ChatGPT answers questions directly. Users stop Googling. Google's search traffic falls. Advertisers follow users to wherever they go. Google's $200B+ ad business collapses. A startup with a better AI can take the market because search is "just" information retrieval.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">What actually happened</div>
    Google's search market share stayed above 89%. Gemini went from 350M to 750M MAUs in 9 months — not by being better than ChatGPT, but by being embedded in Android, Chrome, Gmail, and Workspace. Google's Q3 2024 revenue hit $88.3B, up 15% YoY. AI Overviews now serve 2B monthly interactions. The moat didn't just survive — it compounded.
  </div>
</div>

The external framing missed the actual structure of Google's advantage. Google was never just "a search engine." It was a two-circle system — distribution and data — where each circle makes the other stronger. Understanding this structure explains why a better AI model alone cannot displace Google, and why every new AI feature Google ships increases the moat rather than defending against it.`,

    howSolved: `Google's moat is structural, not technological. It consists of two interlocking circles that compound each other. The AI era accelerated both circles rather than threatening either.

<strong>The two circles</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Circle</div><div>What it is</div><div>Why it compounds</div>
  </div>
  <div class="ex-table-row">
    <div>Distribution</div>
    <div>7 products with 2B+ users each: Search, Android, Chrome, YouTube, Maps, Gmail, Google Photos. Plus $26B/year paid to Apple and Samsung for default search placement (covering ~50% of US searches).</div>
    <div>Distribution ensures AI reaches users without requiring them to find it. Gemini doesn't need to win a "best AI" competition — it's already in the search bar 4B people use daily.</div>
  </div>
  <div class="ex-table-row">
    <div>Data</div>
    <div>Every search query, YouTube watch, Maps navigation, Gmail, and Android interaction generates proprietary behavioural data. 13.7B searches processed daily. No competitor has access to this data.</div>
    <div>More data → better models → better products → more users → more data. The flywheel spins faster with every interaction.</div>
  </div>
</div>

<strong>How the two circles connect</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Distribution (Android, Chrome, default search) delivers billions of users</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Users generate proprietary query + behaviour data</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Data trains better models (Gemini, AI Overviews)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Better models improve product quality → users stay</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Distribution strengthens — advertisers follow users, funding more distribution deals</div>
</div>

<strong>How Google used AI to deepen both circles</strong>

<br>• <strong>AI Overviews</strong> — AI answers surfaced directly in Search results. Not a separate product — embedded in the default search experience 4B people already use. Users don't need to switch to ChatGPT; the same search bar now gives AI-quality answers. Every AI Overview interaction is also a data point that improves future answers.

<br>• <strong>Gemini embedded in distribution</strong> — Gemini didn't launch as a standalone app competing with ChatGPT on merit. It launched inside Android, Chrome, Gmail, and Workspace — products people already open dozens of times per day. 350M → 750M MAUs in 9 months is a distribution story, not a product quality story.

<br>• <strong>The Apple deal as moat infrastructure</strong> — Google pays Apple $18–20B/year to be the default search engine on iPhones. This covers 28% of all US searches. The DOJ antitrust case called this "the flywheel of monetisation" — ad revenue → distribution payments → query volume → data → better models → more ad revenue. Each element funds the next.

<br>• <strong>AI Overviews cannibalising publisher traffic deliberately</strong> — AI Overviews reduce click-through to publisher websites (46.7% CTR decline when an AIO is present). This looks harmful to the web ecosystem — and it is. But it's a calculated strategic move: Google is sacrificing traffic referrals to prevent users from switching to ChatGPT. Keep users in Google's ecosystem even if they get zero-click answers, rather than lose them entirely to a competitor.

<strong>The regulatory threat as the real vulnerability</strong>
The DOJ antitrust ruling found that Google's distribution contracts illegally maintain monopoly. If Google is forced to stop paying Apple for default placement, and if Android OEMs can no longer be required to default to Google Search, the distribution circle weakens significantly. This — not a better AI model — is the credible threat to Google's moat. The data circle remains intact; the distribution circle is legally vulnerable.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Habitual searcher</div>
  Uses Google 10 times per day by habit, default browser, default search. Failure mode for competitors: this user never actively chooses Google — they just open their browser and it's there. To switch them, a competitor needs to either (1) become the default (requires deals Google has locked up), or (2) be so dramatically better that the user actively changes their default. ChatGPT's growth came from users who actively sought it out — a small fraction of Google's habitual user base.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Advertiser</div>
  Spends $X on Google Search ads because that's where buyer intent lives. Failure mode for Google: if users leave Search for AI tools, advertiser spend follows. Google's response: embed AI in Search so users stay, then build new ad formats (Direct Offers in AI Mode) that monetise AI interactions. Same user, same advertiser, new format — the ad business survives the transition.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">7</div>
    <div class="ex-stat-label">Products with 2B+ users each — Search, Android, Chrome, YouTube, Maps, Gmail, Photos</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">$26B</div>
    <div class="ex-stat-label">Paid to Apple/Samsung/Mozilla annually for default search placement</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">750M</div>
    <div class="ex-stat-label">Gemini MAUs — up from 350M in 9 months, driven by distribution not product quality</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2B</div>
    <div class="ex-stat-label">Monthly AI Overview interactions — embedded in default Search, not a separate product</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">89%+</div>
    <div class="ex-stat-label">Search market share maintained through AI era — slight dip from 90%+ but moat held</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. AI Overviews cannibalise the publisher ecosystem Google depends on.</strong> If AI answers replace clicks to publisher websites, publishers produce less content. Less content means less to index. Less to index means Search quality degrades over time. Google is consuming the very ecosystem its index is built on. This is a slow-burning structural risk — not visible in quarterly earnings, but real over a 5-year horizon.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Distribution deals are legally vulnerable.</strong> The DOJ ruling found that Google's Apple and Android OEM deals illegally maintain monopoly. If forced to stop paying for default placement, Google loses the distribution circle's most powerful mechanism. The data circle remains — Google still has more user data than any competitor — but distribution becomes competitive rather than locked.</p>

<p style="margin-bottom:0.75rem;"><strong>C. The flywheel works against Google on vertical search.</strong> Google's generalist moat is strongest on broad queries. Vertical AI products (Perplexity for research, Harvey for legal, Otter for meetings) don't need to beat Google overall — they only need to be better for one specific query type. Users who shift 20% of their searches to vertical AI tools represent a meaningful revenue loss even if Google retains 80% market share.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Counter-positioning is the only viable startup strategy against Google.</strong> A startup that tries to build a better general search engine will fail — it cannot replicate Google's distribution deals or data flywheel. The viable strategies are: (1) vertical focus (be dramatically better for one query type), (2) counter-positioning (do what Google can't do because it would hurt their ad business — e.g., fully ad-free AI search), or (3) access a distribution channel Google doesn't own (Perplexity on Comet browser, Claude in enterprise tools).</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Google's moat is the most important case study in AI strategy because it shows that technology alone doesn't determine who wins. ChatGPT may have been a better product in 2022 — but Google had distribution that ChatGPT couldn't replicate. Gemini grew from 350M to 750M MAUs in 9 months not because it's better than ChatGPT, but because it's in the search bar 4 billion people open every day. Distribution beats capability when capability differences are marginal. This is the Google lesson.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you compete with Google Search?"</div>
  <div class="ex-interview-answer">You can't beat Google head-on. The two-circle moat (distribution + data) is structurally impossible to replicate from scratch. The viable strategies:
<br><br>• <strong>Vertical focus:</strong> Be dramatically better for one query type. Perplexity for research, Harvey for legal, Otter for meetings. Win the specific category before Google optimises for it.
<br>• <strong>Counter-positioning:</strong> Do what Google structurally can't. Fully ad-free AI search — Google can't offer this without destroying its business model. Privacy-first search (no tracking) — Google can't offer this without destroying its data circle.
<br>• <strong>New distribution:</strong> Find a distribution channel Google doesn't own. Enterprise software integrations, new devices (AR glasses, voice assistants), or platforms where Google's defaults don't apply.
<br><br>Indian context: Bharat (Tier 2/3 India) is increasingly accessing the internet via voice in Hindi, Tamil, Telugu. Google's data flywheel is weaker in regional languages. A voice-native, regional-language search built for Bharat could carve out a meaningful vertical before Google fully optimises for it.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is a moat and how do you build one?"</div>
  <div class="ex-interview-answer">Google is the canonical example. A moat is a structural advantage that makes it harder for competitors to take your market share over time — not a feature advantage that can be copied.
<br><br>Google's moat has two components that reinforce each other:
<br>• <strong>Distribution</strong> — being where users already are (Android, Chrome, default search). Distribution is a moat because it's locked by contracts (Apple deal), ecosystem inertia (Android OEMs), and habit.
<br>• <strong>Data flywheel</strong> — more users → more data → better models → better products → more users. Data is a moat because the flywheel compounds over time and can't be replicated without the user base.
<br><br>For an AI PM building a product: the question is not "what feature should we build?" but "which of these moat types can we build?" Distribution moat (be in the workflow), data flywheel (each user makes the product better for all users), or switching cost moat (Honeycomb — proprietary query language makes migration painful).</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the biggest risk to Google's business?"</div>
  <div class="ex-interview-answer">Not ChatGPT. The DOJ antitrust ruling.
<br><br>If Google is forced to stop paying Apple for default placement — $18–20B/year covering 28% of US searches — the distribution circle cracks. Users on iPhones would see a neutral search default prompt. Some percentage would choose Google. Some would choose Bing, Perplexity, or whatever Apple builds. Even a 10% share shift from Apple users would be a massive revenue event.
<br><br>The data circle would remain intact — Google still has decades of proprietary query data. But without distribution dominance, the flywheel slows. New entrants can accumulate data and close the gap.
<br><br>This is why the DOJ case matters more for Google's future than any AI competitor.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about Google's AI strategy, say "Google was slow to respond to ChatGPT and is now catching up." Two things wrong:
  <br><br>• <strong>Google wasn't slow — it was cautious about cannibalising its ad business.</strong> Google had LLM technology before ChatGPT launched (LaMDA was demonstrated in 2021). They didn't ship it because generative AI in Search threatened the click-based ad model. The "slowness" was a strategic choice, not a capability gap. Understanding this distinction matters — it shows you understand the moat structure, not just the product timeline.
  <br><br>• <strong>The battle is distribution, not model quality.</strong> Gemini grew to 750M MAUs not because it beat ChatGPT in head-to-head evals — it grew because it was embedded in Android, Chrome, and Gmail. Analysing Google's AI strategy through a "which model is better" lens completely misses the actual competitive dynamic. The model is table stakes. The distribution is the moat.
</div>`,

    sources: [
      { id: 9, title: 'Google\'s AI Strategy and Search Moat', url: 'https://www.newsletter.justanotherpm.com/p/googles-ai-strategy' },
      { id: 10, title: 'How Google Defended Its Search Moat', url: 'https://www.newsletter.justanotherpm.com/p/how-google-defended-its-search-moat' }
    ]
  }
},
{
  slug: 'openai-competitive-strategy',
  company: 'OpenAI',
  problem: 'Competitive Strategy — Building Moats Without Distribution',
  oneLiner: 'OpenAI ($12B ARR, 700M weekly users) built the most recognised AI brand in history without owning any distribution infrastructure — relying instead on consumer mindshare, developer ecosystem lock-in, and model velocity to stay ahead as capability gaps narrow',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats'],
  sections: {
    problem: `OpenAI's strategic position is uniquely precarious: it is the world's most valuable AI company but owns no distribution infrastructure. Google has Android and Chrome. Apple has iOS. Microsoft has Office and Windows. OpenAI has ChatGPT — a standalone app that users must consciously choose to open.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">OpenAI's original moat — model quality</div>
    GPT-3 and GPT-4 were so far ahead of alternatives that "use OpenAI" was the obvious default for any AI application. The model quality gap itself was the moat. Enterprises used the API. Developers built on it. Consumers paid for ChatGPT Plus. The technology advantage justified premium pricing and created switching costs.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">OpenAI's current reality — narrowing gaps</div>
    By 2024, Google's Gemini, Anthropic's Claude, and Meta's Llama had closed much of the capability gap. Open-source models like Llama were "faster, more customisable, more private, and pound-for-pound more capable" for many use cases. The model quality moat was breached. OpenAI now competes on brand, ecosystem, and distribution gravity — not just capability.
  </div>
</div>

The core strategic problem: OpenAI cannot do what Google does. It can't make ChatGPT the default on Android or embed it in Chrome. Every new user requires a conscious adoption decision. This is structurally expensive — OpenAI was losing $5B in 2024 on $3.7B in revenue, partly because customer acquisition without distribution requires constant product innovation and marketing spend. The question isn't whether OpenAI built something remarkable — it did. The question is what sustains the lead when remarkable becomes normal.`,

    howSolved: `OpenAI is building four interlocking moats to replace the eroding model quality advantage. None alone is sufficient; together they create a platform dynamic that's harder to displace than any individual model.

<strong>Moat 1 — Consumer mindshare (brand as distribution)</strong>
ChatGPT reached 100M users in 2 months — the fastest consumer app in history at the time. It created a cultural moment comparable to the first iPhone or first Google search. "ChatGPT" became synonymous with AI the way "Google" became synonymous with search.
<br>• 700M weekly active users as of 2026
<br>• 23% of US adults had used it by February 2024
<br>• 60% of college students use it regularly
<br>• 79% of software developers have tried it
<br><br>Brand as distribution: users who think "AI" think "ChatGPT" and go there first. This is softer than Google's structural distribution but creates real gravitational pull — especially for casual users who won't evaluate alternatives.

<strong>Moat 2 — Developer ecosystem lock-in</strong>
The OpenAI API became the default building block for AI applications. Companies like Cursor, Clay, and Decagon built their entire businesses on OpenAI's foundation models. This creates switching costs that compound over time:
<br>• Fine-tuned models are specific to OpenAI's API format
<br>• Prompt libraries are optimised for specific model behaviours
<br>• Integrated workflows assume OpenAI's latency, pricing, and output format
<br>• Engineering teams know OpenAI's idiosyncrasies — migrating requires relearning
<br><br>92% of Fortune 500 companies use OpenAI products. Enterprise switching costs are not just technical — they're organisational. A company that has trained 500 employees on ChatGPT Enterprise doesn't switch to an alternative casually.

<strong>Moat 3 — Model velocity</strong>
OpenAI maintains a release cadence that forces competitors to react rather than lead. GPT-4 → GPT-4 Turbo → GPT-4o → o1 → o3 → GPT-5. Each release resets the quality comparison and gives media and developers a reason to return to OpenAI's narrative.
<br>• The o-series (reasoning models) created a new capability category that others scrambled to match
<br>• Consistent release velocity maintains "latest and greatest" positioning even when specific benchmarks are contested
<br>• First-mover advantage on new capability categories (image generation with DALL-E, video with Sora, voice with Advanced Voice Mode)

<strong>Moat 4 — Platform strategy (ChatGPT as funnel)</strong>
ChatGPT serves dual purposes: consumer product AND developer funnel. A user who starts with the free ChatGPT consumer product is exposed to capabilities that then pull them toward the API or Enterprise tier.

<div class="ex-flow">
  <div class="ex-flow-step">Consumer uses ChatGPT free tier</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Upgrades to ChatGPT Plus ($20/month) for better models</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Developer builds a product using OpenAI API</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Company adopts ChatGPT Enterprise for the team</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Fine-tuned models create switching costs that compound</div>
</div>

<strong>The Microsoft strategic alliance — borrowed distribution</strong>
OpenAI doesn't own distribution but borrows it through Microsoft. Azure provides global infrastructure. Office 365 Copilot embeds OpenAI models in the tools 300M+ enterprise users open daily. Microsoft captures ~20% of OpenAI's revenue through the arrangement. This gives OpenAI enterprise distribution it couldn't build itself — but with dependency risk: if Microsoft builds its own competing models (which it has started doing), the arrangement weakens.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Enterprise AI buyer</div>
  Evaluating AI vendors for a company-wide deployment. Failure mode without OpenAI's ecosystem moat: evaluates Claude, Gemini, and GPT-4 on benchmark scores, picks "best" model, switches every 6 months as models improve. OpenAI's response: create switching costs through fine-tuned models, custom GPTs, and enterprise workflow integrations. The more deeply a company builds on OpenAI's infrastructure, the more expensive switching becomes — regardless of whether a competing model scores higher on benchmarks.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Developer building an AI product</div>
  Needs to pick an AI provider to build on. Failure mode for OpenAI: developer picks Anthropic or an open-source model because it's cheaper or more flexible. OpenAI's response: developer tooling, fine-tuning, the GPT store, and an established community of tutorials and examples make OpenAI the path of least resistance for most developers. The ecosystem compounds — more developers on OpenAI means more tutorials, more StackOverflow answers, more community knowledge, which attracts more developers.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">$12B</div>
    <div class="ex-stat-label">ARR in 2025 — up from $3.7B in 2024, 2-year CAGR of ~182%</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">700M</div>
    <div class="ex-stat-label">Weekly active users on ChatGPT as of 2026</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">92%</div>
    <div class="ex-stat-label">Of Fortune 500 companies use OpenAI products</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">$5B</div>
    <div class="ex-stat-label">Net loss in 2024 on $3.7B revenue — the cost of building without owned distribution</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2 months</div>
    <div class="ex-stat-label">To reach 100M users — fastest consumer app in history at the time</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. No owned distribution means permanent customer acquisition cost.</strong> Google deploys Gemini to 4B users for free by being the default search engine. OpenAI spends $5B+ per year partly because every new user requires marketing, product investment, and compute spend without the structural advantage of being the default anything. As model quality gaps narrow, OpenAI's cost to retain users grows relative to companies that own distribution.</p>

<p style="margin-bottom:0.75rem;"><strong>B. The Microsoft dependency is a strategic risk.</strong> OpenAI borrowed enterprise distribution through Microsoft but gave up 20% of revenue and created a dependency. Microsoft has started building its own models (Phi series) and has full access to OpenAI's technology through the partnership. If Microsoft decides to go independent — or builds models good enough to serve most enterprise use cases — OpenAI loses its primary enterprise distribution channel.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Model velocity is expensive and unsustainable as the only differentiation.</strong> Releasing a new frontier model every 6 months requires billions in compute. If the release maintains the quality lead, the strategy works. If a competitor (Google, Anthropic, Meta) closes the gap before the next release, OpenAI's primary differentiation temporarily disappears. The strategy requires continuous massive capital investment with no guarantee of sustained quality leadership.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Open-source is a structural threat to the API moat.</strong> Meta's Llama series demonstrated that near-frontier model quality is achievable open-source. Enterprises that build on Llama instead of OpenAI's API have no switching costs — they own the weights. As open-source quality improves, OpenAI's developer ecosystem moat depends increasingly on tooling, fine-tuning infrastructure, and community — not just model quality.</p>

<p style="margin-bottom:0.75rem;"><strong>E. Brand synonymity cuts both ways.</strong> "ChatGPT" synonymous with AI means OpenAI benefits from any positive AI news. It also means OpenAI takes reputational damage from any AI failure or safety controversy — whether their own or a competitor's. Being the face of AI creates asymmetric accountability.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">OpenAI is the most important AI strategy case study because it shows what happens when you build the most successful AI product in history without owning any distribution infrastructure. The comparison with Google is clarifying: Google has Android, Chrome, and default search contracts covering 50% of US queries. OpenAI has brand. Both are valuable — but brand requires constant investment to maintain, while structural distribution compounds automatically. Understanding this gap explains both OpenAI's growth trajectory and its $5B annual losses.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is OpenAI's competitive moat?"</div>
  <div class="ex-interview-answer">Four layers — from strongest to most vulnerable:
<br><br>• <strong>Consumer mindshare (strongest):</strong> "ChatGPT" = AI. This brand association took 2 months and 100M users to build and can't be replicated quickly. It creates gravitational pull for casual users.
<br>• <strong>Developer ecosystem:</strong> 92% of Fortune 500 using OpenAI products, hundreds of thousands of apps built on OpenAI API. Switching costs compound as fine-tuning and workflow integration deepen.
<br>• <strong>Model velocity:</strong> Consistent first-mover on new capability categories (o1 reasoning, Sora video, Advanced Voice). Resets quality comparison periodically.
<br>• <strong>Microsoft alliance (most vulnerable):</strong> Borrowed enterprise distribution. Dependency risk if Microsoft builds competing models or exercises pricing leverage.
<br><br>The weakest layer: actual model quality superiority. This gap has narrowed significantly. The moat is now about ecosystem and brand, not model benchmarks.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design an AI product strategy for an Indian startup competing with global AI platforms?"</div>
  <div class="ex-interview-answer">OpenAI's strategy inverted for an Indian context:
<br><br>• <strong>Don't compete on general capability.</strong> You can't out-OpenAI OpenAI on general intelligence. Pick a vertical where Indian context is the moat — legal (Indian law is complex and local), healthcare (ABHA, Ayushman Bharat compliance), or financial services (SEBI regulations, tax law).
<br>• <strong>Find distribution OpenAI doesn't own.</strong> WhatsApp has 500M+ Indian users. ONDC has millions of small merchants. Aadhaar-linked services touch 1.4B citizens. These are distribution channels that OpenAI has no presence in and can't easily enter.
<br>• <strong>Build the data flywheel for Indian languages.</strong> OpenAI's models are weakest on Hindi, Tamil, Telugu, Bengali at the regional nuance level. Training on Indian vernacular data — job postings, court documents, medical records, agricultural advisory — creates a data moat that a US company can't replicate without being in the market.
<br>• <strong>The Krutrim / Sarvam playbook:</strong> Solve for Bharat's specific needs (voice-first, low-bandwidth, multilingual) before OpenAI optimises for them. Be so far ahead on the specific use case that GPT-5 being "better" in English benchmarks is irrelevant.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you think about building moats in AI when model quality keeps changing?"</div>
  <div class="ex-interview-answer">OpenAI's predicament is the answer. Model quality moats are temporary — they erode as open-source and competitors catch up. The durable moats in AI are:
<br><br>• <strong>Distribution</strong> — being where users already are (Google's Android/Chrome, Microsoft's Office). Almost impossible to replicate without a platform.
<br>• <strong>Data flywheel</strong> — more users generating proprietary data that improves your model in ways competitors can't replicate. Works when your data is truly proprietary (search queries, medical records, legal documents).
<br>• <strong>Switching costs</strong> — fine-tuned models, integrated workflows, trained employees. Grows over time as customers invest in your ecosystem.
<br>• <strong>Brand/category ownership</strong> — OpenAI's current strongest asset. "ChatGPT" as the default mental model for AI. Harder to build than distribution, easier to erode if quality gaps open.
<br><br>The PM implication: don't build a roadmap that assumes your model will always be the best. Build switching costs and distribution from day one.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe OpenAI's competitive strategy as "they have the best models." Two things wrong:
  <br><br>• <strong>Model quality is no longer the moat — it's table stakes.</strong> By 2024, Google's Gemini and Anthropic's Claude had closed most meaningful capability gaps for real-world use cases. A leaked Google memo said it plainly in 2023: "We have no moat, and neither does OpenAI." Candidates who lead with "best models" are describing a moat that has already been partially breached.
  <br><br>• <strong>The real moat is ecosystem and brand — and both require constant investment.</strong> OpenAI loses $5B/year partly because maintaining these moats without owned distribution requires constant product innovation, marketing, and compute spend. Google's moat compounds for free through Android and Chrome. OpenAI's moat requires active maintenance. Understanding this cost structure is what separates a surface-level answer from a strategic one.
</div>`,

    sources: [
      { id: 15, title: 'OpenAI Competitive Strategy and Moat Analysis', url: 'https://www.newsletter.justanotherpm.com/p/openai-strategy' },
      { id: 16, title: 'The AI Race: OpenAI vs Google vs Anthropic', url: 'https://www.newsletter.justanotherpm.com/p/ai-race-openai-google-anthropic' }
    ]
  }
},
{
  slug: 'apple-on-device-ai-strategy',
  company: 'Apple',
  problem: 'On-Device AI Strategy — Privacy as Competitive Moat',
  oneLiner: 'Apple (2.2B active devices) chose not to build a chatbot — instead embedding a 3B parameter on-device AI model in every iPhone that processes personal data locally, using privacy as the product differentiator in a market where every competitor sends data to the cloud',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats', 'AI Design'],
  sections: {
    problem: `When every major tech company was racing to ship the most capable AI chatbot, Apple did something strategically different: it deliberately didn't build one.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Everyone else's approach — cloud-first AI</div>
    OpenAI, Google, Microsoft: AI runs on massive cloud servers. User data (messages, emails, photos, voice queries) travels to data centres to be processed. More capable models, better answers — but every interaction is a data transfer. The user's personal context lives on someone else's servers.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Apple's approach — on-device first</div>
    A 3 billion parameter language model runs directly on the iPhone's Neural Engine. Most AI tasks — text summarisation, writing suggestions, photo analysis, Siri requests — never leave the device. When cloud processing is genuinely needed, Apple's Private Cloud Compute extends device-level security to the server. ChatGPT is available as a last-resort option, always requiring explicit user permission.
  </div>
</div>

Apple's strategic logic: privacy is not a constraint on their AI — it's the product. Every competitor's AI requires trusting a third party with your most personal data. Apple's AI is designed to require no such trust. This is counter-positioning: Apple is doing something its competitors structurally cannot do without rebuilding their entire business model around on-device processing rather than cloud monetisation.`,

    howSolved: `Apple built a three-tier AI architecture — on-device first, private cloud second, third-party last — and backed it with silicon investment that started a decade before the AI era.

<strong>The three-tier architecture</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Tier</div><div>What runs here</div><div>Privacy guarantee</div>
  </div>
  <div class="ex-table-row">
    <div>On-device (default)</div>
    <div>3B parameter model on Neural Engine. Text summarisation, writing tools, photo analysis, most Siri requests, Face ID, health data insights.</div>
    <div>Data never leaves the device. Apple cannot see it. No network required.</div>
  </div>
  <div class="ex-table-row">
    <div>Private Cloud Compute (PCC)</div>
    <div>Complex requests exceeding on-device capability. Runs on Apple Silicon servers.</div>
    <div>Data processed and immediately deleted. Servers don't retain personal information. Cryptographically verifiable — Apple can't see it even in the cloud.</div>
  </div>
  <div class="ex-table-row">
    <div>ChatGPT (last resort)</div>
    <div>Queries explicitly routed by the user to ChatGPT for broader knowledge tasks.</div>
    <div>Always requires explicit user permission. Never automatic. OpenAI's privacy policy applies when used.</div>
  </div>
</div>

<strong>Why Apple can do this — the silicon moat</strong>
Apple introduced the Neural Engine with the A11 Bionic chip in 2017 — seven years before Apple Intelligence launched. The A18 Pro (iPhone 16 Pro) features a 16-core Neural Engine capable of 35 trillion operations per second specifically for AI tasks. This hardware investment is the prerequisite for on-device AI at a useful capability level.

<br>• <strong>M-series chips (Mac/iPad):</strong> Even more powerful Neural Engines that can run larger models on-device
<br>• <strong>Core ML framework:</strong> Developer toolkit for building privacy-preserving AI apps using Apple's on-device infrastructure
<br>• <strong>Differential privacy:</strong> Apple learns from collective user behaviour without accessing individual data — statistical patterns extracted, personal data never transmitted

No other company has this hardware-software-privacy stack built and deployed at scale. Google could build on-device AI — but it would require cannibalising the cloud data collection that funds its advertising business. OpenAI has no device hardware. Microsoft has Windows devices but no custom AI silicon.

<strong>What Apple Intelligence actually does — invisible AI, not a chatbot</strong>
Apple explicitly avoided building a chatbot as the primary AI interface. Instead:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Feature</div><div>What it does</div><div>Where it runs</div>
  </div>
  <div class="ex-table-row">
    <div>Writing Tools</div>
    <div>Rewrite, proofread, summarise text in any app system-wide</div>
    <div>On-device</div>
  </div>
  <div class="ex-table-row">
    <div>Photo cleanup / generation</div>
    <div>Remove objects, generate images in Messages</div>
    <div>On-device</div>
  </div>
  <div class="ex-table-row">
    <div>Smart Reply / Mail summaries</div>
    <div>Suggests email replies, summarises long email threads</div>
    <div>On-device — reads your emails without Apple seeing them</div>
  </div>
  <div class="ex-table-row">
    <div>Priority notifications</div>
    <div>Surfaces the most important notifications based on your context</div>
    <div>On-device — reads your notifications without Apple seeing them</div>
  </div>
  <div class="ex-table-row">
    <div>Siri with personal context</div>
    <div>Siri that knows your calendar, contacts, messages, emails — and can act across apps</div>
    <div>On-device for personal context; PCC for complex queries</div>
  </div>
</div>

<strong>The platform strategy — AI APIs for developers</strong>
Apple encourages third-party developers to use Apple's on-device AI APIs rather than embedding their own cloud models. This creates a platform dynamic: developers who build on Core ML and Apple Intelligence APIs get privacy, performance, and maintenance for free. Those who bypass Apple's stack take on the cost and liability of managing their own AI infrastructure. Apple extends its ecosystem gravity by making privacy-preserving AI the easiest path for developers.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Privacy-conscious consumer</div>
  Uses iPhone for sensitive personal communications — medical discussions, financial messages, confidential work emails. Failure mode with cloud AI: using any AI assistant means sending this content to a third-party server. Many users simply don't use AI assistants for sensitive tasks. With Apple Intelligence: AI reads and summarises these messages on-device. The user gets AI capabilities on their most sensitive data without trusting a third party.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Enterprise / regulated industry user</div>
  Works in healthcare, legal, or finance where data leaving the device creates compliance risk. Failure mode: HIPAA, GDPR, or client confidentiality requirements prohibit using ChatGPT or Gemini for work tasks — AI tools are blocked or restricted. With Apple Intelligence on-device: the data never leaves the device, so compliance concerns don't apply in the same way. AI features become available to users in regulated industries for the first time.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Low-connectivity user</div>
  Lives in an area with unreliable internet or has limited mobile data. Failure mode with cloud AI: AI features require network connectivity — unavailable or expensive to use. With on-device Apple Intelligence: core AI features work offline. Writing Tools, Photo cleanup, Smart Reply all work without any internet connection.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">3B</div>
    <div class="ex-stat-label">Parameter on-device language model running on Apple Neural Engine in every supported iPhone</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">35T</div>
    <div class="ex-stat-label">Operations per second — A18 Pro Neural Engine for AI tasks</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2.2B</div>
    <div class="ex-stat-label">Active Apple devices — the distribution platform for on-device AI at scale</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2017</div>
    <div class="ex-stat-label">Year Neural Engine first shipped in iPhone (A11 Bionic) — 7 years before Apple Intelligence launched</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">20+</div>
    <div class="ex-stat-label">New Apple Intelligence features shipped in iOS 26</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. On-device capability ceiling is real.</strong> A 3B parameter model running on a phone is significantly less capable than GPT-4 or Gemini Ultra running in the cloud. Apple Intelligence can summarise an email — it cannot write a research paper, analyse a complex legal document, or answer multi-step reasoning questions with the same quality as frontier cloud models. Apple accepts this tradeoff deliberately: solve the 80% of everyday tasks well on-device, escalate to PCC or ChatGPT for the 20% that genuinely needs more power.</p>

<p style="margin-bottom:0.75rem;"><strong>B. The hardware requirement creates a fragmentation problem.</strong> Apple Intelligence requires A17 Pro or newer (iPhone 15 Pro+) or M-series chips. Older iPhones don't have sufficient Neural Engine capability. This means a significant portion of the iPhone installed base can't use Apple Intelligence at all. Unlike software features that roll out to all supported devices, on-device AI is gated by hardware capability — creating a two-tier user experience.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Privacy as positioning is hard to prove.</strong> Apple's claim that on-device data never leaves the device is a technical truth — but users have limited ability to verify it. Privacy is an experience-invisible benefit: users benefit from it but can't feel it working. This makes it harder to market than a feature like "better photos" or "longer battery life." Apple's privacy marketing works partly because of trust built over decades — it wouldn't work for a new entrant making the same claims.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Counter-positioning requires Apple to not compete on chatbot capability.</strong> Apple's strategy works precisely because it's different from OpenAI and Google. If Apple builds a frontier chatbot to compete on capability benchmarks, it loses the positioning advantage — it becomes "a worse ChatGPT with privacy" rather than "a fundamentally different approach to AI." Staying on-device means accepting capability limitations as a strategic choice, not a temporary gap to close.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Apple's AI strategy is the clearest example of counter-positioning in the AI era. Every competitor built AI that requires sending your data to the cloud. Apple built AI that doesn't. This isn't a capability gap — it's a deliberate strategic choice backed by 7 years of Neural Engine investment. Apple can do this because it owns the hardware. Google, OpenAI, and Microsoft can't match it without rebuilding their entire infrastructure and revenue model. Privacy as product, not feature.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design an AI feature for a healthcare / fintech app in India?"</div>
  <div class="ex-interview-answer">Apple's on-device model is the reference architecture for any regulated industry.
<br><br><strong>Apply the three-tier model:</strong>
<br>• <strong>On-device tier:</strong> Patient data summarisation, drug interaction checks, form auto-fill from medical history — process locally on the user's device. Data never leaves. No DPDP (India's data protection law) concern.
<br>• <strong>Private compute tier:</strong> Complex diagnostic assistance that needs more compute — send to a secure server with immediate deletion post-processing. Audit log maintained.
<br>• <strong>Third-party tier:</strong> Only for non-sensitive queries, always with explicit user consent.
<br><br><strong>India-specific consideration:</strong> ABDM (Ayushman Bharat Digital Mission) health records are highly sensitive. An AI health assistant that processes ABHA records on-device — never sending patient data to a cloud server — would be the only viable approach for broad adoption across India's privacy-conscious and connectivity-challenged user base.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is counter-positioning as a moat and how does Apple use it?"</div>
  <div class="ex-interview-answer">Counter-positioning: doing something incumbents can't copy because it would hurt their core business.
<br><br>Apple's counter-position against Google and OpenAI:
<br>• <strong>Google can't build privacy-first AI</strong> without undermining the data collection that funds its $200B+ ad business. Every piece of data that stays on-device is a piece of data Google can't use for targeting.
<br>• <strong>OpenAI can't build on-device AI</strong> — it has no device hardware, no Neural Engine, no silicon roadmap. Building on-device capability would require a decade of hardware investment OpenAI hasn't made.
<br>• <strong>Microsoft has devices but no custom AI silicon.</strong> Windows runs on diverse hardware; Apple controls the full stack.
<br><br>The counter-positioning insight: Apple's privacy advantage isn't just a feature — it's architecturally impossible for Google to match without destroying its business model. That's a durable moat.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you decide whether to build AI on-device vs. in the cloud?"</div>
  <div class="ex-interview-answer">Apple's framework — three questions:
<br><br>• <strong>How sensitive is the data?</strong> Messages, emails, health records, financial data → on-device if possible. Public queries, general knowledge → cloud acceptable.
<br>• <strong>How much compute does the task need?</strong> Summarisation, suggestions, classification → 3B parameter model sufficient. Complex reasoning, long-context analysis → may need cloud.
<br>• <strong>What is the connectivity context?</strong> Mobile users, emerging markets, healthcare settings → on-device for reliability. Power users with reliable internet → cloud acceptable.
<br><br>Apple's decision: on-device for the 80% of everyday personal tasks. Cloud (PCC) for the 20% requiring more compute. Third-party only with explicit consent. The framework maps directly to any product decision about data sensitivity, compute requirements, and user context.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe Apple's AI strategy as "they were late to AI and are catching up." Two things wrong:
  <br><br>• <strong>Apple wasn't late — it was patient.</strong> The Neural Engine shipped in 2017. Core ML shipped in 2017. Apple spent 7 years building the hardware foundation for on-device AI before revealing the strategy publicly. "Late" assumes the goal was to ship a chatbot. The goal was on-device privacy-preserving AI — which requires silicon Apple spent years developing.
  <br><br>• <strong>Apple is not competing on the same dimension as OpenAI and Google.</strong> Comparing Apple Intelligence to ChatGPT on capability benchmarks misses the strategic point entirely. Apple is counter-positioning — it's doing something competitors can't match without rebuilding their business model. The right comparison is not "which AI is smarter?" but "which AI can I trust with my most sensitive personal data?" Apple's answer to that question is structurally differentiated in a way that no competitor can easily close.
</div>`,

    sources: [
      { id: 22, title: 'Apple Intelligence: The On-Device AI Strategy', url: 'https://www.newsletter.justanotherpm.com/p/apple-intelligence-on-device-ai-strategy' }
    ]
  }
},
{
  slug: 'nvidia-cuda-nvlink-moat',
  company: 'Nvidia',
  problem: 'CUDA + NVLink Moat — AI Infrastructure Dominance',
  oneLiner: 'Nvidia ($130B+ revenue run rate, 80%+ AI GPU market share) built an unassailable infrastructure moat from two interlocking advantages — CUDA software ecosystem (20 years of developer lock-in) and NVLink hardware (the only way to connect thousands of GPUs into one virtual supercomputer at scale)',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats'],
  sections: {
    problem: `Before ChatGPT, Nvidia was a successful graphics chip company whose GPUs happened to be useful for AI research. After ChatGPT, Nvidia became the most critical bottleneck in the global economy — every AI model, every AI company, every hyperscaler needed Nvidia GPUs, and there weren't enough.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Pre-ChatGPT — GPU as commodity</div>
    GPUs were chips for gaming and some ML research. AMD competed on price. Intel had its own AI chip ambitions. The assumption: GPU hardware is a commodity that will commoditise like every other semiconductor. Better chip design = temporary advantage until competitors catch up. Nvidia was valuable but not irreplaceable.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Post-ChatGPT — Nvidia as infrastructure monopoly</div>
    Training GPT-4 required tens of thousands of Nvidia H100s connected via NVLink. No other chip could do this at scale — not because of raw performance alone, but because CUDA, the software layer every AI model is written in, only runs on Nvidia hardware. Switching to AMD or custom silicon required rewriting years of optimised code. The moat wasn't the chip — it was the ecosystem built around the chip over 20 years.
  </div>
</div>

The strategic question everyone missed: why couldn't AWS, Google, or AMD just build a better chip and take the market? The answer is that the moat isn't the hardware. AMD's MI300X has competitive raw performance on many benchmarks. The moat is CUDA — 20 years of developer tools, libraries, and optimisations that only work on Nvidia GPUs. Switching is not a hardware purchase decision — it's a software rewrite decision. And for most AI teams, rewriting years of CUDA-optimised training code is not worth the savings from cheaper chips.`,

    howSolved: `Nvidia's dominance comes from two interlocking moats that compound each other. Neither alone is sufficient — together they create a switching cost that has survived multiple generations of competitive pressure.

<strong>Moat 1 — CUDA: The software that locks you in</strong>
CUDA (Compute Unified Device Architecture) launched in 2006 — 16 years before ChatGPT. It was a programming model that let developers write general-purpose code to run on Nvidia GPUs. At launch, the use case was scientific computing. The strategic implication wasn't obvious until AI arrived.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>What CUDA is</div><div>Why it creates lock-in</div>
  </div>
  <div class="ex-table-row">
    <div>A programming language and runtime for Nvidia GPUs</div>
    <div>Every AI framework (PyTorch, TensorFlow, JAX) runs on CUDA. Every researcher writing AI code writes CUDA-compatible code — even if they never touch CUDA directly.</div>
  </div>
  <div class="ex-table-row">
    <div>20,000+ libraries and developer tools built over 20 years</div>
    <div>cuDNN (deep learning), cuBLAS (linear algebra), NCCL (multi-GPU communication) — each library is years of optimisation. Equivalent AMD libraries exist but are less optimised and less battle-tested.</div>
  </div>
  <div class="ex-table-row">
    <div>Only runs on Nvidia hardware</div>
    <div>All the CUDA code, all the optimised libraries, all the researcher knowledge — none of it transfers to AMD or custom silicon. Switching means starting over on the software stack.</div>
  </div>
</div>

The CUDA moat compounds through the developer community. Every AI researcher trains on CUDA. Every tutorial is written for CUDA. Every bug is fixed in a CUDA context. The community knowledge itself is locked to Nvidia hardware — and community knowledge is worth as much as the software itself.

<strong>Moat 2 — NVLink: The hardware that enables scale</strong>
NVLink is Nvidia's proprietary high-speed interconnect — the technology that allows thousands of GPUs to communicate with each other as if they were one large virtual GPU.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>What NVLink does</div><div>Why it matters</div>
  </div>
  <div class="ex-table-row">
    <div>Connects GPUs at 900 GB/s bandwidth (NVLink 4.0)</div>
    <div>Training large models requires GPUs to constantly share intermediate calculations. Slow interconnect = GPUs waiting for each other = wasted compute. NVLink eliminates this bottleneck.</div>
  </div>
  <div class="ex-table-row">
    <div>Enables NVMe clusters (8 GPUs → 72 GPUs → thousands)</div>
    <div>GPT-4 training required ~25,000 A100s working in synchrony. NVLink makes this possible. PCIe (the standard alternative) has 1/5th the bandwidth — the cluster would be 5x slower.</div>
  </div>
  <div class="ex-table-row">
    <div>Proprietary — doesn't connect non-Nvidia GPUs</div>
    <div>A cluster that's 80% Nvidia + 20% AMD can't use NVLink for the AMD portion. Mixed clusters are dramatically less efficient. The interconnect itself enforces homogeneity.</div>
  </div>
</div>

DeepSeek's H800 training illustrates the NVLink constraint in reverse: H800s are H100s with memory bandwidth restricted by US export controls. DeepSeek spent enormous engineering effort (20 of 132 processing units per chip dedicated to cross-chip communication management) specifically to compensate for the degraded interconnect. The bandwidth constraint drove their entire architectural innovation — Flash Attention, MoE architecture, multi-token prediction. They innovated around the limitation because the limitation was the NVLink moat expressed through its absence.

<strong>The two moats working together</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Developer writes AI code in PyTorch (built on CUDA)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Training requires scale → needs NVLink cluster to be efficient</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">NVLink cluster only works with Nvidia GPUs</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Switching to AMD requires rewriting CUDA code AND losing NVLink efficiency</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Developer stays on Nvidia → generates more CUDA optimisations → moat deepens</div>
</div>

<strong>Nvidia's NIM strategy — extending the software moat into inference</strong>
As training spend stabilises and inference spend grows, Nvidia launched NIM (Nvidia Inference Microservices) — pre-optimised model packages that run exclusively on Nvidia GPUs. The strategic logic: even if customers eventually migrate training to custom silicon (Google TPUs, AWS Trainium), Nvidia wants to lock in the inference layer too. NIMs make deploying models on Nvidia hardware trivially easy — and deploying on anything else comparatively hard.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — AI researcher / ML engineer</div>
  Writes PyTorch code for model training. Has 5 years of CUDA-optimised code. Failure mode of switching: every CUDA kernel, every custom optimisation, every library dependency must be rewritten or replaced for AMD ROCm or custom silicon. Estimated switching cost for a large AI team: 6–18 months of engineering work. The chip savings don't justify the switching cost — Nvidia's price premium is real but smaller than the rewrite cost.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Hyperscaler building AI infrastructure (AWS, Azure, Google)</div>
  Needs to train frontier models at scale. Failure mode of non-Nvidia: building a 10,000-GPU cluster with AMD MI300X requires either using PCIe interconnect (5x slower bandwidth than NVLink) or building a proprietary interconnect (years of engineering, billions in investment). Google has TPUs with their own interconnect — but training on TPUs requires rewriting code for a completely different architecture. Amazon's Trainium is improving but still years behind in software ecosystem maturity.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">80%+</div>
    <div class="ex-stat-label">AI GPU market share — maintained through multiple competitive chip launches</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">$130B+</div>
    <div class="ex-stat-label">Revenue run rate — from near-zero AI revenue in 2020 to dominant position by 2024</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">900 GB/s</div>
    <div class="ex-stat-label">NVLink 4.0 bandwidth — vs. ~64 GB/s for PCIe 5.0 (standard alternative), ~14x faster</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2006</div>
    <div class="ex-stat-label">Year CUDA launched — 16 years of ecosystem building before the AI era arrived</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">20,000+</div>
    <div class="ex-stat-label">CUDA-optimised libraries and tools — each one a switching cost for any competitor</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. The CUDA moat is strongest for training, weaker for inference.</strong> Training large models requires the full CUDA + NVLink stack — rewriting training code is extremely expensive. Inference is simpler: serving a trained model is less software-intensive, and inference-optimised chips (Google TPUs, AWS Inferentia, custom silicon) are closing the gap faster on inference than on training. Nvidia's NIM strategy is a direct response to this vulnerability — lock in inference before the gap closes.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Hyperscalers have both the incentive and the resources to break the moat.</strong> Google, Amazon, and Microsoft each spend billions annually on Nvidia GPUs. Each has built alternative chips (TPU, Trainium, Maia). Each has the engineering talent to rewrite ML frameworks for custom silicon. The CUDA moat survives because rewriting is expensive and the alternatives aren't yet good enough — not because it's impenetrable. As custom silicon matures, the calculus shifts. Ben Thompson's analysis: the CUDA wall is higher than Intel's differentiation ever was, but the concentrated customer base has more resources to break it than any previous competitive threat.</p>

<p style="margin-bottom:0.75rem;"><strong>C. DeepSeek demonstrated the moat's ceiling, not its collapse.</strong> DeepSeek trained a frontier model with H800s (bandwidth-constrained H100s) using architectural innovations that compensated for the missing NVLink bandwidth. This is often misread as "you don't need Nvidia." The correct reading: even with constrained Nvidia hardware and enormous engineering effort to work around the constraint, DeepSeek still used Nvidia GPUs. The moat wasn't broken — it was stressed. A team with unrestricted H100 access and full NVLink bandwidth would have trained the same model cheaper and faster.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Export controls are creating a bifurcated market that could weaken the moat long-term.</strong> US export controls restrict H100/H200 sales to China. Chinese AI labs (DeepSeek, Baidu, ByteDance) are being forced to innovate around Nvidia constraints — developing both model architectures that need less compute and investing in domestic GPU alternatives (Huawei Ascend, Cambricon). If Chinese domestic chips become competitive within China's large AI market, Nvidia loses that market permanently. A chip ecosystem that only serves Western markets is a smaller moat than one that serves the world.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Nvidia's moat is the most important infrastructure case study in AI because it shows that the deepest competitive advantages are invisible to the user and built over decades. CUDA launched in 2006 as a programming tool for scientific computing. No one knew it would become the foundation of the AI economy 16 years later. The lesson: Nvidia didn't predict AI — it built developer tools so valuable that when AI arrived, every developer was already locked in. Distribution and ecosystem moats compound silently for years before they become obvious.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is Nvidia's competitive moat and how durable is it?"</div>
  <div class="ex-interview-answer">Two moats — different durability profiles:
<br><br><strong>CUDA (software) — very durable for training, moderating for inference:</strong>
<br>• 20 years of developer tools, libraries, and community knowledge
<br>• Switching cost = rewriting years of optimised code (6–18 months for large teams)
<br>• Durability risk: inference-optimised chips are closing the gap faster than training alternatives
<br><br><strong>NVLink (hardware) — durable while frontier training requires scale:</strong>
<br>• 14x bandwidth advantage over PCIe enables the only efficient path to 10,000+ GPU clusters
<br>• Durability risk: if model architectures shift toward efficiency over scale (DeepSeek direction), the need for massive NVLink clusters shrinks
<br><br>Most vulnerable point: inference at scale, where custom silicon (TPUs, Inferentia) is already competitive and NIM is Nvidia's defensive response.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you build a product strategy around Nvidia infrastructure?"</div>
  <div class="ex-interview-answer">Three strategic positions relative to Nvidia's moat:
<br><br>• <strong>Build on top (most common):</strong> Use Nvidia GPUs via cloud (AWS, Azure, GCP). Leverage CUDA ecosystem fully. Accept Nvidia's pricing power. Right for: startups, most enterprise AI teams. Cost is high but switching cost of alternative is higher.
<br>• <strong>Build around (DeepSeek approach):</strong> Innovate model architecture to need less compute. MoE, quantisation, distillation reduce GPU requirements. Right for: teams with strong ML research capability willing to trade engineering complexity for infrastructure cost.
<br>• <strong>Build the alternative (hyperscaler approach):</strong> Invest billions in custom silicon (TPU, Trainium). Only viable for companies with $10B+ annual GPU spend where the ROI justifies the investment. Google's TPUv5 is competitive for inference; Trainium 2 is improving for training.
<br><br>Indian context: most Indian AI companies should build on top via cloud — the CUDA ecosystem and managed GPU access via AWS/Azure is the right economic decision at current scale. Only when annual GPU spend exceeds ~$50M does building around or building the alternative make economic sense.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What does the DeepSeek moment mean for Nvidia?"</div>
  <div class="ex-interview-answer">Three things — carefully distinguished:
<br><br>• <strong>What it proved:</strong> Efficient model architecture can compensate for constrained compute. You don't need the largest cluster to train a frontier model. This shifts the conversation from "who has the most GPUs" to "who has the best architecture."
<br>• <strong>What it didn't prove:</strong> That Nvidia is irreplaceable. DeepSeek trained on H800s — Nvidia GPUs. The innovation was around Nvidia's constraints, not away from them. A model trained with full H100 access and NVLink bandwidth would be cheaper and faster.
<br>• <strong>The real implication for Nvidia:</strong> If inference efficiency improves and training clusters shrink, the NVLink moat (which only matters at massive cluster scale) becomes less relevant. The CUDA moat remains. Nvidia's response: NIM locks in inference. The battle moves from training to inference, and Nvidia is already there.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates describe Nvidia's moat as "they make the best GPUs." Two things wrong:
  <br><br>• <strong>Raw GPU performance is not the moat.</strong> AMD's MI300X is competitive on many benchmarks. The moat is CUDA — 20 years of developer tools and community knowledge that only runs on Nvidia hardware. A chip that's 20% faster but requires rewriting 5 years of code will lose to a chip that's 20% slower but requires no switching cost.
  <br><br>• <strong>DeepSeek didn't break the moat — it stressed it.</strong> A common post-DeepSeek take: "efficient architectures mean you don't need Nvidia." DeepSeek trained on Nvidia GPUs (H800s). Their architectural innovations were driven by Nvidia's bandwidth constraints, not by choosing non-Nvidia hardware. The correct reading: efficient architectures reduce the cluster size needed for frontier training, which moderates the NVLink moat's importance. The CUDA moat remains fully intact.
</div>`,

    sources: [
      { id: 35, title: 'Nvidia Waves and Moats', url: 'https://stratechery.com/2024/nvidia-waves-and-moats/' },
      { id: 36, title: 'Nvidia On the Mountaintop', url: 'https://stratechery.com/2023/nvidia-on-the-mountaintop/' }
    ]
  }
},
{
  slug: 'projectdiscovery-llm-cost-optimisation',
  company: 'ProjectDiscovery',
  problem: 'LLM Cost Optimisation — Prompt Caching + Model Routing',
  oneLiner: 'ProjectDiscovery (autonomous security testing platform) cut LLM costs by 59–70% using prompt caching on agentic workflows that run 20–40 LLM steps per task — and the broader lesson applies to any product where the same context is repeatedly sent to the model',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Cost Optimisation'],
  sections: {
    problem: `ProjectDiscovery builds Neo — an autonomous security testing platform that runs multi-agent, multi-step workflows. A single complex task (vulnerability assessment, code review, security audit) executes 20–40 LLM steps. A single task with Claude Opus could consume 60 million tokens.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Naive token usage</div>
    Every LLM step sends the full system prompt + all prior context + the new query. In a 40-step workflow, the same 10,000-token system prompt is processed 40 times. The same tool descriptions are processed 40 times. The same background context is processed 40 times. Each re-processing is charged at full input token rates. A single complex task: 60M tokens. LLM costs were "staggering" at launch.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Prompt caching + model routing</div>
    Static content (system prompt, tool descriptions, background context) marked with cache_control markers. Cached tokens served at 10% of the full input rate. 59% overall cost reduction. Post-optimisation: 66%. Last 10 days at time of writing: 70%. Same workflow quality, dramatically lower cost.
  </div>
</div>

The core insight: agentic systems have fundamentally different economics from chatbots. A chatbot has 1–2 turns with a 500-token system prompt — caching is marginal. An agentic system has 20–40 turns with a 10,000+ token system prompt that's identical across every turn. The static content is enormous relative to the dynamic content. This ratio is what makes caching so powerful for agentic workflows — and so underused by teams who think about LLM costs the same way they think about chatbot costs.`,

    howSolved: `ProjectDiscovery implemented two cost levers in sequence: prompt caching first (highest ROI, lowest effort), model routing second (requires more engineering but compounds the savings).

<strong>Lever 1 — Prompt Caching</strong>

Anthropic's prompt caching works by marking stable prefixes with <code>cache_control</code> markers. When a subsequent request shares the same prefix, those tokens are served from cache at 10% of the standard input rate instead of being reprocessed.

<strong>The three-layer prompt structure</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Layer</div><div>Content</div><div>Cache strategy</div>
  </div>
  <div class="ex-table-row">
    <div>Layer 1 — Static system message</div>
    <div>Core agent instructions, persona, output format rules. Never changes between requests.</div>
    <div>Always cached. Breakpoint 1. Represents 5–20% of total tokens but is processed on every single step.</div>
  </div>
  <div class="ex-table-row">
    <div>Layer 2 — Reference content</div>
    <div>Tool descriptions, knowledge base chunks, documentation, examples. Stable within a session or time window.</div>
    <div>Cached with periodic invalidation. Breakpoint 2. Often 50–70% of tokens in agentic workflows — the biggest savings opportunity.</div>
  </div>
  <div class="ex-table-row">
    <div>Layer 3 — Dynamic content</div>
    <div>User query, real-time data, step-specific context. Changes every request.</div>
    <div>Never cached. Optimise for minimal size. Should be under 30% of total tokens if layers 1 and 2 are properly structured.</div>
  </div>
</div>

<strong>The relocation trick — ProjectDiscovery's key implementation insight</strong>
Anthropic allows up to 4 cache breakpoints per request. ProjectDiscovery uses 3. The challenge: the standard prompt structure put dynamic content (step results, intermediate outputs) between static layers — breaking the cache prefix. Their solution: relocate dynamic content to always appear after all static content, so the cache prefix is never interrupted. This "relocation trick" is not obvious from the documentation — it required experimentation to discover.

<div class="ex-flow">
  <div class="ex-flow-step">Static system message [cache_control: breakpoint 1]</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Tool descriptions + reference context [cache_control: breakpoint 2]</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Background context [cache_control: breakpoint 3]</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Dynamic step content [no cache — always fresh]</div>
</div>

<strong>Lever 2 — Model Routing (the complementary lever)</strong>
Prompt caching reduces the cost of processing the same tokens. Model routing reduces the cost by using cheaper models for simpler steps — the tokens that are processed get processed by a cheaper model.

The principle: in a 40-step agentic workflow, not every step requires frontier model capability.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Step type</div><div>Complexity</div><div>Right model</div>
  </div>
  <div class="ex-table-row">
    <div>Classification, intent detection, yes/no routing decisions</div>
    <div>Low — pattern matching, simple logic</div>
    <div>Haiku / GPT-4o-mini / Llama 8B. 10–20x cheaper than frontier.</div>
  </div>
  <div class="ex-table-row">
    <div>Summarisation, extraction, formatting</div>
    <div>Medium — needs language quality but not deep reasoning</div>
    <div>Sonnet / GPT-4o. 3–5x cheaper than frontier.</div>
  </div>
  <div class="ex-table-row">
    <div>Complex reasoning, code generation, security analysis</div>
    <div>High — requires full frontier capability</div>
    <div>Opus / GPT-4 / Claude 3.5 Sonnet. Use here only.</div>
  </div>
</div>

The router itself is typically a small classifier model or a rule-based system that categorises the incoming step before sending it to the appropriate model. For ProjectDiscovery's security workflows: initial triage and scope classification → small model; vulnerability analysis and exploit path reasoning → frontier model.

<strong>What teams get wrong — prompt structure as an afterthought</strong>
Most teams enable caching and see 10–20% reduction, assume it doesn't work, and move on. The difference between 10% and 70% reduction is almost entirely prompt structure — specifically, whether dynamic content is correctly relocated after all static content. Teams that organise prompts for developer convenience (dynamic content scattered wherever it felt natural) leave most of the savings on the table.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Agentic product team hitting unexpected LLM bills</div>
  Built a multi-step AI workflow — each step sends full context to the LLM. Month 1 costs look fine. Month 3 at scale: LLM bill is 3–5x what was budgeted. Failure mode: team optimises the wrong thing (switching models, reducing context) rather than fixing prompt structure. With caching properly implemented: 59–70% cost reduction with no quality change and minimal engineering effort.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Team using frontier model for all steps equally</div>
  Uses GPT-4 or Claude Opus for every step in a 40-step workflow — including simple classification steps that a Haiku-equivalent handles at 95%+ quality. Failure mode: paying $25/M output tokens for a step that "$0.25/M output tokens" handles identically. With model routing: simple steps route to cheap models automatically, complex steps escalate to frontier. 40–70% additional cost reduction on top of caching.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">59–70%</div>
    <div class="ex-stat-label">LLM cost reduction from prompt caching — 59% overall, 70% in the most recent 10-day period</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">10%</div>
    <div class="ex-stat-label">Cost of cached token reads vs. standard input rate — 90% cheaper per cached token</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">20–40</div>
    <div class="ex-stat-label">LLM steps per task in Neo — why agentic caching savings dwarf chatbot caching savings</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3</div>
    <div class="ex-stat-label">Cache breakpoints used (of 4 available) — with relocation trick to preserve prefix integrity</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">40–70%</div>
    <div class="ex-stat-label">Additional savings from model routing — routing simple steps to cheaper models</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Cache hit rate depends entirely on prompt structure discipline.</strong> The difference between 10% and 70% cache hit rates is prompt hygiene — whether dynamic content is correctly relocated after all static content. This is an engineering discipline problem as much as a technical one. Every developer who adds a new prompt must understand the cache structure and maintain it. Without explicit ownership, prompts drift: dynamic content creeps back between static layers, breaking the cache prefix and destroying the hit rate silently.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Model routing requires quality evals per step type.</strong> You can't route a step to a cheaper model without knowing that the cheaper model produces acceptable quality on that step. This means building evals for each step type before routing — which is additional upfront investment. Teams that skip evals and route blindly discover quality regressions only when users complain. The right order: eval first, route second.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Caching introduces prompt versioning complexity.</strong> Cached prefixes are tied to specific prompt versions. When you update the system prompt, the cache is invalidated — all requests pay full price until the new prefix accumulates enough hits to rebuild the cache. Frequent prompt iteration (common during development) means frequent cache invalidation and lower savings. Caching economics improve as prompts stabilise — it's most valuable in production, least valuable during active development.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Model routing adds latency management complexity.</strong> Different models have different latency profiles. A routing layer that sends some steps to a small model and others to a frontier model creates variable latency within a single workflow — which can cause unexpected behaviour if downstream steps assume consistent response times. Latency budgets must be defined per step type, not just per workflow.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">ProjectDiscovery is the clearest production example of why agentic AI economics are fundamentally different from chatbot economics. A chatbot sends 500 tokens of system prompt once per conversation. An agentic system sends 10,000 tokens of system prompt 40 times per task. The same optimisation (caching) that produces 5% savings in a chatbot produces 70% savings in an agent. Understanding this ratio — static context size relative to dynamic content — is the core of LLM cost management for any AI PM building agentic products.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you reduce LLM costs for an AI product at scale?"</div>
  <div class="ex-interview-answer">Two levers — apply in this order:
<br><br><strong>Lever 1 — Prompt caching (highest ROI, lowest effort):</strong>
<br>• Audit your prompt structure — what's static vs. dynamic?
<br>• Restructure: all static content first, all dynamic content last
<br>• Add cache_control markers at each static layer boundary
<br>• Measure cache hit rate — target 60%+ for agentic workflows
<br>• Expected savings: 40–70% on input token costs
<br><br><strong>Lever 2 — Model routing (higher effort, compounds caching savings):</strong>
<br>• Classify each step by complexity: low / medium / high
<br>• Build evals for each step type before routing
<br>• Route low-complexity steps to cheap models (Haiku, GPT-4o-mini)
<br>• Reserve frontier models for high-complexity steps only
<br>• Expected savings: additional 40–70% on top of caching
<br><br>Apply both together: a 40-step agentic workflow can go from $7/task to under $1/task without changing output quality.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design an AI feature for Swiggy / PhonePe and keep costs manageable"</div>
  <div class="ex-interview-answer">Apply ProjectDiscovery's two-lever framework to any Indian fintech or food delivery AI feature:
<br><br><strong>Example — PhonePe customer support agent:</strong>
<br>• Static layer (cached): agent persona, response format rules, product knowledge base, escalation policies — changes rarely, processed every step
<br>• Dynamic layer (not cached): user query, transaction context, account state — changes every turn
<br>• Model routing: intent classification → Haiku (₹0.002/query). Refund policy explanation → Sonnet. Complex dispute resolution → Opus.
<br><br><strong>The PM implication:</strong> Unit economics of AI features must be modelled before launch. "Cost per conversation" at 1,000 users looks fine. At 10M users, an unoptimised prompt structure becomes a ₹10Cr/month problem. Caching and routing are not engineering optimisations — they are product decisions that determine whether the feature is economically viable at scale.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use prompt caching vs. fine-tuning to reduce costs?"</div>
  <div class="ex-interview-answer">Different problems, different tools:
<br><br>• <strong>Prompt caching</strong> — reduces the cost of repeatedly processing the same static context. Right when: you have large stable system prompts, agentic workflows, document analysis with multiple queries on the same document. Does not improve model capability — only reduces cost of existing capability.
<br>• <strong>Fine-tuning</strong> — teaches the model a new capability (syntax, style, domain knowledge) so you no longer need to include it in the prompt. Right when: your system prompt contains extensive instructions that could be baked into weights — eliminating the prompt tokens entirely. Honeycomb is the example: fine-tuning eliminated the need for the full query language manual in the prompt.
<br>• <strong>Model routing</strong> — reduces cost by matching task complexity to model capability. Right when: your workflow has a mix of simple and complex steps currently all handled by a frontier model.
<br><br>The correct order: caching first (zero capability risk), routing second (requires evals), fine-tuning last (highest investment, highest reward when correct).</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about LLM cost optimisation, say "use a cheaper model" or "reduce the context window." Two things wrong:
  <br><br>• <strong>Switching models without fixing prompt structure first.</strong> A cheaper model on an unoptimised prompt structure saves 3x on model cost but leaves 7x savings from caching untouched. The correct order: fix prompt structure and implement caching first — this is zero-quality-risk and often produces the largest savings. Switch models second, with evals to validate quality.
  <br><br>• <strong>Applying chatbot cost intuitions to agentic systems.</strong> Caching produces marginal savings on chatbots (small system prompts, few turns) and enormous savings on agentic systems (large system prompts, many turns). A team that tried caching on their chatbot, saw 10% savings, concluded "caching doesn't work," and moved on — will miss 60%+ savings if they later build an agentic workflow. The economics are fundamentally different. Static context size relative to dynamic content is the variable that determines how much caching saves.
</div>`,

    sources: [
      { id: 68, title: 'How ProjectDiscovery Cut LLM Costs by 59% With Prompt Caching', url: 'https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching' }
    ]
  }
},
{
  slug: 'netflix-artwork-personalisation-bandits',
  company: 'Netflix',
  problem: 'Artwork Personalisation via Contextual Bandits',
  oneLiner: 'Netflix (300M users, thousands of titles) shows different thumbnail artwork to different users for the same title — using contextual bandits to learn which image maximises play rate for each member, replacing slow batch A/B tests that left most users on suboptimal artwork for weeks',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Post-Training'],
  sections: {
    problem: `The thumbnail you see for Stranger Things on Netflix is not the same thumbnail someone else sees. Netflix has multiple artwork options per title — action shots, character-focused images, emotional scenes — and shows different ones to different users based on what they're likely to click.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Batch A/B testing</div>
    Netflix ran a batch ML cycle: collect data → train a model → run an A/B test → if B wins, roll out to everyone. This cycle took weeks. During that time, every member who would have preferred the better artwork was shown the worse one. The "regret" — value lost while the system hadn't yet learned the optimal artwork — was enormous at 300M user scale. A/B tests also found one winner for all users — missing the insight that different users respond to different visual signals.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Contextual bandits</div>
    Contextual bandits learn in real time: show an artwork, observe whether the member played the title, update the model immediately. No waiting for batch data collection, no waiting for A/B test completion. Each member gets the artwork that the model currently estimates is best for them specifically — not the artwork that won for the average user. Regret shrinks continuously as the model learns.
  </div>
</div>

The root problem with A/B testing for artwork: it optimises for one winner across all users. But the user who watches a lot of romance titles responds to a different thumbnail than the user who watches action. The user who has already seen the trailer responds differently from one who hasn't. A/B tests find the average best — contextual bandits find the individual best.`,

    howSolved: `Netflix built a contextual bandit system for artwork selection — online learning that personalises in real time rather than in batch cycles.

<strong>What a contextual bandit does</strong>
A bandit algorithm solves the explore/exploit tradeoff: show the artwork you currently think is best (exploit), while occasionally showing other artworks to learn whether they might be better (explore). A contextual bandit adds member and title context to this decision — the exploration and exploitation are personalised, not random.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Concept</div><div>What it means</div><div>Netflix application</div>
  </div>
  <div class="ex-table-row">
    <div>Arms</div>
    <div>The choices the bandit can make</div>
    <div>Each artwork option for a title — typically 10–30 images per title</div>
  </div>
  <div class="ex-table-row">
    <div>Context</div>
    <div>Information available when making the choice</div>
    <div>Member's viewing history, genre preferences, time of day, device, language, whether they've seen the title's trailer</div>
  </div>
  <div class="ex-table-row">
    <div>Reward</div>
    <div>What the system optimises for</div>
    <div>Did the member play the title after seeing this artwork? (Play rate, not click rate)</div>
  </div>
  <div class="ex-table-row">
    <div>Regret</div>
    <div>Value lost by not always showing the optimal arm</div>
    <div>Members who saw suboptimal artwork and didn't play a title they would have enjoyed</div>
  </div>
</div>

<strong>Why contextual beats non-contextual bandits</strong>
Netflix previously used non-contextual bandits — finding the single best artwork regardless of who was watching. This was already better than A/B testing (faster learning, less regret) but still found one winner for all users. Contextual bandits personalise the selection: the algorithm learns that users who watch a lot of dramas prefer character-focused artwork, while users who watch action prefer dynamic scene shots. The same title gets a different optimal thumbnail for each user segment.

<strong>How artwork attributes feed the context</strong>
Netflix's AVA (Artwork Visual Analysis) system processes every frame of every title through computer vision:
<br>• Facial detection + sentiment analysis — is there a recognisable actor? What's their emotional expression?
<br>• Scene composition — is it an action shot, a character moment, a dramatic landscape?
<br>• Visual properties — brightness, contrast, colour palette, motion blur
<br>• Contextual metadata — which characters appear, what's happening in the scene

These attributes become features in the contextual bandit model. The model learns: "members who respond to emotional drama thumbnails also tend to respond to artworks with close-up character shots showing vulnerability." This is knowledge the algorithm discovers from data — no human needs to manually tag "this image is good for drama fans."

<strong>The explore/exploit mechanics</strong>

<div class="ex-flow">
  <div class="ex-flow-step">Member opens Netflix — context captured (history, preferences, device, time)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Bandit model selects artwork — mostly exploit (show best known), occasionally explore (show alternative)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Member plays (reward = 1) or skips (reward = 0)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Model updates immediately — no waiting for batch cycle</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Next member gets updated model — learning compounds in real time</div>
</div>

<strong>The cold-start problem for new titles</strong>
A new title has no play data — the bandit has no reward signal to learn from. Netflix's solution: initialise with image quality signals (brightness, composition, face detection quality) as a prior. The bandit starts with an informed guess based on visual attributes, then updates rapidly as the first members interact. A well-composed, visually striking image is a reasonable prior before any behavioural data exists.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Genre-specific viewer (romance fan)</div>
  Opens Netflix to browse. Title has two artwork options: a high-action shot and a tender character moment between the two leads. Failure mode with A/B testing: the action shot won for the average population — but this user's history shows they overwhelmingly watch romance. They see the action shot, don't recognise it as their genre, scroll past. With contextual bandit: their genre preference is in context — they see the character moment, recognise the romance signal, click to play.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Actor-driven viewer</div>
  Watches primarily because of specific actors — will try almost any genre if a favourite actor is in it. Failure mode: default artwork shows a scene without the actor prominently featured. User never connects the title to their favourite actor. With contextual bandit: the model learns this user responds to actor-recognition signals — artwork featuring their watched actors surfaces, connection is made, play rate increases.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">10–30</div>
    <div class="ex-stat-label">Artwork options per title — each with different visual composition and character focus</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Real-time</div>
    <div class="ex-stat-label">Model update frequency — vs. weeks for batch A/B test cycles</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Play rate</div>
    <div class="ex-stat-label">Optimisation metric — not click rate. A clicked thumbnail that doesn't lead to play is a failure.</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Exploration creates short-term regret to reduce long-term regret.</strong> Every time the bandit explores (shows a non-optimal artwork to learn), some members see a worse image than they would have under pure exploitation. This is a deliberate tradeoff: short-term exploration regret buys long-term model accuracy. The explore rate must be tuned carefully — too much exploration and users consistently see suboptimal images; too little and the model stops learning and can get stuck on a local optimum.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Play rate as a reward is a lagging signal.</strong> The bandit shows artwork and waits to see if the member plays. But members may play hours later, may not play during the session, or may play because of something other than the artwork (a friend's recommendation, a marketing email). The immediate signal available is click — but optimising for click rate produces clickbait thumbnails. Netflix optimises for play rate, which is a better signal but requires a longer observation window. Delayed reward signals make bandit learning slower and noisier.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Context richness creates feature selection complexity.</strong> Adding more context features (member history, time of day, device, trailer views, social signals) can improve personalisation — but also increases model complexity and the risk of overfitting to spurious correlations. Netflix uses regularisation and careful feature selection. The PM decision: which context features are genuinely causal (this user watches romance → prefers character artwork) vs. correlational noise (this user opened Netflix at 9pm → no consistent artwork preference).</p>

<p style="margin-bottom:0.75rem;"><strong>D. Artwork creation becomes a strategic investment.</strong> The bandit system only works if there are meaningfully different artworks to choose from. If all 10 images for a title are similar compositions with similar visual signals, the bandit has nothing to personalise. Netflix's AVA system and creative teams must produce diverse artwork options — different character focuses, different emotional tones, different visual compositions — for the bandit to exploit. The ML system is only as good as the creative diversity it has to work with.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Netflix Artwork Personalisation is the clearest production example of why A/B testing is not always the right tool for personalisation. A/B tests find one winner for the average user. Contextual bandits find the best option for each user, in real time, with continuously shrinking regret. The key insight: the same content can and should look different to different people — not because the content changes, but because different visual signals resonate with different preference profiles. The thumbnail is the first moment of personalisation before a user even clicks play.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you personalise the Hotstar / JioCinema homepage for different users?"</div>
  <div class="ex-interview-answer">Apply Netflix's contextual bandit framework to Indian streaming:
<br><br><strong>Context signals specific to India:</strong>
<br>• Language preference — Hindi-dominant user vs. Tamil-dominant user sees different artwork emphasising different cast members
<br>• IPL vs. non-IPL season — cricket artwork performs dramatically differently during tournament weeks
<br>• Regional genre — a Malayalam cinema fan responds to different visual aesthetics than a Bollywood fan
<br><br><strong>Artwork diversity strategy:</strong>
<br>• For a Hindi film: artwork options should include star-focused (hero/heroine), action scene, emotional moment, comedy moment
<br>• For a cricket match: player-focused, crowd shot, stadium shot, trophy/stakes shot
<br><br><strong>Reward signal:</strong> Play rate, not click rate — same as Netflix. An artwork that gets clicks but no sustained play is misleading the user, not serving them.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use a bandit algorithm vs. A/B testing?"</div>
  <div class="ex-interview-answer">Use <strong>A/B testing</strong> when:
<br>• You need a clean causal estimate — regulatory, financial, or safety decisions where statistical rigour is required
<br>• The decision is binary and permanent — you need to know definitively which version is better before committing
<br>• You have enough traffic that both arms get sufficient exposure quickly
<br><br>Use <strong>bandit algorithms</strong> when:
<br>• You want to minimise regret — every user on the losing arm represents lost value
<br>• Personalisation matters — different users respond differently and you want to learn this
<br>• Decisions are continuous and reversible — you can update artwork choices in real time
<br>• You have many arms — A/B testing 20 artwork options would take months; a bandit learns all 20 simultaneously
<br><br>Netflix's insight: for artwork, the cost of showing the wrong image to the wrong user at scale is enormous. Bandit algorithms minimise that cost continuously. A/B tests fix it once, slowly.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you handle cold-start in a recommendation or personalisation system?"</div>
  <div class="ex-interview-answer">Netflix's three-layer answer for new titles:
<br><br>• <strong>Visual quality prior</strong> — use computer vision attributes (composition, brightness, face quality, sentiment) as an informed starting point before any behavioural data. A well-composed image with a clearly visible, emotionally expressive face is a better prior than a random frame.
<br>• <strong>Genre/attribute transfer</strong> — if the new title is a romance, initialise with artwork preferences learned from other romance titles the user has interacted with. Genre-level learning transfers to new titles in that genre.
<br>• <strong>Rapid bandit learning</strong> — the first 1,000 impressions update the model dramatically. Unlike batch ML that waits for a full data collection cycle, bandits update after every impression. Cold start resolves quickly when the explore rate is appropriately high for new titles.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about personalising visual content, say "run A/B tests to find the best image." Two things wrong:
  <br><br>• <strong>A/B tests find the best image for the average user — not for each user.</strong> The artwork that wins for the average Netflix population is suboptimal for genre-specific viewers, actor-driven viewers, and users with niche preferences. Contextual bandits find the best image per user context. For a platform with 300M users across hundreds of viewing preferences, "average best" leaves enormous value on the table.
  <br><br>• <strong>A/B tests create regret at scale.</strong> A 4-week A/B test means 4 weeks of 50% of users seeing the suboptimal artwork — at Netflix's scale, that's hundreds of millions of suboptimal impressions. Bandit algorithms shrink regret continuously from day one. The appropriate use of A/B testing is for decisions that require clean causal inference (a product feature launch, a policy change) — not for decisions that can be continuously optimised in real time.
</div>`,

    sources: [
      { id: 27, title: 'Artwork Personalization at Netflix', url: 'https://netflixtechblog.com/artwork-personalization-c589f074ad76' }
    ]
  }
},
{
  slug: 'instagram-feature-level-memory',
  company: 'Instagram (Meta)',
  problem: 'Feature-Level Memory Architecture',
  oneLiner: 'Instagram runs three completely different memory architectures — Reels, Explore, and Meta AI — on the same app, because each feature has a different answer to the same question: what should the AI know about you, and when should it know it?',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Personalisation', 'Recommendations'],
  sections: {
    problem: `Most PMs think of Instagram as one product. The right way to think about it is as three products running three completely different memory strategies — sometimes on the same screen at the same time.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Wrong mental model — one app, one memory system</div>
    "Instagram's algorithm learns what you like." True — but which Instagram? The Reels feed, Explore tab, and Meta AI chat window are each running a different memory strategy with different write policies, different retention windows, and different forgetting rules. A PM who designs memory for Instagram as if it were a single system will build the wrong thing for every feature.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Right mental model — one app, three memory architectures</div>
    Reels: implicit behavioural memory, updated on every watch signal, no user control. Explore: interest-level memory, patterns extracted from behaviour, stable over weeks. Meta AI: explicit declarative memory, user-controlled, four simultaneous memory systems active in every conversation.
  </div>
</div>

The insight: memory architecture is a product decision, not just a technical one. The right memory design depends entirely on what the feature is trying to do — not on what technology is available.`,

    howSolved: `Instagram (Meta) runs three distinct memory architectures. Each is optimised for a different product goal.

<strong>Architecture 1 — Reels: Implicit Behavioural Memory</strong>
Reels does not remember events. It remembers patterns extracted from events.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Memory aspect</div><div>How Reels implements it</div>
  </div>
  <div class="ex-table-row">
    <div>What it stores</div>
    <div>Interest features — not "watched a cooking video" but "affinity score for cooking content = 0.87." The event is discarded; the pattern is retained.</div>
  </div>
  <div class="ex-table-row">
    <div>Write trigger</div>
    <div>Every meaningful engagement signal: watch time (most important), re-watches, shares, comments, skips. Weighted by recency — a skip today matters more than a watch last month.</div>
  </div>
  <div class="ex-table-row">
    <div>Retention window</div>
    <div>Interest scores decay over time unless reinforced. A cooking interest built over 3 months fades if you stop watching cooking videos. The model tracks both what you like and when you last signalled it.</div>
  </div>
  <div class="ex-table-row">
    <div>Forgetting policy</div>
    <div>Decay-based — scores drift toward neutral without reinforcement. Sudden strong signal (binge watching a new topic) rapidly shifts interest scores. No hard deletion — gradual drift.</div>
  </div>
  <div class="ex-table-row">
    <div>User control</div>
    <div>None on the model. Indirect via engagement behaviour only. You can't tell Reels to forget you like cooking — you can only stop watching cooking videos.</div>
  </div>
</div>

<strong>Architecture 2 — Explore: Interest-Level Memory</strong>
Explore operates at a coarser level than Reels. Where Reels tracks affinity scores per content category, Explore identifies stable interest clusters — broader topic areas the user consistently engages with across multiple sessions.

Explore memory is slower to update and slower to forget. A user who watches travel content for 3 days doesn't immediately see Explore populate with travel. The system waits for a consistent pattern across multiple sessions before updating the interest cluster. This makes Explore feel less reactive but more stable — it reflects who you are over weeks, not what you did this morning.

<strong>Architecture 3 — Meta AI: Four Simultaneous Memory Systems</strong>
When you type a message into Meta AI inside Instagram, four memory systems activate at the same time — most users see none of this.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Memory type</div><div>What it stores</div><div>Who controls it</div>
  </div>
  <div class="ex-table-row">
    <div>KV Cache (in-context)</div>
    <div>The system prompt — Meta AI's persona, safety rules, tone guidelines. Shared across all users. Cached so it isn't reprocessed every message.</div>
    <div>Meta — invisible to user</div>
  </div>
  <div class="ex-table-row">
    <div>Conversation memory (in-context)</div>
    <div>Everything said in the current conversation. Grows with each turn. Cleared when the conversation ends.</div>
    <div>Ephemeral — resets per session</div>
  </div>
  <div class="ex-table-row">
    <div>Long-term memory (external)</div>
    <div>Facts the user explicitly told Meta AI or that Meta AI learned and saved: "I'm vegetarian," "I'm planning a trip to Japan in March," "My daughter's name is Priya." Persists across all future sessions.</div>
    <div>User can view, edit, and delete</div>
  </div>
  <div class="ex-table-row">
    <div>Social graph context</div>
    <div>Connections, mutual friends, accounts followed. Meta AI can reference "your friend Rahul just posted about restaurants in Bangalore" because it has access to your social graph.</div>
    <div>Meta — derived from platform data</div>
  </div>
</div>

<strong>The write strategy — when does memory get updated?</strong>
Each architecture has a different trigger for writing new information:
<br>• <strong>Reels:</strong> Every watch signal writes immediately. High-frequency, low-threshold — any engagement updates the model.
<br>• <strong>Explore:</strong> Pattern confirmation across multiple sessions. Low-frequency, high-threshold — requires consistent behaviour before writing a new interest cluster.
<br>• <strong>Meta AI long-term:</strong> Explicit statement or inferred fact above a confidence threshold. User can also explicitly tell Meta AI to remember something.

<strong>The forgetting policy — what gets removed and when?</strong>
<br>• <strong>Reels:</strong> Interest scores decay without reinforcement. No hard deletion.
<br>• <strong>Explore:</strong> Interest clusters fade if not reinforced over weeks. New strong interests can displace old ones.
<br>• <strong>Meta AI long-term:</strong> User-initiated deletion only. Nothing is automatically forgotten — a fact told to Meta AI in January is still there in December unless the user deletes it. This is the appropriate policy for explicit declarative memory — forgetting something the user intentionally shared would be a product failure.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Reels user whose taste has changed</div>
  Used to watch a lot of fitness content, now prefers cooking. Failure mode if memory has no decay: fitness interest score stays high, cooking never breaks through. With decay-based memory: fitness score drifts down without reinforcement, cooking score rises with each watch. Feed transitions naturally over 1–2 weeks without any user action required.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Meta AI user who shares personal context</div>
  Tells Meta AI "I'm vegetarian and I have a peanut allergy." Failure mode without long-term memory: has to repeat this every conversation. Failure mode with memory but no user control: can't remove or correct the memory if circumstances change. With explicit long-term memory + user control: Meta AI remembers across all sessions, user can view the stored facts and delete or edit them anytime.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Explore user discovering a new interest</div>
  Starts watching a lot of photography content after a travel trip. Failure mode if Explore uses same fast-write policy as Reels: one week of travel photography content permanently shifts their Explore interest clusters. With slower pattern-confirmation write policy: Explore waits for sustained interest across multiple sessions before updating. A one-week spike doesn't override months of established interests.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">4</div>
    <div class="ex-stat-label">Simultaneous memory systems active in every Meta AI conversation — KV cache, conversation, long-term, social graph</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3</div>
    <div class="ex-stat-label">Distinct memory architectures in one app — Reels, Explore, Meta AI each running different write and forget policies</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Implicit memory (Reels) has no user transparency.</strong> Users can't see their interest scores, can't reset them, and can't explain why they're seeing a certain type of content. The only control is indirect — change your engagement behaviour and wait for scores to drift. This creates a "filter bubble" risk: a user who binge-watched a topic once may see it dominate their feed for weeks before decay corrects it. The PM decision: how fast should decay be? Fast decay = more responsive but less stable. Slow decay = more stable but harder to escape content rabbit holes.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Explicit memory (Meta AI) creates liability if not surfaced.</strong> If Meta AI has stored "user is diabetic" from a conversation 6 months ago and that information is wrong or outdated, acting on it could cause harm (e.g. dietary advice). Explicit long-term memory must be surfaced to users so they can review and correct it. A memory system with no visibility or edit mechanism is worse than no memory system — it gives the AI false confidence in stale facts.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Social graph memory raises privacy expectations.</strong> Meta AI knowing your friends' recent posts and being able to reference them in conversation is powerful — but users may not realise this is happening. "Your friend Rahul posted about restaurants" uses data the user shared with Instagram (their social graph), not data they shared with Meta AI directly. The line between these two data sources is invisible to most users. Clear disclosure of what context sources Meta AI uses is both a product trust decision and a regulatory requirement in many markets.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Different features need different memory policies — there is no universal right answer.</strong> The biggest PM mistake is applying one memory design to all features. Reels needs fast-write, decay-based, implicit memory. Meta AI needs slow-write (on explicit statements), no-decay (user controls deletion), explicit memory. Building the wrong type for the wrong feature produces an experience that either feels unstable (too reactive) or feels stuck (too rigid).</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Instagram is the clearest production example of why "memory" is not a single product decision — it's a set of decisions made separately for each feature. Reels, Explore, and Meta AI each have different answers to: what to store, when to write, how long to keep it, and what triggers forgetting. A PM who designs one memory system for all three features will get all three wrong. The first question in any AI memory design is not "what should we remember?" — it's "what is this feature trying to do, and what does it need to know, when?"</div>
</div>

<function_calls>
<invoke name="bash_tool">
<parameter name="command">cat >> /home/claude/examples.js << 'ENDOFOBJECT2'

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design memory for an AI feature in Swiggy / Zomato / PhonePe"</div>
  <div class="ex-interview-answer">Apply Instagram's framework — different features, different memory architectures:
<br><br><strong>Swiggy feed (like Reels):</strong>
<br>• Implicit behavioural memory — extract cuisine affinity scores from order history
<br>• Fast write (every order updates scores), decay-based forgetting (summer preference for cold desserts fades in winter)
<br>• No user control needed — behaviour is the signal
<br><br><strong>Swiggy search (like Explore):</strong>
<br>• Interest cluster memory — stable dietary preferences (vegetarian, no onion-garlic)
<br>• Slow write (pattern across multiple orders), slow forgetting (dietary preferences are sticky)
<br>• Surface to user for correction — a vegetarian flag should be editable
<br><br><strong>Swiggy AI assistant (like Meta AI):</strong>
<br>• Explicit declarative memory — "I'm allergic to peanuts," "my home address is X"
<br>• Write on explicit statement only, no automatic forgetting, user controls deletion
<br>• Always surface what's been stored so user can verify and correct</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design a personalisation system that feels helpful but not creepy?"</div>
  <div class="ex-interview-answer">The Instagram framework maps directly to the creepiness question:
<br><br>• <strong>Implicit memory (Reels model):</strong> Users accept this because the signal (watch time) is obviously connected to the output (similar content). Not creepy because the connection is intuitive.
<br>• <strong>Explicit memory with visibility (Meta AI model):</strong> Not creepy when the user can see exactly what's stored and delete it. Creepy when memory is invisible and the AI references things the user didn't know it remembered.
<br>• <strong>Social graph memory:</strong> Highest creepiness risk — referencing a friend's post feels surveillance-like if the user didn't connect their social graph to the AI context. Explicit disclosure required.
<br><br>The PM rule: visibility + control = trust. Memory that the user can see, edit, and delete is not creepy. Memory that acts on information the user didn't realise was being used is.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to design memory for an AI product, describe one memory system for the whole product. Instagram's lesson is that this is wrong — different features within the same app need fundamentally different memory architectures.
  <br><br>• <strong>Applying explicit memory design to recommendation features.</strong> A Reels-like feature that requires users to explicitly tell it their interests (like Meta AI long-term memory) will feel tedious and won't capture the implicit signals that make recommendations good. Recommendation memory should be implicit, behaviour-driven, and automatic.
  <br><br>• <strong>Applying implicit memory design to conversational features.</strong> A chatbot that silently infers and stores facts from conversations without surfacing them to users will feel creepy when it references them later. Conversational AI memory should be explicit, visible, and user-controlled.
  <br><br>The diagnostic question: "Is the user's goal to consume content passively or to share context intentionally?" Passive consumption → implicit memory. Intentional sharing → explicit memory with user control.
</div>`,

    sources: [
      { id: 13, title: 'Memory in AI — Part 2', url: 'https://www.technomanagers.com/p/memory-in-ai-part-2' }
    ]
  }
}

,
{
  slug: 'position-bias-two-module-model',
  company: 'Amazon / Flipkart',
  problem: 'Position Bias — Two-Module Ranking Model',
  oneLiner: 'Position 1 gets more clicks than Position 10 regardless of quality — every recommendation system that trains on this biased data accidentally learns to rank popular-position items higher. The fix: split P(saw it) from P(wanted it) into two separate modules',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Evals & AI Quality'],
  sections: {
    problem: `Every recommendation system trains on click data. Click data is biased. Position 1 gets clicked more than Position 10 — not because it is better, but because it is more visible. A model trained on this data learns "Position 1 items are good." It ranks those items higher. They get more clicks. The model learns they are even better. The feedback loop compounds silently.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Biased training — what actually happens</div>
    Flipkart shows Product A at Position 1 and Product B at Position 7. Product A gets 10 clicks, Product B gets 2 clicks. Model trains: Product A = high relevance, Product B = low relevance. Next time Product A is ranked even higher. Gets even more clicks. Product B never gets a fair chance — quality hidden behind position disadvantage.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Debiased training — the two-module fix</div>
    Same data, different framing. The model separates two questions: (1) Was the product visible enough to be seen? (2) Given it was seen, was it relevant enough to click? Position 1 higher click rate is explained by higher visibility, not higher relevance. Debiased relevance score reflects actual user preference — not position advantage.
  </div>
</div>

The problem compounds silently. A system trained on biased data does not know it is biased — the feedback loop reinforces existing rankings without any signal that the system is wrong. Position bias is the most pervasive and least discussed failure mode in production recommendation systems.`,

    howSolved: `The two-module model (PAL — Position-bias Aware Learning) separates click probability into two independent components and optimises each separately.

<strong>The mathematical decomposition</strong>
<br>• Standard model: P(click | item, position) — one score explaining everything
<br>• Two-module model: P(click | item, position) = P(seen | position) × P(click | item, seen)

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Module</div><div>What it models</div><div>What drives it</div>
  </div>
  <div class="ex-table-row">
    <div>Examination module</div>
    <div>P(seen | position) — probability the user examined this position at all. Nothing to do with the item.</div>
    <div>Position only. Position 1 = high examination. Position 10 = lower. Pure position bias — captured and isolated.</div>
  </div>
  <div class="ex-table-row">
    <div>Relevance module</div>
    <div>P(click | item, seen) — probability the user clicked IF they examined this position. Actual relevance signal stripped of position advantage.</div>
    <div>Item features, user context, query — not position. This is what the system actually cares about.</div>
  </div>
</div>

<strong>Why separating them works</strong>
Position 1 gets 18 clicks, Position 7 gets 3 clicks. Standard model: Position 1 item is 6x better. Two-module model: Position 1 has 3x higher examination probability. After controlling for examination, Position 1 item is only 2x better — and Position 7 item is actually 1.5x better than standard model gave it credit for.

At inference time: only the relevance module scores are used for ranking. The examination module is discarded. The system ranks by P(wanted | seen) — not by P(clicked | shown).

<strong>Practical alternatives when full two-module training is not feasible</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Method</div><div>How it works</div><div>When to use</div>
  </div>
  <div class="ex-table-row">
    <div>Randomisation</div>
    <div>Randomly shuffle positions for a fraction of traffic. Clicks in randomised positions = unbiased signal.</div>
    <div>Works but wastes impressions. Use on 5% of traffic to collect debiased training data.</div>
  </div>
  <div class="ex-table-row">
    <div>Position as a feature</div>
    <div>Include position as training input. Model learns to discount its contribution.</div>
    <div>Simpler to implement. Less effective than two-module — disentangling is imperfect.</div>
  </div>
  <div class="ex-table-row">
    <div>Two-module (PAL)</div>
    <div>Full decomposition into examination + relevance modules trained jointly.</div>
    <div>State of the art. When position bias is confirmed and engineering capacity is available.</div>
  </div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Flipkart / Amazon shopper looking for the best product</div>
  Searches for "wireless earphones under ₹2,000." Standard model shows most-clicked earphones — most-clicked partly because they have been at Position 1 for months, not because they are best. User buys an inferior product, returns it. With two-module model: ranking reflects actual relevance — the earphone that users who examined it chose to click, not the one benefiting most from Position 1 exposure.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — New seller on Meesho / Flipkart with a genuinely better product</div>
  Lists a high-quality kurta at a competitive price. Gets shown at Position 15 initially. Gets fewer clicks — not because it is worse, but because no one sees it. Standard model interprets low clicks as low quality. Product never gets promoted. With debiased ranking: the few users who did see it at Position 15 clicked at a high rate. Two-module model recognises high relevance despite low examination volume — promotes the product.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">53–87%</div>
    <div class="ex-stat-label">CTR overestimation at Position 1 vs. fair share — confirmed across multiple platform studies</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">2</div>
    <div class="ex-stat-label">Modules trained jointly — examination (position only) and relevance (item + context, no position)</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Randomisation hurts short-term metrics.</strong> Randomising positions to collect debiased training data means some users see suboptimal rankings during data collection. On high-traffic pages (Flipkart homepage, Amazon search), this is a real cost. Use stratified randomisation on 5% of traffic to collect debiased signal while keeping 95% on the optimised ranking.</p>

<p style="margin-bottom:0.75rem;"><strong>B. The examination module assumes position is the only driver of visibility.</strong> PAL assumes P(seen | position) is entirely determined by position. In reality, visual salience, image quality, bestseller badges, and scroll depth also affect whether a product is seen. A product with a bright image at Position 5 may be more visible than a low-contrast image at Position 2. Pure position-based examination models undercorrect for these additional visibility factors.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Position bias compounds with popularity bias.</strong> Popular items appear at high positions because they are popular. High positions generate more clicks, reinforcing popularity. Two-module models address position bias but not popularity bias independently. Most production systems address both, but implementing both simultaneously is significantly more complex.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Position bias is the most common silent failure in recommendation systems. Every team optimising on CTR is accidentally optimising for "which items got shown at good positions" rather than "which items users actually wanted." The two-module model is the production fix — but the PM insight is more important than the technical fix: if your primary metric is CTR, you need to ask whether you are measuring relevance or position advantage.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is wrong with using CTR as your primary metric for recommendations?"</div>
  <div class="ex-interview-answer">CTR = P(click | item, position). It conflates two things:
<br><br>• P(seen | position) — did the user even see this item? Entirely driven by position.
<br>• P(click | item, seen) — given they saw it, did they want it? Driven by relevance.
<br><br>Optimising CTR directly optimises for getting items into high-visibility positions, not for showing users what they want. Better metrics:
<br>• <strong>Purchase rate</strong> — downstream of click, harder to game with position
<br>• <strong>Return rate</strong> — users who bought and returned were shown the wrong product
<br>• <strong>Long-term retention</strong> — users who consistently find what they want come back
<br><br>Indian context: Meesho and Flipkart face position bias acutely because small sellers with genuinely good products cannot break through to high positions without significant click history. Debiasing the ranking model is a marketplace health decision, not just a quality decision.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you improve the Flipkart / Amazon recommendation system?"</div>
  <div class="ex-interview-answer">Before jumping to model architecture, confirm position bias is the actual problem:
<br><br><strong>Diagnosis:</strong>
<br>• Shuffle positions randomly for 5% of traffic
<br>• Compare CTR by position in shuffled vs. standard condition
<br>• If Position 1 CTR drops significantly in shuffled condition → position bias confirmed
<br><br><strong>Fix sequence:</strong>
<br>• <strong>Quick:</strong> Position-as-feature — add position as a training input. Implementable in days. Imperfect but immediate improvement.
<br>• <strong>Full fix:</strong> Two-module model — train examination module on shuffled traffic data, relevance module on item features excluding position. Rank by relevance only at inference.
<br>• <strong>Metric change:</strong> Replace CTR as primary metric with purchase rate or long dwell time — harder to fake with position gaming.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates say "optimise for CTR" when asked about recommendation metrics. Two things wrong:
  <br><br>• <strong>CTR measures position advantage, not relevance.</strong> A system optimising for CTR will eventually put the same popular items at Position 1 forever — they have the most clicks because they always get the best positions. The system has no mechanism to discover that a new product at Position 15 is actually better, because it never gets the examination volume to generate meaningful click signal.
  <br><br>• <strong>The feedback loop is silent.</strong> A system with position bias does not produce errors — it produces confident wrong rankings. The only way to detect it is to deliberately randomise positions, observe the CTR distribution by position, and measure how much it deviates from expectation if all positions were equally visible. Most teams never run this experiment — and never discover the bias compounding in their training data for months or years.
</div>`,

    sources: [
      { id: 3, title: 'Two Versions of Every Click — Position Bias in Recommendations', url: 'https://www.technomanagers.com/p/two-versions-of-every-click' }
    ]
  }
}

,
{
  slug: 'trust-in-ai-systems',
  company: 'GitHub Copilot / Booking.com / Air Canada',
  problem: 'Building User Trust in AI Products',
  oneLiner: 'Trust in AI is not proportional to capability — it is proportional to predictability and reversibility. GitHub Copilot is correct 43% of the time and has 1.3M subscribers. Air Canada had a highly confident chatbot and got sued. The difference is not accuracy — it is what happens when the AI is wrong',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design', 'Evals & AI Quality'],
  sections: {
    problem: `Most AI product teams think trust is a function of accuracy. Build a better model → users trust it more. This is wrong. Trust is a function of three things: predictability (can the user anticipate what the AI will do?), reversibility (if the AI is wrong, how cheap is the correction?), and proof of competence (has the AI earned trust in narrow tasks before being given broader responsibility?).

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Wrong mental model — trust = accuracy</div>
    Air Canada's chatbot was confident. It gave specific information (you can apply retroactively within 90 days). No disclaimer, no escalation, no uncertainty signal. The user trusted it because it sounded authoritative. The information was wrong. The user made an irreversible financial decision. Trust destroyed — legally and publicly.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Right mental model — trust = predictability + reversibility</div>
    GitHub Copilot is correct 43% of the time on first suggestion. 1.3M paid subscribers. Users trust it because rejection costs one Escape keypress. The AI is never surprising, never irreversible, always shows its suggestion before acting. Predictable beats perfect — every time.
  </div>
</div>

The core insight: trust is not built by being right — it is built by being predictable when right and cheap to correct when wrong. A system that is 95% accurate but applies changes without showing them first will feel less trustworthy than a system that is 43% accurate but shows every suggestion before applying it.`,

    howSolved: `The Builderlab trust framework defines three layers and five principles that translate into concrete product decisions.

<strong>The three-layer trust model</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Layer</div><div>What it means</div><div>Production example</div>
  </div>
  <div class="ex-table-row">
    <div>1. Predictability</div>
    <div>Users can anticipate what the AI will do next. No surprises. Behaviour follows a consistent, learnable pattern.</div>
    <div>GitHub Copilot: suggestion always appears as ghost text before anything changes. User knows exactly what will happen if they press Tab. No variability.</div>
  </div>
  <div class="ex-table-row">
    <div>2. Reversibility</div>
    <div>Every AI action can be undone cheaply. Failure has no lasting cost. Users have the courage to experiment because mistakes are not permanent.</div>
    <div>Booking.com Smart Filter: applied filters are shown to the user and editable with one click. AI interpreted "rooftop bar" wrong — user clicks to remove that filter. Done. No consequence.</div>
  </div>
  <div class="ex-table-row">
    <div>3. Proof of competence</div>
    <div>AI earns trust by performing well in a narrow scope before being given broader responsibility. Trust is extended incrementally — not assumed.</div>
    <div>GitHub Copilot: started with single-line autocomplete before completing full functions. Each capability extension followed demonstrated competence at the previous level.</div>
  </div>
</div>

<strong>The five design principles</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Principle</div><div>What it means in practice</div><div>Anti-pattern (Air Canada)</div>
  </div>
  <div class="ex-table-row">
    <div>Make behaviour visible</div>
    <div>Show the user what the AI did and why. Applied filters visible. Suggested code visible. Memory items visible.</div>
    <div>Air Canada chatbot: user had no visibility into where the policy information came from. Could not verify. Could not cross-check.</div>
  </div>
  <div class="ex-table-row">
    <div>Build for reversibility</div>
    <div>Every AI action must have an undo path. One-click correction. No irreversible AI decisions without explicit user confirmation.</div>
    <div>Air Canada: user made an irreversible flight booking based on AI output. No escalation prompt. No confirmation step. No reversal possible.</div>
  </div>
  <div class="ex-table-row">
    <div>Keep explanations human</div>
    <div>Explanations in plain language. Not "confidence score: 0.87" — but "This recommendation is based on your recent searches." Users calibrate trust based on explanations they understand.</div>
    <div>Air Canada: no explanation at all. Just a confident statement. Authoritative tone without justification creates false certainty.</div>
  </div>
  <div class="ex-table-row">
    <div>Design safety margins</div>
    <div>For high-stakes AI outputs — add a disclaimer, add a human escalation path, add a confirmation step. Match the safety margin to the cost of being wrong.</div>
    <div>Air Canada: zero safety margin on a financial policy question. No disclaimer, no "verify with an agent," no escalation. The cost of being wrong was borne entirely by the user.</div>
  </div>
  <div class="ex-table-row">
    <div>Show consistent track record</div>
    <div>Trust compounds with repeated correct behaviour. Each interaction that goes well increases user confidence. Each surprise or error resets it. Consistency over time matters more than occasional impressive outputs.</div>
    <div>Air Canada: one wrong answer destroyed trust permanently and publicly. No track record of correct answers was sufficient to recover from a single irreversible failure.</div>
  </div>
</div>

<strong>The trust calibration framework — matching safety margin to stakes</strong>
Article #43 (You're Not Building an AI Product) defines this explicitly:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Precision level</div><div>What AI action it supports</div><div>Safety margin required</div>
  </div>
  <div class="ex-table-row">
    <div>99%+ precision</div>
    <div>Hard automation — AI acts without user confirmation</div>
    <div>Reversibility required. Notification that action was taken.</div>
  </div>
  <div class="ex-table-row">
    <div>80% precision</div>
    <div>Clear suggestion — AI proposes, user confirms</div>
    <div>Suggestion shown before application. One click to accept or reject.</div>
  </div>
  <div class="ex-table-row">
    <div>40% precision</div>
    <div>Soft nudge — AI surfaces information, user decides independently</div>
    <div>Framed as "you might want to consider" — not as a recommendation.</div>
  </div>
  <div class="ex-table-row">
    <div>Below 40%</div>
    <div>Do not act on this output</div>
    <div>Escalate to human. Surface uncertainty explicitly.</div>
  </div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — New AI feature adopter</div>
  Opens a product with an AI feature for the first time. Failure mode if trust is not designed: first AI suggestion is wrong, user sees the correction cost is high, decides the feature is not worth the risk, never uses it again. With reversibility-first design: first suggestion is wrong, user presses Escape (one keystroke), nothing changed, tries again. Trust survives the first failure because the failure was cheap.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — High-stakes decision maker</div>
  Using AI to make a consequential decision (flight booking, medical information, financial advice). Failure mode with no safety margin: AI gives confident wrong answer, user acts, consequence is irreversible. Air Canada case exactly. With designed safety margins: AI gives answer + disclaimer + escalation path. User verifies before acting. Even if the AI is wrong, the consequence is avoided.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Sceptical power user</div>
  Technically sophisticated user who is skeptical of AI. Failure mode if AI acts automatically: user feels control has been removed, rejects the feature entirely even if accurate. With ghost-text design (GitHub Copilot): AI never acts without explicit Tab press. User retains full control. Scepticism converts to adoption because the user is never surprised by the AI acting without permission.
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Reversibility limits what AI can automate.</strong> If every AI action requires a confirmation step, the AI cannot truly automate anything — it can only accelerate human decisions. True automation (AI acts, human finds out later) requires either very high precision (99%+) or very low stakes (reversible with trivial effort). Most products are in the middle — requiring suggestion-and-confirm design rather than true automation. This is a product positioning decision, not a failure of technology.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Predictability can conflict with capability expansion.</strong> A predictable AI is one whose behaviour users have learned. Expanding capability (new features, new models, new interaction patterns) breaks learned user mental models and resets trust. GitHub Copilot's expansion into Workspace (multi-file, multi-step changes) required users to relearn what the AI might do — resetting the trust curve that single-line autocomplete had built. Every capability expansion is also a trust regression event.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Safety margins reduce engagement metrics in the short term.</strong> Adding a disclaimer or escalation path to a chatbot response reduces the fraction of users who take action immediately — some will go to a human agent instead. This looks like lower chatbot "deflection rate" or lower "self-serve completion" in the short term. The right metric is longer-term: did the users who went through the safety margin make better decisions? Did trust improve? Air Canada optimised for chatbot confidence and paid legally. Safety margins are an investment in trust, not a drag on engagement.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">The Builderlab trust framework gives you the vocabulary to answer any "how do you build a trustworthy AI product" question. Three layers: predictability (users can anticipate what the AI will do), reversibility (failure is cheap), proof of competence (narrow scope first, expand as trust is earned). Five principles: make behaviour visible, build for reversibility, keep explanations human, design safety margins, show consistent track record. The contrast case is always Air Canada: a highly confident chatbot with no safety margin on a high-stakes decision. Predictable beats perfect, every time.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you design an AI feature that sceptical users will adopt?"</div>
  <div class="ex-interview-answer">Three steps from the trust framework:
<br><br>• <strong>Start narrow, earn expansion.</strong> Do not launch with the full capability. Launch with the lowest-stakes, most reversible version. GitHub Copilot started with single-line completions. Users trusted single lines before they trusted full function bodies. Proof of competence in narrow scope precedes broader trust.
<br>• <strong>Make every AI action visible before it takes effect.</strong> Ghost text (Copilot), visible applied filters (Booking.com), shown memory items (Meta AI). The user must be able to see what the AI is about to do. Surprises kill trust.
<br>• <strong>Make correction trivially cheap.</strong> One Escape key. One filter click. One delete. If correction requires effort, users will not experiment. If they do not experiment, they do not learn to trust.
<br><br>Indian context: UPI / PhonePe / Paytm users are highly sceptical of AI making financial decisions on their behalf. Any AI feature touching money must be suggestion-only (user confirms) rather than automated — regardless of model accuracy. The correction cost of a wrong financial transaction is too high for automation trust to build quickly.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you decide how much autonomy to give an AI agent?"</div>
  <div class="ex-interview-answer">Match autonomy to reversibility and precision — the calibration framework:
<br><br>• <strong>High autonomy + high reversibility = safe.</strong> GitHub Copilot suggests a full function body. If wrong, one Escape key. High autonomy because failure is trivially cheap.
<br>• <strong>High autonomy + low reversibility = unsafe.</strong> A chatbot giving policy advice that leads to irreversible financial decisions. Air Canada exactly. Should have been suggestion + disclaimer + escalation, not autonomous answer.
<br>• <strong>The rule:</strong> Autonomy level must be capped by the reversal cost. If the user cannot easily undo an AI action, the AI should not take that action autonomously — it should suggest and require explicit confirmation.
<br>• <strong>Precision matters too:</strong> 99%+ precision can support automation with notifications. 80% supports suggestion-and-confirm. 40% supports soft nudge only. Never give policy answers at unknown precision with no safety margin.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What metrics do you use to measure user trust in an AI feature?"</div>
  <div class="ex-interview-answer">Three categories — each measuring a different trust dimension:
<br><br><strong>Adoption and retention:</strong>
<br>• Feature return rate — do users come back after their first session? (Trust survives first failure)
<br>• Suggestion acceptance rate over time — does it improve as users learn the AI? (Predictability building trust)
<br><br><strong>Failure response:</strong>
<br>• Post-correction churn rate — what fraction of users abandon the feature after a correction? (Reversal cost signal)
<br>• Escalation rate — how often do users escalate to human rather than trusting the AI? (Safety margin usage)
<br><br><strong>Trust calibration:</strong>
<br>• Acceptance rate on high-stakes vs. low-stakes suggestions — do users calibrate trust to stakes appropriately? If acceptance rate is identical on high and low stakes, users are either over-trusting (dangerous) or under-trusting (feature failing).</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates say "improve model accuracy" when asked how to build user trust in an AI product. Two things wrong:
  <br><br>• <strong>Accuracy and trust are not the same thing.</strong> GitHub Copilot is correct 43% of the time. 1.3M paid subscribers. Air Canada had a confident, specific chatbot. Got sued. Accuracy does not determine trust — the cost of being wrong does. A product that is 60% accurate with trivial correction costs will be more trusted than a product that is 90% accurate with irreversible failures.
  <br><br>• <strong>Trust is a design problem, not a model problem.</strong> The difference between Copilot and Air Canada's chatbot is not model quality — it is design. Ghost text vs. authoritative statement. Reversible vs. irreversible. Visible vs. hidden. These are product decisions, not engineering ones. The PM owns trust design. Asking engineering for a more accurate model is the wrong lever.
</div>`,

    sources: [
      { id: 48, title: 'Enhancing Trust in AI Systems', url: 'https://www.builderlab.ai/p/enhancing-trust-in-ai-systems' },
      { id: 43, title: "You're Not Building an 'AI Product'", url: 'https://www.builderlab.ai/p/youre-not-building-an-ai-product' },
      { id: 111, title: 'GitHub Copilot: Lessons in AI Product Design', url: 'https://www.builderlab.ai/p/github-copilot-lessons-in-ai-product-design' }
    ]
  }
}

,
{
  slug: 'benedict-evans-renting-cold-start',
  company: 'Startups vs. Amazon / TikTok',
  problem: 'Renting the Cold Start — LLMs as World Model APIs',
  oneLiner: 'Amazon and TikTok spent years building recommendation data moats from their own users. A startup today can skip that by calling a general-purpose LLM API — renting the cold start that used to take years and hundreds of millions of users to build',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats', 'Recommendations'],
  sections: {
    problem: `For two decades, building a good recommendation system required solving the cold start problem: you needed user behaviour data to make recommendations, but you needed good recommendations to attract users. Only incumbents with massive user bases (Amazon, TikTok, Netflix) could solve this. Startups without users couldn't build good recommendations, so they couldn't compete.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Pre-LLM world — cold start requires your own data</div>
    Amazon built product recommendations by watching what millions of Amazon customers did on Amazon. TikTok built content recommendations by watching what hundreds of millions of TikTok users watched on TikTok. A startup with 1,000 users had 1,000 users' worth of signal. Their recommendations were weak. Users found better recommendations on Amazon or TikTok. The startup couldn't grow. The moat compounded.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Post-LLM world — rent the cold start via API</div>
    A general-purpose LLM trained on the internet's collective human knowledge already understands that users who buy running shoes are likely interested in running socks, GPS watches, and foam rollers. A startup doesn't need to observe this pattern across their own users — they can infer it from the world model baked into the LLM. The cold start that used to require years and millions of users is now an API call.
  </div>
</div>

This is Benedict Evans's central insight in "AI, Networks and Mechanical Turks": LLMs are essentially world models trained on centuries of human-generated text. They understand products, preferences, behaviours, and relationships — not because they observed your specific users, but because they were trained on everything humans have written about every category of human activity. The "mechanical turk" that built Amazon and TikTok's data moats was human behaviour at scale. For LLMs, that mechanical turk ran for hundreds of years — and now any startup can access the output via API.`,

    howSolved: `Evans's framework breaks the cold start problem into two halves — and explains which half LLMs solve and which half they don't.

<strong>Half 1 — Generic preference knowledge (LLMs solve this)</strong>
Traditional recommendation systems required observing behaviour on your own platform to learn generic preference patterns. "People who buy X also tend to buy Y." "Users who watch genre A often enjoy genre B." These patterns exist in human behaviour broadly — they don't need to be learned from your specific users.

LLMs have absorbed these patterns from the internet. A general-purpose LLM already knows:
<br>• Running shoes correlate with GPS watches and foam rollers
<br>• Users who watch Bollywood romance films often enjoy regional drama
<br>• Buyers of baby monitors tend to be interested in safety gates and childproofing products

A startup can skip the years of data collection required to learn these patterns and access them directly through an LLM API. This is renting the cold start — you borrow the world model instead of building your own.

<strong>Half 2 — Individual preference calibration (LLMs don't solve this)</strong>
The second half of the cold start problem is personalisation: not "what do people like in general" but "what does THIS specific user like." Amazon doesn't just know that running shoe buyers often buy GPS watches — it knows that you, specifically, already own three GPS watches and probably don't need another one. TikTok doesn't just know that users of your demographic tend to like cooking content — it knows from watching your specific scroll patterns that you actually click away from cooking videos after 8 seconds.

This half of the problem still requires your own user data. LLMs cannot substitute for the personalisation signal that comes from observing individual user behaviour on your platform. They give you the population-level prior — not the individual posterior.

<strong>The practical implication for product and strategy</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Question</div><div>Pre-LLM answer</div><div>Post-LLM answer</div>
  </div>
  <div class="ex-table-row">
    <div>How do you build recommendations with no user data?</div>
    <div>You can't — show popular items and wait for data to accumulate</div>
    <div>Use LLM to infer preference patterns from product/content metadata. Personalise as user data accumulates.</div>
  </div>
  <div class="ex-table-row">
    <div>Is a data moat still a moat?</div>
    <div>Yes — proprietary behavioural data was irreplaceable</div>
    <div>Generic preference patterns are no longer a moat. Proprietary individual behavioural signals still are.</div>
  </div>
  <div class="ex-table-row">
    <div>What does a startup need to compete with Amazon/TikTok on recommendations?</div>
    <div>Years of user data or a partnership to acquire it</div>
    <div>LLM API for Day 1 cold start + user-specific data to personalise as they grow</div>
  </div>
</div>

<strong>The "correlation without causation" limitation</strong>
Evans notes that recommendation systems — both traditional and LLM-powered — understand correlation, not causation. Amazon knows that running shoe buyers buy GPS watches. It does not know why. It does not know whether the correlation is causal (running shoes cause GPS watch purchases) or confounded (fitness-oriented people buy both). This is like a dog knowing that the sound of door keys correlates with a walk — without knowing what keys are. LLMs inherit this limitation. They know what co-occurs in human behaviour. They don't know why.

<strong>The broader strategic shift: where leverage lives</strong>
Pre-LLM: leverage lived in your data flywheel. More users → more data → better model → better product → more users.

Post-LLM: that flywheel is partially bypassed at the generic knowledge layer. Leverage now lives in:
<br>• Individual user data that the generic LLM can't replicate
<br>• Proprietary domain knowledge not in the LLM's training data
<br>• Unique workflow integrations that create switching costs independent of model quality`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">Startup founder building a new e-commerce recommendation system</div>
  Launches with 500 products and 200 users. Traditional approach: show bestsellers, wait months for click data, recommendations are generic and unhelpful for the first 6–12 months. Users find Amazon's recommendations better and leave. With LLM cold start: on Day 1, call LLM API with product metadata. LLM infers "users who buy yoga mats often also want yoga blocks and straps." Recommendations feel personalised from day one. Data flywheel starts with a meaningful head start.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">Vertical marketplace competing with Amazon in a niche</div>
  Building a marketplace for professional photography equipment. Pre-LLM: needs 100,000+ photographers' browsing and purchase data to understand cross-product relationships in this niche. Amazon already has this at scale — impossible to compete. Post-LLM: LLM already understands photographer workflows, knows that a Sony A7 buyer likely needs batteries, a cage, and memory cards. Startup has Day 1 recommendations that rival years of Amazon behavioural data — on the generic patterns. Personalisation differentiates as their user base grows.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">~0</div>
    <div class="ex-stat-label">User behavioural data needed for Day 1 generic recommendations — LLM provides the world model</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Hundreds of years</div>
    <div class="ex-stat-label">Of human-generated text the LLM was trained on — the "mechanical turk" that runs in the background</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Renting the cold start means renting generic knowledge — not proprietary insight.</strong> LLM-powered recommendations know what everyone knows. They don't know what's unique about your users. A startup that only ever uses the LLM world model and never builds their own user data layer will always have generic recommendations. The LLM solves the cold start — it doesn't replace the flywheel. Startups that mistake "renting the cold start" for "not needing a data moat" will find that incumbents with rich individual user data outpersonalise them as both scale.</p>

<p style="margin-bottom:0.75rem;"><strong>B. LLMs understand correlation, not causation.</strong> Recommendation quality is limited by the fact that LLMs learned co-occurrence patterns, not causal relationships. This produces recommendations that are plausible but can be wrong in systematic ways. "Users who search for latex gloves also search for latex-free gloves" — both appear in the same corpus, both get similar embeddings, but they represent opposite intent. Correlation-based systems fail on negations, exclusions, and contexts where intent inverts the signal.</p>

<p style="margin-bottom:0.75rem;"><strong>C. The data moat hasn't disappeared — it has shifted.</strong> Evans's insight is not "data moats are dead." It is "the type of data that creates a moat has changed." Generic behavioural patterns (what people typically buy with X) are no longer a moat — the LLM has learned them from the internet. Proprietary individual signals (what this specific user has done, in what sequence, with what outcome) remain a moat. Startups should focus data strategy on capturing the signals LLMs can't access — first-party individual behaviour — rather than trying to rebuild what LLMs already know.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Benedict Evans's cold start insight is the most important strategic framework for AI startups in 2024–2025. For two decades, building good recommendations required a data flywheel only incumbents could afford. LLMs dissolved half of that barrier — the generic preference knowledge half. A startup can now call an API and get Day 1 recommendations that rival what Amazon took years to build on generic patterns. But the individual personalisation half still requires your own data. The strategic question has shifted from "how do we build a data moat?" to "which half of the data moat can LLMs replace — and which half must we still build?"</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you build recommendations for a new Swiggy / Meesho competitor with no users?"</div>
  <div class="ex-interview-answer">Apply Evans's two-half framework:
<br><br><strong>Day 1 — rent the cold start:</strong>
<br>• Call LLM API with restaurant/product metadata: category, cuisine type, price range, location
<br>• LLM infers cross-category patterns: "users who order biryani often reorder from the same restaurant, users who order sushi tend to explore new restaurants more"
<br>• Use these patterns to populate "you might also like" and "popular in your area" with plausible recommendations immediately
<br><br><strong>Day 30 onwards — build the proprietary layer:</strong>
<br>• Capture individual signal: which restaurants this specific user reorders from, what time they order, what they skip
<br>• This signal is what the LLM can't replicate and what creates personalisation that incumbents can't match at the individual level
<br><br>India-specific: Swiggy and Zomato already have the individual data flywheel. A new entrant's only defensible path is a niche where their individual data compounds faster — hyperlocal (one city, deep), specific dietary vertical (vegan, Jain), or B2B food (office catering where order patterns are very different from consumer).</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Is a data moat still a competitive advantage in the AI era?"</div>
  <div class="ex-interview-answer">Yes — but only for the right kind of data. Evans's framework distinguishes two types:
<br><br>• <strong>Generic preference patterns</strong> — what people typically do in a category (running shoe buyers buy GPS watches). LLMs have already absorbed these from the internet. No longer a moat for anyone.
<br>• <strong>Individual behavioural signals</strong> — what this specific user does, in what sequence, with what outcome. LLMs cannot replicate this. Still a strong moat.
<br><br>The strategic implication: stop investing in building what LLMs already know. Invest in capturing the first-party individual signal that LLMs can't access. This means richer user interaction logging, better session data, outcome tracking (did the recommendation lead to repeat purchase?), and proprietary contexts (enterprise knowledge bases, clinical records, legal documents) that never appear in LLM training data.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you think about competition between startups and incumbents in AI?"</div>
  <div class="ex-interview-answer">Evans's framework gives three structural observations:
<br><br>• <strong>The first moat (generic knowledge) is democratised.</strong> A startup with an LLM API and good product sense can build Day 1 quality that previously required years of scale. This lowers the barrier to building a good v1.
<br>• <strong>The second moat (individual data) still requires scale.</strong> Incumbents with years of individual user behaviour data still have an advantage that can't be bought via API. The cold start is rented — the personalisation flywheel still must be built.
<br>• <strong>The real competitive question is distribution.</strong> Evans is clear: capability gaps between models are converging. The durable advantages are distribution (who reaches users without fighting for attention) and proprietary data (what individual signal no competitor can access). For startups, the question is "which distribution channel can I reach that incumbents can't easily follow?"</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about data moats in the AI era, either say "data moats are dead because LLMs know everything" or "data moats still work exactly the same as before." Both are wrong:
  <br><br>• <strong>"Data moats are dead" is wrong.</strong> LLMs dissolved the generic preference knowledge moat — they know what people typically do in a category. They did not dissolve the individual behavioural signal moat — what this specific user does, in what sequence, remains a durable advantage that no API call replaces.
  <br><br>• <strong>"Data moats work the same" is wrong.</strong> A startup that treats generic preference patterns as something to build from scratch (as they would have pre-LLM) is wasting years and capital on something they can rent for cents per API call. The strategic resource allocation has fundamentally changed — spend on capturing individual signal, not on rebuilding what LLMs already know.
</div>`,

    sources: [
      { id: 69, title: 'AI, Networks and Mechanical Turks', url: 'https://www.ben-evans.com/benedictevans/2025/11/23/ai-networks-and-mechanical-turks' }
    ]
  }
},
{
  slug: 'benedict-evans-subjective-vs-binary',
  company: 'ChatGPT / Midjourney / Cursor',
  problem: 'Subjective vs Binary Tasks — Where AI Can and Cannot Be Trusted',
  oneLiner: 'The most important question before deploying any AI feature is not "how good is the model?" — it is "is this task subjective or binary?" Binary tasks have objectively wrong answers that users cannot catch without re-doing all the work. Subjective tasks have no wrong answers — only better or worse. The deployment rules are completely different.',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design', 'Evals & AI Quality'],
  sections: {
    problem: `Benedict Evans asked ChatGPT 4o: how many people were employed as elevator operators in the USA in 1980? The correct answer — from a specific US Census PDF — is 21,982. ChatGPT gave a confident, plausible-sounding answer. It was wrong.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Binary task — one right answer, wrong answers matter</div>
    "How many elevator operators in 1980?" has one correct answer. The LLM's confident wrong answer is not "a bit off" — it is simply false. The user cannot detect this without doing all the research themselves. If they don't check, they publish a false statistic. If they do check, the AI saved them no time. It either misleads or provides no value. There is no middle ground.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Subjective task — no wrong answers, only better or worse</div>
    "Write me a blog post about elevator operators" has no objectively correct output. The AI's draft might be better or worse, more or less interesting, more or less appropriate for the audience — but it cannot be factually wrong in a way that matters. The user can improve it, reject it, use it as a starting point. The AI always adds some value even when the output is mediocre.
  </div>
</div>

This distinction — binary vs subjective — is the most important framework for deciding where to deploy AI and with what level of autonomy. The mistake most PMs make is treating all AI tasks the same: "the model is X% accurate, so it's good enough to deploy." For subjective tasks, X% accuracy is a useful metric. For binary tasks, X% accuracy is often irrelevant — what matters is whether the user can detect the errors, and at what cost.`,

    howSolved: `Evans's framework divides tasks into two categories with completely different deployment rules.

<strong>The binary vs subjective spectrum</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Task type</div><div>Characteristics</div><div>AI deployment rule</div>
  </div>
  <div class="ex-table-row">
    <div>Purely subjective</div>
    <div>Quality is a spectrum. No objectively wrong answer. User can evaluate output without domain expertise.</div>
    <div>Deploy with high autonomy. User reviews and improves. Even mediocre output has value as a starting point.</div>
  </div>
  <div class="ex-table-row">
    <div>Subjective with quality signals</div>
    <div>Output quality varies but user can tell good from bad without checking underlying facts. Coding, writing, design.</div>
    <div>Deploy with human review. Ghost-text pattern (Copilot) — show before applying. User can evaluate without re-doing the work.</div>
  </div>
  <div class="ex-table-row">
    <div>Binary with expert verifier</div>
    <div>One right answer, but the user is an expert who can quickly detect errors. Medical diagnosis for doctors, code review for engineers.</div>
    <div>Deploy as suggestion with verification. Expert catches errors faster than AI makes them.</div>
  </div>
  <div class="ex-table-row">
    <div>Binary without verifier</div>
    <div>One right answer, and the user cannot detect errors without re-doing all the underlying research or computation.</div>
    <div>Do not deploy with autonomy. Either ground answers in verified sources (RAG) or add mandatory human verification. The elevator operator case.</div>
  </div>
</div>

<strong>The elevator operator test — three questions to ask before deploying any AI feature</strong>
<br>• <strong>Does this task have objectively wrong answers?</strong> If yes, it is binary (at least in part). If no, it is subjective.
<br>• <strong>Can the user detect a wrong answer without re-doing all the underlying work?</strong> If yes, deploy with review. If no — do not deploy autonomously without verification or grounding.
<br>• <strong>What is the cost of a wrong answer reaching a user?</strong> Financial consequence (Air Canada), safety consequence (medical), reputational consequence (published false statistic), or trivial consequence (slightly off creative suggestion)?

<strong>Production examples across the spectrum</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Product</div><div>Task type</div><div>Why it works or doesn't</div>
  </div>
  <div class="ex-table-row">
    <div>Midjourney image generation</div>
    <div>Purely subjective</div>
    <div>Works perfectly. "Generate an image of a mountain at sunset" has no wrong answer. Every output is usable or can be regenerated. Error rate is irrelevant — quality spectrum is what matters.</div>
  </div>
  <div class="ex-table-row">
    <div>GitHub Copilot code completion</div>
    <div>Subjective with quality signals</div>
    <div>Works because engineers can evaluate code quality quickly. A wrong suggestion is visible — the code doesn't compile, or the logic is obviously wrong. Ghost text + Tab-to-accept means error cost is one Escape key.</div>
  </div>
  <div class="ex-table-row">
    <div>Cursor (AI code editor)</div>
    <div>Binary with expert verifier</div>
    <div>Works for experienced engineers. They can catch hallucinated APIs and wrong logic. Does not work well for junior developers who cannot reliably distinguish a plausible-but-wrong implementation from a correct one.</div>
  </div>
  <div class="ex-table-row">
    <div>ChatGPT for specific factual research</div>
    <div>Binary without verifier</div>
    <div>Does not work reliably. "How many elevator operators in 1980?" — user cannot verify without finding the original Census PDF themselves. The AI's confident wrong answer is worse than no answer: it stops the user from looking further.</div>
  </div>
  <div class="ex-table-row">
    <div>AI legal contract review</div>
    <div>Binary with expert verifier</div>
    <div>Works for lawyers reviewing AI-flagged clauses. Lawyer can quickly evaluate whether the AI correctly identified a risk. Does not work for non-lawyers relying on AI to catch contract issues they cannot independently evaluate.</div>
  </div>
</div>

<strong>The grounding solution for binary tasks</strong>
The fix for binary-without-verifier tasks is not a better model — it is architectural. Two approaches:
<br>• <strong>RAG grounding:</strong> Force the model to retrieve and cite the specific source before answering. Air Canada's chatbot should have retrieved the current bereavement policy page and answered only from that document. If the document doesn't contain the answer, say so — don't generate one.
<br>• <strong>Structured output with sources:</strong> Require the model to output both the answer and the source. User can then verify the source themselves. This converts a binary-without-verifier task into a binary-with-verifier task — the user still has to check, but the AI has done the retrieval work.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Researcher relying on AI for specific facts</div>
  Asks ChatGPT for a specific statistic to include in a report. The model gives a confident, plausible answer. It is wrong. The user doesn't check because the answer was specific and confident — it sounded like something a knowledgeable source would say. They publish the false statistic. Failure mode: binary task, no verifier, high cost of being wrong. Right design: model should say "I don't have reliable data on this — here are sources you could check" rather than generating a plausible-sounding wrong number.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Junior developer using AI code editor</div>
  Uses Cursor to implement a feature. AI generates code using a library API that doesn't exist — the function names are plausible but hallucinated. Junior developer doesn't know the library well enough to detect this. Code is shipped with a bug that only surfaces in edge cases. Failure mode: binary task (code either works or it doesn't), user is not an expert verifier. Right design for junior users: always show documentation links alongside generated code, flag when using APIs with low confidence, require test generation alongside implementation.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Creative professional using AI for drafts</div>
  Uses AI to generate a first draft of marketing copy. The output is mediocre — off-brand, generic, missing the key insight. User rewrites most of it. Failure mode: none. This is a subjective task. Even a mediocre draft provided a starting point, saved some time, and was entirely detectable as low quality without domain expertise. The user lost nothing — they just didn't gain as much as they hoped.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">21,982</div>
    <div class="ex-stat-label">Elevator operators in the USA in 1980 — the correct answer ChatGPT 4o got wrong with full confidence</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">4</div>
    <div class="ex-stat-label">Task categories in Evans's framework — purely subjective, subjective with quality signals, binary with verifier, binary without verifier</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. The binary/subjective distinction is a spectrum, not a binary.</strong> Most real tasks have both binary and subjective components. A legal brief must be factually accurate (binary) and persuasively argued (subjective). A medical note must correctly record the diagnosis (binary) and communicate clearly to the next clinician (subjective). The PM's job is to identify which component is dominant and which failure mode has higher cost — then design the AI interaction model around the dominant risk.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Expert verifier availability changes the deployment decision.</strong> The same binary task can be safely deployed with AI assistance in one context and dangerously deployed in another. Code review with a senior engineer verifying: deploy AI assistance. Code review by a junior developer who cannot catch hallucinated APIs: do not deploy without guardrails. The task is identical — the verifier changes the risk profile entirely. AI product design must account for who actually uses the product, not just what the product is theoretically capable of.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Confident wrong answers are worse than admitted ignorance.</strong> For binary tasks without verifiers, the worst AI failure mode is not refusing to answer — it is answering confidently and wrongly. A confident wrong answer stops the user from searching further. An honest "I don't know, but here are sources" keeps the user in a productive search mode. Calibrated uncertainty — the model knowing what it doesn't know — is more valuable than high average accuracy for binary tasks where the user cannot verify.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Evans's subjective vs binary framework is the most practical tool for any PM deciding where and how to deploy AI. The question is not "is the model accurate enough?" — it is "if the model is wrong, can the user catch it without re-doing all the work?" Midjourney: yes — you can see a bad image instantly. ChatGPT answering a specific historical question: no — you'd have to find the original Census PDF yourself. The deployment model must be completely different for these two cases, regardless of the underlying model accuracy.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you decide where to use AI in a product?"</div>
  <div class="ex-interview-answer">Apply Evans's four-category test to every candidate use case:
<br><br><strong>Step 1 — Is the task subjective or binary?</strong>
<br>• Subjective (writing, design, brainstorming): deploy with appropriate review workflow. Even mediocre output has value.
<br>• Binary (specific facts, calculations, policy information): go to Step 2.
<br><br><strong>Step 2 — Can the user verify errors without re-doing the work?</strong>
<br>• Yes (expert user, quick sanity check): deploy with human review. Ghost-text pattern.
<br>• No (non-expert, would need original sources): do not deploy autonomously. Use RAG grounding + source citation. Or surface uncertainty explicitly.
<br><br><strong>Step 3 — What is the cost of an undetected wrong answer?</strong>
<br>• Trivial (slightly off creative copy): deploy.
<br>• Significant (financial decision, medical information, published fact): add safety margin — disclaimer, escalation path, mandatory source citation.
<br><br>India application: PhonePe AI answering "what is my UPI transaction limit?" — binary task, user likely cannot verify without checking RBI guidelines themselves. Must use RAG grounded in current policy, not model-generated answer. Wrong answer → user makes financial decision on false information → liability and trust destroyed.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you not use AI for a task?"</div>
  <div class="ex-interview-answer">Evans gives the clearest answer: do not use AI autonomously when the task is binary, the user cannot verify errors without re-doing all the underlying work, and the cost of wrong answers is significant.
<br><br>Concrete examples of when NOT to deploy AI autonomously:
<br>• Specific regulatory or policy questions (Air Canada bereavement policy, RBI UPI limits) — binary, non-expert user, high cost of being wrong
<br>• Medical dosage information for patients — binary, patient cannot verify, life-safety stakes
<br>• Financial calculations for non-experts — binary, user cannot recheck the maths, financial loss stakes
<br>• Specific historical or statistical facts in a research context — binary, user cannot verify without finding the original source
<br><br>In all these cases: either ground in verified sources (RAG) or be explicit about uncertainty ("I don't have reliable data on this specific question — here are sources to check"). Never generate a confident answer to a binary question the model doesn't reliably know.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you evaluate whether an AI feature is ready to ship?"</div>
  <div class="ex-interview-answer">The standard answer is "run evals, measure accuracy." Evans adds a necessary prior step:
<br><br>• <strong>First: classify the task.</strong> Subjective or binary? If subjective, accuracy metrics are the right measure — what % of outputs are good enough? If binary, accuracy metrics are necessary but not sufficient.
<br>• <strong>For binary tasks: measure error detectability, not just error rate.</strong> What % of wrong answers will users catch? If users catch 90% of wrong answers quickly, an 85% accuracy model is deployable with review. If users catch 10% of wrong answers, a 95% accuracy model still ships dangerous errors at scale.
<br>• <strong>For binary tasks without expert verifiers: require architectural grounding before shipping.</strong> No amount of model accuracy justifies shipping a binary-task AI feature without RAG grounding or source citation when users cannot independently verify answers.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked whether an AI feature is ready to deploy, answer purely on accuracy: "the model is 90% accurate, so it's good enough." Evans's framework shows two things wrong with this:
  <br><br>• <strong>For subjective tasks, 90% accuracy is probably fine.</strong> A writing tool that generates good output 90% of the time is valuable — the user can see the 10% that's bad and fix it.
  <br><br>• <strong>For binary tasks without verifiers, 90% accuracy can be disqualifying.</strong> At scale, 10% wrong answers to specific factual questions — where users cannot detect errors without re-doing the research — means millions of users making decisions on false information. The Air Canada chatbot failure was a binary task (policy question) deployed autonomously with no grounding and no disclaimer. The accuracy of the underlying model was irrelevant — the architectural choice to let it answer binary policy questions without verification was the failure.
  <br><br>The elevator operator test: before any AI deployment, ask "if this model is wrong, will the user know?" If no — change the architecture, not the model.
</div>`,

    sources: [
      { id: 65, title: 'Are Better Models Better?', url: 'https://www.ben-evans.com/benedictevans/2025/1/the-problem-with-better-models' }
    ]
  }
},
{
  slug: 'meta-glasses-always-on-context',
  company: 'Meta (Ray-Ban Glasses)',
  problem: 'AI Glasses as Always-On Context Platform',
  oneLiner: 'Meta is betting that the next AI platform is not a chatbot on a screen but a pair of glasses that sees what you see, hears what you hear, and builds a continuously updating model of your life — making AI ambient rather than summoned',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats', 'AI Design'],
  sections: {
    problem: `Every AI product today requires a deliberate act: open the app, type the question, wait for the answer. The user must interrupt what they are doing to access AI assistance. Meta's glasses strategy is built on a different premise: what if AI runs continuously in the background, building context from everything you see and hear, and surfaces help before you have to ask?

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Current AI paradigm — summoned, isolated</div>
    You are in a meeting, a name comes up you don't recognise. You remember to ask later. You take out your phone, open ChatGPT, type the question, wait. By the time you have the answer, the context is gone. Or: you leave your house and forget your keys. You only discover this when you reach the door. No system saw you walk past the key hook without picking them up.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Meta's glasses paradigm — ambient, anticipatory</div>
    The glasses see the same meeting. When a name comes up, they surface the person's LinkedIn silently in your peripheral vision. When you leave the house, they see you did not pick up your keys — and remind you before you reach the door. AI is not summoned. It is already watching, already knows the context, already building the model of your day.
  </div>
</div>

Mark Zuckerberg's framing: glasses are "the main way that we integrate superintelligence into our day-to-day lives." Not smartphones (require you to look away from the world). Not VR headsets (isolate you from the world). Glasses sit on your face, face the world with you, and let AI run alongside your actual experience — not as a separate mode you switch into.`,

    howSolved: `Meta is building toward always-on contextual AI through three successive hardware generations and a clear software architecture.

<strong>Generation 1 — Ray-Ban Meta (current): on-demand AI</strong>
The existing Ray-Ban Meta glasses have cameras, microphones, and speakers. Users say "Hey Meta" to activate. Meta AI answers questions about what the camera sees, plays music, takes photos, sends messages. Limited to on-demand use — battery runs down to 30 minutes when Live AI (continuous camera feed) is active.

<strong>Generation 2 (in development: Aperol and Bellini): always-on foundation</strong>
Two internally codenamed models extending toward always-on capability:
<br>• Continuous camera feed that builds a 3D map of your environment in real time
<br>• Facial recognition — glasses recognise people you meet, surface their name and context
<br>• Object memory — glasses see what you interact with, building a log of your day
<br>• Extended battery life as the primary engineering constraint to solve before shipping always-on

<strong>Generation 3 (Michael Abrash's vision): full ambient AI</strong>
Meta's Reality Labs Chief Scientist described the target state:
<br>• AI always running in the background — no activation phrase
<br>• Dynamic 3D map of your environment and your movements within it
<br>• Log of everything you see, hear, and interact with throughout the day
<br>• Proactive surfacing: AI alerts you to what matters most without being asked

<strong>The software architecture — four capability layers</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Layer</div><div>What it does</div><div>Current state</div>
  </div>
  <div class="ex-table-row">
    <div>Perception</div>
    <div>Camera + microphone captures continuous stream of what you see and hear</div>
    <div>Live — battery constrained at 30 min continuous. Multi-hour target for Gen 2.</div>
  </div>
  <div class="ex-table-row">
    <div>Understanding</div>
    <div>Multimodal AI processes the stream: recognises people, objects, places, spoken words, text in view</div>
    <div>Live for on-demand queries. Continuous processing requires more efficient models and on-device inference.</div>
  </div>
  <div class="ex-table-row">
    <div>Memory</div>
    <div>Builds and maintains a log of your day — what you saw, who you met, what you forgot, what was said</div>
    <div>Not yet shipped. The most technically complex layer — requires persistent context across hours.</div>
  </div>
  <div class="ex-table-row">
    <div>Anticipation</div>
    <div>AI proactively surfaces relevant information before you ask — based on context, not a query</div>
    <div>Earliest stage. Requires memory layer to be stable first.</div>
  </div>
</div>

<strong>Why glasses and not a phone or earbuds</strong>
Meta has considered multiple form factors. Glasses win on one specific dimension: they face the world the same direction as the user. A phone requires you to hold it up. Earbuds hear but don't see. Glasses have both camera and audio, both face outward, both passive to wear. The ergonomic fit matters for always-on use — a device you wear all day without thinking about it is the only viable form factor for ambient AI. Zuckerberg explicitly contrasts glasses with VR headsets (which isolate) and phones (which distract).

<strong>The competitive position — why Meta has an advantage here</strong>
<br>• <strong>Ray-Ban partnership</strong> — fashion-first design that people actually want to wear. Fashion acceptability is the primary adoption barrier for glasses, not technology.
<br>• <strong>Reality Labs investment</strong> — $40B+ spent on AR/VR infrastructure. The hardware, optics, and battery technology required for always-on glasses is exactly what Reality Labs has been building.
<br>• <strong>Social graph as context layer</strong> — Meta knows who your friends are. When the glasses recognise a face, Meta's social graph provides the name, relationship, and context immediately. Apple, Google, and OpenAI don't have this data asset for personal relationship context.
<br>• <strong>WhatsApp + Messenger as output layer</strong> — AI insights can be surfaced through apps 3 billion people already use daily.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Person who is bad at remembering names</div>
  Meets someone at an event they have met before. Cannot remember their name. Current state: awkward conversation, hoping the person introduces themselves. With Meta glasses: glasses have previously seen this person in a photo or prior meeting. Facial recognition surfaces their name and a one-line context ("met at TechSparks 2023, works at Flipkart") in peripheral vision. User can continue the conversation naturally.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Person managing a busy schedule</div>
  Has five meetings a day with different people across different contexts. Currently: spends 10 minutes before each meeting reviewing notes, LinkedIn profiles, and past email threads. With ambient AI glasses: before walking into a room, glasses surface a brief context summary — who is in the meeting, what was discussed last time, any open items. Preparation that takes 10 minutes now happens in seconds, without taking out a phone.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Elderly user with memory challenges</div>
  Struggles to remember where they put objects, whether they took their medication, what appointments they have. Current state: relies on family members or written notes. With always-on glasses: glasses log object placement ("keys placed on kitchen counter at 9:14am"), medication was taken ("pill bottle opened at 8:30am"), and upcoming appointments surfaced proactively. AI as cognitive augmentation — not for productivity but for independence.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">30 min</div>
    <div class="ex-stat-label">Battery life with Live AI active on current Ray-Ban Meta — primary constraint for always-on</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">$40B+</div>
    <div class="ex-stat-label">Meta's Reality Labs cumulative investment in AR/VR hardware infrastructure</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3B</div>
    <div class="ex-stat-label">Daily active users across Meta's family of apps — the distribution layer for glasses AI outputs</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">&lt;5 years</div>
    <div class="ex-stat-label">Zuckerberg's estimate for when always-on contextual AI glasses will arrive</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Always-on camera is the most significant privacy risk in consumer AI history.</strong> A device that continuously records what you see means recording other people without their consent — in restaurants, offices, homes, and public spaces. The Aperol/Bellini leak triggered immediate public reaction: "I don't care how useful it is, I'm never turning it on." Meta must solve not just technical privacy (where does the data go?) but social privacy (how do people around you know they're being recorded?). An LED indicator that shows the camera is active is legally required in some jurisdictions and socially required in most contexts.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Facial recognition creates the most direct surveillance concern.</strong> Knowing the name of everyone around you is useful for the wearer — and terrifying for everyone else. Two Harvard students built a prototype that used Meta's current glasses + facial recognition to identify strangers in public. The capability exists today. Meta has not enabled it commercially — regulatory and social backlash risks are too high. Zuckerberg has acknowledged this directly: the technology is ready but the social norms and legal frameworks are not. This tension does not resolve easily.</p>

<p style="margin-bottom:0.75rem;"><strong>C. The battery problem is currently unsolvable without architectural changes.</strong> Always-on vision AI drains a small wearable battery in 30 minutes. Solving this requires either dramatically more efficient on-device inference (requires custom silicon that doesn't yet exist at wearable scale), lower-power camera hardware (active research area), or intermittent sampling (glasses watch for 1 second every 5 seconds — reduces capability significantly). Battery life is the engineering constraint that determines when always-on AI glasses are practical, not the AI capability itself.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Fashion acceptability is the primary adoption barrier — not technology.</strong> Google Glass was technically more advanced than Ray-Ban Meta but failed because people didn't want to wear it. Ray-Ban Meta succeeded because it looks like Ray-Ban sunglasses. Every generation of AI glasses must pass the "would I wear this in public?" test before any technical capability matters. This is why the Ray-Ban partnership is strategically more important than any particular AI feature.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Meta's glasses strategy is the most important AI platform bet of the next decade — and it is almost entirely a product design and trust problem, not a technology problem. The capability to build always-on contextual AI glasses exists today. The battery exists today (barely). The AI models exist. What doesn't exist is a product that people will wear all day, that people around the wearer will accept, and that regulators will permit. Meta's bet is that solving these three design and social problems — form factor, social acceptability, and privacy — will unlock the next AI platform. The technology is necessary but not sufficient.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the next big AI platform after smartphones?"</div>
  <div class="ex-interview-answer">Meta's thesis is the clearest answer: ambient wearables — glasses primarily, earbuds secondarily.
<br><br>Three reasons glasses win over other form factors:
<br>• <strong>Always-worn without friction</strong> — unlike phones (must be held) or headsets (must be worn deliberately), glasses are worn all day as default
<br>• <strong>Same field of view as the user</strong> — camera faces what you face. Phone camera requires deliberate pointing.
<br>• <strong>Audio + visual together</strong> — earbuds hear but don't see. Phones see but require attention. Glasses do both passively.
<br><br>The platform analogy: whoever controls the glasses OS controls the AI context layer of your physical life — the same way iOS controls the app layer of your digital life. Meta is trying to be that platform before Apple, Google, or OpenAI gets there.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design a privacy-preserving always-on AI feature?"</div>
  <div class="ex-interview-answer">Apply the trust framework to ambient AI — where the stakes are highest:
<br><br>• <strong>Visible signal when recording:</strong> LED indicator always on when camera is active. No exceptions. Social contract requires others to know they are being recorded.
<br>• <strong>On-device processing only for personal data:</strong> Facial recognition, conversation context, location — process on device, never send to cloud. Same as Apple's on-device AI principle applied to glasses.
<br>• <strong>Explicit opt-in for each capability:</strong> Memory of objects: opt-in. Facial recognition of strangers: opt-in. Proactive alerts: opt-in. Never default-on for capabilities that affect others.
<br>• <strong>User-controlled memory log:</strong> Everything the glasses remember about your day should be viewable, searchable, and deletable by you. Same as Meta AI's explicit memory design.
<br><br>India-specific consideration: India has 1.4B people in dense urban settings. Always-on glasses in Mumbai local trains or Delhi markets will inevitably record thousands of people per hour. DPDP (India's data protection law) will require explicit consent frameworks for any biometric processing — facial recognition in public spaces may be entirely prohibited for private companies.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is Meta's competitive moat in AI hardware?"</div>
  <div class="ex-interview-answer">Three layers — none individually decisive, together significant:
<br>• <strong>Ray-Ban brand + distribution:</strong> Fashion acceptability is the hardest part of the glasses problem. Ray-Ban is one of the world's most recognised eyewear brands. This is not replicable quickly — Apple has no eyewear brand, Google Glass burned the Google brand in this space, OpenAI has no hardware heritage.
<br>• <strong>Social graph as context:</strong> When glasses recognise a face, who provides the name and relationship context? Meta knows 3 billion people's social connections. Apple, Google, and OpenAI do not have this personal relationship data at scale.
<br>• <strong>$40B Reality Labs investment:</strong> Hardware development cycles are long and expensive. Meta has been investing in optics, displays, battery technology, and custom silicon for AR/VR for a decade. This infrastructure directly applies to glasses. A new entrant would need a decade and tens of billions to reach the same hardware capability baseline.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about AI wearables or the next AI platform, describe an improved smartphone with voice AI or a better version of Alexa. Two things wrong:
  <br><br>• <strong>Voice-only AI is not ambient AI.</strong> "Hey Alexa" requires deliberate summoning — you must interrupt what you are doing, wait for the device to respond, and speak a command. This is not ambient. Ambient AI sees and hears continuously, builds context over time, and surfaces insights without being asked. The difference is fundamental: one is a new interface for old AI, the other is a new paradigm entirely.
  <br><br>• <strong>The hard problem is design and trust, not capability.</strong> Most candidates frame the glasses problem as "we need better AI models." The AI is ready. The hard problems are: will people wear it all day (form factor), will people around the wearer accept it (social contract), and will regulators permit always-on facial recognition in public (legal). These are product and strategy problems, not model problems. A PM who only talks about AI capability misses the actual challenge.
</div>`,

    sources: [
      { id: 42, title: 'AI Strategy Case Studies for Product Managers', url: 'https://www.technomanagers.com/p/ai-strategy-case-studies-for-product' }
    ]
  }
},
{
  slug: 'ai-pricing-models',
  company: 'Zendesk / Cursor / Decagon / Intercom',
  problem: 'AI Pricing Models — 4 Archetypes and When to Use Each',
  oneLiner: 'Seat-based pricing is dying in AI — per-seat dropped from 21% to 15% of SaaS in 12 months while hybrid surged to 41%. The reason: AI automates work, reducing the number of users who need access. A pricing model that charges per seat gets penalised as AI makes the product more valuable. The right model depends on what value the AI actually delivers — and whether that value is measurable',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Strategy & Moats', 'AI Design'],
  sections: {
    problem: `Traditional SaaS pricing had one dominant model: charge per seat (per user per month). This worked because software value scaled with the number of people using it. More users = more value to the company = more revenue.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Per-seat model — breaks when AI reduces users</div>
    Zendesk charges $115/seat/month for customer support software. A company with 50 support agents pays $5,750/month. AI resolves 70% of tickets automatically — the company needs only 15 human agents. Now they pay $1,725/month. Zendesk's product became dramatically more valuable (70% fewer tickets requiring human work) and their revenue fell 70%. The pricing model punishes the vendor for delivering value.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">Outcome-based model — revenue aligns with value</div>
    Zendesk charges per successful AI resolution instead of per seat. The company with 50% AI resolution rate pays more than before — because the AI is resolving tickets the software wasn't previously handling. As AI handles more tickets, Zendesk earns more. Revenue scales with value delivered. Vendor and customer interests align.
  </div>
</div>

The root problem: AI changes what "usage" means. Traditional software is used by humans — more users = more usage = more value. AI software automates work humans used to do — more AI automation = fewer humans needed = fewer seats purchased. Per-seat pricing made sense when value came from human access. It breaks when value comes from automated outcomes.`,

    howSolved: `Four pricing archetypes have emerged. Each is optimised for a different value delivery model. Most mature AI products land on hybrid — combining elements of multiple models.

<strong>The four archetypes</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Model</div><div>What you charge for</div><div>Best when</div><div>Production example</div>
  </div>
  <div class="ex-table-row">
    <div>Seat-based</div>
    <div>Per user per month — access to the product</div>
    <div>AI augments human work but doesn't replace it. Value scales with number of users. Output quality varies by user skill.</div>
    <div>Cursor ($20/seat/month) — AI coding assistant. Engineer still does the work; AI makes them faster. Number of engineers = number of seats.</div>
  </div>
  <div class="ex-table-row">
    <div>Usage-based</div>
    <div>Per API call, per token, per conversation, per task run</div>
    <div>AI does discrete, measurable units of work. Consumption varies widely across customers. Variable costs scale with usage.</div>
    <div>OpenAI API (per token), Decagon (per conversation) — each AI interaction is a discrete unit with a clear cost. Customer pays for what they consume.</div>
  </div>
  <div class="ex-table-row">
    <div>Outcome-based</div>
    <div>Per successful result — ticket resolved, lead converted, contract signed</div>
    <div>AI delivers a clear, measurable business outcome. Vendor and customer interests align. Outcome is attributable to the AI.</div>
    <div>Zendesk and Intercom (per successful AI resolution) — only charge when the AI actually resolves the ticket without human intervention.</div>
  </div>
  <div class="ex-table-row">
    <div>Hybrid</div>
    <div>Base subscription (access) + usage overage + optional outcome fees</div>
    <div>Most AI products — provides revenue predictability for vendor and cost predictability for customer, with upside as usage grows.</div>
    <div>Cursor (seat base + usage-based premium model charges), Salesforce Einstein (seat base + outcome-based AI features). Most common model: 41% of SaaS by 2025.</div>
  </div>
</div>

<strong>When each model breaks down</strong>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Model</div><div>Failure mode</div><div>Why it happens</div>
  </div>
  <div class="ex-table-row">
    <div>Seat-based</div>
    <div>Revenue falls as AI automation reduces headcount. Vendor penalised for delivering value.</div>
    <div>Zendesk's 50-seat customer becoming 15-seat customer after AI deployment.</div>
  </div>
  <div class="ex-table-row">
    <div>Usage-based</div>
    <div>Unpredictable bills. Customer usage spikes → surprise invoice → trust breakdown.</div>
    <div>A startup using OpenAI API for a viral feature gets a $50,000 bill they didn't budget for. Churn follows.</div>
  </div>
  <div class="ex-table-row">
    <div>Outcome-based</div>
    <div>Attribution disputes. What counts as a successful resolution? Did the AI cause it or would it have happened anyway?</div>
    <div>Customer says "the AI gave a wrong answer and the user worked it out themselves — that's not a resolution." Vendor says "the AI touched it — that's a resolution." Legal dispute.</div>
  </div>
  <div class="ex-table-row">
    <div>Hybrid</div>
    <div>Complexity. Customers can't easily predict their bill. Sales cycles lengthen because procurement needs to model three cost components.</div>
    <div>A CFO reviewing a hybrid AI contract needs to model base + estimated usage + expected outcomes across 12 months. Every assumption is uncertain.</div>
  </div>
</div>

<strong>The a16z framework — AI-native vs. AI-added products price differently</strong>
A16z identified a key pattern: AI-native companies (Cursor, Decagon, ElevenLabs) tend toward usage or outcome-based pricing from day one. Companies that added AI to existing products (Zendesk, Notion, Canva) layer AI pricing on top of existing seat structures — producing hybrid models by default.

The strategic implication: if you are building AI-native, you have the freedom to choose the right model from scratch. If you are adding AI to an existing product, you are constrained by your existing customer contracts and pricing expectations — leading to hybrid as the practical default.

<strong>Market data — the pricing shift</strong>
<br>• Seat-based pricing: 21% → 15% of SaaS companies (2024 to 2025, 12 months)
<br>• Hybrid pricing: 27% → 41% of SaaS companies (same period)
<br>• Only 5% of AI projects reach production — pricing model mismatch is one of the most common reasons projects stall at procurement`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Enterprise buyer evaluating an AI customer support product</div>
  Has 50 support agents, considering an AI product that will automate 60% of tickets. Failure mode with per-seat pricing: buys 50 seats, deploys AI, reduces team to 20 agents, cancels 30 seats. Vendor loses 60% of contract value. Buyer is satisfied, vendor is not. With outcome-based pricing: buyer pays per resolved ticket. As AI resolves more tickets, vendor earns more. Incentives align — vendor wants AI to work, buyer wants AI to work.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Startup using usage-based API pricing</div>
  Builds a consumer app on OpenAI API. Feature goes viral. 100,000 users in a week. Gets a $50,000 API bill they didn't budget for. Failure mode: usage-based pricing with no cap creates existential billing risk for startups with variable traffic. Fix: usage cap + alert at 80% of budget. Or: hybrid with base access fee covering predictable usage + overage for spikes.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Procurement team evaluating hybrid AI pricing</div>
  Receives a proposal: $5,000/month base + $0.50/API call + $10/successful resolution. Cannot model total cost without knowing expected API calls and resolution rate. Procurement requires three different budget scenarios before approval. Sales cycle extends from 2 weeks to 6 weeks. Failure mode: hybrid pricing complexity delays and sometimes kills deals at procurement. Fix: offer a simplified tier (e.g., flat fee for up to X resolutions, then per-resolution above) that gives predictability without sacrificing value alignment.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">21%→15%</div>
    <div class="ex-stat-label">Seat-based pricing share of SaaS — dropped in 12 months as AI made per-seat model unviable</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">27%→41%</div>
    <div class="ex-stat-label">Hybrid pricing adoption — fastest growing model as vendors seek revenue predictability + value alignment</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">40%</div>
    <div class="ex-stat-label">Lower gross margins for companies sticking with per-seat pricing for AI products vs. usage/outcome models</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">5%</div>
    <div class="ex-stat-label">Of AI projects that reach production — pricing model mismatch is one of the top reasons projects stall</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Outcome-based pricing requires outcome definition agreement before signing.</strong> "Successful resolution" sounds simple. In practice: does it count if the user rates the AI answer 3/5 stars? Does it count if the ticket is resolved but the user reopens it 3 days later? Does it count if the AI gave a partial answer and the user found the rest themselves? Every ambiguity in the outcome definition becomes a billing dispute at scale. The contract must define success criteria with surgical precision — and both sides must agree before deployment, not after.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Usage-based pricing requires cost visibility tooling.</strong> The primary reason usage-based pricing creates customer anxiety is opacity — customers don't know how much they're spending until the bill arrives. The fix is tooling: real-time cost dashboards, budget alerts at 50%/80%/100% of budget, and automatic caps. Vendors who offer usage-based pricing without cost visibility tooling have dramatically higher churn than those who do. Cost visibility is a product feature, not an afterthought.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Hybrid pricing wins on revenue but loses on sales cycle simplicity.</strong> Hybrid models capture more total revenue by combining base predictability with usage upside. But they add complexity to procurement. Enterprise deals that should close in 30 days extend to 90 days because finance teams can't sign off without modelling three cost components across 12-month scenarios. A simplified hybrid (flat monthly fee covering a defined usage envelope, with overages above that threshold) reduces procurement friction while maintaining the model's revenue advantages.</p>

<p style="margin-bottom:0.75rem;"><strong>D. The right pricing model changes as the product matures.</strong> Early stage: seat or flat usage is simplest — reduces friction to adoption. Growth stage: hybrid captures more revenue as customers' usage patterns become clearer. Scale stage: outcome-based becomes viable once attribution is well defined and customers trust the measurement. Most products start seat or usage and migrate toward hybrid or outcome as they scale. Pricing model evolution should be planned from the start — changing pricing on existing customers is extremely difficult.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">AI pricing is not a packaging decision — it is a business model decision. The wrong pricing model doesn't just leave money on the table: it actively misaligns vendor and customer incentives. Zendesk's per-seat pricing penalises them when AI reduces agent headcount — the product works better, they earn less. Outcome-based pricing flips this: the better the AI works, the more the vendor earns. The PM's job is to find the model where vendor incentives and customer value align — then design the contract, tooling, and measurement infrastructure to make that model work.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you price an AI customer support product for Swiggy / Zomato / Flipkart?"</div>
  <div class="ex-interview-answer">Apply the outcome-based model with a hybrid fallback:
<br><br><strong>Primary model — per successful resolution:</strong>
<br>• Define "successful resolution" precisely before signing: ticket closed, user did not reopen within 48 hours, user satisfaction score ≥ 4/5
<br>• Price: ₹15–25 per successful AI resolution (vs. ₹200–400 per human agent resolution — clear ROI story)
<br>• Cap at 150% of expected volume to prevent billing shock on viral events
<br><br><strong>Fallback — hybrid if outcome attribution is contested:</strong>
<br>• Base: ₹X/month for access + up to 10,000 AI conversations
<br>• Overage: ₹Y per conversation above 10,000
<br>• This gives Swiggy predictable base cost and Zomato the flexibility to scale during peak seasons (Diwali, IPL, Big Billion Day)
<br><br><strong>India-specific consideration:</strong> Indian enterprise procurement teams are highly sensitive to unpredictable bills. Always offer a usage cap option — even if usage-based is the primary model. "Your maximum monthly bill will never exceed ₹X" is often the sentence that closes the deal.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you decide which pricing model to use for an AI product?"</div>
  <div class="ex-interview-answer">Three diagnostic questions:
<br><br>• <strong>Does AI replace human labour or augment it?</strong>
<br>&nbsp;&nbsp;— Replace (fewer humans needed): per-seat will shrink revenue as AI works. Use outcome or usage.
<br>&nbsp;&nbsp;— Augment (same humans, more productive): per-seat can work. Value scales with users.
<br><br>• <strong>Is the outcome attributable and measurable?</strong>
<br>&nbsp;&nbsp;— Yes (ticket resolved, contract signed, lead converted): outcome-based is viable.
<br>&nbsp;&nbsp;— No (better decisions, improved quality, faster iteration): outcome-based creates attribution disputes. Use usage or seat.
<br><br>• <strong>How variable is usage across customers?</strong>
<br>&nbsp;&nbsp;— Highly variable (startup vs. enterprise usage can differ 100x): usage-based with caps.
<br>&nbsp;&nbsp;— Predictable (similar usage patterns across customers): seat or flat subscription works fine.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the risk of outcome-based pricing for an AI product?"</div>
  <div class="ex-interview-answer">Three risks — each requiring a specific mitigation:
<br><br>• <strong>Attribution disputes:</strong> Customer says the AI didn't cause the outcome. Mitigation: define success criteria in the contract with zero ambiguity. Include measurement methodology and data source.
<br>• <strong>Gaming the metric:</strong> Customer optimises for the measured outcome rather than actual business value. If you charge per ticket closed, agents close tickets faster but quality drops. Mitigation: composite metric (closed + satisfaction score + no reopen within 48h).
<br>• <strong>Revenue unpredictability for the vendor:</strong> Outcome rates vary — if AI quality drops or customer usage pattern changes, revenue drops. Mitigation: hybrid model with a base fee providing revenue floor regardless of outcomes.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked how to price an AI product, default to per-seat pricing because "that's how SaaS works." Two things wrong:
  <br><br>• <strong>Per-seat pricing assumes value scales with users — AI breaks this assumption.</strong> When AI automates work previously done by humans, the company needs fewer humans, buys fewer seats, and the vendor's revenue falls even as the product becomes more valuable. Zendesk's situation is the canonical example. Candidates who default to seat-based for any AI product haven't thought through the automation economics.
  <br><br>• <strong>Pricing model choice is a strategic decision with long-term consequences.</strong> Changing pricing on existing enterprise customers is one of the hardest things in SaaS — contracts lock in models for 1–3 years, and customers resist changes that increase their costs. The pricing model you choose at launch shapes your revenue trajectory, customer relationships, and competitive positioning for years. It is not a marketing decision to be revisited quarterly.
</div>`,

    sources: [
      { id: 46, title: 'Pricing AI: 4 Models and When to Use Each', url: 'https://www.builderlab.ai/p/pricing-ai' },
      { id: 49, title: 'AI Is Driving a Shift Towards Outcome-Based Pricing', url: 'https://a16z.com/newsletter/december-2024-enterprise-newsletter-ai-is-driving-a-shift-towards-outcome-based-pricing/' }
    ]
  }
}

,
{
  slug: 'flipkart-flippi-conversational-commerce',
  company: 'Flipkart',
  problem: 'Conversational E-Commerce Assistant (Flippi)',
  oneLiner: 'Flipkart built Flippi — an end-to-end LLM shopping assistant that takes a user from "I need a laptop for college under ₹50,000" to a compared shortlist with offers highlighted, across multiple conversation turns, without losing context',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Agents', 'AI Design', 'Search'],
  sections: {
    problem: `Flipkart has over 300 million product listings. A user who types "laptop for college" into the search bar gets 50,000+ results, filtered by price, brand, and specs they may not fully understand. The core problem is not retrieval — it is decision fatigue.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — Search bar + filters</div>
    User types "laptop for college under ₹50,000." Gets 8,000 results. Applies brand filter — still 2,000. Doesn't know which specs matter. Opens 15 product pages, reads 30 reviews each, loses track of what they compared. Leaves without buying. Or buys the wrong thing and returns it.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — Flippi conversational assistant</div>
    User tells Flippi: "Need a laptop for college, budget ₹50,000, mostly for coding and some gaming." Flippi asks one follow-up: "Do you prefer Windows or are you open to other options?" Then surfaces 3 shortlisted options with a side-by-side comparison of the specs that matter for their use case, highlights the best current offer on each, and answers follow-up questions across multiple turns — all in a single conversation.
  </div>
</div>

The technical challenge underneath this: multi-turn conversation in e-commerce is fundamentally different from general-purpose chat. Every follow-up message references earlier context ("that second one — does it have good battery?") without restating it. The system must resolve "that second one" to a specific product ID from earlier in the conversation, understand "good battery" means >8 hours for a college use case, and fetch that specific spec from the product database — all in one turn. Standard LLMs have no mechanism for this without careful architecture.`,

    howSolved: `Flippi is built as a modular pipeline — each module owns a narrow, well-defined job. The pipeline runs sequentially for every user message, with each module feeding the next.

<strong>The 7-module pipeline</strong>

<div class="ex-flow">
  <div class="ex-flow-step">User message arrives</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">SAQ: Rewrite message with conversation history → self-contained query</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Coarse Intent Model: Classify into decision type or out-of-scope</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Product Search + ArgsLLM: Retrieve products, extract required attributes</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Decision Assistant / Compare / Summarize: Generate response</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">CX handler if post-purchase query</div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Module</div><div>What it does</div><div>Key design decision</div>
  </div>
  <div class="ex-table-row">
    <div>SAQ (Standalone Query)</div>
    <div>Rewrites the current user message using conversation history to create a fully self-contained query. "That second one — does it have good battery?" → "Does the Lenovo IdeaPad 3 (Product ID: X123) have battery life above 8 hours for a college student doing coding?"</div>
    <div>Started with GPT-3.5 + prompt engineering. Hit a performance ceiling — especially on complex multi-turn references. Switched to fine-tuning an in-house model. GPT-4 eval shows under 1% deviation from human judgment on SAQ accuracy.</div>
  </div>
  <div class="ex-table-row">
    <div>Coarse Intent Model</div>
    <div>Classifies every query into a decision intent (product specs, offers, payment options, comparison, post-purchase support) or Non-Decision (out-of-scope). Routes to the right downstream module.</div>
    <div>A lightweight classifier, not a full LLM call. Fast and cheap. The Non-Decision class is critical — it prevents the system from hallucinating answers to questions it cannot reliably answer (e.g. "is this seller trustworthy?").</div>
  </div>
  <div class="ex-table-row">
    <div>ArgsLLM</div>
    <div>Extracts structured product arguments from the conversation — what specs the user cares about, what constraints they've expressed, what they've already rejected and why. Builds a structured profile of what this user needs.</div>
    <div>Enables personalised filtering: a user who says "nothing too heavy, I carry it to college daily" gets weight as a hard constraint even if they never explicitly said "under 2kg." ArgsLLM infers the implicit requirement.</div>
  </div>
  <div class="ex-table-row">
    <div>Decision Assistant (DA)</div>
    <div>RAG-based Q&A over product pages. Fetches the specific product detail, answers the specific question. "Does it have Thunderbolt support?" — DA retrieves the spec sheet, finds the answer, responds factually.</div>
    <div>Grounded in product data — never generates specs from model knowledge. If the spec isn't in the product page, DA says so rather than hallucinating.</div>
  </div>
  <div class="ex-table-row">
    <div>Compare</div>
    <div>Side-by-side comparison of 2–3 products on the dimensions the user has expressed interest in. Does not compare all specs — only the ones relevant to this user's stated use case.</div>
    <div>Context reduction: product pages can be 10,000+ tokens each. Compare module extracts only the relevant attributes before passing to the LLM — dramatically reduces token cost and improves response quality.</div>
  </div>
  <div class="ex-table-row">
    <div>CX / Post-Purchase</div>
    <div>Handles order status, return requests, refund queries — routing to Flipkart's CX system when live data is needed.</div>
    <div>Separates pre-purchase (product discovery) from post-purchase (order management) flows, which have completely different data sources and resolution paths.</div>
  </div>
</div>

<strong>The fine-tuning decision for SAQ</strong>
This is Flippi's most important engineering insight. SAQ is the module that enables multi-turn — without it, every message is interpreted in isolation and references to prior conversation break. GPT-3.5 with prompt engineering could handle simple references but failed on complex multi-turn chains. Fine-tuning an in-house model gave Flipkart three advantages: better accuracy on their specific e-commerce conversation patterns, lower latency (smaller model), and lower cost at scale. The decision mirrors Honeycomb's fine-tuning choice — the task (query reformulation in a specific domain) was not solvable by prompting alone.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Value-driven shopper (core Flipkart user base)</div>
  Wants the best deal but doesn't know how to evaluate specs. Failure mode with search: overwhelmed by results, applies wrong filters, picks based on price alone, gets an underpowered product. With Flippi: tells it their use case in plain language. Flippi surfaces the ArgsLLM-filtered shortlist and highlights which product has the best current offer for their specific requirements. Decision made confidently in one conversation.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Comparison paralysed shopper</div>
  Opens 10 browser tabs for different laptops. Can't decide because every product page emphasises different specs. Failure mode: decision fatigue, tab closure, abandonment. With Flippi Compare: "Compare the first two you showed me on battery, weight, and price." Gets a structured side-by-side only on the three dimensions they care about — not 40 specs that confuse rather than help.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Tier 2/3 user unfamiliar with e-commerce specs</div>
  Doesn't know what RAM, SSD, or display resolution means. Failure mode with search and filters: meaningless spec numbers with no guidance on what's good enough for their use case. With Flippi: describes their actual usage ("videos, WhatsApp, some Excel") in natural language. Flippi translates their use case into spec requirements they never had to name, and explains recommendations in plain language.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">&lt;1%</div>
    <div class="ex-stat-label">Deviation between GPT-4 evaluation and human judgment on SAQ module accuracy</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">7</div>
    <div class="ex-stat-label">Specialised modules in the pipeline — each independently evaluable and improvable</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Fine-tuned</div>
    <div class="ex-stat-label">SAQ model — switched from GPT-3.5 prompting to in-house fine-tuned model after hitting performance ceiling</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Modular pipeline adds latency at each step.</strong> Every user message passes through SAQ → Intent → Search → ArgsLLM → Response generation. Each module adds latency. For a conversational product with real-time interaction expectations, this compounds quickly. Flipkart mitigates with a lightweight Intent classifier (not a full LLM call), parallel execution where modules don't depend on each other, and context caching for repeated product lookups within the same session.</p>

<p style="margin-bottom:0.75rem;"><strong>B. SAQ fine-tuning requires domain-specific training data.</strong> The SAQ module's job — rewriting queries with e-commerce conversation history — requires training data in the form of (conversation history, current query, correct rewrite) triples. This data must come from real Flipkart conversations, not general-purpose datasets. Flipkart needed to build an annotation pipeline to create this data before fine-tuning was possible. Any platform replicating this architecture must invest in domain-specific annotation first.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Context reduction is a cost lever, not just a quality lever.</strong> Product pages on Flipkart can be 10,000+ tokens. Passing three full product pages into a comparison model would cost 30,000+ input tokens per comparison query. Flippi's Compare module extracts only the relevant attributes before the LLM call — reducing input tokens by 80%+ and improving response quality by removing irrelevant noise. Context reduction is simultaneously a cost optimisation and an accuracy improvement.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Non-Decision classification prevents hallucination but increases user friction.</strong> The Coarse Intent classifier's Non-Decision class routes out-of-scope queries away from the LLM. This prevents Flippi from hallucinating answers to questions it can't reliably answer. But it also means users who ask valid questions that fall outside Flippi's current scope ("is this seller verified?") get a "I can't help with that" response — which can feel unhelpful. Expanding scope requires expanding the CX system integrations, not just the LLM's willingness to answer.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Flippi is the most important Indian example of conversational commerce done right — and it teaches the key architectural lesson: multi-turn conversation in e-commerce requires a dedicated query reformulation module (SAQ). Without it, every message is interpreted in isolation and any reference to prior conversation breaks. This is the single hardest engineering problem in building a shopping assistant, and Flipkart's decision to fine-tune a dedicated SAQ model — after hitting GPT-3.5's ceiling — is the right call for any production system at scale.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design an AI shopping assistant for Flipkart / Meesho / Amazon India"</div>
  <div class="ex-interview-answer">Use Flippi's 7-module pipeline as the reference architecture:
<br><br><strong>Non-negotiable modules:</strong>
<br>• <strong>SAQ</strong> — multi-turn only works if every message is rewritten with full conversation context. Start with GPT-3.5 prompting, plan to fine-tune when you hit the ceiling.
<br>• <strong>Intent classifier</strong> — lightweight, fast. Routes to the right module. Prevents hallucination via Non-Decision class.
<br>• <strong>Context reduction</strong> — never pass full product pages to the LLM. Extract only relevant attributes first.
<br><br><strong>India-specific considerations:</strong>
<br>• Meesho Tier 2/3 users describe products in regional terms — "blue kurta like the one in the ad" requires image + text understanding beyond Flippi's current scope
<br>• Price sensitivity is extreme — the offer detection module (ArgsLLM + current offer highlight) is more valuable here than in any other market
<br>• Hindi + English code-mix queries are common ("laptop chahiye for college under 50k") — SAQ must handle this gracefully without breaking reformulation</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you fine-tune vs. use RAG vs. prompt engineer for an AI product feature?"</div>
  <div class="ex-interview-answer">Flippi answers this with a concrete production example:
<br><br>• <strong>Prompt engineering first:</strong> SAQ started with GPT-3.5 + prompting. Fast to ship, no training data needed. Validates the concept.
<br>• <strong>Fine-tune when you hit the ceiling:</strong> GPT-3.5 SAQ failed on complex multi-turn e-commerce references. The task (query reformulation in a specific domain) requires learning patterns from real conversations — not just following instructions. Fine-tuning with domain-specific data crossed the threshold prompting couldn't.
<br>• <strong>RAG for factual Q&A:</strong> Decision Assistant is purely RAG — retrieves from product pages, never generates specs. Binary task (does this product have Thunderbolt?) where hallucination is unacceptable. RAG grounds every answer in the actual product data.
<br>• <strong>Never mix approaches where roles are clear:</strong> Don't use RAG for SAQ (it's a reformulation task, not a retrieval task) and don't fine-tune for DA (it's a factual lookup task where grounding in source data matters more than pattern learning).</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you handle hallucination in an AI shopping assistant?"</div>
  <div class="ex-interview-answer">Flippi's three-layer answer:
<br><br>• <strong>Architectural grounding:</strong> Decision Assistant never generates product specs from model weights — it retrieves from the product page and answers only from that source. If the spec isn't in the product page, it says so. Same as the Air Canada lesson: binary factual questions must be grounded, not generated.
<br>• <strong>Non-Decision classification:</strong> Questions the system can't reliably answer (seller trust, delivery predictions) are routed to Non-Decision and escalated rather than answered hallucinated. The classifier prevents the LLM from attempting answers it shouldn't.
<br>• <strong>Context reduction prevents confabulation:</strong> When comparison queries get 30,000 tokens of product pages as input, LLMs confabulate — they fill gaps in their context with plausible but wrong specs. Extracting only the relevant attributes eliminates the noise that triggers confabulation.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to design a shopping assistant, describe a single LLM that takes a user query and returns product recommendations. Two things wrong:
  <br><br>• <strong>A single LLM cannot handle multi-turn e-commerce conversation reliably.</strong> References like "that second one" or "something similar but cheaper" require resolving product IDs, understanding constraints implied by earlier messages, and reformulating the query in context. A single LLM call treats each message in isolation — multi-turn breaks immediately. The SAQ module exists specifically because this is a separate, learnable task that requires dedicated architecture.
  <br><br>• <strong>Product pages at scale require context reduction before LLM processing.</strong> Most candidates assume the LLM reads product pages and extracts what's relevant. At scale, this is impractical — 3 product pages × 10,000 tokens = 30,000 input tokens per comparison query. Candidates who skip context reduction will build systems that are expensive, slow, and more prone to confabulation. Context reduction is not an optimisation — it is a design requirement for any production shopping assistant.
</div>`,

    sources: [
      { id: 82, title: 'Flippi: End To End GenAI Assistant for E-Commerce', url: 'https://arxiv.org/abs/2507.05788' }
    ]
  }
},
{
  slug: 'zomato-ai-customer-support',
  company: 'Zomato',
  problem: 'AI Customer Support at Scale',
  oneLiner: 'Zomato (11M tickets/month, 18.5M monthly users) replaced 4,000+ human agents and 8 fragmented tools with an AI support system that doubled CSAT, cut response time 75%, saved $10M+, and handles 85% of tickets automatically — including vision-based refund decisions from food photos',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Agents', 'Evals & AI Quality', 'AI Design'],
  sections: {
    problem: `Zomato processes 750 million+ food delivery orders per year across India. Every order is a potential support ticket — wrong item delivered, cold food, late delivery, damaged packaging. At this scale, customer support is not a cost centre. It is a product experience that directly drives repeat orders and brand trust.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before — fragmented human-heavy operations</div>
    4,000+ outsourced human agents across 8-10 separate platforms (Zendesk, Freshdesk, Zoho, Salesforce, and more). Data silos meant no single view of a customer's history. 60% of tickets were auto-resolved by old rule-based bots — but bot CSAT lagged significantly behind human agent CSAT. The 40% needing human handling required agents to manually switch between tools, losing context at every handoff. Cost: ~$20M/year.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After — AI-native unified support</div>
    85% automation rate. 25% improvement in CSAT. 30% reduction in average handling time. $10M+ cost savings. 11M tickets/month handled through one platform. Vision AI processes food photos to automate 70% of refund decisions. Multi-model orchestration routes each query to the cheapest model that can resolve it accurately.
  </div>
</div>

The core problem was structural: Zomato's support volume (750M+ orders/year) creates a ticket volume no human-only operation can cost-effectively handle. But food delivery support is uniquely complex — it involves real-time order data, image evidence (wrong item photos, tampered packaging), three-party interactions (customer, restaurant, delivery partner), and time-critical decisions (refund now vs. investigate later). A generic chatbot cannot handle this. The AI system had to integrate live order data, understand images, orchestrate multiple models by task complexity, and make consequential decisions (refund or not) in under 10 seconds.`,

    howSolved: `Zomato built an AI support system in two phases — a Together AI phase (2024 conference talk) followed by a deeper Nugget integration (2025) — each adding capability layers on top of the previous.

<strong>Phase 1 — LLM-powered intent + response (Together AI, 2024)</strong>
Zomato's AI engineer Yuvraj Gagneja described building a support bot using Llama models via Together AI's infrastructure at the Fifth Elephant Conference 2024. Key design decisions:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Design choice</div><div>What it does</div><div>Why it matters</div>
  </div>
  <div class="ex-table-row">
    <div>Data filtering before LLM</div>
    <div>Pre-processes the ticket context to remove noise before sending to the model</div>
    <div>Directly reduces tokens processed → lower cost. Together AI's infrastructure enables smaller models where appropriate, widening the cost gap further.</div>
  </div>
  <div class="ex-table-row">
    <div>Model routing by query complexity</div>
    <div>Simple queries (order status, "where is my delivery?") → smaller cheap model. Complex queries (partial refund negotiation, multi-item disputes) → frontier model.</div>
    <div>Performance-cost tradeoff optimised per query type rather than using one model for everything.</div>
  </div>
  <div class="ex-table-row">
    <div>Llama optimised inference</div>
    <div>Together AI's optimised Llama models + scalable infrastructure</div>
    <div>Enabled scaling to 1,000+ messages per minute cost-effectively — something OpenAI API pricing at that volume would not support.</div>
  </div>
</div>

<strong>Phase 2 — Multi-modal orchestration + vision + unified workspace (Nugget, 2025)</strong>
Zomato's full AI support stack adds three capabilities the Phase 1 bot lacked:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Capability</div><div>What it does</div><div>Production impact</div>
  </div>
  <div class="ex-table-row">
    <div>Vision AI — image analysis</div>
    <div>User submits photo of wrong item, spilled food, or damaged packaging. Vision model scans the image, identifies the defect type, detects stock images (fraud), detects brand mismatches.</div>
    <div>Automates 70% of refund decisions. Previously required human agent review of every photo. Now only the 30% the model flags as ambiguous go to humans.</div>
  </div>
  <div class="ex-table-row">
    <div>Multi-modal LLM orchestration</div>
    <div>Every ticket routes to the optimal combination of text, vision, or speech models. Orchestrator selects the cheapest model that meets the accuracy threshold for this ticket type.</div>
    <div>Maximises accuracy at lowest AI cost per ticket. Zomato doesn't pay frontier model rates for tickets a smaller model resolves identically.</div>
  </div>
  <div class="ex-table-row">
    <div>100% quality control + pattern detection</div>
    <div>Every AI conversation audited in real time. Analytics surface ticket nature buckets — patterns in what's going wrong, what the AI is handling well vs. poorly.</div>
    <div>Enables continuous improvement: Zomato's team creates new automation logic from the pattern data. Evals are not a one-time exercise — they run continuously in production.</div>
  </div>
  <div class="ex-table-row">
    <div>Agent co-pilot for human-handled tickets</div>
    <div>For the 15% of tickets that escalate to humans: instant customer profile, issue diagnosis, recommended resolutions, auto-generated chat summaries. Human agent never starts from scratch.</div>
    <div>30% reduction in average handling time even for human-handled tickets. The AI doesn't just replace humans — it makes human agents dramatically faster.</div>
  </div>
</div>

<strong>The three-party complexity that makes this hard</strong>
Food delivery support involves three parties with conflicting interests: the customer (wants refund), the restaurant (disputes responsibility), the delivery partner (disputes responsibility). The AI system must:
<br>• Pull real-time order data — what was ordered, what time, which delivery partner, GPS data of delivery location
<br>• Parse image evidence — was the food actually wrong or does the photo show the correct item?
<br>• Apply SOPs (standard operating procedures) — Zomato's rules for when to refund, when to investigate, when to escalate
<br>• Make a decision in under 10 seconds — food delivery support has near-zero patience latency

<div class="ex-flow">
  <div class="ex-flow-step">User reports issue (text + optional photo)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Intent detection: classify ticket type (wrong item, late delivery, damaged, etc.)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Real-time data pull: order status, GPS, restaurant confirmation</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Vision AI (if photo submitted): defect detection, fraud check</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">SOP matching: what does Zomato's policy say for this exact scenario?</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Resolution: instant refund / credit / escalate to human — with explanation to user</div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — Customer with wrong/missing item</div>
  Orders Chicken Biryani, receives Veg Biryani. Previously: contacts support, describes problem in chat, waits for human agent to review, agent manually checks restaurant's confirmation, decides refund eligibility — 8-10 minutes minimum. With AI support: submits photo of wrong item. Vision AI identifies mismatch in under 5 seconds, cross-references with order details, applies SOP (first incident within time window = auto-refund), issues refund instantly with explanation. Average response time: under 10 seconds.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Repeat fraud claimant</div>
  Small fraction of users repeatedly claim wrong items or missing food to get refunds fraudulently. Failure mode with human agents: hard to detect across fragmented tools — agent sees this ticket, doesn't see the 5 previous similar claims from the same user. With AI: 100% audit trail, pattern detection across all tickets per user, fraud signals (stock images, implausible defect claims) flagged by vision model. Containment rate for legitimate cases improves while fraud is caught more reliably.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — Delivery partner with payment dispute</div>
  Delivery partner disputes pay calculation for a completed order. Previously: separate support queue, different tools, no unified view of the order. With unified omnichannel workspace: all three parties (customer, restaurant, delivery partner) managed through the same platform with the same order data as context. Agent co-pilot surfaces full order history regardless of which party contacts support.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">85%</div>
    <div class="ex-stat-label">Automation rate — up from 60% with rule-based bots, now with better CSAT than human agents</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">25%</div>
    <div class="ex-stat-label">CSAT improvement — AI bot now scores above legacy bot and approaches human agent quality</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">75%</div>
    <div class="ex-stat-label">Reduction in response time — from minutes to under 10 seconds average</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">$10M+</div>
    <div class="ex-stat-label">Cost savings — from $20M+ annual ops cost, with 4,000+ agent headcount replaced or redeployed</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">11M</div>
    <div class="ex-stat-label">Tickets/month handled through AI platform — from 750M+ annual orders</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">70%</div>
    <div class="ex-stat-label">Of refund decisions automated via vision AI — previously 100% required human photo review</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. 85% automation means 15% still requires human agents — and those 15% are the hardest cases.</strong> The tickets that reach human agents are not a random sample — they are the most complex, most emotionally charged, highest-value disputes that the AI couldn't resolve. Human agents now handle a more difficult portfolio than before. This raises training requirements and average handle time for human-handled tickets, even as the total volume of human-handled tickets falls. The 30% AHT reduction mitigates this — agent co-pilot gives humans better context — but the nature of human work has shifted upmarket.</p>

<p style="margin-bottom:0.75rem;"><strong>B. Vision AI for fraud detection creates a false positive risk with real cost.</strong> A legitimate customer who submits a blurry photo of a genuinely wrong item may get flagged as a potential fraud case and have their refund denied or delayed. At Zomato's scale, even a 1% false positive rate on the vision model means tens of thousands of legitimate customers getting worse service. The threshold for "flag as suspicious" must be tuned carefully — too sensitive and legitimate refunds are denied, too lenient and fraud slips through. This is a continuous calibration problem, not a one-time setting.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Multi-model orchestration requires continuous model evaluation.</strong> The system routes tickets to the cheapest accurate model. But model capabilities and costs change — a model that was the right choice at a given price/performance point in Q1 may not be by Q3. The orchestration layer must be continuously re-evaluated against updated model benchmarks. This is operational overhead that a single-model system doesn't have.</p>

<p style="margin-bottom:0.75rem;"><strong>D. The old 60% automation rate masked bot CSAT problems — fixing automation quality, not just rate, is the real win.</strong> Zomato's pre-AI bots auto-resolved 60% of tickets, but bot CSAT lagged significantly behind human CSAT. The framing "we went from 60% to 85% automation" understates the actual improvement: the quality of the automated resolution improved dramatically. A 60% automation rate with bad CSAT is worse than 40% automation with high CSAT — unhappy auto-resolved customers contact support again, doubling ticket volume. The CSAT improvement is what sustains the cost savings.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Zomato is the most important Indian example of AI customer support at scale — and it teaches two lessons simultaneously. First: the right architecture for high-volume, complex support is multi-modal AI orchestration (text + vision + real-time data), not a single chatbot. Second: automation rate is the wrong primary metric. Zomato's old system automated 60% of tickets with bad CSAT. The AI system automates 85% with CSAT that exceeds the old automation. The goal is high-quality automation — not maximum automation.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design an AI customer support system for Swiggy / Ola / PhonePe?"</div>
  <div class="ex-interview-answer">Apply Zomato's architecture with domain-specific adjustments:
<br><br><strong>Core pipeline (same across all):</strong>
<br>• Intent classification → real-time data pull → policy/SOP matching → resolution or escalation
<br>• Multi-model routing: simple queries → small model, complex disputes → frontier model
<br>• 100% audit trail for continuous improvement
<br><br><strong>Domain-specific additions:</strong>
<br>• <strong>Swiggy Instamart</strong>: Vision AI for substitution disputes ("I ordered Amul butter, got Britannia") — same image analysis pattern as Zomato
<br>• <strong>Ola</strong>: GPS data integration for fare disputes — AI cross-references actual route vs. charged route automatically
<br>• <strong>PhonePe</strong>: Transaction data integration for payment failures — AI pulls full transaction log and identifies whether failure was at payment gateway, bank, or merchant layer before responding
<br><br>The universal rule: AI support quality is only as good as the real-time data it can access. The model is secondary to the data integration.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What metrics would you use to evaluate an AI customer support system?"</div>
  <div class="ex-interview-answer">Zomato's example shows why automation rate alone is misleading. The right metric stack:
<br><br><strong>Quality metrics (primary):</strong>
<br>• <strong>Bot CSAT</strong> — did the user feel the issue was resolved? Target: at or above human agent CSAT
<br>• <strong>Containment quality rate</strong> — of auto-resolved tickets, what % did not re-contact support within 48h? Re-contact = resolution failed
<br>• <strong>False positive rate on fraud detection</strong> — what % of legitimate refund claims are incorrectly flagged?
<br><br><strong>Efficiency metrics (secondary):</strong>
<br>• Automation rate (% handled without human)
<br>• Average handling time for human-escalated tickets
<br>• Cost per ticket (weighted across automated and human-handled)
<br><br>Never optimise automation rate in isolation. Zomato at 60% automation with bad CSAT was worse than a lower automation rate with high CSAT.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you handle image-based evidence in an AI system?"</div>
  <div class="ex-interview-answer">Zomato's vision AI pipeline is the reference:
<br><br>• <strong>Defect detection</strong>: identify wrong item, spill, damaged packaging from photo
<br>• <strong>Fraud signals</strong>: detect stock images (user submitted a Google image, not a real photo), brand mismatches, implausible defect types
<br>• <strong>Confidence thresholding</strong>: high confidence defect detected → auto-resolve. Low confidence → escalate to human with image pre-analysed
<br><br>Key design principle: vision model output is never the final decision for ambiguous cases — it provides structured input to the decision layer, which applies business rules (SOP) before resolving. The model says "this looks like a wrong item" — the SOP layer decides "given this is a first claim, auto-refund under ₹200."</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to design an AI customer support system, describe a single LLM chatbot that answers questions. Two things wrong:
  <br><br>• <strong>A chatbot without real-time data integration cannot resolve most support tickets.</strong> "Where is my order?" requires live GPS data. "I got the wrong item" requires order details and image analysis. "My refund isn't showing" requires payment system integration. A chatbot that can only talk but cannot pull and act on live data produces plausible-sounding responses that don't actually resolve anything. Resolution requires action, not just response.
  <br><br>• <strong>Optimising for automation rate without measuring resolution quality creates a worse system.</strong> Zomato's old bots had 60% automation rate with CSAT below human agents. Every unresolved auto-resolved ticket generates a follow-up contact, doubling effective ticket volume. A system that auto-resolves badly is worse than one that escalates to humans faster. The PM's job is to define "auto-resolved" as "resolved without re-contact within 48 hours" — not "bot sent a response."
</div>`,

    sources: [
      { id: 83, title: 'How Zomato Built an AI Support Bot — 2x CSAT, 75% Faster', url: 'https://www.together.ai/customers/zomato' },
      { id: 84, title: 'How Nugget Reduced Zomato Support Costs by $10M+', url: 'https://www.nugget.com/resources/zomato-case-study/' }
    ]
  }
},
{
  slug: 'swiggy-hermes-text-to-sql',
  company: 'Swiggy',
  problem: 'Hermes — Text-to-SQL for Internal Data Democratisation',
  oneLiner: 'Swiggy built Hermes so any employee can query production data in plain English via Slack — accuracy went from 54% (V1) to 93% (V3) using the SQL2Text trick: LLMs understand SQL far better than they write it',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['AI Design', 'Cost Optimisation'],
  sections: {
    problem: `Swiggy is an AI-first company with terabytes of production data — orders, delivery times, restaurant performance, pricing, user behaviour. The problem: most of this data was inaccessible to business teams without a SQL-fluent data analyst as a middleman.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before Hermes</div>
    A Swiggy city operations manager wants to know: "Which restaurants in Bangalore have declining reorder rates this month compared to last month, broken by cuisine type?" They write a Slack message to the data team. The data analyst adds it to their queue. The query takes 2–3 days to return. By then, the operational window for action has passed. Data was available — but not accessible.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After Hermes V3</div>
    Same manager types the question in a Slack channel. Hermes V3 converts it to SQL in seconds using few-shot examples from similar past queries, executes it on Snowflake/Databricks, returns the result directly in Slack. 93% accuracy on their benchmark. Data analyst backlog eliminated for routine analytical queries.
  </div>
</div>

This is the same problem Honeycomb solved — translating plain language into a proprietary query language — applied to Swiggy's internal data stack. The key insight that drove the V1→V3 evolution: LLMs are dramatically better at understanding SQL than writing it. This observation, discovered empirically during V2→V3 development, is the architectural breakthrough that took accuracy from 54% to 93%.`,

    howSolved: `Hermes evolved across three versions, each fixing the primary failure mode of the previous one.

<strong>V1 — Proof of concept, single charter</strong>
Built for one business unit (charter) as a test. Architecture: LLM receives table schemas + user question, generates SQL. Key learnings from V1:
<br>• Schema context bloat: giving the model all tables made it pick wrong ones
<br>• No Swiggy-specific context: model didn't know Swiggy's naming conventions, column definitions, or business logic
<br>• Accuracy: functional but not benchmarked — informal testing only
<br>• Delivery: via a custom web UI (friction too high for adoption)

<strong>V2 — RAG + multi-charter + Slack interface</strong>
Fixed V1's three core problems:

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Problem from V1</div><div>V2 fix</div><div>How it works</div>
  </div>
  <div class="ex-table-row">
    <div>Schema context bloat</div>
    <div>RAG-based schema retrieval</div>
    <div>Knowledge base of table/column descriptions. For each query, retrieve only the relevant tables using vector similarity. Model sees 5–10 relevant tables instead of all 200+.</div>
  </div>
  <div class="ex-table-row">
    <div>No Swiggy-specific context</div>
    <div>Charter-specific GenAI models</div>
    <div>Each business unit gets a model fine-tuned with their specific table context, column definitions, and business logic. "GMV" means something specific at Swiggy — the model learns this.</div>
  </div>
  <div class="ex-table-row">
    <div>UI friction</div>
    <div>Slack as the interface</div>
    <div>Every Swiggy employee already lives in Slack. Zero new tool to learn. Query in the same channel you're already working in.</div>
  </div>
</div>

Architecture: Slack → AWS Lambda middleware (formats input) → Databricks job (fetches charter model, generates SQL, executes on Snowflake/Databricks, returns output) → Slack response.

<strong>V3 — The SQL2Text breakthrough (54% → 93%)</strong>
V2's accuracy plateaued at 54% on their benchmark of ~100 manually tagged queries. The team ran an experiment that revealed the key insight:

<em>"LLMs are a lot better at understanding SQL queries than writing them. Tasking a model to generate a SQL query with a lot of text and noise as supplemental information does not do a great job — but tasking a model to explain a SQL query with a lot of noise around it does a fairly decent job."</em>

This insight unlocked the SQL2Text pipeline:

<div class="ex-flow">
  <div class="ex-flow-step">Take all historically executed Snowflake queries</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">SQL2Text: feed each SQL + business context to Claude → generate a plain English description of what the query does</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Build a curated database of (natural language prompt ↔ SQL query) pairs</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">At query time: vectorise the user's question, find similar prompts in the database</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Inject top-k similar (prompt, SQL) pairs as few-shot examples into the generation prompt</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">LLM generates SQL guided by real working examples, not just schema descriptions</div>
</div>

<strong>Why SQL2Text works — the intuition</strong>
A model asked to write SQL from scratch must: understand the question, map to the right tables, construct the correct join logic, handle Swiggy-specific conventions, get the syntax right. Many failure points in sequence.

A model given a working SQL query and asked "what does this do in plain English?" only needs to: read the SQL, understand the logic, describe it. Far easier — SQL is unambiguous, structured, and the model's job is interpretation not generation.

By inverting this — using the model's strength (understanding SQL) to build a library of (prompt ↔ SQL) pairs, then using those pairs as few-shot examples for generation — Swiggy bypassed the model's weakness (generating SQL from scratch against noisy context).

<strong>The Claude connection</strong>
Swiggy leveraged large context Claude models to run SQL2Text, using the SQL query and the context of the business line to create a prompt. Claude's long context window was specifically important here — the business context needed to correctly interpret Swiggy's SQL conventions was extensive.`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">User type 1 — City operations manager</div>
  Needs daily data on restaurant performance, delivery SLAs, and demand patterns to make operational decisions. Failure mode before Hermes: submits request to data team, waits 2–3 days, decision window closes. With Hermes V3: types question in Slack, gets answer in seconds. Operational speed matches data availability for the first time.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 2 — Data analyst buried in ad-hoc requests</div>
  Spends 60% of time writing routine queries for business teams. Failure mode: no time for complex analysis that requires their expertise. With Hermes handling routine queries: analyst time freed for complex, non-automatable analysis. The data team's value shifts upmarket — they do the work that requires judgment, not the work that requires SQL syntax knowledge.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">User type 3 — New Swiggy employee unfamiliar with the data stack</div>
  Joins the company, needs data but doesn't know which tables contain what, what Swiggy-specific column names mean, or how to write Snowflake SQL. Failure mode: completely dependent on senior analysts. With Hermes: can ask questions in plain English immediately, charter-specific context means the model knows Swiggy's naming conventions, new employee is productive from Day 1.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">54%→93%</div>
    <div class="ex-stat-label">SQL generation accuracy from V2 to V3 — benchmark of ~100 manually tagged queries</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">SQL2Text</div>
    <div class="ex-stat-label">Key architectural insight — LLMs understand SQL better than they write it. Inverted the problem.</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">Slack</div>
    <div class="ex-stat-label">Interface — zero new tool adoption required. Query where employees already work.</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">3 versions</div>
    <div class="ex-stat-label">V1 (proof of concept) → V2 (RAG + multi-charter + Slack) → V3 (SQL2Text + few-shot, 93% accuracy)</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. 93% accuracy means 7% wrong SQL — and wrong SQL can return misleading data.</strong> A wrong answer to "what's our GMV this month?" that returns a plausible-but-incorrect number is worse than an error message — the user may act on it without realising it's wrong. Hermes mitigates this by always returning the generated SQL alongside the result. Users can inspect the SQL and catch obvious errors. But most users don't review SQL — they trust the result. The PM decision: should Hermes always show the SQL, or only on request?</p>

<p style="margin-bottom:0.75rem;"><strong>B. The SQL2Text pipeline requires a corpus of high-quality historical queries.</strong> The few-shot examples that power V3's accuracy come from previously executed Snowflake queries. A new business unit or a new data domain with no historical query corpus has no examples to learn from — V3's accuracy advantage disappears. The system is strong where query history is rich and weak where it's sparse. Cold-start for new charters defaults to V2-level accuracy until sufficient query history accumulates.</p>

<p style="margin-bottom:0.75rem;"><strong>C. Charter-specific models create maintenance overhead.</strong> Each business unit has its own model with its own context, table definitions, and business logic. When Swiggy's data schema changes (new tables added, columns renamed, business logic updated), every affected charter model must be updated. This is an ongoing maintenance cost that scales with the number of charters. A unified model would be simpler to maintain but would sacrifice the Swiggy-specific context accuracy that drives V2's improvement over V1.</p>

<p style="margin-bottom:0.75rem;"><strong>D. Slack as interface is an adoption win but a context limitation.</strong> Slack integration drove adoption — employees query where they already work. But Slack conversations lack the rich context of a proper analytics environment: no chart rendering, no follow-up visualisation, no drill-down capability. Hermes returns SQL results as text. For quick lookups this is fine; for complex analysis that needs charts or iterative exploration, users eventually still go to a proper BI tool. Hermes is a fast path to answers, not a BI replacement.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">Swiggy Hermes is the most important Indian example of internal AI tooling done right — and it teaches two lessons simultaneously. First: the right interface for data democratisation is the one people already use (Slack), not a new tool they have to adopt. Second: the SQL2Text insight is genuinely generalisable — whenever an LLM struggles to generate domain-specific structured output, ask whether it can understand that output better than it can generate it. If yes, invert the pipeline: use the model's strength to build a library of examples, then use those examples to guide generation.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you democratise data access at a company like Zomato / PhonePe / Razorpay?"</div>
  <div class="ex-interview-answer">Apply Hermes V3's architecture directly:
<br><br><strong>Phase 1 — V1 equivalent (2 weeks):</strong>
<br>• Pick one high-demand charter (e.g. city ops at Zomato)
<br>• RAG over their table schemas + GPT-4o for SQL generation
<br>• Slack interface via Lambda middleware
<br>• Measure accuracy manually on 50 benchmark queries
<br><br><strong>Phase 2 — V2 equivalent (1–2 months):</strong>
<br>• Expand to all charters with charter-specific knowledge bases
<br>• Add Snowflake/Databricks execution + result return
<br><br><strong>Phase 3 — V3 equivalent (when you have query history):</strong>
<br>• Run SQL2Text on all historical queries using Claude (large context for business context injection)
<br>• Build (prompt ↔ SQL) vector database
<br>• Add few-shot retrieval to the generation step
<br>• Target: 90%+ accuracy on your benchmark
<br><br>India-specific consideration: Indian tech companies have heterogeneous data stacks (Snowflake + Databricks + MySQL + BigQuery all in one org). The middleware layer must handle routing to the right execution engine per charter — not just SQL generation.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you improve an AI feature that has plateaued in accuracy?"</div>
  <div class="ex-interview-answer">Hermes V2→V3 is the reference case:
<br><br>• <strong>First: understand where it fails.</strong> Swiggy benchmarked 100 manually tagged queries in V2. They knew exactly which query types failed and why — complex joins, Swiggy-specific conventions, multi-table aggregations.
<br>• <strong>Second: look for the model's strength, not just its weakness.</strong> V2 improved generation by adding context. V3 found a different insight: the model understands SQL better than it generates it. This is not obvious from looking at the failure modes — it required a deliberate experiment.
<br>• <strong>Third: invert the pipeline around the strength.</strong> SQL2Text inverted generation into comprehension + retrieval. The model no longer writes SQL from scratch — it selects the best matching example and adapts it.
<br><br>The PM lesson: accuracy plateaus in AI features are often architectural, not model quality problems. Before upgrading the model, examine whether the task framing is optimal for what the model is actually good at.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When would you use RAG vs. fine-tuning vs. few-shot prompting?"</div>
  <div class="ex-interview-answer">Hermes shows all three in the same product:
<br><br>• <strong>RAG (V2):</strong> Used for schema retrieval — finding the relevant tables for a given query. The knowledge base is large, changes frequently, and needs exact information retrieval. RAG is the right tool.
<br>• <strong>Few-shot prompting (V3):</strong> Used for SQL generation — injecting similar (prompt, SQL) pairs as examples. The task benefits from examples more than from instructions. The library of examples is built once via SQL2Text and grows with usage.
<br>• <strong>Fine-tuning (not used):</strong> Hermes chose charter-specific context injection over fine-tuning. The data schema changes too frequently — a fine-tuned model would require retraining every time a table is added. RAG is more maintainable for dynamic schemas.
<br><br>The sequencing: RAG first (handles knowledge gaps), few-shot when RAG plateaus (handles pattern learning), fine-tune last (when the task is stable enough to justify training cost).</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked to build a text-to-SQL system, describe giving the LLM table schemas and asking it to generate SQL. This is V1 — and it plateaus quickly. Two things wrong:
  <br><br>• <strong>Schema context alone is not sufficient for domain-specific SQL.</strong> Swiggy's column names, business logic, and query conventions are not in the LLM's training data. Without charter-specific context and a curated example library, the model generates syntactically valid but semantically wrong SQL. "Valid SQL" and "correct SQL" are different things.
  <br><br>• <strong>The fundamental insight is inverted generation, not better prompting.</strong> The V2→V3 jump from 54% to 93% didn't come from a better prompt or a bigger model — it came from recognising that LLMs understand SQL better than they write it, and restructuring the pipeline around that asymmetry. Candidates who only think about "how do I prompt the model better?" miss the architectural insight that produced the biggest accuracy gain.
</div>`,

    sources: [
      { id: 85, title: 'Hermes: A Text-to-SQL Solution at Swiggy (V2)', url: 'https://bytes.swiggy.com/hermes-a-text-to-sql-solution-at-swiggy-81573fb4fb6e' },
      { id: 86, title: 'Hermes V3: Building Swiggy\'s Conversational AI Analyst', url: 'https://bytes.swiggy.com/hermes-v3-building-swiggys-conversational-ai-analyst-a41057a2279d' }
    ]
  }
},
{
  slug: 'meta-silvertorch-index-as-model',
  company: 'Meta',
  problem: 'SilverTorch — Index as Model, Unified GPU Retrieval',
  oneLiner: 'Meta replaced fragmented microservice-based recommendation retrieval with SilverTorch — a single GPU-native model that does ANN search, filtering, and scoring in one shot, achieving 23.7× throughput and 20.9× lower TCO across Facebook Reels, Feed, and Video',
  addedOn: '01 Jun 2025',
  important: false,
  hidden: false,
  topics: ['Recommendations', 'Cost Optimisation'],
  sections: {
    problem: `Meta serves recommendations at a scale few systems have ever faced — Reels, Feed, and Video across Facebook and Instagram for billions of users simultaneously. Retrieval — narrowing from hundreds of millions of items to thousands of candidates in under 100 milliseconds — is the first and most computationally demanding stage.

<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before SilverTorch — microservice mesh</div>
    Traditional retrieval was a mesh of separate services: an ANN service (Faiss or Milvus) for vector similarity search, an inverted index service for feature filtering, a caching layer, a scoring service. Each had its own versioning, scheduling, and batching logic. The client orchestrated requests to all services and merged results. Every inter-service call added latency. Components couldn't be jointly optimised because they were built and maintained independently. Model complexity was hard-capped — you couldn't run a more complex retrieval model without violating the 100ms budget.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After SilverTorch — single GPU model</div>
    All retrieval components (ANN search, feature filtering, OverArch scoring, embedding cache) run inside one PyTorch model on a single GPU. No inter-service calls. No data movement between components. No orchestration overhead. The "index" is no longer a separate service — it is part of the model. 23.7× throughput. 20.9× lower TCO. 5.6% recall improvement. Accepted at SIGIR 2026 as full paper.
  </div>
</div>

The architectural problem was structural: microservice-based retrieval creates three compounding inefficiencies. First, every service call is a network round-trip — latency stacks. Second, each service optimises independently — there is no joint training signal between ANN search and scoring. Third, the client must orchestrate and merge results from multiple services — adding logic and failure points. SilverTorch eliminates all three by making the index a layer inside the model, not a separate system outside it.`,

    howSolved: `SilverTorch replaces the multi-service retrieval pipeline with a unified PyTorch model that runs entirely on GPU.

<strong>The core insight — Index as Model</strong>
Traditional systems treat the index (ANN search + filtering) as infrastructure that runs before the model. SilverTorch treats the index as model layers — implemented as differentiable operations inside the PyTorch forward pass.

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>Traditional approach</div><div>SilverTorch approach</div>
  </div>
  <div class="ex-table-row">
    <div>ANN search</div>
    <div>Separate Faiss/Milvus service on CPU. Fixed topK. Cannot co-optimise with downstream scoring.</div>
    <div>In-model GPU layer. Supports topK up to 100,000 without performance degradation. Co-designed with OverArch scoring.</div>
  </div>
  <div class="ex-table-row">
    <div>Feature filtering</div>
    <div>Inverted index service. Separate call. Merged with ANN results by client.</div>
    <div>In-model filtering layer. Runs on same GPU pass as ANN. Zero data movement overhead.</div>
  </div>
  <div class="ex-table-row">
    <div>Early-stage ranking</div>
    <div>Separate scoring service. Requires fetching item embeddings over network for each candidate.</div>
    <div>In-model embedding cache. Pre-calculated embeddings stored inside the model. 10.18× QPS improvement on ESR alone.</div>
  </div>
  <div class="ex-table-row">
    <div>Multi-task scoring</div>
    <div>Not feasible — adding OverArch layers to standalone services exceeds latency budget.</div>
    <div>OverArch scoring layers added within the same GPU pass. Enables learned similarities and multi-task retrieval that were previously architecturally impossible.</div>
  </div>
</div>

<strong>OverArch scoring — the capability unlocked by unification</strong>
The most important new capability SilverTorch enables is OverArch scoring: applying a learned neural network to score and re-rank candidates within the retrieval stage — not just in the downstream ranking stage.

In the microservice model, retrieval used cosine similarity between two-tower embeddings. Any more complex scoring model violated the latency budget because it required additional service calls. SilverTorch's unified GPU execution means the OverArch scoring layer runs within the same forward pass — no additional latency penalty. This directly improves retrieval recall by 5.6% in end-to-end evaluation.

<strong>Multi-task retrieval</strong>
SilverTorch also enables multi-task retrieval: a single retrieval pass can simultaneously optimise for multiple objectives (engagement, diversity, watch time, share rate) rather than a single similarity score. In the microservice model, each objective required a separate retrieval call — multiplicative latency and cost. In SilverTorch, all objectives run within one model forward pass.

<strong>The GPU-native advantage — why this matters now</strong>
Traditional retrieval ran on CPU because Faiss and inverted index services were CPU-based. SilverTorch runs entirely on GPU. This is the foundation of the throughput gain:
<br>• GPU parallelism handles ANN search across 80M items simultaneously
<br>• No CPU-GPU data transfer between retrieval and scoring
<br>• GPU memory holds the full item embedding index — no disk reads during serving
<br>• PyTorch JIT compilation optimises the entire retrieval pass end-to-end

<div class="ex-flow">
  <div class="ex-flow-step">User request arrives</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">SilverTorch model: ANN search across 80M items on GPU</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">In-model feature filtering (no separate service call)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">OverArch scoring of top candidates (in same GPU pass)</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Top-K candidates passed to ranking — all within 100ms</div>
</div>`,

    users: `<div class="ex-failure">
  <div class="ex-failure-label">Facebook/Instagram user — Reels feed</div>
  Watches Reels. Failure mode with microservice retrieval: retrieval model complexity is hard-capped by latency — the system can't run a more complex model without violating the 100ms budget, so recall is limited by architectural constraints rather than model capability. With SilverTorch: OverArch scoring layers improve recall by 5.6% within the same latency budget. Users see more relevant Reels not because the underlying user-item model improved — but because the retrieval architecture stopped being the ceiling.
</div>

<div class="ex-failure">
  <div class="ex-failure-label">Meta infrastructure team — cost and throughput</div>
  Running retrieval for billions of daily Reels, Feed, and Video requests across Meta's family of apps. Failure mode with microservice model: CPU-based ANN services, separate scoring services, orchestration overhead — all multiplied across billions of requests per day. Cost compounds at this scale. With SilverTorch: 20.9× TCO improvement. The same retrieval quality (plus improved recall) at 1/20th the compute cost. At Meta's scale, this is hundreds of millions of dollars in infrastructure savings annually.
</div>`,

    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">23.7×</div>
    <div class="ex-stat-label">Throughput vs. traditional multi-service baseline — 80M item end-to-end evaluation</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">20.9×</div>
    <div class="ex-stat-label">TCO efficiency improvement vs. CPU-based solution</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">5.6%</div>
    <div class="ex-stat-label">Recall improvement from OverArch scoring — previously impossible under microservice latency constraints</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">5.6×</div>
    <div class="ex-stat-label">Lower latency vs. CPU-based approaches</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">10.18×</div>
    <div class="ex-stat-label">QPS improvement on early-stage ranking from in-model embedding cache</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">100K</div>
    <div class="ex-stat-label">Max topK supported without performance degradation — vs. hard limits in standalone Faiss/Milvus</div>
  </div>
</div>`,

    tradeoffs: `<p style="margin-bottom:0.75rem;"><strong>A. Unified model is harder to debug than separate services.</strong> In a microservice architecture, you can log and monitor each service independently. When ANN recall drops, you know exactly which service to investigate. In a unified model, failures are harder to localise — a drop in retrieval quality could be the ANN layer, the OverArch scoring, the filtering, or an interaction between them. Meta mitigates this with per-layer instrumentation inside the PyTorch model — but adding observability to a unified model requires deliberate engineering effort that microservices get for free.</p>

<p style="margin-bottom:0.75rem;"><strong>B. GPU-native architecture requires GPU infrastructure for all retrieval traffic.</strong> Traditional retrieval ran on cheap CPU servers. SilverTorch requires GPUs for all retrieval requests — 24/7, at full Meta scale. The 20.9× TCO improvement means GPU retrieval is cheaper overall, but it represents a significant infrastructure shift. Companies at smaller scale may not have the GPU fleet to run SilverTorch economically — the break-even depends on request volume and GPU utilisation rates.</p>

<p style="margin-bottom:0.75rem;"><strong>C. In-model index requires careful memory management.</strong> The item embedding index for 80M items lives inside the GPU model. At typical embedding dimensions (256-512 float32), 80M items require 80GB+ of GPU memory. This constrains which GPU hardware can run SilverTorch and requires careful batching strategies to keep memory utilisation within bounds during peak traffic. Meta's GPU infrastructure (custom H100 clusters with NVLink) is specifically designed for this kind of memory-intensive workload.</p>

<p style="margin-bottom:0.75rem;"><strong>D. The architecture is proven at Meta's scale — but migration cost is high.</strong> Replacing a multi-service retrieval system with a unified GPU model requires rewriting the serving infrastructure, retraining retrieval models in the new architecture, and validating quality parity before cutover. Meta spent significant engineering time on this migration. For companies with existing multi-service retrieval infrastructure, the migration cost must be weighed against the TCO savings. SilverTorch makes more sense as a greenfield architecture than a migration for most teams outside of Meta's scale.</p>`,

    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — framing the answer</div>
  <div class="ex-interview-answer">SilverTorch is the most important recent infrastructure paper in recommendation systems — and it teaches a lesson that applies far beyond retrieval: sometimes the right solution is not to optimise individual components but to eliminate the boundaries between them. The 23.7× throughput gain did not come from a better ANN algorithm or a better scoring model. It came from removing the inter-service overhead that was the dominant cost. "Index as Model" is not a technical novelty — it is an architectural simplification that happened to be 23.7× more efficient.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design a recommendation system for a large-scale Indian platform (Hotstar / JioCinema / Meesho)"</div>
  <div class="ex-interview-answer">Two-stage architecture still applies — but SilverTorch changes how you think about Stage 1:
<br><br><strong>Traditional Stage 1 (retrieval):</strong>
<br>• Faiss for ANN search (CPU) + filtering service + scoring service
<br>• Works at up to ~10M items before latency becomes problematic
<br>• Appropriate for most Indian platforms today
<br><br><strong>SilverTorch Stage 1 (if scale justifies):</strong>
<br>• Unified GPU model: ANN + filtering + OverArch scoring in one pass
<br>• Justified when: catalogue exceeds 50M items AND GPU infrastructure is available AND retrieval latency is the bottleneck
<br><br><strong>For JioCinema at IPL scale:</strong> Peak IPL traffic is hundreds of millions of simultaneous users. SilverTorch's 23.7× throughput advantage means they can serve the same quality recommendations at IPL peak using 1/23rd the retrieval infrastructure — or serve dramatically better recall within the same infrastructure budget.
<br><br>For most Indian startups today: traditional two-tower + Faiss is the right answer. SilverTorch is a frontier architecture for frontier-scale problems.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What is the retrieval vs. ranking distinction in recommendation systems?"</div>
  <div class="ex-interview-answer">SilverTorch sharpens this distinction:
<br><br>• <strong>Retrieval</strong> — narrows from millions/billions of items to thousands of candidates. Must complete in &lt;100ms. Optimises for recall: don't miss relevant items. Uses ANN search over learned embeddings. SilverTorch operates here.
<br>• <strong>Ranking</strong> — scores and orders the thousands of retrieved candidates. Has more compute budget (already narrowed the set). Optimises for precision: put the best items at the top. Uses more complex models (transformers, contextual features, multi-objective).
<br><br>SilverTorch's key innovation: it brings neural reranking (OverArch scoring) into the retrieval stage — previously only possible in ranking because retrieval latency was too tight. By unifying retrieval on GPU, the latency budget for retrieval expands enough to include a scoring layer that improves recall by 5.6%.
<br><br>The PM implication: the retrieval-ranking boundary is not fixed. As infrastructure improves, capability that was only feasible at ranking stage migrates into retrieval — improving quality without increasing end-to-end latency.</div>
</div>

<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you reduce infrastructure cost for an AI product at scale?"</div>
  <div class="ex-interview-answer">SilverTorch alongside ProjectDiscovery gives you the complete cost optimisation playbook:
<br><br>• <strong>Prompt caching (ProjectDiscovery):</strong> Eliminate redundant token processing. 59–70% cost reduction on agentic workflows. Zero quality impact.
<br>• <strong>Model routing (ProjectDiscovery):</strong> Match task complexity to model cost. Simple tasks → cheap model.
<br>• <strong>Architecture unification (SilverTorch):</strong> Eliminate inter-service overhead. 20.9× TCO improvement at retrieval stage. Requires infrastructure investment upfront.
<br><br>The sequencing: caching and routing first (low effort, immediate savings). Architecture unification when you have reached the scale where inter-service overhead dominates cost — typically 100M+ items in the retrieval index or 1B+ daily requests.</div>
</div>`,

    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates, when asked about recommendation system architecture, describe retrieval as a fixed step: "use Faiss for ANN search, pass candidates to the ranking model." SilverTorch challenges this in two ways:
  <br><br>• <strong>The retrieval-ranking boundary is not architecturally fixed.</strong> It is a latency budget constraint. As GPU infrastructure improves, capability that was previously only feasible in ranking (neural scoring, multi-task objectives) can move into retrieval without violating the latency budget. SilverTorch's OverArch scoring is the production proof — 5.6% recall improvement by adding a scoring layer inside retrieval that previously could only live in ranking.
  <br><br>• <strong>Infrastructure fragmentation has a compounding cost that is easy to overlook.</strong> Each additional microservice looks cheap in isolation. The orchestration overhead, inter-service latency, redundant versioning and scheduling logic, and inability to jointly optimise across boundaries — these costs are invisible until you measure end-to-end efficiency. SilverTorch's 23.7× throughput gain was not from better algorithms. It was from eliminating 23.7× worth of infrastructure fragmentation.
</div>`,

    sources: [
      { id: 87, title: 'SilverTorch: Index as Model — A New Retrieval Paradigm', url: 'https://engineering.fb.com/2026/05/26/ml-applications/silvertorch-index-as-model-new-retrieval-paradigm-recommendation-systems/' },
      { id: 88, title: 'SilverTorch SIGIR 2026 Paper', url: 'https://arxiv.org/abs/2511.14881' }
    ]
  }
},
{
  slug: 'zepto-cart-contextual-recommendations',
  company: 'Zepto',
  problem: 'Cart-Aware Recommendations',
  oneLiner: 'Zepto (millions of daily quick-commerce orders across 500+ cities) built a Transformer-based Masked Language Model that treats a shopping cart as a sentence, predicts missing products from partial baskets, and drove +23.4% Add-to-Cart Rate in A/B testing.',
  addedOn: '14 Jun 2026',
  important: true,
  hidden: false,
  topics: ['Recommendations', 'NLP for Commerce', 'Real-Time ML'],
  sections: {
    problem: `<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Recommendations were popularity-based — same items surfaced regardless of what was already in the cart. A user who had added mozzarella, pasta, and basil was shown generic bestsellers. The system had no mechanism to infer "this is a cooking session" and complete the picture proactively.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    The cart contextual model reads the partial basket in real time, infers the underlying intent (dinner prep, baby stock-up, party snack run), and surfaces the items most likely to complete that specific session — before the user has to search for them.
  </div>
</div>
<p>The root cause was not missing data — Zepto had millions of historical carts. The problem was that no model was reading the <em>relationship</em> between items in a cart. Co-occurrence models can learn that milk and cereal appear together, but they cannot learn that milk + cereal + a masked slot in a Monday morning cart in Bengaluru points specifically toward oats — not chips. That multi-item contextual inference requires a model that understands sequence-level meaning.</p>`,
    howSolved: `<p>The core insight: borrow Masked Language Modeling (MLM) from NLP. A cart is a sentence. Each product is a word. The model learns to predict missing products from the rest of the cart — exactly how BERT predicts masked words from surrounding context.</p>
<div class="ex-flow">
  <div class="ex-flow-step">Historical orders aggregated<br><small>Product + brand + category hierarchy</small></div>
  <div class="ex-flow-arrow">&#8594;</div>
  <div class="ex-flow-step">Temporal + geo signals added<br><small>Day of week, hour, city</small></div>
  <div class="ex-flow-arrow">&#8594;</div>
  <div class="ex-flow-step">Cart sequences built<br><small>2-10 items per cart</small></div>
  <div class="ex-flow-arrow">&#8594;</div>
  <div class="ex-flow-step">Inverse-frequency masking<br><small>Rare items masked more often</small></div>
  <div class="ex-flow-arrow">&#8594;</div>
  <div class="ex-flow-step">12-layer Transformer encoder<br><small>512-dim unified representation</small></div>
  <div class="ex-flow-arrow">&#8594;</div>
  <div class="ex-flow-step">MLM head predicts masked products<br><small>Top-K candidates to recommendations</small></div>
</div>
<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Inverse-frequency masking</div>
    <div>Masks rare products more often during training</div>
    <div>Forces the model to learn long-tail relationships, not just eggs and milk</div>
  </div>
  <div class="ex-table-row">
    <div>Warm-start embeddings</div>
    <div>Initialises product vectors from a previously trained model</div>
    <div>Accelerates convergence and improves quality on infrequent SKUs with little training signal</div>
  </div>
  <div class="ex-table-row">
    <div>Temporal + geo context</div>
    <div>Fuses day-of-week, hour, and city into each product representation</div>
    <div>Monday 7am Bengaluru cart vs Saturday 10pm Delhi cart get different suggestions even with identical items</div>
  </div>
  <div class="ex-table-row">
    <div>12-layer Transformer encoder</div>
    <div>Captures non-linear relationships across the full cart simultaneously via self-attention</div>
    <div>Learns that milk + cereal + masked slot = breakfast context, not just pairwise co-occurrence</div>
  </div>
  <div class="ex-table-row">
    <div>MLM head</div>
    <div>Projects Transformer output to probability score over full product catalog</div>
    <div>Top-scoring candidates feed into "You Might Also Like" inside the active cart</div>
  </div>
</div>`,
    users: `<div class="ex-failure">
  <div class="ex-failure-label">First-item user (session just started)</div>
  Old system had no signal — showed generic bestsellers. New model starts from item 1: diapers added first raises probability of wipes, formula, baby lotion without waiting for the user to search.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Niche / recipe-driven shopper</div>
  Co-occurrence model failed on low-frequency combinations. A user adding kokum, coconut milk, and raw rice (Goan cuisine) got irrelevant suggestions because those triplets appeared rarely. Inverse-frequency masking forces the model to learn exactly these harder, long-tail relationships.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Time-sensitive replenishment shopper</div>
  Coffee pods at 7am weekday vs 9pm Sunday — same product, completely different session intent. Without temporal signals, treated identically. With day + hour embeddings, 7am cart surfaces quick breakfast items; 9pm cart surfaces evening snacks.
</div>`,
    metrics: `<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">+23.4%</div>
    <div class="ex-stat-label">Add-to-Cart Rate</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+&#8377;0.70</div>
    <div class="ex-stat-label">Avg Order Value per order</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+&#8377;0.10</div>
    <div class="ex-stat-label">Gross Profit per order</div>
  </div>
</div>
<p>Strongest lift came from the "You Might Also Like" surface inside the active cart — suggestions served at exactly the moment a user is already in purchase mode.</p>`,
    tradeoffs: `<p><strong>Carts capped at 2-10 items.</strong> Fewer than 2 items gives too little context to infer intent. More than 10 adds noise — a 25-item weekly run has too diffuse an intent signal. Some sessions fall back to popularity ranking entirely. Deliberate quality decision, not a technical limitation.</p>
<p><strong>Inverse-frequency masking sacrifices head-item accuracy for tail coverage.</strong> The model becomes slightly less sharp at predicting staples like eggs and milk — but dramatically better at long-tail and recipe-driven relationships. Zepto made this explicit: staples do not need recommendation help; niche items are exactly where proactive surfacing adds value.</p>
<p><strong>Warm-starting creates path dependency.</strong> Historical biases in the prior model partially carry into initial weights. Mitigated by keeping the auxiliary embedding frozen while the main product embedding remains trainable — but it is a real tradeoff between training speed and representation freshness.</p>`,
    pmAngle: `<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — frame the problem before the solution</div>
  <div class="ex-interview-answer">The key framing: recommendations are most valuable when a user is already in purchase mode. The question is not "what does this user like in general?" — that is a personalisation problem. The question is "what is this user trying to accomplish in this specific session, right now?" That intent signal lives entirely inside the current cart. The right architecture reads the partial basket as a structured sequence, infers the mission — dinner prep, baby stock-up, party run — and completes it. That insight leads you to MLM rather than collaborative filtering.</div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design cart recommendations for Blinkit?"</div>
  <div class="ex-interview-answer">Start with the quick-commerce constraint: average Blinkit session is under 4 minutes, cart is 3-6 items. The model needs a confident intent hypothesis from very few signals — no waiting for 8 items. Architecture: Transformer-based MLM on historical orders, cart as a product sequence enriched with time and location. Critical India layer — geography: 6-item cart at 8am in a Bengaluru tech corridor looks completely different from the same cart in a Lucknow residential area. Weight masking toward rare and long-tail products during training: Blinkit's value is not recommending milk — it is surfacing the specific brand of ghee or kokum the user did not know to search for.</div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What metric would you use to evaluate cart recommendations?"</div>
  <div class="ex-interview-answer">Add-to-Cart Rate on recommended items is primary — directly measures whether predictions are actionable in the moment. But track alongside Average Order Value, because a system that drives adds without lifting basket size may just be substituting items the user would have added anyway. Zepto is clean on both: +23.4% ATC and +&#8377;0.70 AOV — the model is completing baskets, not rearranging them. Also watch the split between head-item and tail-item add rates. If the model only drives adds on staples, it is doing popularity ranking with extra steps, not contextual inference.</div>
</div>`,
    commonMistake: `<div class="ex-mistake">
  <div class="ex-mistake-label">&#9888; Common mistake</div>
  Most candidates say "use collaborative filtering — find users with similar purchase history and recommend what they bought." Wrong for this problem. Collaborative filtering answers "what does this type of user buy?" — it operates on identity, not session intent. It would recommend a baby product to someone who bought diapers six months ago even if today's cart is clearly a party snack run. The right answer is session-aware inference: read the current cart as a sequence, infer the active mission, and complete it. MLM gives you a model that understands mozzarella + pasta + basil today means tomato sauce is missing — regardless of what the user bought last week.
</div>`,
    sources: [{id:89,title:'Your Cart Has a Story — How Zepto Learned to Read It',url:'https://blog.zepto.com/your-cart-has-a-story-heres-how-we-learned-to-read-it-10ba9188f534'}]
  }
},
{
  slug: 'swiggy-address-correction-qcommerce',
  company: 'Swiggy',
  problem: 'Address Correction for Q-Commerce',
  oneLiner: 'Swiggy Instamart (q-commerce delivery where GPS inaccuracy in Indian urban environments causes delivery failures and cancellations) built a two-stage address correction system — a multimodal RoBERTa classifier (AUC-ROC 0.89, +23pp precision, +32pp recall over baseline) that flags inaccurate locations, followed by a self-supervised geocoder that corrects them using delivery partner field signals rather than manually labelled data.',
  addedOn: '14 Jun 2026',
  important: false,
  hidden: false,
  topics: ['Geo & Location ML', 'LLM Systems', 'Operations ML'],
  sections: {
    problem: `
<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    GPS coordinates captured by customers' phones were used as-is for routing delivery partners. In dense Indian urban environments — high-rises, narrow lanes, metallic structures — GPS multipath errors place pins hundreds of metres from the actual address. Delivery partners couldn't find customers, called support teams, spent longer between orders, and in extreme cases orders were cancelled. No system flagged or corrected these inaccurate locations.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    A prefilter removes addresses with accurate locations. A multimodal classifier (AUC-ROC 0.89) flags inaccurate ones using address text + delivery partner field signals. A geocoder corrects the flagged locations using self-supervised learning from historical delivery data. No manually labelled data required anywhere in the pipeline.
  </div>
</div>
<p>The root cause is a q-commerce-specific constraint that doesn't exist in e-commerce: customers provide their GPS location alongside their text address. In e-commerce, you geocode every address because no location is available. In q-commerce, most captured locations are accurate — you only want to correct the inaccurate ones, and accuracy requirements are far more stringent (tens of metres, not hundreds) because delivery windows are 10–20 minutes. Applying standard e-commerce geocoding to all addresses wastes compute and risks correcting accurate locations to wrong ones.</p>
`,

    howSolved: `
<p>The system is a three-stage pipeline: prefilter (rules-based), classifier (flags inaccurate locations), geocoder (corrects them). Each stage passes only the addresses it can't resolve cleanly to the next — the geocoder only sees addresses the classifier has flagged and that have at least one prior successful delivery.</p>

<div class="ex-flow">
  <div class="ex-flow-step">Location Inaccuracy Prefilter<br><small>Rules: median historical delivery location within threshold of captured location → accurate, skip correction</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Multimodal Inaccuracy Classifier<br><small>RoBERTa (address text + geohash) + numeric DP field signals → inaccuracy flag</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Geocoder (SAM / UAM / Seq2Seq)<br><small>Corrects flagged address to predicted true location</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Post-processor<br><small>Certifies geocode as usable only if it falls within threshold of historical delivery locations</small></div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Multimodal classifier — text branch</div>
    <div>RoBERTa encodes address text + L8 geohash of captured location to detect dissonance between what the text says and where the pin is</div>
    <div>Challenge: if the GPS is wrong, the reverse geocode pre-filled in the address form is also wrong — so the model must detect dissonance between a noisy text and a noisy coordinate. Indian addresses add further noise: unstructured format, linguistic diversity, and Latin-script spellings of vernacular place names</div>
  </div>
  <div class="ex-table-row">
    <div>Multimodal classifier — numeric branch</div>
    <div>Fuses delivery partner field signals: fraction of ICA (Incorrect Address) flags, DP-to-customer call rates, call duration, longer-than-promised travel distance tickets, customer-initiated cancellations</div>
    <div>These signals are noisy (DPs flag ICA for many reasons beyond GPS) but collectively add +23pp precision and +32pp recall over the text-only baseline. The model is trained in three phases: standard MLM pretraining → binary classification on perturbation dataset → end-to-end fine-tuning with numeric features on DBSCAN dataset</div>
  </div>
  <div class="ex-table-row">
    <div>Self-supervised training data</div>
    <div>Negative samples (accurate locations) derived from cross-validation of median historical delivery locations; positive samples generated by Gaussian perturbation or address swapping</div>
    <div>No human labellers anywhere in the pipeline. The DBSCAN dataset (for numeric fine-tuning phase) uses density-based clustering of historical delivery locations to identify ground truth — inherently reliable because it reflects where DPs actually delivered successfully</div>
  </div>
  <div class="ex-table-row">
    <div>SAM geocoder (best performer)</div>
    <div>RoBERTa-based address matching: encodes query address and a database of accurately-located addresses into embedding space, retrieves nearest neighbour within the H8 geohash cell of the captured location</div>
    <div>Coarse localisation (H3 resolution 8, ~600m × 600m cell) anchored to the captured GPS location — even an inaccurate GPS is unlikely to be 156km wrong (L3 cell size), so the model searches within a tight geographic radius</div>
  </div>
  <div class="ex-table-row">
    <div>Post-processor (usability certification)</div>
    <div>Geocoder output is only used if it falls within a threshold of historical delivery locations for that address</div>
    <div>Raw geocoders produce 95th percentile delivery deviations of hundreds of metres — unsuitable for q-commerce. Post-processing against historical delivery locations brings deviations to a scale comparable with DBSCAN while requiring 1.25–2.5x fewer historical orders than DBSCAN needs to produce a prediction</div>
  </div>
</div>
`,

    users: `
<div class="ex-failure">
  <div class="ex-failure-label">Customer in a high-rise apartment complex</div>
  GPS multipath from surrounding buildings places the pin on the street rather than inside the complex. Delivery partner navigates to the street, can't find the building, calls the customer or support. With the classifier flagging this address as inaccurate and the geocoder correcting to the cluster centroid of historical delivery locations, the DP is routed to where previous DPs successfully delivered.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Delivery partner on the field</div>
  Old system: DP navigates to wrong location, calls support (ICA flag), calls customer (DP2Cr), spends extra time, submits a longer-distance payout ticket. New system: the address is pre-corrected before the order is dispatched — the DP receives a corrected pin and navigates directly. Extended inter-order time drops; payout disputes decrease.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">New address with no delivery history</div>
  The prefilter and geocoder both require historical delivery locations to operate. A brand-new address with no prior successful deliveries falls through the pipeline uncorrected — the system correctly does nothing rather than producing an unreliable correction. The inaccuracy flag can still nudge the customer to review and correct their address text.
</div>
`,

    metrics: `
<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">0.89</div>
    <div class="ex-stat-label">AUC-ROC (inaccuracy classifier)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+23pp</div>
    <div class="ex-stat-label">Precision over text-only baseline</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+32pp</div>
    <div class="ex-stat-label">Recall over text-only baseline</div>
  </div>
</div>
`,

    tradeoffs: `
<p><strong>Correct only when flagged — not all addresses.</strong> In e-commerce, every address is geocoded because no GPS is available. In q-commerce, most captured locations are accurate — applying the geocoder to all addresses risks correcting accurate ones to wrong locations, which is worse than doing nothing. The prefilter + classifier gate means the geocoder only touches a small fraction of addresses where inaccuracy is likely. The tradeoff is that the system's coverage is limited by classifier recall: inaccurate addresses the classifier misses go uncorrected. The three-phase training design (perturbation → DBSCAN → numeric fine-tuning) is specifically engineered to maximize recall without destroying precision.</p>

<p><strong>Self-supervised training over manual labels — inherits noise from DP behavior.</strong> No human labels are used anywhere in the pipeline. Positive samples (inaccurate addresses) are generated synthetically by Gaussian perturbation or address swapping; the DBSCAN dataset derives ground truth from delivery location clustering. The advantage is scale — manual labelling at Swiggy's address volume is infeasible. The risk is systematic bias: DPs flag ICA for reasons beyond GPS inaccuracy (illegible building names, access restrictions), so numeric features derived from ICA rates introduce noise that the model must learn to discount.</p>

<p><strong>Post-processing geocoder output rather than deploying raw predictions.</strong> Raw geocoder outputs — even the best SAM architecture — produce 95th percentile delivery deviations far above q-commerce requirements. Rather than building a better model, Swiggy added a post-processor that validates geocoder predictions against historical delivery locations and only surfaces "usable" predictions. This means coverage drops (some addresses can't be certified), but every correction that is served meets the accuracy bar. The tradeoff is explicit: fewer corrections, but all corrections are trustworthy.</p>
`,

    pmAngle: `
<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — establish why q-commerce address correction is a different problem than e-commerce geocoding</div>
  <div class="ex-interview-answer">
    The first thing I'd clarify is that address correction in q-commerce is a fundamentally different problem from geocoding in e-commerce. In e-commerce, you geocode every address because the customer's GPS location isn't available — you must infer location from text alone. In q-commerce, customers provide their GPS coordinates, and most of them are accurate. So the problem is: identify the subset of addresses where the GPS is wrong, and correct only those. Applying e-commerce geocoding to all q-commerce addresses wastes compute and — more importantly — risks moving accurate pins to wrong locations. The architectural answer is a classifier gate before the geocoder, not a geocoder running on every address.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you reduce delivery failures due to wrong addresses at Blinkit?"</div>
  <div class="ex-interview-answer">
    I'd build exactly the pipeline Swiggy built: a three-stage system. First, a prefilter using historical delivery locations — if past DPs delivered successfully at a location close to the captured GPS, it's probably accurate. Second, a classifier that uses address text and delivery partner field signals — incorrect address flags, call rates, longer-distance travel tickets — to identify the remaining inaccurate pins. The key insight for Blinkit specifically is that DPs are a real-time sensor network: every time a DP calls support or the customer, that's a signal that something is wrong with the address. Those signals are noisy individually but powerful in aggregate. Third, a geocoder that corrects flagged addresses using clustering of historical delivery locations for that address, post-processed to only surface corrections that meet the accuracy bar for 10-minute delivery. No manual labels needed anywhere — the training data comes entirely from the DP field signals.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you get training data for a location inaccuracy model without labelling?"</div>
  <div class="ex-interview-answer">
    Self-supervised data generation using two complementary approaches, as Swiggy did. For negative samples (accurate locations), cross-validate the customer's captured GPS against the median of historical delivery locations for that address — if DPs have consistently delivered within a small radius of the captured point, the location is accurate. For positive samples (inaccurate locations), start from verified accurate locations and either perturb them with Gaussian noise or swap addresses from different parts of the city. The perturbed samples are guaranteed inaccurate because you know the true location. The swap samples simulate the specific failure mode where a user selects a pin from their location history that doesn't match their current text. The advantage is scale: you can generate millions of labeled pairs without a single human labeller. The risk is that synthetic positives don't capture every real-world failure mode — which is why Swiggy added a DBSCAN dataset from actual field data in the final fine-tuning phase.
  </div>
</div>
`,

    commonMistake: `
<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates either say "improve the address input UX to force users to pin accurately" (a product intervention, not an ML system, and it doesn't fix existing addresses) or propose geocoding every address using a standard maps API (works for e-commerce but wrong for q-commerce — it ignores the GPS coordinate the customer provided, and applying corrections to accurate addresses introduces new errors). The right answer is conditional correction: prefilter to exclude accurate addresses, classify the remainder to identify inaccurate ones, and only then apply the geocoder — using delivery partner field signals and historical delivery clustering as your ground truth source rather than a maps API or manual labels.
</div>
`,

    sources: [
      {
        id: 111,
        title: 'Address Correction for Q-Commerce Part 1: Location Inaccuracy Classifier',
        url: 'https://bytes.swiggy.com/address-correction-for-q-commerce-part-1-location-inaccuracy-classifier-ca1bd41e9c82'
      },
      {
        id: 112,
        title: 'Address Correction for Q-Commerce Part 2: Geocoder',
        url: 'https://bytes.swiggy.com/address-correction-for-q-commerce-part-2-geocoder-79a5b26ece34'
      }
    ]
  }
},
{
  slug: 'swiggy-cross-domain-new-user-reco',
  company: 'Swiggy',
  problem: 'New User Cold-Start Recommendations (Instamart)',
  oneLiner: 'Swiggy Instamart (q-commerce grocery service with severe cold-start data sparsity for new users) built a Hierarchical Cross-Domain Ranking model that transfers food delivery behavior to grocery recommendations, outperforming popularity baseline by 8% NDCG and embedding-mapping approaches by 30% NDCG, with a 4% improvement in conversion in production.',
  addedOn: '14 Jun 2026',
  important: true,
  hidden: false,
  topics: ['Recommendations', 'Cold Start', 'Cross-Domain Learning'],
  sections: {
    problem: `
<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    New Instamart users saw popularity-based recommendations — the same top products for their location and time slot regardless of who they were. A user who exclusively ordered paneer curries on Swiggy Food was shown the same generic grocery list as a user who ordered sandwiches. The first widget a new user sees on Instamart was effectively blind to any signal about their preferences.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    The HCDR model maps food ordering history to grocery category preferences through a hierarchical taxonomy. A paneer curry orderer sees dairy and fresh produce ranked higher. A sandwich liker sees cheese and bread surfaced. +4% conversion on the first Instamart widget for new and early repeat users.
  </div>
</div>
<p>The root cause is data sparsity — new Instamart users have no grocery purchase history, so collaborative filtering and user-item interaction models produce nothing useful. The insight is that Swiggy's food delivery service is a much richer data source: users have months of food ordering history before their first Instamart visit. That history contains latent signals about grocery preferences — someone who orders paneer dishes frequently is more likely to buy milk and dairy; a sandwich lover over-indexes on cheese and bread relative to the average user. The challenge is learning that cross-domain mapping reliably despite India's geographic and cultural diversity in both food and grocery preferences.</p>
`,

    howSolved: `
<p>The Hierarchical Cross-Domain Ranking (HCDR) model is a two-stage architecture. Stage 1 maps food category preferences to grocery category preferences at three levels of the product taxonomy (L1/L2/L3). Stage 2 uses those mapped preferences as features in a location-aware learning-to-rank model to produce the final product ranking.</p>

<div class="ex-flow">
  <div class="ex-flow-step">User's food order history<br><small>X months of dish-family order % vectors</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Hierarchical cross-domain mapper<br><small>3 multi-label classifiers: L1 / L2 / L3 grocery categories</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Category affinity scores + ranks<br><small>Probability of ordering each grocery category in first order</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Location-aware GBT ranker<br><small>Combines cross-domain features + product RWF popularity score</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Personalised product ranking<br><small>Served on Instamart's first widget for new users</small></div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Dish-family order % vector (input)</div>
    <div>Encodes what fraction of the user's food orders belong to each dish family</div>
    <div>Operates at category level, not item level — avoids embedding noise from long-tail dishes that rarely appear. A user who ordered paneer curry 50% of the time is represented by that fraction, not by specific dish embeddings</div>
  </div>
  <div class="ex-table-row">
    <div>Hierarchical mapper (L1/L2/L3)</div>
    <div>Three separate multi-label classifiers, each predicting which grocery categories the user will order in their first Instamart visit</div>
    <div>Hierarchy matters: removing L1 features causes a 9% NDCG drop; removing L2 on top causes further degradation. Coarser categories provide stable signal that finer categories alone can't — especially for new users with limited food history</div>
  </div>
  <div class="ex-table-row">
    <div>Recency-weighted frequency (RWF) score</div>
    <div>Location and time-slot specific product popularity, weighted toward recent orders</div>
    <div>Still the highest-importance feature in the GBT ranker — the cross-domain features add incremental signal on top of popularity, not replace it. This is the right production tradeoff: popularity is a strong prior; personalization lifts the tail</div>
  </div>
  <div class="ex-table-row">
    <div>GBT point-wise LTR (Stage 2)</div>
    <div>Scores each user-product pair using L1/L2/L3 affinity scores + ranks + RWF popularity</div>
    <div>Trained as binary classification: products ordered in user's first grocery session = positive; top-K popular products not ordered = negatives. Positive/negative split reflects real cold-start signal availability</div>
  </div>
</div>
`,

    users: `
<div class="ex-failure">
  <div class="ex-failure-label">New Instamart user — zero grocery history</div>
  Popularity model shows the same top-10 products for all new users in a location. HCDR uses food order history — even 1 month of food orders is enough to produce a meaningful category affinity vector. Paneer curry orderer sees dairy ranked higher; biryani-only orderer sees rice and spices surfaced.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Early repeat user — 1–2 Instamart orders</div>
  Collaborative filtering still can't operate meaningfully with 1–2 data points. HCDR continues to use cross-domain signal until enough grocery history accumulates to transition to standard collaborative filtering — the model is explicitly designed for this "early repeat" segment alongside true new users.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Regional diversity — Bengaluru vs. Lucknow</div>
  A flat embedding-mapping approach (MLP-EM) treats all users' grocery preferences as derivable from a single global mapping function. HCDR's location-aware Stage 2 ranker incorporates store-specific product availability and local popularity signals — a sandwich liker in Bengaluru and one in Lucknow get different recommendations because local assortment and cultural grocery preferences differ.
</div>
`,

    metrics: `
<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">+8%</div>
    <div class="ex-stat-label">NDCG vs. popularity baseline (offline)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+30%</div>
    <div class="ex-stat-label">NDCG vs. MLP embedding-mapping (offline)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+12.5%</div>
    <div class="ex-stat-label">MRR vs. popularity baseline (offline)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+4%</div>
    <div class="ex-stat-label">Conversion uplift (production A/B)</div>
  </div>
</div>
`,

    tradeoffs: `
<p><strong>Category-level mapping over item-level embedding mapping.</strong> The standard cross-domain approach (MLP-EM) maps user embeddings derived from item-level interactions across domains. Swiggy found this sub-optimal because grocery sales are long-tailed — most items are ordered rarely, making item embeddings noisy. Operating at category level (dish families → grocery L1/L2/L3) aggregates signal across items, producing stable representations even for users with limited history. The tradeoff is loss of granularity: two users with identical category preferences but different brand loyalties get the same category-level recommendations.</p>

<p><strong>Three separate hierarchical classifiers over a single flat model.</strong> Training one multi-label classifier over all grocery categories would conflate L1, L2, and L3 signals. Separate classifiers per hierarchy level allow the GBT ranker to use coarse-grained and fine-grained signals independently — and the ablation study confirms this matters: removing L1 features alone drops NDCG by 9%. The tradeoff is three models to maintain instead of one, and inference requires three passes through the mapper before Stage 2 can run.</p>

<p><strong>RWF popularity remains the top feature — cross-domain is incremental.</strong> The GBT feature importance shows RWF (recency-weighted local popularity) as the single most important feature, with cross-domain scores adding non-zero but secondary lift. This is the right design for a new-user product: popularity is a reliable prior that prevents catastrophic recommendations; personalization nudges the ranking for users whose preferences diverge from local averages. But it means users with highly mainstream food preferences will see near-identical recommendations to the popularity baseline.</p>
`,

    pmAngle: `
<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — establish that cold start is a data problem, not a model problem</div>
  <div class="ex-interview-answer">
    When I'm asked about cold-start recommendations, I first ask: what other data do we have about this user that doesn't come from the target domain? Cold start is a data sparsity problem — the user has no history in the system we're trying to recommend for. But they usually have history somewhere else. At Swiggy, new Instamart users often have months of food ordering history. That history contains real signal about preferences — someone who orders paneer curries is statistically more likely to buy dairy and fresh produce than someone who orders sandwiches. The architectural question is how to transfer that signal reliably, accounting for the fact that the relationship between food preferences and grocery preferences varies across India's geographic and cultural diversity.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you solve cold start for a new user on Zepto?"</div>
  <div class="ex-interview-answer">
    Zepto is interesting because it's a grocery-first platform — there's no food delivery history to cross-reference. So the cold-start data sources are different: device signals, location, time of first session, and any onboarding data the user provides. I'd start with a hybrid: location-aware popularity as the strong prior, and a lightweight onboarding flow that asks two or three questions — "Do you cook at home often?", "Any dietary restrictions?" — to segment the user into a cohort before their first order. The Swiggy insight that applies here is hierarchy: if you map preferences, do it at category level (dairy, snacks, produce) rather than item level, because item-level data is too sparse to produce stable signals. For Zepto specifically, I'd also look at whether there's any signal from the user's first search query — someone searching "paneer" in their first session is showing you something that a popularity model would ignore.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "When does cross-domain learning break down?"</div>
  <div class="ex-interview-answer">
    Cross-domain learning breaks down when the relationship between domains is weak, noisy, or varies so much by geography that a single mapping function can't capture it. Swiggy found that a flat MLP embedding mapping — which learns one global transfer function from food to grocery — underperformed their hierarchical category approach by 30% NDCG. The reason is that grocery sales are long-tailed, so item embeddings are noisy, and a single mapping function can't account for the fact that a "sandwich liker" in Bengaluru and one in Lucknow have very different local grocery assortments available to them. The safeguard is always to keep a strong local popularity baseline as the dominant signal and treat cross-domain features as incremental lift — that way, if the transfer signal is weak for a particular user, the recommendation quality degrades gracefully to popular products rather than failing catastrophically.
  </div>
</div>
`,

    commonMistake: `
<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates either say "show popular products to new users" (correct but leaves personalization on the table) or "use collaborative filtering with item embeddings mapped across domains" (sounds sophisticated but breaks down when sales are long-tailed and item embeddings are noisy). The right answer is category-level cross-domain mapping: aggregate user preferences at the dish-family level from the richer domain, learn a hierarchical mapping to grocery category preferences, and use those affinity scores as features in a location-aware ranker that still treats local popularity as the dominant prior. The hierarchy is what makes it work — using L1, L2, and L3 grocery categories simultaneously gives the ranker both stable coarse-grained signal and discriminative fine-grained signal that a flat mapping function misses.
</div>
`,

    sources: [
      {
        id: 113,
        title: 'New-User Product Recommendations for Q-Commerce via Hierarchical Cross-Domain Learning',
        url: 'https://bytes.swiggy.com/new-user-product-recommendations-for-q-commerce-via-hierarchical-cross-domain-learning-88e1b8b47802'
      }
    ]
  }
},
{
  slug: 'swiggy-wira-homepage-layout',
  company: 'Swiggy',
  problem: 'Homepage Layout Personalisation',
  oneLiner: 'Swiggy (millions of daily app sessions across five user cohorts and five meal slots) built WiRa — a Widget Ranking framework using contextual Multi-Armed Bandits — that personalises the order of homepage widgets per user and drove a 1.08pp lift in dynamic slots order share in a pan-India A/B test, while eliminating the manual multi-team effort of running widget positioning experiments.',
  addedOn: '14 Jun 2026',
  important: false,
  hidden: false,
  topics: ['Personalisation', 'Bandits & RL', 'Homepage & Discovery'],
  sections: {
    problem: `
<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Widget order on the homepage was static — fixed per user cohort, manually set. Adding a new widget required a PM to run a series of A/B experiments across multiple teams (operations, experimentation, analytics) to find its optimal position. At Swiggy's five cohort × five meal-slot granularity, this process took weeks and still produced a one-size-fits-all answer per cohort.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    WiRa ranks six homepage widgets in real time per user using a single contextual MAB. A new widget is added as a candidate arm — no positional A/B experiments needed. Pan-India A/B result: +1.08pp dynamic slots order share. Customer NPS improved. No significant drop in Ads RPO.
  </div>
</div>
<p>The structural problem with static layouts is that widget value is not position-independent. A "Coupons For You" widget is more valuable to a price-sensitive user at dinner time than to a repeat premium user at breakfast. A single fixed layout optimizes for average behavior and leaves per-user signal on the table. The manual A/B process couldn't catch up — each positioning decision took weeks, and cohort-level layouts still weren't individual-level.</p>
`,

    howSolved: `
<p>WiRa went through three formulations before settling on a single contextual MAB. The key evolution was moving from per-slot MABs (sparse, siloed) to a single multi-arm multi-play MAB where each arm is a widget and scores rank all slots simultaneously.</p>

<div class="ex-flow">
  <div class="ex-flow-step">Baseline<br><small>Linear combo of order share + ad revenue per cohort × meal slot</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Linear Programming (discarded)<br><small>Couldn't scale to user-level; rigid feature engineering</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">MAB v1 — per slot (discarded)<br><small>k separate MABs; sparse data in lower slots; high maintenance</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">MAB v2 — single multi-play MAB<br><small>One MAB, 6 arms (widgets), scores rank all dynamic slots</small></div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Dynamic slots</div>
    <div>Replaces fixed widget positions with candidate sets the model can rank</div>
    <div>Not all slots are dynamic — some widgets (like the search bar) remain static. Only 6 candidate widgets compete for dynamic positions, limiting blast radius during the experimental rollout</div>
  </div>
  <div class="ex-table-row">
    <div>Context vector</div>
    <div>Encodes meal slot (breakfast/lunch/snacks/dinner/midnight) and user cohort as the MAB's observation of the environment</div>
    <div>Deliberately simple in v1 — the vector format makes it extensible to user embeddings and widget embeddings in future iterations without architectural changes</div>
  </div>
  <div class="ex-table-row">
    <div>Single multi-play MAB (TF-Agents)</div>
    <div>Outputs a score for each of the 6 widget arms simultaneously; scores are used to rank widgets into dynamic slots</div>
    <div>Chosen over Vowpal Wabbit for transparency into hidden state, policy-level controls (LinUCB and Thompson Sampling both available), and a native simulation environment for offline evaluation</div>
  </div>
  <div class="ex-table-row">
    <div>Reward function</div>
    <div>Binary: 1 if an order was placed through the widget in that session, 0 otherwise; combined with ad revenue signal</div>
    <div>Training filtered to ordered sessions only — including all sessions made data heavily imbalanced and caused the MAB to over-index on ad clicks rather than order conversions</div>
  </div>
  <div class="ex-table-row">
    <div>Offline evaluation loop</div>
    <div>Trains on 2 months of data, evaluates iteratively day-by-day on month 3, computes nDCG@6, top-1 order share, top-3 order share, and Ads RPO</div>
    <div>After 15 days, both LinUCB and Thompson Sampling consistently beat the baseline on top-1 widget order share — confirming the MAB was learning the right widget to surface first per context</div>
  </div>
</div>
`,

    users: `
<div class="ex-failure">
  <div class="ex-failure-label">PM trying to launch a new widget</div>
  Old process: design 3–4 A/B experiments across ops, experimentation, and analytics teams to find the optimal position — weeks of elapsed time. New process: add the widget as a candidate arm in WiRa. The MAB explores its placement automatically and converges to the right position through online learning, with no manual experiment pipeline.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">User at breakfast vs. late night</div>
  Static layout showed the same widget order at 8am and midnight. A "Try Something New" widget at midnight may convert well; at 8am a quick "Customer Favourites" widget serves faster intent. WiRa's meal-slot context lets the MAB learn these temporal patterns and reorder accordingly per session.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Widget unavailable in certain regions</div>
  MAB v1 (per-slot) would return a widget that wasn't available in the user's city — the response was unusable. Single MAB v2 handles this by scoring all 6 arms and skipping unavailable ones, since availability is a filter applied to scores rather than a model-level constraint.
</div>
`,

    metrics: `
<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">+1.08pp</div>
    <div class="ex-stat-label">Dynamic slots order share (pan-India A/B)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+0.16pp</div>
    <div class="ex-stat-label">Dynamic slots order share (4-city pilot)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">↑</div>
    <div class="ex-stat-label">Customer NPS (significant)</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">✓</div>
    <div class="ex-stat-label">Ads RPO held — no significant drop</div>
  </div>
</div>
`,

    tradeoffs: `
<p><strong>Single MAB over per-slot MABs — loses position-awareness.</strong> The v1 per-slot design had each slot learn which widget worked best in that position. The v2 single MAB scores all widgets globally and ranks them into slots — meaning the same widget ranking is applied to every slot without accounting for position effects (e.g. a widget might perform differently at slot 2 vs. slot 5 because of scroll depth). Swiggy made this tradeoff explicitly to avoid data sparsity in lower slots and reduce maintenance cost, acknowledging it as a known limitation to address in a future version.</p>

<p><strong>Ordered sessions only for training — biases away from discovery.</strong> Including all sessions (ordered and not) caused the MAB to over-index on ad clicks because click data was far denser than order data. Filtering to ordered sessions fixes the objective but means the model never learns from users who browsed without ordering — a systematic blind spot for re-engagement and discovery use cases where conversion isn't the immediate signal.</p>

<p><strong>Static slots coexist with dynamic slots — limits full personalization.</strong> WiRa only ranks 6 of the homepage widgets; other slots remain static and can't be reordered. This limits how much the layout can change per user — a widget hardcoded into slot 1 always wins regardless of what the MAB would have scored it. The tradeoff was intentional for v1: limiting blast radius during the experimental rollout. Full homepage dynamism is a future-state goal.</p>
`,

    pmAngle: `
<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — frame why homepage layout is a ranking problem, not a positioning problem</div>
  <div class="ex-interview-answer">
    The framing I'd start with is: widget positioning isn't a one-time decision, it's a per-user real-time ranking problem. The mistake most teams make is treating it as a static configuration — run an A/B test, find the best position, lock it in. That works when you have one widget and one user type. At Swiggy's scale — five user cohorts, five meal slots, six competing widgets — the optimal layout for a premium user at dinner is different from the right layout for a new user at breakfast. A/B experiments can't keep up with that combinatorial space. The right architecture is a contextual bandit that observes the user context and learns which widget to surface first, updating continuously as new widgets are added or user behavior shifts.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you design homepage personalisation for Zomato?"</div>
  <div class="ex-interview-answer">
    I'd start with the same abstraction Swiggy used — treat each homepage section as a widget with a score, not a fixed position. For Zomato specifically, the key context signals are meal slot, user's order history recency, and whether they're in food or Blinkit mode — those three signals segment intent sharply enough to produce meaningfully different rankings. The architecture I'd use is a contextual MAB with one arm per widget candidate. The reward signal is order completion through the widget, not click — clicks are noisy because they include curiosity taps on ads. The PM-level insight is that this system also eliminates the manual A/B positioning process: a new widget becomes a new arm, and the bandit explores its optimal position through online learning rather than a 3-week experiment pipeline.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "What metric would you use to evaluate a homepage ranking system?"</div>
  <div class="ex-interview-answer">
    The primary metric is order share attributable to the ranked widgets — what fraction of total orders came through the sections the model controls. Swiggy called this "dynamic slots order share." The reason to track this rather than total homepage conversion is attribution clarity: if a static widget drives all orders, the ranking model gets undeserved credit. The critical check metric is Ads Revenue Per Order — a ranking model that buries ad widgets to boost conversion is optimizing the wrong objective. Swiggy explicitly held Ads RPO flat as a constraint. I'd also track the explore-exploit trajectory over time: if the MAB stops exploring early and locks in a fixed ranking, it's no longer adapting to new widgets or shifting behavior — which defeats the purpose of the system.
  </div>
</div>
`,

    commonMistake: `
<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates propose running A/B tests to find the best widget order, then hardcoding the winner. Wrong for two reasons. First, A/B tests produce a single winner across all users — they can't produce a per-user ranking, which means a price-sensitive evening user and a premium breakfast user get the same layout. Second, every time a new widget is added, the experiment process restarts: new variants, new coordination across teams, new wait for statistical significance. The right answer is a contextual bandit where each widget is an arm, the context encodes user segment and session time, and the reward is order completion. New widgets are added as new arms — the bandit explores their placement automatically. No experiment pipeline, no fixed positions, continuous adaptation.
</div>
`,

    sources: [
      {
        id: 110,
        title: 'Personalising the Swiggy Homepage Layout (Parts I & II)',
        url: 'https://bytes.swiggy.com/personalising-the-swiggy-homepage-layout-part-i-1b0fe3524472'
      }
    ]
  }
},
{
  slug: 'zepto-agentic-customer-support-zap',
  company: 'Zepto',
  problem: 'Agentic Customer Support',
  oneLiner: 'Zepto (millions of daily orders, peak-hour support queues that could not scale linearly with volume) built Zap — a layered agentic support system with specialist vertical agents and horizontal policy guardrails — reducing average resolution time by 75% (minutes to seconds) and lifting positive customer reviews by 20%.',
  addedOn: '14 Jun 2026',
  important: false,
  hidden: false,
  topics: ['Agentic AI', 'LLM Systems', 'Support Automation'],
  sections: {
    problem: `
<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Human-first support model. During peak hours and sale events, queues grew as order volume surged. Agents had to stitch together information from multiple systems to resolve straightforward issues — a missing item refund that should take seconds took minutes. Agent-to-agent variability meant inconsistent outcomes on identical issues.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    Zap handles standard support cases end-to-end autonomously. Humans are escalation points, not first responders. Resolution time dropped 75% — from minutes to seconds. Positive customer reviews up 20%. The system scales with order volume without linear headcount growth.
  </div>
</div>
<p>The structural problem wasn't agent quality — it was that human-first workflows introduced irreducible latency for cases that didn't need human judgment. Most quick-commerce support issues are familiar, repeatable, and time-sensitive: missing item, wrong product, damaged delivery, refund query. These can be resolved deterministically once the system has verified the evidence. Routing them through a human queue is the wrong architecture, not the wrong people.</p>
`,

    howSolved: `
<p>Zap is built as a layered architecture of specialist agents. The guiding principle: complex problems need deep specialists; consistency, safety, and policy compliance are enforced centrally through horizontal layers. Every interaction passes through the same flow regardless of issue type.</p>

<div class="ex-flow">
  <div class="ex-flow-step">Customer selects ticket category</div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Horizontal agents<br><small>Auth + multimodal evidence verification</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Vertical specialist agent<br><small>Chat-based or product-based</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Policy guardrail layer<br><small>Validates proposed resolution before execution</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Response or action<br><small>Refund issued, replacement triggered, or human escalated</small></div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Horizontal agents (auth + context)</div>
    <div>Verify evidence quality before any specialist agent processes it</div>
    <div>Check image legibility, evidence relevance to the order, and whether images are reused across multiple tickets — prevents fraudulent or ambiguous inputs from reaching resolution logic</div>
  </div>
  <div class="ex-table-row">
    <div>Chat-based vertical agents</div>
    <div>Handle conversational, time-sensitive issues across multi-turn dialogue</div>
    <div>Multi-node architecture separates intent detection, SOP resolution, and response formulation — avoids the failure mode of reasoning and acting simultaneously without structure</div>
  </div>
  <div class="ex-table-row">
    <div>Grid-based SOP framework</div>
    <div>Maps conversation state (intent + order state + delay severity) to a narrowly scoped policy subset</div>
    <div>Avoids injecting entire SOP documents into prompts — reduces context window size, lowers latency, and makes policy updates faster since each grid cell references a small, precise policy slice</div>
  </div>
  <div class="ex-table-row">
    <div>Product-based vertical agents</div>
    <div>Handle physical quality and fulfilment issues requiring evidence-based verification</div>
    <div>Follow Validation → Scoring → Policy → Decision. Image Scorer assesses freshness, expiry visibility, defect extent. Scores feed the policy layer — the agent never decides on raw image perception alone</div>
  </div>
  <div class="ex-table-row">
    <div>Chain-of-Thought before action</div>
    <div>Forces the agent to reason explicitly (SOP allows X, order state is Y, customer asked for Z) before formulating a response or triggering an action</div>
    <div>Eliminates fabricated claims like incorrect ETAs or refund timelines — the agent can only assert what the grounded reasoning chain supports</div>
  </div>
  <div class="ex-table-row">
    <div>Automated evaluation loop</div>
    <div>Randomly samples real conversations and replays them through the system, scoring on quality dimensions</div>
    <div>Chat agents evaluated on correctness, latency, conversation quality. Product agents on claim resolution accuracy. Turns production conversations into continuous training signal without manual audit</div>
  </div>
</div>
`,

    users: `
<div class="ex-failure">
  <div class="ex-failure-label">Customer reporting a missing item with a photo</div>
  Old flow: agent manually inspects photo, cross-references order, applies policy judgment. Variable outcome depending on agent. New flow: horizontal agent verifies image legibility and checks it isn't reused from a prior ticket. Product vertical agent scores the evidence. Policy guardrail validates the resolution. Refund triggered in seconds, consistently.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Customer with a multi-turn complaint ("this is late again")</div>
  Ambiguous in isolation — "again" requires conversation history and current order state to interpret. Chat-based vertical agent's intent detection layer jointly reasons over latest message, full conversation history, current order state, and prior agent actions. Avoids one-shot misclassification of evolving intent.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Peak-hour surge (sale event, festive season)</div>
  Human-first model: queue length grows proportionally with order volume. Zap: throughput scales with compute, not headcount. Standard cases resolve autonomously; humans only see genuinely ambiguous edge cases. Resolution time stays constant regardless of queue depth.
</div>
`,

    metrics: `
<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">75%</div>
    <div class="ex-stat-label">Reduction in average resolution time</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+20%</div>
    <div class="ex-stat-label">Positive customer reviews</div>
  </div>
</div>
`,

    tradeoffs: `
<p><strong>Narrow vertical agents over one broad support bot.</strong> A single generalist agent seems simpler — one model, one prompt, one deployment. But a generalist agent must handle missing items, delivery delays, refund disputes, and product quality claims in a single context window. Specialization matters because the evidence required, the policy applicable, and the failure modes are completely different across categories. A product quality agent needs an image scoring pipeline; a delivery delay agent needs real-time order state. Keeping agents narrow means each has access only to the data and APIs it needs — which also limits blast radius when one agent fails.</p>

<p><strong>Grid-based SOP lookup over full-policy injection.</strong> Injecting the entire support SOP into every prompt would give the agent maximum context — but SOP documents are large, evolving, and most of their content is irrelevant to any given conversation. The grid approach (intent + order state + delay severity indexes a precise policy slice) reduces prompt size, lowers latency, and makes policy updates safer: changing one grid cell doesn't risk destabilizing unrelated resolution paths. The tradeoff is that the grid must be maintained — new intent categories or order states require explicit grid expansion, not just a document update.</p>

<p><strong>Automated evaluation over manual audits.</strong> At Zepto's scale, human auditors can't review every support conversation. Automated evaluation using replay and scoring enables continuous quality monitoring — but it means the quality signal is only as good as the scoring model. If the automated evaluator has blind spots (e.g., systematically misscoring a nuanced conversation type), those blind spots compound invisibly. The team mitigated this with random sampling across verticals, but it remains a structural dependency.</p>
`,

    pmAngle: `
<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — establish the architecture principle before the agent design</div>
  <div class="ex-interview-answer">
    The key framing for any agentic support design question is: where does human judgment actually add value, and where is it just a bottleneck? In quick commerce, the majority of support cases — missing item, wrong product, delivery delay — are repeatable, deterministic, and time-sensitive. They don't need human judgment; they need fast evidence verification and policy application. The right architecture positions humans as escalation points for genuine ambiguity, not as first responders for cases that can be resolved by reading an order state and checking a photo. That shift is what drives the 75% reduction in resolution time Zepto achieved with Zap.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "Design an agentic support system for Swiggy Instamart"</div>
  <div class="ex-interview-answer">
    I'd start with the same layered principle Zepto used: horizontal agents for auth and evidence verification, vertical agents for specific issue categories, a policy guardrail layer before any action fires. For Instamart specifically, the product quality vertical is especially important — fresh produce quality claims are high-frequency and require image scoring to assess freshness and visible damage, not just policy lookup. The chat-based vertical for delivery issues needs to handle the "where is my order" intent robustly, which means reading real-time dark store state and rider location, not just a static SOP. The India-specific constraint is that a large fraction of users will communicate in a mix of Hindi and English, so the intent detection layer needs to handle transliteration and code-switching without losing context across turns.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you prevent an agentic support system from making wrong decisions?"</div>
  <div class="ex-interview-answer">
    There are three layers Zepto built into Zap that I'd replicate. First, evidence verification before the specialist agent ever sees the claim — horizontal agents check image quality, relevance, and whether the same image has been submitted across multiple tickets. You can't reason reliably over ambiguous inputs. Second, Chain-of-Thought before action — the agent must explicitly reason through what the SOP allows, what the order state is, and what the customer is asking before formulating a response. This eliminates fabricated ETAs and refund timelines because the agent can only assert what its grounded reasoning supports. Third, a policy guardrail layer that validates the proposed resolution before it executes. The agent proposes; the guardrail approves. No single reasoning step has unchecked authority over customer-facing outcomes.
  </div>
</div>
`,

    commonMistake: `
<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates design one large support bot: a single LLM with the full support SOP in its context window, handling all issue types in a single agent. This fails for three reasons specific to quick commerce. First, a full SOP injected into every prompt bloats context size and produces inconsistent behaviour — the model can't reliably attend to the right policy slice for the current issue. Second, a generalist agent needs access to every data source (order state, image scorer, refund API, delivery tracker) simultaneously, which creates a large blast radius when anything fails. Third, there's no policy guardrail — the agent reasons and acts in one step, which is where fabrications and policy violations occur. The right design is narrow specialist agents with horizontal auth and a policy validation layer before any action executes.
</div>
`,

    sources: [
      {
        id: 95,
        title: 'How Agentic AI Enables Fast, Reliable Customer Support in QuickCommerce',
        url: 'https://zepto.tech/how-agentic-ai-enables-fast-reliable-customer-support-in-quickcommerce'
      }
    ]
  }
},
{
  slug: 'zepto-cohort-search-personalisation',
  company: 'Zepto',
  problem: 'Cohort-Based Search Personalisation',
  oneLiner: 'Zepto (200K+ search requests per minute, <51ms latency) built a Mixture-of-Experts ranking model with four cohort-specific expert networks — Entry, Mass, Mass-Premium, Premium — that lifted Orders per Day by 60bps, Average Order Value by 138bps, and Gross Profit per Order by 185bps.',
  addedOn: '14 Jun 2026',
  important: false,
  hidden: false,
  topics: ['Search & Ranking', 'Personalisation', 'Real-Time ML'],
  sections: {
    problem: `
<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    A single ranking model served all users identically. A Premium user searching "organic almond butter" saw a discounted peanut butter bulk pack ranked #1 — the model optimized for aggregate clicks, which skewed toward price-sensitive behavior. An Entry user searching "cooking oil" saw a niche cold-pressed variant — wrong intent, wrong user.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    Four cohort-specific expert networks inside a Mixture-of-Experts layer — each trained to optimize for its segment's intent. Premium's expert surfaces long-tail specialty SKUs. Entry's expert surfaces promotions and affordability. One model, one serving infrastructure, four behaviors. +185bps Gross Profit per Order.
  </div>
</div>
<p>The structural failure of a single ranker is that it chases aggregate engagement. At Zepto's scale, Entry and Mass users dominate order volume — so a generic model learns to optimize for price sensitivity and promotions. Premium users, who have higher basket values and healthier unit economics, receive a degraded experience because their behavior pattern is numerically minority. The model isn't wrong; it's optimizing for the wrong objective for each cohort.</p>
`,

    howSolved: `
<p>The solution was a Mixture-of-Experts (MoE) architecture layered on top of a shared deep network. Users are segmented into four cohorts — Entry, Mass, Mass-Premium, Premium — and each cohort gets a dedicated expert network that learns cohort-specific ranking heuristics. A gating network dynamically weights expert outputs based on the user's cohort embedding and query context.</p>

<div class="ex-flow">
  <div class="ex-flow-step">Rich multi-modal inputs<br><small>Categorical + continuous features embedded</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Shared MLP (universal encoder)<br><small>Learns baseline relevance representation</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">MoE layer<br><small>4 expert networks + gating network</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Gated expert logits combined<br><small>Cohort-informed ranking score</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">TF Serving on Cerebro<br><small>200K+ RPM, &lt;51ms latency</small></div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Cohort embedding (8-dim)</div>
    <div>Encodes user segment as a learned dense vector rather than a one-hot flag</div>
    <div>Lets the model capture nuanced cohort similarities — Mass-Premium can borrow signal from both Mass and Premium experts — rather than treating segments as rigid discrete buckets</div>
  </div>
  <div class="ex-table-row">
    <div>Shared MLP with GELU + L1</div>
    <div>Learns a universal relevance representation before expert specialization</div>
    <div>L1 regularization encourages sparsity, reducing overfitting and highlighting the most discriminative features before routing to experts</div>
  </div>
  <div class="ex-table-row">
    <div>Expert networks (×4)</div>
    <div>Each expert learns cohort-specific ranking heuristics independently</div>
    <div>Premium expert learns to prioritize long-tail and specialty SKUs. Entry expert leans into promotions and discounts. They are free to diverge — there is no parameter sharing inside the expert layer</div>
  </div>
  <div class="ex-table-row">
    <div>Gating network</div>
    <div>Computes dynamic weights over expert outputs based on cohort embedding + deep features</div>
    <div>Soft gating — not a hard assignment to one expert. A Mass-Premium user with strong premium signal in-session can weight toward the Premium expert dynamically</div>
  </div>
  <div class="ex-table-row">
    <div>Search term + product embeddings</div>
    <div>Capture semantic intent and product relevance in a shared vector space</div>
    <div>Combined with categorical features (brand, offer flags) and continuous features (price, discount %) to give each expert a rich, multi-modal input</div>
  </div>
</div>
`,

    users: `
<div class="ex-failure">
  <div class="ex-failure-label">Premium user — quality and discovery intent</div>
  Old model ranked discounted bulk packs high for "organic almond butter" because aggregate click data skews price-sensitive. Premium expert now learns from Premium cohort behavior specifically — prioritizes niche, specialty, and long-tail SKUs even when they have lower aggregate CTR.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Entry user — price and promotion intent</div>
  Old model occasionally surfaced cold-pressed oils for "cooking oil" because those products had strong Premium engagement signals contaminating the shared model. Entry expert now surfaces the best-value, most-discounted relevant product — the right answer for a user optimizing for affordability.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">Mass-Premium user — nuanced middle ground</div>
  Hardest cohort to serve with a single model — responds to both promotions and quality. Soft gating allows the model to dynamically blend Expert signals based on in-session behavior rather than forcing a hard assignment.
</div>
`,

    metrics: `
<div class="ex-stats">
  <div class="ex-stat">
    <div class="ex-stat-num">+60bps</div>
    <div class="ex-stat-label">Orders per Day</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+138bps</div>
    <div class="ex-stat-label">Average Order Value</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">+185bps</div>
    <div class="ex-stat-label">Gross Profit per Order</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">200K+</div>
    <div class="ex-stat-label">Requests per minute</div>
  </div>
  <div class="ex-stat">
    <div class="ex-stat-num">&lt;51ms</div>
    <div class="ex-stat-label">Inference latency</div>
  </div>
</div>
`,

    tradeoffs: `
<p><strong>Four cohorts instead of N=1 personalisation.</strong> True individual-level personalisation would theoretically give each user a unique ranker. The problem is data density — a single user doesn't generate enough search interactions to train a stable individual model, and inference complexity explodes. Four cohorts are broad enough to be data-rich and stable, yet segmented enough to produce meaningfully different experiences. The tradeoff is that within-cohort variance is ignored: two Premium users with very different taste profiles get the same expert weights. Zepto explicitly acknowledged this as a stepping stone toward N=1.</p>

<p><strong>Soft gating over hard expert assignment.</strong> Hard assignment — routing each user exclusively to their cohort's expert — would be simpler to reason about and debug. Soft gating introduces ambiguity: a user's ranking score is a blend of multiple experts, which makes attribution harder. But soft gating handles the Mass-Premium cohort's inherent ambiguity more gracefully, and lets the model adapt dynamically within a session rather than being locked to a static cohort label assigned at registration.</p>

<p><strong>One shared model over four separate models.</strong> Training four completely separate rankers per cohort would give each expert maximum freedom to specialize, but it multiplies infrastructure cost (four serving endpoints), complicates deployment, and loses the shared signal from the base MLP layer. The MoE design gets most of the specialization benefit while sharing compute on the universal encoder — one model to train, one model to serve.</p>
`,

    pmAngle: `
<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — establish why a single ranker fails before proposing MoE</div>
  <div class="ex-interview-answer">
    When I'm asked to design a personalised search ranker, I first ask: how homogeneous is our user base? At Zepto, Entry users are price-sensitive and promotion-driven; Premium users are quality-seeking and browse the long tail. A single model trained on all users learns to optimize for aggregate clicks, which means it over-indexes on the majority behavior — price sensitivity — and produces the wrong rankings for Premium users. The solution space has two ends: one-size-fits-all (fails Premium) and N=1 individual models (fails on data density and infrastructure). The right middle ground is cohort-based ranking with a Mixture-of-Experts architecture: you get specialization at the segment level without multiplying serving costs.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you personalise Meesho's search for its user base?"</div>
  <div class="ex-interview-answer">
    Meesho's user base is even more polarised than Zepto's — it spans first-time internet shoppers in Tier 3 cities buying on price, and fashion-forward urban buyers seeking variety and discovery. I'd start with cohort-based ranking, likely simpler than Zepto's four-segment model — maybe two to three cohorts: value-first, discovery-first, and a hybrid. The key Meesho-specific constraint is that price sensitivity is extremely high even within cohorts, so the Entry expert needs to prominently surface discount signals and lowest-price-per-unit for commodities, while the discovery expert needs to surface visual novelty and new arrivals. I'd use an 8-dimensional cohort embedding rather than one-hot encoding so the model can learn that the hybrid cohort is genuinely between the other two, not just a flag to flip.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you define cohorts for search personalisation?"</div>
  <div class="ex-interview-answer">
    The trap is defining cohorts on demographics — age, city tier, income — because those signals are often unavailable or stale. Zepto's cohorts are behavioral: Entry, Mass, Mass-Premium, and Premium, defined by purchase history, price-point of past orders, and category behavior. This is more predictive because it captures revealed preference, not stated preference. The practical consideration is cohort stability — if a user moves from Entry to Mass over three months, the model should adapt. That's why using a learned cohort embedding rather than a hard label matters: the embedding can shift gradually as the gating network sees updated behavioral signals, instead of producing a jarring step-change in rankings the day a user crosses a threshold.
  </div>
</div>
`,

    commonMistake: `
<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates either propose a single universal ranker ("personalise with user features as input") or jump to "train a separate model per user segment." The first fails because a shared model optimizes for the majority behavior and systematically under-serves minority cohorts — at Zepto, this meant Premium users got price-led results. The second fails because four separate models multiply infrastructure cost, create deployment complexity, and lose the shared signal from base-layer learning. The right architecture is a Mixture-of-Experts with a shared encoder and cohort-specific expert networks — one model to train and serve, with expert specialization that happens inside the architecture rather than at the deployment layer.
</div>
`,

    sources: [
      {
        id: 94,
        title: 'Personalized Search Ranking: The Zepto Way',
        url: 'https://zepto.tech/personalized-search-ranking-the-zepto-way'
      }
    ]
  }
},
{
  slug: 'zepto-search-relevance-ranker',
  company: 'Zepto',
  problem: 'Search Relevance Ranking',
  oneLiner: 'Zepto (millions of search queries daily across a 500+ city quick-commerce catalog) built a cross-encoder relevance ranker trained via teacher-student distillation on 40 million query-product pairs, ultimately choosing TinyBERT (4M parameters) over larger models because it delivered 5x faster inference with comparable top-k ranking quality.',
  addedOn: '14 Jun 2026',
  important: true,
  hidden: false,
  topics: ['Search & Ranking', 'Knowledge Distillation', 'Real-Time ML'],
  sections: {
    problem: `
<div class="ex-contrast">
  <div class="ex-contrast-old">
    <div class="ex-contrast-label">Before</div>
    Search returned the right products but ordered them badly. A user searching "low fat milk" might see chocolate milk at position #1 and skimmed milk at position #14. The retrieval system found the right candidates — the ranking layer failed to order them correctly. Downstream personalization couldn't fix a fundamentally wrong ordering.
  </div>
  <div class="ex-contrast-new">
    <div class="ex-contrast-label">After</div>
    A cross-encoder reranker scores each query-product pair jointly, capturing token-level interactions between query and product. The right milk surfaces at position #1. TinyBERT delivers this at 5x the speed of larger models with 25x fewer parameters — making precision affordable at production scale.
  </div>
</div>
<p>The root cause was architectural. Zepto's retrieval layer (bi-encoders, keyword matching) was optimized for coverage — get 100 plausible candidates fast. But the ranking layer was too shallow to distinguish "low-fat milk" from "chocolate milk" when both share tokens. What was needed was a model that could read the query and the product <em>together</em>, not separately — a cross-encoder at Stage 2, sitting between retrieval and final personalized ranking.</p>
`,

    howSolved: `
<p>Modern search is a three-stage pipeline. Zepto's relevance ranker lives entirely at Stage 2 — after retrieval, before personalization. The key architectural choice was cross-encoders over bi-encoders for this stage, and teacher-student distillation to make them production-viable.</p>

<div class="ex-flow">
  <div class="ex-flow-step">Stage 1 — Recall<br><small>Bi-encoders + lexical fetch ~100 candidates</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Stage 2 — Relevance Scoring<br><small>Cross-encoder scores each query-product pair jointly</small></div>
  <div class="ex-flow-arrow">→</div>
  <div class="ex-flow-step">Stage 3 — Final Ranking<br><small>Blends relevance + clicks + price + personalization</small></div>
</div>

<div class="ex-table">
  <div class="ex-table-row ex-table-header">
    <div>Component</div><div>What it does</div><div>Key detail</div>
  </div>
  <div class="ex-table-row">
    <div>Teacher model (large LLM)</div>
    <div>Labels every query-product pair with a continuous relevance score 0–1</div>
    <div>Produces 40M labeled pairs across millions of search queries — far richer than click data alone, far cheaper than human raters</div>
  </div>
  <div class="ex-table-row">
    <div>Cross-encoder student</div>
    <div>Concatenates [query + product] as a single input; self-attention captures token-level interactions</div>
    <div>"Low fat milk" can actively downweight "chocolate milk" despite lexical overlap — impossible with bi-encoders where query and product never interact inside the model</div>
  </div>
  <div class="ex-table-row">
    <div>Hard negative mining</div>
    <div>Forces the model to learn fine-grained distinctions by training on semantically similar but irrelevant pairs</div>
    <div>~20 hard negatives per query: items just below the relevance cutoff + high cosine similarity but low teacher score. "Chocolate milk" for "low fat milk" is a hard negative; a toaster is not</div>
  </div>
  <div class="ex-table-row">
    <div>TinyBERT-L2 (4M params)</div>
    <div>Student model chosen for production deployment</div>
    <div>5x faster inference and 25x fewer parameters than ModernBERT-base — matched larger models on top-k ranking quality despite lower correlation scores. Correlation ≠ ranking correctness.</div>
  </div>
  <div class="ex-table-row">
    <div>Pointwise BCE loss</div>
    <div>Trains each query-product pair independently against teacher score</div>
    <div>Outperformed pairwise and listwise losses in practice — at 40M examples, data scale beat theoretical elegance</div>
  </div>
</div>
`,

    users: `
<div class="ex-failure">
  <div class="ex-failure-label">User searching for a specific product variant</div>
  "Low fat milk" with the old ranker surfaces "chocolate milk" at position #1 — lexical overlap on "milk" fools the bi-encoder. Cross-encoder reads both tokens together; "low fat" actively suppresses irrelevant variants because the model sees the full query-product interaction.
</div>
<div class="ex-failure">
  <div class="ex-failure-label">User searching a tail query (low-frequency, high intent)</div>
  Tail queries have sparse click data — the old system had almost no signal and fell back to popularity. The teacher model labels tail query-product pairs using semantic reasoning, not historical frequency. The student inherits this coverage, so tail queries get the same ranking quality as head queries.
</div>
`,

    tradeoffs: `
<p><strong>TinyBERT over ModernBERT despite lower correlation scores.</strong> ModernBERT achieved higher Pearson and Spearman correlation against teacher scores in offline eval. TinyBERT did not. But correlation measures how well a model mimics the teacher's exact score distribution — not whether it ranks the top results correctly. In offline simulations, TinyBERT matched larger models on top-k ranking quality, the only metric that matters on a mobile screen. At Zepto's query volume, 5x faster inference isn't an aesthetic preference — it's infrastructure cost and p99 latency budget.</p>

<p><strong>Pointwise loss over pairwise and listwise.</strong> Pairwise and listwise losses are theoretically better aligned with ranking objectives. Pointwise BCE treats every pair independently and doesn't explicitly optimize for relative order. Yet BCE won in practice. At 40M labeled examples, pointwise training leverages data scale more effectively — each pair contributes independently to gradient updates, convergence is more stable, and the sheer volume of data compensates for the loss function's theoretical shortcomings. The lesson: in production ML, data scale frequently beats theoretical elegance.</p>

<p><strong>Teacher-student over human labels.</strong> Human annotation would be more precise at the margin but doesn't scale to 40M pairs and introduces inter-annotator inconsistency. The teacher model produces continuous scores (not binary labels), which gives the student richer gradient signal. The tradeoff is that teacher errors propagate to the student — if the teacher systematically misjudges a product category, the student inherits that bias with no human correction mechanism.</p>
`,

    pmAngle: `
<div class="ex-interview-q">
  <div class="ex-interview-label">Open with — frame the architecture before the model choice</div>
  <div class="ex-interview-answer">
    The first thing I'd clarify in any search ranking question is which stage of the pipeline we're talking about. Search is never a single model — it's retrieval, then relevance scoring, then final ranking. These are different problems. Retrieval needs to be fast and maximize recall across millions of products, so you use bi-encoders or BM25. Relevance scoring needs to be precise about semantic alignment between the query and a small candidate set, so you use a cross-encoder where query and product tokens interact inside the model. Final ranking layers in behavioral signals like CTR, price, and personalization on top. Conflating these stages is the most common mistake — you can't optimize your retrieval model out of a ranking problem, and you can't run a cross-encoder over millions of products in real time.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How would you get training labels for a search ranker at Flipkart's scale?"</div>
  <div class="ex-interview-answer">
    I'd use teacher-student distillation rather than human labels or click data alone. The problem with click data is that it's position-biased — products ranked higher get more clicks regardless of relevance — and it's completely dark for tail queries that rarely appear. Human labels don't scale to tens of millions of query-product pairs and are inconsistent at the margin. The approach that works at scale is using a powerful LLM as a teacher: for each query-product pair, the teacher outputs a continuous relevance score between 0 and 1, capturing degree of relevance rather than binary labels. Zepto generated 40 million labeled pairs this way. You then train a small, fast student model to mimic the teacher's score distribution — the student runs in production, the teacher only runs offline for labeling. The critical addition is hard negative mining: include semantically similar but irrelevant pairs in training, because those are what a ranker actually needs to distinguish in production.
  </div>
</div>
<div class="ex-interview-q">
  <div class="ex-interview-label">If asked — "How do you evaluate a search ranker before A/B testing?"</div>
  <div class="ex-interview-answer">
    Offline eval for rankers has a trap: correlation with teacher scores is not the same as ranking quality. Zepto found that TinyBERT had lower Pearson and Spearman correlation against teacher scores than ModernBERT — but matched ModernBERT on top-k ranking correctness in offline simulations. The distinction matters because on a mobile screen, only positions 1 through 3 are visible above the fold. A model that perfectly mimics the teacher's full score distribution but gets position #1 wrong is worse than a model with lower correlation that consistently surfaces the right product at the top. So I'd evaluate on position-weighted metrics — MRR, NDCG@3 — not raw correlation. And I'd specifically stress-test on tail queries and hard negatives, because that's where ranking failures are invisible in aggregate metrics.
  </div>
</div>
`,

    commonMistake: `
<div class="ex-mistake">
  <div class="ex-mistake-label">⚠ Common mistake</div>
  Most candidates say "use a transformer model for search ranking" and jump straight to describing a bi-encoder or a large cross-encoder deployed end-to-end. Wrong on both counts. Bi-encoders encode query and product independently — they can't capture token-level interactions like "low fat" suppressing "chocolate milk." And a large cross-encoder can't run in real time over millions of products — the query and product must be processed jointly for every pair, which is computationally infeasible at retrieval scale. The right answer is to separate the stages: use bi-encoders for retrieval (fast, scalable, optimizes recall), deploy a small cross-encoder only at the reranking stage on 50–100 candidates, and use knowledge distillation to make the cross-encoder fast enough for production — as Zepto did with TinyBERT at 4M parameters.
</div>
`,

    sources: [
      {
        id: 92,
        title: 'Building a Lightning-Fast Search Relevance Ranker',
        url: 'https://zepto.tech/building-a-lightning-fast-search-relevance-ranker'
      }
    ]
  }
}
];
