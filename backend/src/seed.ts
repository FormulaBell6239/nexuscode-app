import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Game } from './entities/Game';
import { Achievement } from './entities/Achievement';
import { UserProgress } from './entities/UserProgress';
import { UserAchievement } from './entities/UserAchievement';
import { StoreItem } from './entities/StoreItem';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'nexuscode',
  entities: [User, Game, Achievement, UserProgress, UserAchievement, StoreItem],
  synchronize: true,
});

const GAMES = [
  // Quiz
  { icon: '🧠', title: 'Code Quiz', description: 'Test your programming knowledge with timed Q&A rounds', href: '/games/code-quiz', difficulty: 'Easy', genre: 'quiz', locked: false },
  { icon: '⚗️', title: 'Syntax Showdown', description: 'Spot the syntax error before time runs out', href: null, difficulty: 'Medium', genre: 'quiz', locked: true },
  { icon: '📐', title: 'CS Theory', description: 'Answer questions on algorithms, data structures & more', href: null, difficulty: 'Hard', genre: 'quiz', locked: true },
  // Debug
  { icon: '🐞', title: 'Debugging Challenge', description: 'Find and fix bugs hidden in real code snippets', href: '/games/debugging-challenge', difficulty: 'Medium', genre: 'debug', locked: false },
  { icon: '🔍', title: 'Error Hunt', description: 'Track down runtime errors across multiple files', href: null, difficulty: 'Hard', genre: 'debug', locked: true },
  { icon: '🛠', title: 'Refactor Rush', description: 'Improve messy code without breaking it', href: null, difficulty: 'Medium', genre: 'debug', locked: true },
  // Speed
  { icon: '⚡', title: 'Speed Coding', description: 'Solve problems against the clock', href: '/games/speed-coding', difficulty: 'Hard', genre: 'speed', locked: false },
  { icon: '🏎', title: 'Type Race', description: 'Race others by typing code as fast as you can', href: null, difficulty: 'Easy', genre: 'speed', locked: true },
  { icon: '⏱', title: 'Minute Blitz', description: '60 seconds — as many problems as you can solve', href: null, difficulty: 'Medium', genre: 'speed', locked: true },
  // Logic
  { icon: '🔗', title: 'Logic Puzzles', description: 'Strengthen problem-solving skills with brain teasers', href: '/games/logic-puzzles', difficulty: 'Medium', genre: 'logic', locked: false },
  { icon: '♟', title: 'Algorithm Arena', description: 'Implement classic algorithms step by step', href: null, difficulty: 'Hard', genre: 'logic', locked: true },
  { icon: '🧩', title: 'Pattern Forge', description: 'Complete patterns using loops, maps, and filters', href: null, difficulty: 'Medium', genre: 'logic', locked: true },
  // Build
  { icon: '🏗', title: 'Mini Builder', description: 'Build small UI components from guided specs', href: null, difficulty: 'Medium', genre: 'build', locked: true },
  { icon: '🌐', title: 'HTML Blitz', description: 'Recreate page layouts from screenshots', href: null, difficulty: 'Easy', genre: 'build', locked: true },
  { icon: '🎨', title: 'CSS Art', description: 'Style elements to precisely match the target design', href: null, difficulty: 'Easy', genre: 'build', locked: true },
  // Collab/Multiplayer
  { icon: '⚔️', title: 'Code Duel', description: 'Go head-to-head with another coder in real time', href: null, difficulty: 'Medium', genre: 'collab', locked: true },
  { icon: '🤝', title: 'Pair Mode', description: 'Collaborate on a challenge with a partner', href: null, difficulty: 'Easy', genre: 'collab', locked: true },
  { icon: '🏆', title: 'Tournament', description: 'Bracket-style competition across 8 players', href: null, difficulty: 'Hard', genre: 'collab', locked: true },
] as const;

