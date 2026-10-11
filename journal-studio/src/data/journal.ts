// Exact content source: Maya's 30-day curriculum.
export interface Chapter { number: number; title: string; subtitle: string }
export interface Prompt { id: string; day?: number; chapter: number; title: string; body: string; fromLibrary?: boolean }

export const CHAPTERS: Chapter[] = [
  {
    "number": 1,
    "title": "Getting to Know Your Patterns",
    "subtitle": "Days 1–6 · Building awareness without judgment"
  },
  {
    "number": 2,
    "title": "Understanding Your Need for Comfort",
    "subtitle": "Days 7–12 · Emotional needs, relief, and nourishment"
  },
  {
    "number": 3,
    "title": "Changing the Conversation With Yourself",
    "subtitle": "Days 13–18 · Food beliefs, guilt, and self-compassion"
  },
  {
    "number": 4,
    "title": "Creating More Ways to Care for Yourself",
    "subtitle": "Days 19–24 · Coping, flexibility, and practical change"
  },
  {
    "number": 5,
    "title": "Recognizing Growth and Moving Forward",
    "subtitle": "Days 25–30 · Integration and continued learning"
  }
];

export const MAYA_PROMPTS: Prompt[] = [
  {
    "id": "day-1",
    "day": 1,
    "title": "Your Story With Food and Stress",
    "body": "Reflect on the role food has played during stressful periods of your life. Think about how that relationship has evolved, what you've come to expect from food during difficult times, and what you wish felt different today. There is no need to label your experiences as good or bad.",
    "chapter": 1
  },
  {
    "id": "day-2",
    "day": 2,
    "title": "When Life Feels Like Too Much",
    "body": "Explore what stress feels like in your world. Write about the pressures you carry, the ways they affect your thoughts and body, and how you tend to respond when everything begins to feel overwhelming. Notice what you might overlook when you're busy simply getting through the day.",
    "chapter": 1
  },
  {
    "id": "day-3",
    "day": 3,
    "title": "The Space Between Doing and Being",
    "body": "Reflect on the transition between being busy and having time to yourself. Consider what you tend to carry with you after a demanding day, what makes it difficult to switch off, and what you find yourself reaching for when you finally have a moment of freedom.",
    "chapter": 1
  },
  {
    "id": "day-4",
    "day": 4,
    "title": "Life on Autopilot",
    "body": "Think about the habits and routines you fall into when you're tired, distracted, or stressed. Explore which ones feel comforting, which ones leave you feeling disconnected, and how you experience the difference between acting automatically and making a conscious choice.",
    "chapter": 1
  },
  {
    "id": "day-5",
    "day": 5,
    "title": "Listening to Your Body",
    "body": "Reflect on how you relate to your body's needs when life becomes demanding. Explore your experiences with hunger, fullness, tiredness, energy, and rest. Consider which signals are easy to notice, which are harder to recognize, and how you might become more responsive to them.",
    "chapter": 1
  },
  {
    "id": "day-6",
    "day": 6,
    "title": "Patterns Beginning to Emerge",
    "body": "Look back on what you've explored so far. Write about recurring themes, unexpected observations, and any assumptions about yourself that you're beginning to reconsider. Notice not only the circumstances that feel difficult, but also the times when things feel easier.",
    "chapter": 1
  },
  {
    "id": "day-7",
    "day": 7,
    "title": "The Many Meanings of Comfort",
    "body": "Explore what comfort means to you. Reflect on the experiences, people, places, and routines that have made you feel safe or cared for throughout your life. Consider the role food plays among these sources of comfort, and what makes it particularly appealing during stressful times.",
    "chapter": 2
  },
  {
    "id": "day-8",
    "day": 8,
    "title": "What You're Carrying",
    "body": "Imagine setting down the responsibilities and expectations you've been holding. Write about the pressures that weigh on you, including those others may not see. Explore how carrying these pressures affects your capacity to care for yourself and what you wish could feel lighter.",
    "chapter": 2
  },
  {
    "id": "day-9",
    "day": 9,
    "title": "Permission to Rest",
    "body": "Reflect on the messages you've absorbed about productivity, effort, and rest. Explore how comfortable you feel doing nothing, the emotions that arise when you slow down, and what a more forgiving relationship with rest might look like.",
    "chapter": 2
  },
  {
    "id": "day-10",
    "day": 10,
    "title": "The Feelings Beneath Stress",
    "body": "Stress can contain many different emotions. Explore the feelings that tend to accompany demanding periods of your life, whether frustration, worry, sadness, loneliness, or something harder to name. Write about how you usually respond to these feelings and what it might be like to give them space.",
    "chapter": 2
  },
  {
    "id": "day-11",
    "day": 11,
    "title": "The Care You Give and the Care You Need",
    "body": "Think about how you distribute your time, energy, and attention. Reflect on the needs you readily meet for others, the ones you postpone for yourself, and the kinds of support you find difficult to request or accept. Consider what caring for yourself could look like during an ordinary busy week.",
    "chapter": 2
  },
  {
    "id": "day-12",
    "day": 12,
    "title": "Understanding What You Really Need",
    "body": "Revisit what you've discovered about comfort and stress. Explore the different forms of relief you seek and what each one offers. Write about ways your needs might change from day to day, and how you could approach those needs with curiosity rather than judgment.",
    "chapter": 2
  },
  {
    "id": "day-13",
    "day": 13,
    "title": "The Voice in Your Head",
    "body": "Pay attention to the way you speak to yourself when life or eating doesn't go as planned. Explore the words you use, the standards you hold yourself to, and how those messages influence the way you feel. Reflect on where that voice might have come from and whether it represents how you truly want to treat yourself.",
    "chapter": 3
  },
  {
    "id": "day-14",
    "day": 14,
    "title": "The Rules We Live By",
    "body": "Reflect on the spoken and unspoken rules that shape your relationship with food. Consider where you learned them, which ones feel supportive, and which ones create pressure or guilt. Explore what it might feel like to approach eating with greater flexibility and trust.",
    "chapter": 3
  },
  {
    "id": "day-15",
    "day": 15,
    "title": "When Good Enough Doesn't Feel Enough",
    "body": "Explore your relationship with perfection and self-control, both around food and in other parts of life. Write about what happens internally when you fall short of your expectations, the meaning you attach to those moments, and how you might define progress differently.",
    "chapter": 3
  },
  {
    "id": "day-16",
    "day": 16,
    "title": "Where These Beliefs Began",
    "body": "Think about the messages surrounding food, bodies, discipline, and worth that you've encountered over the years. Explore which messages have stayed with you, how they have shaped your choices, and which ones you're beginning to question.",
    "chapter": 3
  },
  {
    "id": "day-17",
    "day": 17,
    "title": "Learning to Be on Your Own Side",
    "body": "Imagine treating yourself with the same warmth and understanding you would offer someone you love. Reflect on why that might feel natural or difficult, what compassion means when you're struggling, and how your inner dialogue might change if you no longer needed to earn kindness.",
    "chapter": 3
  },
  {
    "id": "day-18",
    "day": 18,
    "title": "Making Peace With Imperfection",
    "body": "Reflect on your understanding of setbacks and difficult days. Explore what you've learned from moments that didn't go as hoped, how you tend to respond afterward, and what it might mean to allow progress to be uneven without losing trust in yourself.",
    "chapter": 3
  },
  {
    "id": "day-19",
    "day": 19,
    "title": "Remembering Your Strengths",
    "body": "Think about the ways you've navigated difficult periods in the past. Reflect on the qualities, relationships, decisions, or small acts of care that helped you through. Explore strengths you may overlook because they don't feel particularly impressive or dramatic.",
    "chapter": 4
  },
  {
    "id": "day-20",
    "day": 20,
    "title": "Caring for Yourself Before You're Depleted",
    "body": "Imagine what your days might look like if your basic needs received attention before you reached exhaustion. Reflect on the obstacles that make this difficult, the support that could help, and small opportunities to nourish or restore yourself throughout everyday life.",
    "chapter": 4
  },
  {
    "id": "day-21",
    "day": 21,
    "title": "Creating Space for Yourself",
    "body": "Explore the rituals, boundaries, and transitions that help you feel grounded. Think about moments when you move from responsibility into personal time and what could make that transition more supportive. Write about the kind of space you wish you could create for yourself.",
    "chapter": 4
  },
  {
    "id": "day-22",
    "day": 22,
    "title": "Expanding Your Sources of Comfort",
    "body": "Reflect on the many things that bring you pleasure, connection, relief, or a sense of being cared for. Think about what makes certain forms of comfort easier to access than others, and how you might create more opportunities for those experiences without needing to give up the comfort of food.",
    "chapter": 4
  },
  {
    "id": "day-23",
    "day": 23,
    "title": "Knowing Isn't Always Doing",
    "body": "Consider the difference between understanding what might help and actually putting it into practice. Explore the barriers you encounter when you're tired, overwhelmed, or distracted. Reflect on how your expectations, environment, and routines could make supportive choices easier.",
    "chapter": 4
  },
  {
    "id": "day-24",
    "day": 24,
    "title": "Building Your Own Way Forward",
    "body": "Bring together what you've learned about stress, nourishment, comfort, and personal needs. Imagine a realistic approach to caring for yourself during difficult periods. Explore what you would want to remember, what options you'd like available, and how you could make room for flexibility.",
    "chapter": 4
  },
  {
    "id": "day-25",
    "day": 25,
    "title": "Seeing Yourself With New Eyes",
    "body": "Look back at the person you were when you began this journal. Reflect on what you've discovered about your relationship with stress, food, and yourself. Explore the ideas that challenged you, the insights that stayed with you, and anything you now see differently.",
    "chapter": 5
  },
  {
    "id": "day-26",
    "day": 26,
    "title": "The Small Shifts That Matter",
    "body": "Think about the subtle changes you may have noticed in your awareness, reactions, or everyday choices. Write about moments when you paused, recognized a need, treated yourself with more understanding, or tried something different. If little has changed yet, explore what you're still learning.",
    "chapter": 5
  },
  {
    "id": "day-27",
    "day": 27,
    "title": "Redefining Control",
    "body": "Reflect on what control has meant to you in your relationship with eating. Explore the difference between rigid rules and flexible choices, between suppressing feelings and responding to them, and between striving for perfection and developing trust in yourself.",
    "chapter": 5
  },
  {
    "id": "day-28",
    "day": 28,
    "title": "Making Room for Difficult Days",
    "body": "Imagine encountering familiar struggles again in the future. Reflect on how you would like to respond to yourself, what forms of support you might need, and how you could approach difficult experiences as opportunities for understanding rather than proof that you've failed.",
    "chapter": 5
  },
  {
    "id": "day-29",
    "day": 29,
    "title": "A Letter to Your Future Self",
    "body": "Write a letter to yourself for a time when life feels especially demanding. Share what you've learned about your needs, the comfort you deserve, the patterns you've come to recognize, and the reminders you hope will help you navigate difficult moments with compassion.",
    "chapter": 5
  },
  {
    "id": "day-30",
    "day": 30,
    "title": "The Relationship You Want to Build",
    "body": "Imagine a future in which your relationship with food and stress feels more peaceful and flexible. Describe what everyday life might feel like, how you would care for yourself through challenges, and which lessons from this journey you want to carry forward. Let this be a vision to explore, not a standard you must meet.",
    "chapter": 5
  }
];
