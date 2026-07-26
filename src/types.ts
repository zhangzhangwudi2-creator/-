export interface CharacterStats {
  name: string;
  origin: 'cultivator' | 'mage' | 'beyonder' | 'martial';
  realm: string;
  level: number;
  xp: number;
  xpNeeded: number;
  gold: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  spirit: number;
  maxSpirit: number;
  inventory: InventoryItem[];
  equipment: {
    weapon: InventoryItem | null;
    armor: InventoryItem | null;
    accessory: InventoryItem | null;
  };
  skills: Skill[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'elixir';
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  description: string;
  modifiers: {
    health?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
  };
  isEquipped?: boolean;
}

export interface Skill {
  name: string;
  description: string;
  type: 'physical' | 'spell' | 'heal' | 'shield';
  powerValue: number; // Percentage or flat value multiplier
  spiritCost: number;
}

export interface WebNovelChapter {
  id: string;
  novelName: string;
  chapterTitle: string;
  chapterContent: string;
}

export interface GameChoice {
  optionText: string;
  consequenceText: string;
  statChanges: {
    xp?: number;
    gold?: number;
    healthDamage?: number;
    spiritRestore?: number;
  };
  rewardItem?: Omit<InventoryItem, 'id'> | null;
}

export interface GameQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BossStats {
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  description: string;
  avatarSeed: string; // to render cool SVG/avatar
}

export interface LevelDetails {
  chapterTitle: string;
  novelName: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  narrativeIntroduction: string;
  encounterType: 'choice' | 'quiz' | 'boss_fight';
  encounterName: string;
  encounterBrief: string;
  
  // Specific structures based on encounterType
  choiceEncounter?: {
    narrative: string;
    choices: GameChoice[];
  };
  
  quizEncounter?: {
    narrative: string;
    quiz: GameQuiz;
  };
  
  bossEncounter?: {
    narrative: string;
    boss: BossStats;
    bossSkills: Array<{
      name: string;
      description: string;
      damagePercent: number;
    }>;
    rewards: {
      xp: number;
      gold: number;
      item: Omit<InventoryItem, 'id'> | null;
    };
  };
}
