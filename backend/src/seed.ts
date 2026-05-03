import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Game } from './entities/Game';
import { Achievement } from './entities/Achievement';
import { UserProgress } from './entities/UserProgress';
import { UserAchievement } from './entities/UserAchievement';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'nexuscode',
  entities: [User, Game, Achievement, UserProgress, UserAchievement],
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
  { name: 'Gold Medal', description: 'Awarded for top overall performance', icon: '🏅', type: 'overall_performance', requiredCount: 1 },
  { name: 'Target Master', description: 'Hit 100 coding targets', icon: '🎯', type: 'targets_hit', requiredCount: 100 },
  { name: 'Rocket Coder', description: 'Complete 50 challenges', icon: '🚀', type: 'challenges_completed', requiredCount: 50 },
  { name: 'Puzzle Solver', description: 'Solve 25 logic puzzles', icon: '🧩', type: 'logic_puzzles_solved', requiredCount: 25 },
  { name: 'Speed Demon', description: 'Win 10 speed coding rounds', icon: '⚡', type: 'speed_rounds_won', requiredCount: 10 },
  { name: 'Debug Legend', description: 'Fix 20 debugging challenges', icon: '🐛', type: 'debug_challenges_fixed', requiredCount: 20 },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database');

  const gameRepo = AppDataSource.getRepository(Game);
  const achievementRepo = AppDataSource.getRepository(Achievement);

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

  await AppDataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