const ACHIEVEMENTS = [
  { name: 'First Blood',    description: 'Complete your very first lesson',                   icon: '🎯', type: 'lessons_completed',      requiredCount: 1,   creditReward: 10  },
  { name: 'On A Roll',      description: 'Complete 10 lessons',                               icon: '🚀', type: 'lessons_completed',      requiredCount: 10,  creditReward: 20  },
  { name: 'Century Coder',  description: 'Complete 100 lessons',                              icon: '💯', type: 'lessons_completed',      requiredCount: 100, creditReward: 75  },
  { name: 'Streak Starter', description: 'Maintain a 3-day learning streak',                  icon: '🔥', type: 'streak',                 requiredCount: 3,   creditReward: 15  },
  { name: 'Week Warrior',   description: 'Maintain a 7-day learning streak',                  icon: '⚡', type: 'streak',                 requiredCount: 7,   creditReward: 30  },
  { name: 'Unstoppable',    description: 'Maintain a 30-day learning streak',                 icon: '🌟', type: 'streak',                 requiredCount: 30,  creditReward: 100 },
  { name: 'Speed Demon',    description: 'Win 10 speed coding rounds',                        icon: '🏎', type: 'speed_rounds_won',        requiredCount: 10,  creditReward: 25  },
  { name: 'Debug Legend',   description: 'Fix 20 debugging challenges',                       icon: '🐛', type: 'debug_challenges_fixed',  requiredCount: 20,  creditReward: 30  },
  { name: 'Puzzle Solver',  description: 'Solve 25 logic puzzles',                            icon: '🧩', type: 'logic_puzzles_solved',    requiredCount: 25,  creditReward: 35  },
  { name: 'Perfectionist',  description: 'Complete 20 lessons on the first try',              icon: '✨', type: 'first_try_lessons',       requiredCount: 20,  creditReward: 40  },
  { name: 'Gold Medal',     description: 'Reach the top 10 on the global leaderboard',        icon: '🏅', type: 'leaderboard_top10',       requiredCount: 1,   creditReward: 50  },
  { name: 'Level 5',        description: 'Reach Level 5',                                     icon: '⬆️', type: 'level',                  requiredCount: 5,   creditReward: 20  },
  { name: 'Level 10',       description: 'Reach Level 10',                                    icon: '🔷', type: 'level',                  requiredCount: 10,  creditReward: 50  },
  { name: 'Game On',        description: 'Play 5 game rounds',                                icon: '🎮', type: 'game_rounds_played',      requiredCount: 5,   creditReward: 15  },
  { name: 'Arcade Legend',  description: 'Play 50 game rounds',                               icon: '🕹', type: 'game_rounds_played',      requiredCount: 50,  creditReward: 60  },
];

const STORE_ITEMS = [
  // ── Games ────────────────────────────────────────────────────────────
  { name: 'Syntax Showdown',  description: 'Spot syntax errors before time runs out',            icon: '⚗️',  category: 'game',     creditCost: 50,  gameSlug: 'syntax-showdown',  cosmeticType: null, applyValue: '/games/syntax-showdown',   oneTimePurchase: true },
  { name: 'CS Theory',        description: 'Algorithms, data structures and CS fundamentals',    icon: '📐',  category: 'game',     creditCost: 150, gameSlug: 'cs-theory',        cosmeticType: null, applyValue: '/games/cs-theory',          oneTimePurchase: true },
  { name: 'Error Hunt',       description: 'Track down runtime errors across multiple files',    icon: '🔍',  category: 'game',     creditCost: 100, gameSlug: 'error-hunt',       cosmeticType: null, applyValue: '/games/error-hunt',         oneTimePurchase: true },
  { name: 'Stack Trace',      description: 'Decode error stack traces and find the break',       icon: '📡',  category: 'game',     creditCost: 75,  gameSlug: 'stack-trace',      cosmeticType: null, applyValue: '/games/stack-trace',        oneTimePurchase: true },
  { name: 'Type Race',        description: 'Race others by typing code as fast as you can',      icon: '🏎',  category: 'game',     creditCost: 50,  gameSlug: 'type-race',        cosmeticType: null, applyValue: '/games/type-race',          oneTimePurchase: true },
  { name: 'Chain Blitz',      description: '5 escalating rapid-fire problems back to back',      icon: '🔥',  category: 'game',     creditCost: 125, gameSlug: 'chain-blitz',      cosmeticType: null, applyValue: '/games/chain-blitz',        oneTimePurchase: true },
  { name: 'Algorithm Arena',  description: 'Implement classic algorithms step by step',          icon: '♟',  category: 'game',     creditCost: 200, gameSlug: 'algorithm-arena',  cosmeticType: null, applyValue: '/games/algorithm-arena',    oneTimePurchase: true },
  { name: 'Graph Navigator',  description: 'Trace BFS and DFS paths across interactive graphs',  icon: '🕸️',  category: 'game',     creditCost: 175, gameSlug: 'graph-navigator',  cosmeticType: null, applyValue: '/games/graph-navigator',    oneTimePurchase: true },
  { name: 'CSS Battle',       description: 'Match a target design pixel-perfectly with CSS',     icon: '🎨',  category: 'game',     creditCost: 50,  gameSlug: 'css-battle',       cosmeticType: null, applyValue: '/games/css-battle',         oneTimePurchase: true },
  { name: 'HTML Blitz',       description: 'Recreate page layouts from screenshots',             icon: '🌐',  category: 'game',     creditCost: 75,  gameSlug: 'html-blitz',       cosmeticType: null, applyValue: '/games/html-blitz',         oneTimePurchase: true },
  { name: 'Mini Builder',     description: 'Build UI components from guided specs',              icon: '🏗',  category: 'game',     creditCost: 125, gameSlug: 'mini-builder',     cosmeticType: null, applyValue: '/games/mini-builder',       oneTimePurchase: true },
  { name: 'Code Duel',        description: 'Go head-to-head with another coder in real time',    icon: '⚔️',  category: 'game',     creditCost: 200, gameSlug: 'code-duel',        cosmeticType: null, applyValue: '/games/code-duel',          oneTimePurchase: true },
  { name: 'Pair Mode',        description: 'Collaborate on a challenge with a partner',          icon: '🤝',  category: 'game',     creditCost: 150, gameSlug: 'pair-mode',        cosmeticType: null, applyValue: '/games/pair-mode',          oneTimePurchase: true },
  { name: 'Tournament',       description: 'Bracket-style competition across 8 players',         icon: '🏆',  category: 'game',     creditCost: 300, gameSlug: 'tournament',       cosmeticType: null, applyValue: '/games/tournament',         oneTimePurchase: true },
  // ── Power-ups ─────────────────────────────────────────────────────────
  { name: 'XP Boost',         description: '2× XP on all activities for 24 hours',               icon: '⚡',  category: 'powerup',  creditCost: 80,  gameSlug: null,               cosmeticType: null, applyValue: 'xp_boost_24h',              oneTimePurchase: false },
  { name: 'Energy Refill',    description: 'Instantly restore all energy to full',               icon: '🔋',  category: 'powerup',  creditCost: 40,  gameSlug: null,               cosmeticType: null, applyValue: 'energy_refill',             oneTimePurchase: false },
  { name: 'Streak Shield',    description: 'Protect your streak for one missed day',             icon: '🛡️',  category: 'powerup',  creditCost: 60,  gameSlug: null,               cosmeticType: null, applyValue: 'streak_shield',             oneTimePurchase: false },
  // ── Cosmetics ─────────────────────────────────────────────────────────
  { name: 'Cyber Neon Theme', description: 'Unlock the Cyber Neon UI theme',                    icon: '🔮',  category: 'cosmetic', creditCost: 80,  gameSlug: null,               cosmeticType: 'theme',       applyValue: 'cyber-neon',                oneTimePurchase: true },
  { name: 'Matrix Green Theme', description: 'Unlock the Matrix Green UI theme',                icon: '⍇',  category: 'cosmetic', creditCost: 80,  gameSlug: null,               cosmeticType: 'theme',       applyValue: 'matrix-green',              oneTimePurchase: true },
  { name: 'Midnight Theme',   description: 'Unlock the Midnight UI theme',                      icon: '🌑',  category: 'cosmetic', creditCost: 60,  gameSlug: null,               cosmeticType: 'theme',       applyValue: 'minimal-dark',              oneTimePurchase: true },
  { name: '⚡ Elite Card',     description: 'Exclusive calling card for dedicated coders',       icon: '🏦',  category: 'cosmetic', creditCost: 75,  gameSlug: null,               cosmeticType: 'callingCard', applyValue: 'elite',                     oneTimePurchase: true },
  { name: '🔥 Inferno Card',  description: 'Calling card for players on a 30-day streak',      icon: '🏦',  category: 'cosmetic', creditCost: 100, gameSlug: null,               cosmeticType: 'callingCard', applyValue: 'inferno',                   oneTimePurchase: true },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database');

  const gameRepo = AppDataSource.getRepository(Game);
  const achievementRepo = AppDataSource.getRepository(Achievement);
  const storeItemRepo = AppDataSource.getRepository(StoreItem);

  // Seed games (skip if already seeded)
  const existingGames = await gameRepo.count();
  if (existingGames === 0) {
    for (const g of GAMES) {
      const game = gameRepo.create({
        ...g,
        href: g.href ?? undefined,
      } as Partial<Game>);
      await gameRepo.save(game);
    }
    console.log(`Seeded ${GAMES.length} games`);
  } else {
    console.log(`Games already seeded (${existingGames} rows), skipping`);
  }

  // Seed achievements (skip if already seeded)
  const existingAchievements = await achievementRepo.count();
  if (existingAchievements === 0) {
    for (const a of ACHIEVEMENTS) {
      const achievement = achievementRepo.create(a);
      await achievementRepo.save(achievement);
    }
    console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
  } else {
    console.log(`Achievements already seeded (${existingAchievements} rows), skipping`);
  }

  // Seed store items (skip if already seeded)
  const existingItems = await storeItemRepo.count();
  if (existingItems === 0) {
    for (const s of STORE_ITEMS) {
      const item = storeItemRepo.create(s as Partial<StoreItem>);
      await storeItemRepo.save(item);
    }
    console.log(`Seeded ${STORE_ITEMS.length} store items`);
  } else {
    console.log(`Store items already seeded (${existingItems} rows), skipping`);
  }

  await AppDataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
