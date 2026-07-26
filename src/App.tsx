import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Sword,
  Sparkles,
  Flame,
  HelpCircle,
  BookOpen,
  User,
  Compass,
  FileText,
  Coins,
  Heart,
  Award,
  Volume2,
  VolumeX,
  Plus,
  Settings,
  Package,
  Check,
  ArrowRight,
  RotateCcw,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Play,
  History,
  Sparkle,
  Upload,
  Bookmark,
  Skull,
  MapPin,
  Activity,
  X,
  HeartCrack,
  Info
} from "lucide-react";
import { CharacterStats, InventoryItem } from "./types";

// Dynamic text indicators during simulation loading to improve user suspense/engagement
const CONTEXT_LOADING_PHRASES = [
  "正在逆天感悟大道因果...",
  "命运画卷流沙聚散中...",
  "洞察时空线，重现真实世界...",
  "天地法则推演算计中...",
  "因果纠缠，因果线正在合一...",
  "天机盘急速旋转中..."
];

// Base talents players can choose from to power their cheat/gimmick
const PRESET_TALENTS = [
  { name: "掌天祖瓶 (催熟神药)", desc: "身怀万古宝物，极大增加气运，灵草可在一息间成熟数万年，有利于绝路逢生。" },
  { name: "灰雾化身 (死而复生)", desc: "灵性深海与宏伟灰雾相连，受到致命伤害时有很大几率被虚空迷雾卷回而复苏。" },
  { name: "至尊戒灵 (圣师药尊)", desc: "手指古戒中盘藏着一位超越九品的天界至尊灵魂，随时指引无价功法与万年炼药心得。" },
  { name: "破妄重瞳 (顿悟洞悉)", desc: "双眸洞穿一切幻术、秘境大阵的阵眼与法则伪装，洞悉敌人的神通弱点。" },
  { name: "智子阻断 (科学高维)", desc: "以超自然的物理法则解析时空，免疫一切粗劣的诅咒法术，极度拓宽直觉理智。" }
];

export default function App() {
  // --- Simulation Universe States ---
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>("fanren");
  const [customNovelName, setCustomNovelName] = useState("");
  const [customNovelText, setCustomNovelText] = useState("");
  const [protagonistIdentity, setProtagonistIdentity] = useState<"original" | "custom">("original");
  const [customProtagName, setCustomProtagName] = useState("韩立");
  const [startCheckpoint, setStartCheckpoint] = useState<"start" | "middle" | "climax">("start");
  const [selectedTalent, setSelectedTalent] = useState<string>("掌天祖瓶 (催熟神药)");

  // --- Active Simulation Core States ---
  const [character, setCharacter] = useState<CharacterStats | null>(null);
  const [universeName, setUniverseName] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [narrativeText, setNarrativeText] = useState("");
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [dmNote, setDmNote] = useState("");
  const [dangerLevel, setDangerLevel] = useState<number>(15);

  // --- Game History Feed ---
  const [historyLogs, setHistoryLogs] = useState<Array<{ role: "narration" | "action"; text: string; location?: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(CONTEXT_LOADING_PHRASES[0]);
  const [customActionText, setCustomActionText] = useState("");

  // --- UI Auxiliaries ---
  const [activeTab, setActiveTab] = useState<"narrative" | "history">("narrative");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [pastedCustomOpen, setPastedCustomOpen] = useState(false);
  const [logNotification, setLogNotification] = useState<string | null>(null);

  // Refs for auto scrolling narrative
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Change phrase timer when loading
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      timer = setInterval(() => {
        const randomPhrase = CONTEXT_LOADING_PHRASES[Math.floor(Math.random() * CONTEXT_LOADING_PHRASES.length)];
        setLoadingPhrase(randomPhrase);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isSimulating]);

  // Restore previous simulation state if available
  useEffect(() => {
    const savedStats = localStorage.getItem("novel_simulator_stats");
    const savedUniverse = localStorage.getItem("novel_simulator_universe");
    const savedLoc = localStorage.getItem("novel_simulator_location");
    const savedNarrative = localStorage.getItem("novel_simulator_narrative");
    const savedSuggestions = localStorage.getItem("novel_simulator_suggestions");
    const savedDm = localStorage.getItem("novel_simulator_dm");
    const savedLogs = localStorage.getItem("novel_simulator_logs");
    const savedDanger = localStorage.getItem("novel_simulator_danger");

    if (savedStats && savedUniverse) {
      try {
        setCharacter(JSON.parse(savedStats));
        setUniverseName(savedUniverse);
        setCurrentLocation(savedLoc || "");
        setNarrativeText(savedNarrative || "");
        setSuggestedActions(JSON.parse(savedSuggestions || "[]"));
        setDmNote(savedDm || "");
        setHistoryLogs(JSON.parse(savedLogs || "[]"));
        setDangerLevel(parseInt(savedDanger || "15", 10));
        triggerBeep(330, 0.15); // soft chime for restoration
        addLogBanner("📜 寻得已留存的时空节点，因果正在无缝重续...");
      } catch (e) {
        console.warn("Error restoring previous state", e);
      }
    }
  }, []);

  // Sync state helper
  const syncAndSaveState = (
    nextCharacter: CharacterStats,
    nextUniverse: string,
    nextLoc: string,
    nextNarrative: string,
    nextSuggestions: string[],
    nextDm: string,
    nextLogs: any[],
    nextDanger: number
  ) => {
    localStorage.setItem("novel_simulator_stats", JSON.stringify(nextCharacter));
    localStorage.setItem("novel_simulator_universe", nextUniverse);
    localStorage.setItem("novel_simulator_location", nextLoc);
    localStorage.setItem("novel_simulator_narrative", nextNarrative);
    localStorage.setItem("novel_simulator_suggestions", JSON.stringify(nextSuggestions));
    localStorage.setItem("novel_simulator_dm", nextDm);
    localStorage.setItem("novel_simulator_logs", JSON.stringify(nextLogs));
    localStorage.setItem("novel_simulator_danger", nextDanger.toString());
  };

  // Add ephemeral banner notices
  const addLogBanner = (text: string) => {
    setLogNotification(text);
    setTimeout(() => {
      setLogNotification(null);
    }, 4500);
  };

  // Sound generator (Synthesized Web Audio API safely to prevent external asset reliance)
  const triggerBeep = (frequency = 440, duration = 0.1, type: "sine" | "triangle" | "square" | "sawtooth" = "sine") => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  };

  // Auto scroll
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [narrativeText, isSimulating]);

  // Adjust protagonist original names based on preset chose
  useEffect(() => {
    if (selectedUniverseId === "fanren") setCustomProtagName("韩立");
    else if (selectedUniverseId === "guimi") setCustomProtagName("克莱恩");
    else if (selectedUniverseId === "doupox") setCustomProtagName("萧炎");
    else if (selectedUniverseId === "santi") setCustomProtagName("汪淼");
    else setCustomProtagName("独孤求败");
  }, [selectedUniverseId]);

  // --- START SIMULATION TRIGGER ---
  const handleLaunchSimulation = async () => {
    setIsSimulating(true);
    triggerBeep(440, 0.2, "triangle");

    try {
      const response = await fetch("/api/start-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novelId: selectedUniverseId === "custom" ? null : selectedUniverseId,
          customNovelName: selectedUniverseId === "custom" ? customNovelName : null,
          customNovelText: selectedUniverseId === "custom" ? customNovelText : null,
          protagonistName: customProtagName,
          protagonistIdentity: protagonistIdentity,
          startPoint: startCheckpoint,
          talent: selectedTalent
        })
      });

      const data = await response.json();
      if (data.success) {
        setCharacter(data.character);
        setUniverseName(data.universeName);
        setCurrentLocation(data.starterLocation);
        setNarrativeText(data.narrative);
        setSuggestedActions(data.suggestedActions);
        setDmNote(data.dmNote);
        setDangerLevel(15);
        setHistoryLogs([{ role: "narration", text: data.narrative, location: data.starterLocation }]);

        // Sync immediately
        syncAndSaveState(
          data.character,
          data.universeName,
          data.starterLocation,
          data.narrative,
          data.suggestedActions,
          data.dmNote,
          [{ role: "narration", text: data.narrative, location: data.starterLocation }],
          15
        );

        triggerBeep(520, 0.25, "sine");
        addLogBanner(`💥 已顺利降临 ${data.universeName} 真实时空！`);
      } else {
        addLogBanner("❌ 时空锚定失败，请检查网络后再试");
      }
    } catch (e) {
      addLogBanner("❌ 天道不稳，无法构筑模拟。");
    } finally {
      setIsSimulating(false);
    }
  };

  // --- COMMIT TURN STEP TRIGGER ---
  const handleSimulateStep = async (playerAction: string) => {
    if (!character || isSimulating || !playerAction.trim()) return;

    setIsSimulating(true);
    setCustomActionText(""); // reset
    triggerBeep(220, 0.1, "triangle");

    // Append action to history immediately for feedback
    const actionLog = { role: "action" as const, text: playerAction, location: currentLocation };
    const updatedHistoryLogs = [...historyLogs, actionLog];
    setHistoryLogs(updatedHistoryLogs);

    try {
      const response = await fetch("/api/sim-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novelId: selectedUniverseId === "custom" ? null : selectedUniverseId,
          customNovelText: selectedUniverseId === "custom" ? customNovelText : null,
          character: character,
          action: playerAction,
          history: updatedHistoryLogs,
          currentLocation: currentLocation,
          talent: selectedTalent,
          dangerLevel: dangerLevel
        })
      });

      const data = await response.json();
      if (data.success && data.updatedOutput) {
        const output = data.updatedOutput;

        // Process attribute updates deeply and cleanly
        let updatedChar = { ...character };
        const changes = output.statChanges || {};

        // Apply Gold change
        if (changes.goldChange) {
          updatedChar.gold = Math.max(0, updatedChar.gold + changes.goldChange);
          if (changes.goldChange > 0) addLogBanner(`💰 荒金所得: +${changes.goldChange}`);
          else addLogBanner(`💸 消耗荒金: ${changes.goldChange}`);
        }

        // Apply HP damage/recovery
        if (changes.healthChange) {
          updatedChar.health = Math.min(updatedChar.maxHealth, Math.max(0, updatedChar.health + changes.healthChange));
          if (changes.healthChange < 0) {
            triggerBeep(180, 0.2, "sawtooth");
            addLogBanner(`🩸 惨遭反噬/受伤: ${changes.healthChange} HP`);
          } else {
            addLogBanner(`✨ 服药/喘息恢复生命: +${changes.healthChange} HP`);
          }
        }

        // Apply Spirit usage
        if (changes.spiritChange) {
          updatedChar.spirit = Math.min(updatedChar.maxSpirit, Math.max(0, updatedChar.spirit + changes.spiritChange));
          if (changes.spiritChange < 0) {
            addLogBanner(`🌀 法力/灵性流失: ${changes.spiritChange} 精神`);
          } else {
            addLogBanner(`🌀 神识/脑回充盈: +${changes.spiritChange} 精神`);
          }
        }

        // Apply XP gain & process standard level up / breakthrough parameters
        if (changes.xpGain) {
          let extraXp = changes.xpGain;
          let currentXp = updatedChar.xp + extraXp;
          addLogBanner(`📜 偶得机缘阅历经验: +${extraXp}`);

          if (currentXp >= updatedChar.xpNeeded) {
            // High breakthrough status!
            currentXp = currentXp - updatedChar.xpNeeded;
            updatedChar.level += 1;
            updatedChar.xpNeeded = Math.floor(updatedChar.xpNeeded * 1.35);
            // Boost max attributes automatically on level-ups
            updatedChar.maxHealth += 20;
            updatedChar.health = updatedChar.maxHealth;
            updatedChar.maxSpirit += 10;
            updatedChar.spirit = updatedChar.maxSpirit;
            updatedChar.attack += 5;
            updatedChar.defense += 3;

            triggerBeep(880, 0.45, "sine");
            addLogBanner("⚡【境界通幽】你的气运浑厚，灵力在生死大关后冲天顿悟，修为拔高！");
          }
          updatedChar.xp = currentXp;
        }

        // Process Realm Change
        if (changes.realmUpdate) {
          updatedChar.realm = changes.realmUpdate;
          triggerBeep(980, 0.5, "sine");
          addLogBanner(`👑 修炼阶段暴涨，达成大乘阶位突破：【${changes.realmUpdate}】！`);
        }

        // Process New Item Discovered!
        if (output.itemDiscovered) {
          const newItem: InventoryItem = {
            id: `discovered_${Date.now()}_${Math.floor(Math.random() * 100)}`,
            name: output.itemDiscovered.name,
            type: output.itemDiscovered.type || "accessory",
            tier: output.itemDiscovered.tier || "common",
            description: output.itemDiscovered.description || "在荒野偶得的太古残缺事物",
            modifiers: output.itemDiscovered.modifiers || {},
            isEquipped: false
          };
          updatedChar.inventory = [...updatedChar.inventory, newItem];
          triggerBeep(659, 0.3, "triangle");
          addLogBanner(`🎁 偶得太古秘宝: 【${newItem.name}】(${output.itemDiscovered.tier})`);
        }

        // Process Item Used or Lost!
        if (output.itemLost) {
          const targetName = output.itemLost.trim();
          const remains = updatedChar.inventory.filter(it => it.name !== targetName);
          if (remains.length < updatedChar.inventory.length) {
            addLogBanner(`🗑️ 消耗/遗失秘宝: 【${targetName}】`);
            updatedChar.inventory = remains;
            // Also unequip if applicable
            if (updatedChar.equipment.weapon?.name === targetName) updatedChar.equipment.weapon = null;
            if (updatedChar.equipment.armor?.name === targetName) updatedChar.equipment.armor = null;
            if (updatedChar.equipment.accessory?.name === targetName) updatedChar.equipment.accessory = null;
          }
        }

        // Append outcome narrative
        const narrationLog = { role: "narration" as const, text: output.narrative, location: output.currentLocation || currentLocation };
        const finalLogs = [...updatedHistoryLogs, narrationLog];

        // Apply local storage states and state models
        setCharacter(updatedChar);
        if (output.currentLocation) setCurrentLocation(output.currentLocation);
        setNarrativeText(output.narrative);
        setSuggestedActions(output.suggestedActions || []);
        setDmNote(output.dmNote || "谨慎修行，稳健自救。");
        setDangerLevel(output.dangerLevel || 15);
        setHistoryLogs(finalLogs);

        // Sync and save to localstorage
        syncAndSaveState(
          updatedChar,
          universeName,
          output.currentLocation || currentLocation,
          output.narrative,
          output.suggestedActions || [],
          output.dmNote || "谨慎修行，稳健自救。",
          finalLogs,
          output.dangerLevel || 15
        );

        triggerBeep(440, 0.15, "sine");
      } else {
        addLogBanner("❌ 天机晦涩，无法给出时空指引");
      }
    } catch (_) {
      addLogBanner("❌ 法力崩溃，因果推衍受阻。");
    } finally {
      setIsSimulating(false);
    }
  };

  // --- RE-ROLL / RESET SIMULATION TRIGGER ---
  const handleResetSimulation = () => {
    if (window.confirm("确定要斩断所有的因果并重置这卷世界吗？当前的心得与装备法宝将被全部粉碎！")) {
      localStorage.removeItem("novel_simulator_stats");
      localStorage.removeItem("novel_simulator_universe");
      localStorage.removeItem("novel_simulator_location");
      localStorage.removeItem("novel_simulator_narrative");
      localStorage.removeItem("novel_simulator_suggestions");
      localStorage.removeItem("novel_simulator_dm");
      localStorage.removeItem("novel_simulator_logs");
      localStorage.removeItem("novel_simulator_danger");

      setCharacter(null);
      setUniverseName("");
      setCurrentLocation("");
      setNarrativeText("");
      setSuggestedActions([]);
      setDmNote("");
      setDangerLevel(15);
      setHistoryLogs([]);
      setSelectedInventoryItem(null);
      triggerBeep(150, 0.35, "sawtooth");
      addLogBanner("⚖️ 因果线已完全剥离，你神魂已退回太原初始神座...");
    }
  };

  // --- INVENTORY MANAGEMENT ACTIONS ---
  const handleEquipItem = (item: InventoryItem) => {
    if (!character) return;
    let nextChar = { ...character };
    const slot = item.type;

    // Equip items representing Weapon, Armor or Accessory
    if (slot === "weapon") {
      if (nextChar.equipment.weapon) nextChar.equipment.weapon.isEquipped = false;
      let target = nextChar.inventory.find(i => i.id === item.id);
      if (target) {
        target.isEquipped = true;
        nextChar.equipment.weapon = target;
      }
    } else if (slot === "armor") {
      if (nextChar.equipment.armor) nextChar.equipment.armor.isEquipped = false;
      let target = nextChar.inventory.find(i => i.id === item.id);
      if (target) {
        target.isEquipped = true;
        nextChar.equipment.armor = target;
      }
    } else if (slot === "accessory") {
      if (nextChar.equipment.accessory) nextChar.equipment.accessory.isEquipped = false;
      let target = nextChar.inventory.find(i => i.id === item.id);
      if (target) {
        target.isEquipped = true;
        nextChar.equipment.accessory = target;
      }
    } else if (slot === "elixir") {
      // Consume to restore health or spirit
      const mods = item.modifiers || {};
      const hpGain = mods.health || 40;
      const spiritGain = mods.spirit || 20;

      nextChar.health = Math.min(nextChar.maxHealth, nextChar.health + hpGain);
      nextChar.spirit = Math.min(nextChar.maxSpirit, nextChar.spirit + spiritGain);
      nextChar.inventory = nextChar.inventory.filter(i => i.id !== item.id);
      setSelectedInventoryItem(null);

      triggerBeep(523, 0.25, "sine");
      addLogBanner(`🧪 服下 ${item.name}! 回复了 ${hpGain} 生命与 ${spiritGain} 灵识真气。`);
    }

    // Sum base and dynamic modifiers of equipped gear
    let newAttack = 18;
    let newDefense = 8;
    let newMaxHp = 100;
    let newMaxSpirit = 50;

    const gearList = [nextChar.equipment.weapon, nextChar.equipment.armor, nextChar.equipment.accessory];
    gearList.forEach(eq => {
      if (eq && eq.modifiers) {
        if (eq.modifiers.attack) newAttack += eq.modifiers.attack;
        if (eq.modifiers.defense) newDefense += eq.modifiers.defense;
        if (eq.modifiers.health) newMaxHp += eq.modifiers.health;
        if (eq.modifiers.spirit) newMaxSpirit += eq.modifiers.spirit;
      }
    });

    nextChar.attack = newAttack;
    nextChar.defense = newDefense;
    nextChar.maxHealth = newMaxHp;
    nextChar.maxSpirit = newMaxSpirit;

    // Keep active within safety boundaries
    if (nextChar.health > nextChar.maxHealth) nextChar.health = nextChar.maxHealth;
    if (nextChar.spirit > nextChar.maxSpirit) nextChar.spirit = nextChar.maxSpirit;

    setCharacter(nextChar);
    triggerBeep(659, 0.15, "triangle");
    if (item.type !== "elixir") addLogBanner(`⚔️ 成功装武器秘宝: [${item.name}]`);
    
    // Save state
    syncAndSaveState(
      nextChar,
      universeName,
      currentLocation,
      narrativeText,
      suggestedActions,
      dmNote,
      historyLogs,
      dangerLevel
    );
  };

  const handleUnequipItem = (slot: "weapon" | "armor" | "accessory") => {
    if (!character) return;
    let nextChar = { ...character };
    const eqItem = nextChar.equipment[slot];
    if (!eqItem) return;

    // Find in inventory to disable
    let target = nextChar.inventory.find(i => i.id === eqItem.id);
    if (target) target.isEquipped = false;
    nextChar.equipment[slot] = null;

    // Recalculate
    let newAttack = 18;
    let newDefense = 8;
    let newMaxHp = 100;
    let newMaxSpirit = 50;

    const gearList = [nextChar.equipment.weapon, nextChar.equipment.armor, nextChar.equipment.accessory];
    gearList.forEach(eq => {
      if (eq && eq.modifiers) {
        if (eq.modifiers.attack) newAttack += eq.modifiers.attack;
        if (eq.modifiers.defense) newDefense += eq.modifiers.defense;
        if (eq.modifiers.health) newMaxHp += eq.modifiers.health;
        if (eq.modifiers.spirit) newMaxSpirit += eq.modifiers.spirit;
      }
    });

    nextChar.attack = newAttack;
    nextChar.defense = newDefense;
    nextChar.maxHealth = newMaxHp;
    nextChar.maxSpirit = newMaxSpirit;

    if (nextChar.health > nextChar.maxHealth) nextChar.health = nextChar.maxHealth;
    if (nextChar.spirit > nextChar.maxSpirit) nextChar.spirit = nextChar.maxSpirit;

    setCharacter(nextChar);
    setSelectedInventoryItem(null);
    triggerBeep(330, 0.1, "sine");
    addLogBanner(`🛡️ 已卸下秘宝: [${eqItem.name}]`);

    syncAndSaveState(
      nextChar,
      universeName,
      currentLocation,
      narrativeText,
      suggestedActions,
      dmNote,
      historyLogs,
      dangerLevel
    );
  };

  const handleDiscardItem = (item: InventoryItem) => {
    if (!character) return;
    if (window.confirm(`确定要永远遗弃秘宝 [${item.name}] 吗？`)) {
      let nextChar = { ...character };

      // Unequip if currently equipped
      if (nextChar.equipment.weapon?.id === item.id) nextChar.equipment.weapon = null;
      if (nextChar.equipment.armor?.id === item.id) nextChar.equipment.armor = null;
      if (nextChar.equipment.accessory?.id === item.id) nextChar.equipment.accessory = null;

      nextChar.inventory = nextChar.inventory.filter(i => i.id !== item.id);
      setSelectedInventoryItem(null);
      setCharacter(nextChar);
      triggerBeep(180, 0.15, "sawtooth");
      addLogBanner(`🗑️ 已永久丢弃物品: [${item.name}]`);

      syncAndSaveState(
        nextChar,
        universeName,
        currentLocation,
        narrativeText,
        suggestedActions,
        dmNote,
        historyLogs,
        dangerLevel
      );
    }
  };

  // --- Rarity styling flags helper ---
  const getRarityBadgeStyle = (tier: string) => {
    switch (tier) {
      case "mythic": return "border-red-500/40 text-red-400 bg-red-950/40 font-semibold";
      case "legendary": return "border-amber-500/40 text-amber-300 bg-amber-950/40 font-semibold";
      case "epic": return "border-purple-500/30 text-purple-300 bg-purple-950/40";
      case "rare": return "border-blue-500/30 text-blue-300 bg-blue-950/30";
      default: return "border-zinc-800 text-zinc-400 bg-zinc-900";
    }
  };

  // --- RENDERING VIEWS ---

  return (
    <div id="app_root" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none selection:bg-amber-800 selection:text-white transition-all duration-300">
      
      {/* 🧭 Top Immersive Navigation Banner */}
      <header id="top_app_header" className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 py-3 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-gradient-to-br from-amber-600 to-yellow-800 rounded-lg shadow-inner ring-1 ring-amber-500/30">
            <BookOpen className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-medium tracking-tight bg-gradient-to-r from-amber-200 via-amber-100 to-white bg-clip-text text-transparent">
              网文宇宙真实模拟器
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest hidden sm:block uppercase">动态全图剧本因果沙盒</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {character && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-xs text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>时空连接稳定</span>
            </div>
          )}

          <button
            id="sound_toggle_btn"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              triggerBeep(440, 0.05);
            }}
            className="p-2 hover:bg-zinc-900 rounded-lg border border-zinc-900 hover:border-zinc-800 text-zinc-400 transition"
            title={soundEnabled ? "关闭法力音效" : "开启法力音效"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {character && (
            <button
              id="dissever_button"
              onClick={handleResetSimulation}
              className="px-3 py-1.5 text-xs font-medium text-red-400 flex items-center space-x-1 border border-red-950/30 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">斩断因果</span>
            </button>
          )}
        </div>
      </header>

      {/* Ephemeral Alert Toast Notifications banner */}
      {logNotification && (
        <div id="float_notice" className="fixed top-16 right-4 left-4 sm:left-auto sm:w-[420px] z-50 px-4 py-3 bg-zinc-900/95 border border-amber-600/30 text-amber-200 text-xs sm:text-sm rounded-xl shadow-2xl flex items-center space-x-3 transition-all duration-300 backdrop-blur-lg">
          <Sparkle className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
          <span className="leading-snug flex-1">{logNotification}</span>
        </div>
      )}

      {/* Main Sandbox Workspace grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row p-4 gap-6 overflow-hidden">
        
        {/* ================= PHASE 1: SETUP & BIRTH ================= */}
        {!character ? (
          <div id="setup_screen" className="w-full max-w-4xl mx-auto flex flex-col space-y-8 py-5 opacity-90 transition-all duration-500">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl antialiased font-serif font-black tracking-tight text-amber-200">
                你想模拟那一本著名小说？
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                输入或选中一整本小说设定，AI将深度记住其<b>全部规则常识、地理逻辑、宗门敌人与隐藏规律</b>，建立一个毫无预生成的零死角交互真实世界。你是这场世界大劫中不可或缺的唯一主角。
              </p>
            </div>

            {/* Step 1: Universe selector bento */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-2">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>步骤一：锚定目标网文宇宙</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  id="choice_fanren"
                  onClick={() => {
                    setSelectedUniverseId("fanren");
                    setPastedCustomOpen(false);
                    triggerBeep(261, 0.1);
                  }}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition flex flex-col justify-between ${
                    selectedUniverseId === "fanren" ? "bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-950/20" : "bg-zinc-900 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 rounded font-mono">经典凡人流</span>
                    <h4 className="font-serif text-lg font-bold text-amber-100">《凡人修仙传》</h4>
                    <p className="text-xs text-zinc-400 leading-snug line-clamp-3">韩立在神手谷侥幸获得小绿瓶，开始战战兢兢杀人夺宝、求得仙魔长生之真解。</p>
                  </div>
                  <div className="pt-4 text-[10px] text-zinc-500 italic font-mono">忘语 (著) • 修仙长生</div>
                </div>

                <div
                  id="choice_guimi"
                  onClick={() => {
                    setSelectedUniverseId("guimi");
                    setPastedCustomOpen(false);
                    triggerBeep(293, 0.1);
                  }}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition flex flex-col justify-between ${
                    selectedUniverseId === "guimi" ? "bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-950/20" : "bg-zinc-900 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-400 border border-purple-900 rounded font-mono">神秘朋克</span>
                    <h4 className="font-serif text-lg font-bold text-amber-100">《诡秘之主》</h4>
                    <p className="text-xs text-zinc-400 leading-snug line-clamp-3">克莱恩依靠梦境占卜与扮演非凡技能在廷根守夜人小队自救自强，仰望灰雾神座。</p>
                  </div>
                  <div className="pt-4 text-[10px] text-zinc-500 italic font-mono font-mono">爱潜水的乌贼 (著) • 西幻邪神</div>
                </div>

                <div
                  id="choice_doupox"
                  onClick={() => {
                    setSelectedUniverseId("doupox");
                    setPastedCustomOpen(false);
                    triggerBeep(329, 0.1);
                  }}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition flex flex-col justify-between ${
                    selectedUniverseId === "doupox" ? "bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-950/20" : "bg-zinc-900 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 text-[10px] bg-orange-950 text-orange-400 border border-orange-900 rounded font-mono">至尊热血</span>
                    <h4 className="font-serif text-lg font-bold text-amber-100">《斗破苍穹》</h4>
                    <p className="text-xs text-zinc-400 leading-snug line-clamp-3">萧炎曾遭惨痛退婚，幸遇药老残魂指点，施展无上焚诀大肆拼命吞噬天地异火。</p>
                  </div>
                  <div className="pt-4 text-[10px] text-zinc-500 italic font-mono font-mono">天蚕土豆 (著) • 斗气巅峰</div>
                </div>

                <div
                  id="choice_santi"
                  onClick={() => {
                    setSelectedUniverseId("santi");
                    setPastedCustomOpen(false);
                    triggerBeep(349, 0.1);
                  }}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition flex flex-col justify-between ${
                    selectedUniverseId === "santi" ? "bg-amber-950/20 border-amber-500 shadow-lg shadow-amber-950/20" : "bg-zinc-900 border-zinc-900 hover:bg-zinc-900/40 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-900 rounded font-mono">硬核科幻</span>
                    <h4 className="font-serif text-lg font-bold text-amber-100">《三体》</h4>
                    <p className="text-xs text-zinc-400 leading-snug line-clamp-3">汪淼面对幽灵般的倒计时，深陷在黑暗森林物理社会博弈的大终局挣扎之中。</p>
                  </div>
                  <div className="pt-4 text-[10px] text-zinc-500 italic font-mono font-mono">刘慈欣 (著) • 黑暗森林</div>
                </div>
              </div>

              {/* Unique layout choice: Toggle custom novel inputs slider */}
              <div className="pt-2">
                <button
                  id="custom_novel_paster_toggle"
                  onClick={() => {
                    setSelectedUniverseId("custom");
                    setPastedCustomOpen(!pastedCustomOpen);
                    triggerBeep(330, 0.1);
                  }}
                  className={`w-full p-4 rounded-xl border-2 border-dashed flex items-center justify-between text-left transition ${
                    selectedUniverseId === "custom" ? "bg-amber-950/10 border-amber-500 text-amber-300" : "bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/20"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce" />
                    <div>
                      <h4 className="text-sm font-semibold">自供全新网文大纲/小说文本</h4>
                      <p className="text-xs text-zinc-500">贴入自定义故事框架、法则、大纲后AI会自动完美学习和构建该世界。</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition ${pastedCustomOpen ? "rotate-90 text-amber-400" : "text-zinc-500"}`} />
                </button>

                {selectedUniverseId === "custom" && (
                  <div id="custom_inputs_wrapper" className="mt-4 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4 shadow-xl">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-mono font-bold text-zinc-400">自拟小说总卷名 Name</label>
                      <input
                        type="text"
                        placeholder="例如：《我师兄实在太稳健了》《剑来》等"
                        value={customNovelName}
                        onChange={(e) => setCustomNovelName(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-amber-500 text-amber-100 font-serif"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-mono font-bold text-zinc-400">
                        贴入小说文本片段、世界观设定或修炼境界法则 Context Details
                      </label>
                      <textarea
                        rows={5}
                        placeholder="您可以直接贴入该小说前几章部分文本、贴入百度百科剧情概览、或是自己设计的新颖修炼境界说明（如：一品武夫至九品、神话契约生物等）。字数越多，AI记忆的世界观越精巧真实！"
                        value={customNovelText}
                        onChange={(e) => setCustomNovelText(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-805 rounded-lg text-xs placeholder:text-zinc-650 focus:outline-none focus:border-amber-500 text-amber-100 text-left font-sans"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Roleplay setup bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Identity & Starting era checkpoint */}
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-2">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>步骤二：选择降临主角身份</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setProtagonistIdentity("original");
                      triggerBeep(261, 0.08);
                    }}
                    className={`p-3 rounded-lg border-2 text-center text-xs transition font-semibold ${
                      protagonistIdentity === "original" ? "bg-amber-950/20 border-amber-500 text-amber-200" : "bg-transparent border-zinc-800 text-zinc-400"
                    }`}
                  >
                    扮演：原著主人公
                  </button>
                  <button
                    onClick={() => {
                      setProtagonistIdentity("custom");
                      triggerBeep(293, 0.08);
                    }}
                    className={`p-3 rounded-lg border-2 text-center text-xs transition font-semibold ${
                      protagonistIdentity === "custom" ? "bg-amber-950/20 border-amber-500 text-amber-200" : "bg-transparent border-zinc-800 text-zinc-400"
                    }`}
                  >
                    降临：自定义夺舍客
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-zinc-400">降临宿体的姓名 Name</label>
                  <input
                    type="text"
                    disabled={protagonistIdentity === "original"}
                    value={customProtagName}
                    onChange={(e) => setCustomProtagName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 disabled:opacity-45 rounded-lg text-sm text-amber-100 font-medium tracking-wide focus:outline-none focus:border-amber-500"
                  />
                  {protagonistIdentity === "original" && (
                    <span className="text-[10px] italic text-zinc-500">将直接自动继承所选小说的核心主角真魂和宿命。</span>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  <label className="text-xs font-mono text-zinc-400 flex items-center space-x-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                    <span>选择时空切入起始点 Timeline Checkpoint</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setStartCheckpoint("start")}
                      className={`py-1.5 px-1 bg-zinc-950 text-[10px] rounded border transition ${
                        startCheckpoint === "start" ? "border-amber-500 text-amber-300 font-bold" : "border-zinc-800 text-zinc-500"
                      }`}
                    >
                      开端前传时期
                    </button>
                    <button
                      onClick={() => setStartCheckpoint("middle")}
                      className={`py-1.5 px-1 bg-zinc-950 text-[10px] rounded border transition ${
                        startCheckpoint === "middle" ? "border-amber-500 text-amber-300 font-bold" : "border-zinc-800 text-zinc-500"
                      }`}
                    >
                      中期危机突围
                    </button>
                    <button
                      onClick={() => setStartCheckpoint("climax")}
                      className={`py-1.5 px-1 bg-zinc-950 text-[10px] rounded border transition ${
                        startCheckpoint === "climax" ? "border-amber-500 text-amber-300 font-bold" : "border-zinc-800 text-zinc-500"
                      }`}
                    >
                      决战大世巅峰
                    </button>
                  </div>
                </div>
              </div>

              {/* Cheat/Talent Selection slot */}
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-900/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>步骤三：挑选一截初始逆天气运 (Cheat)</span>
                  </h3>
                  <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1.5">
                    {PRESET_TALENTS.map((tl, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedTalent(tl.name);
                          triggerBeep(330, 0.05);
                        }}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition ${
                          selectedTalent === tl.name ? "bg-amber-950/20 border-amber-600/60 shadow-md" : "bg-zinc-950 hover:bg-zinc-900 border-zinc-900"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${selectedTalent === tl.name ? "bg-amber-400" : "bg-zinc-700"}`} />
                          <h5 className="text-xs font-bold text-amber-250">{tl.name}</h5>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal mt-1">{tl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 italic px-2 bg-zinc-950/40 py-1.5 border border-zinc-900 rounded">
                  💡 注意：此大气运将作为特殊的宿命因果，全程被AI牢记。它能在你选择危局操作时，发挥惊天的逆战或保命奇效！
                </div>
              </div>

            </div>

            {/* Launch CTA */}
            <div className="pt-6 text-center">
              <button
                id="launch_simulation_cta"
                onClick={handleLaunchSimulation}
                disabled={isSimulating || (selectedUniverseId === "custom" && (!customNovelName || !customNovelText))}
                className="w-full sm:w-80 px-8 py-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 disabled:opacity-40 rounded-xl font-medium tracking-wide shadow-2xl shadow-amber-900/40 text-sm sm:text-base flex items-center justify-center space-x-3 text-white transition active:scale-95 duration-100"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>因果凝聚降临中...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 text-amber-100 fill-amber-100" />
                    <span>凝聚因果，降临此界！</span>
                  </>
                )}
              </button>
              {selectedUniverseId === "custom" && (!customNovelName || !customNovelText) && (
                <p className="text-xs text-red-500 mt-2">※ 必须提供自定义小说的名字以及世界大纲内容，方可开启通道！</p>
              )}
            </div>
          </div>
        ) : (
          
          // ================= PHASE 2: TURNS IN LIVE SIMULATOR =================
          <div id="live_workspace" className="w-full flex flex-col md:flex-row gap-6 animate-fade-in duration-300">
            
            {/* 📜 Left column: Immersive Vintage Character Sheet Sidebar */}
            <aside id="protag_sidebar" className="w-full md:w-80 flex-shrink-0 flex flex-col space-y-4">
              
              {/* Profile card metadata */}
              <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-4 text-left shadow-lg">
                <div className="flex items-center space-x-3.5 border-b border-zinc-900 pb-3">
                  <div className="p-2.5 bg-amber-950/40 rounded-xl border border-amber-900/30 text-amber-400 flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-amber-200 truncate">{character?.name}</h3>
                      <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-1.5 border border-zinc-800 rounded">
                        等级 {character?.level}
                      </span>
                    </div>
                    {/* Cultivation Realm rank badge */}
                    <div className="text-xs text-zinc-400 font-serif flex items-center space-x-1 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-100 truncate font-semibold tracking-wide">{character?.realm}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono select-none">
                  {/* Geographic pin */}
                  <div className="flex items-center justify-between bg-zinc-950/40 p-2 border border-zinc-950 rounded">
                    <span className="text-zinc-500 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span>地理锚定 Location</span>
                    </span>
                    <span className="text-amber-200 font-serif truncate max-w-[150px]">{currentLocation}</span>
                  </div>

                  {/* Cheat info in sheet */}
                  <div className="flex items-center justify-between bg-zinc-950/40 p-2 border border-zinc-900 rounded">
                    <span className="text-zinc-500 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>金手指 Cheat</span>
                    </span>
                    <span className="text-amber-100 truncate max-w-[150px]" title={selectedTalent}>
                      {selectedTalent.split("(")[0].trim()}
                    </span>
                  </div>
                </div>

                {/* Core attribute bars */}
                <div id="stats_sheet_bars" className="space-y-3.5 text-xs select-none pt-2 border-t border-zinc-900">
                  
                  {/* HP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 flex items-center space-x-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 fill-rose-950" />
                        <span>生命气血 (HP)</span>
                      </span>
                      <span className="font-bold text-zinc-300">
                        {character?.health} / {character?.maxHealth}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300 shadow-lg"
                        style={{ width: `${Math.min(100, Math.max(0, ((character?.health || 100) / (character?.maxHealth || 100)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Spirit force */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 flex items-center space-x-1">
                        <Activity className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>法力神识 (Spirit)</span>
                      </span>
                      <span className="font-bold text-zinc-300">
                        {character?.spirit} / {character?.maxSpirit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-300 shadow-lg"
                        style={{ width: `${Math.min(100, Math.max(0, ((character?.spirit || 50) / (character?.maxSpirit || 50)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Cultivation XP progression */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span>修为心得瓶颈 (XP)</span>
                      </span>
                      <span className="font-bold text-zinc-300">
                        {character?.xp} / {character?.xpNeeded}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 transition-all duration-300 shadow-lg"
                        style={{ width: `${Math.min(100, Math.max(0, ((character?.xp || 0) / (character?.xpNeeded || 100)) * 100))}%` }}
                      />
                    </div>
                    {(character?.xp || 0) >= (character?.xpNeeded || 100) - 20 && (
                      <span className="text-[10px] text-amber-300 flex items-center justify-center space-x-0.5 animate-pulse pt-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>机缘圆满，一念顿悟突破在即！</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional numbers grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-3 border-t border-zinc-900 select-none">
                  <div className="bg-zinc-950/40 p-2 border border-zinc-950 rounded">
                    <span className="block text-[10px] text-zinc-500 leading-none">攻击 Attack</span>
                    <span className="text-zinc-300 font-bold block pt-1">{character?.attack}</span>
                  </div>
                  <div className="bg-zinc-950/40 p-2 border border-zinc-950 rounded">
                    <span className="block text-[10px] text-zinc-500 leading-none">防御 Defense</span>
                    <span className="text-zinc-300 font-bold block pt-1">{character?.defense}</span>
                  </div>
                  <div className="bg-zinc-950/40 p-2 border border-zinc-950 rounded">
                    <span className="block text-[10px] text-zinc-500 leading-none">荒金 Gold</span>
                    <span className="text-amber-400 font-bold block pt-1 flex items-center justify-center space-x-0.5">
                      <Coins className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span>{character?.gold}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 🎒 Interactive Inventory Item List inside Sidebar */}
              <div className="flex-1 bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex flex-col space-y-3 shadow-lg min-h-[220px]">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    <span>随身储物袋 (Inventory)</span>
                  </h4>
                  <span className="text-[10px] bg-zinc-950 text-zinc-500 px-1.5 py-0.5 border border-zinc-900 rounded">
                    {character?.inventory?.length || 0} 格
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1.5 pr-1">
                  {character?.inventory && character.inventory.length > 0 ? (
                    character.inventory.map((item, idx) => (
                      <div
                        key={item.id}
                        id={`it_item_${idx}`}
                        onClick={() => {
                          setSelectedInventoryItem(item);
                          triggerBeep(330, 0.05);
                        }}
                        className={`p-2 rounded-lg text-left text-xs bg-zinc-950 border flex items-center justify-between cursor-pointer transition ${
                          selectedInventoryItem?.id === item.id ? "border-amber-600 bg-amber-950/5 text-amber-200" : "border-zinc-900 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.tier === "mythic" ? "bg-red-500" : item.tier === "legendary" ? "bg-amber-400" : item.tier === "epic" ? "bg-purple-400" : "bg-zinc-500"
                          }`} />
                          <span className="truncate font-medium text-zinc-300">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {item.isEquipped && (
                            <span className="text-[8px] bg-amber-500/25 border border-amber-500/50 text-amber-300 px-1 font-semibold rounded scale-90">
                              Equip
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-650" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-center text-zinc-600 text-xs">
                      <Bookmark className="w-8 h-8 text-zinc-800 animate-pulse pb-2" />
                      <span>储物袋空空如也，前行路上多搜刮机缘。</span>
                    </div>
                  )}
                </div>
              </div>

            </aside>

            {/* 📖 Center/Right Main Stage: Immersive Chronicles Play area */}
            <section id="story_stage_main" className="flex-1 flex flex-col space-y-4">
              
              {/* Immersive Tab Selector for text visualizer */}
              <div className="flex items-center space-x-2 border-b border-zinc-900 pb-2 select-none">
                <button
                  id="tab_active_story"
                  onClick={() => {
                    setActiveTab("narrative");
                    triggerBeep(330, 0.05);
                  }}
                  className={`px-4 py-1.5 text-xs font-mono font-semibold tracking-wider flex items-center space-x-1.5 transition border-b-2 ${
                    activeTab === "narrative" ? "border-amber-500 text-amber-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>当前境遇 (Universe Present)</span>
                </button>

                <button
                  id="tab_epic_logs"
                  onClick={() => {
                    setActiveTab("history");
                    triggerBeep(330, 0.05);
                  }}
                  className={`px-4 py-1.5 text-xs font-mono font-semibold tracking-wider flex items-center space-x-1.5 transition border-b-2 ${
                    activeTab === "history" ? "border-amber-500 text-amber-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>时空编年全史 (Full History)</span>
                </button>
              </div>

              {/* High stress state indicator banner (Danger Bar) */}
              {dangerLevel > 50 && (
                <div id="combat_banner_alert" className="p-3 bg-red-950/20 rounded-xl border border-red-900/40 flex items-center justify-between text-xs sm:text-sm text-red-300 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <Skull className="w-4 h-4 text-red-500" />
                    <span className="font-semibold select-none font-serif">
                      {dangerLevel >= 80 ? "⚠️ 【极度死线大劫难】天劫或绝顶古魔大敌锁喉！" : "⚔️ 【高危争端冲突】四周神念紊乱，战斗火热进行中！"}
                    </span>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <span className="text-zinc-500">危机危险度:</span>
                    <span className="text-red-400 font-bold ml-1.5">{dangerLevel}%</span>
                  </div>
                </div>
              )}

              {/* ============ VIEW A: CURRENT SCENE WRITER ============ */}
              {activeTab === "narrative" ? (
                <div id="narrative_pane" className="flex-1 flex flex-col space-y-4">
                  <div className="w-full bg-zinc-950/60 border border-zinc-950 rounded-2xl p-5 sm:p-7 shadow-xl flex-1 flex flex-col overflow-y-auto max-h-[480px]">
                    <div className="flex-1 flex flex-col justify-start">
                      
                      {/* Active chapter/epoch sign */}
                      <div className="text-[10px] text-amber-500 font-mono flex items-center space-x-2 select-none border-b border-zinc-950 pb-3 mb-4">
                        <span className="px-1.5 py-0.5 bg-amber-950/30 font-semibold border border-amber-900/30 rounded">{universeName}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700" />
                        <span className="font-serif italic text-zinc-400">{currentLocation}</span>
                      </div>

                      {/* Main Literary Masterpiece Text */}
                      <div className="space-y-4 text-zinc-200 text-sm sm:text-base leading-relaxed tracking-wide text-left font-serif antialiased select-text max-h-[380px] overflow-y-auto">
                        {narrativeText ? (
                          narrativeText.split("\n\n").map((para, i) => (
                            <p key={i} className="first-letter:text-xl first-letter:font-serif first-letter:text-amber-300">
                              {para}
                            </p>
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-full py-20 text-zinc-600 font-mono text-center">
                            正在连通大道长河真魂...
                          </div>
                        )}
                        {/* Loading visual */}
                        {isSimulating && (
                          <div className="flex flex-col space-y-2 py-4 border-t border-zinc-900 animate-pulse text-zinc-400 font-serif text-sm">
                            <div className="flex items-center space-x-2 text-amber-400 font-bold">
                              <Sparkles className="w-4 h-4 animate-spin" />
                              <span>{loadingPhrase}</span>
                            </div>
                            <p className="text-xs text-zinc-500 italic">因果画轴推衍涉及千重剧情走向、功法、身外秘宝，Gemini 正在细细为您撰笔描绘本故事...</p>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                    </div>
                  </div>

                  {/* Dungeon Master smart tip note brackets */}
                  {dmNote && (
                    <div id="dm_tip_box" className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-start space-x-2.5 text-xs text-left text-zinc-400 font-serif select-none">
                      <HelpCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-amber-200 font-bold">【天道因果指引】</span>
                        <span>{dmNote}</span>
                      </div>
                    </div>
                  )}

                  {/* Suggested Dynamic Actions Box */}
                  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3">
                    <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest text-left select-none">
                      点击即可采取下一步因果动作 (Choices)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 select-none">
                      {suggestedActions && suggestedActions.map((act, index) => (
                        <button
                          key={index}
                          id={`action_sug_${index}`}
                          disabled={isSimulating}
                          onClick={() => handleSimulateStep(act)}
                          className="px-3 py-3 text-xs text-left bg-zinc-900 hover:bg-zinc-900/40 text-amber-100 hover:text-amber-200 border border-zinc-900 hover:border-amber-900/40 rounded-lg transition active:translate-y-0.5 min-h-[50px] leading-relaxed line-clamp-2"
                        >
                          <span className="text-amber-500 font-bold font-mono mr-1.5">{index + 1}.</span>
                          <span>{act}</span>
                        </button>
                      ))}
                    </div>

                    {/* Styled free text Action search bar */}
                    <div className="pt-2 border-t border-zinc-900 select-none">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSimulateStep(customActionText);
                        }}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="text"
                          disabled={isSimulating}
                          value={customActionText}
                          onChange={(e) => setCustomActionText(e.target.value)}
                          placeholder="✍️ 我想采取任何不被局限的特异行为进行探索、施放法术（例如：‘大声求饶，并献上手中小瓶绿浆’）..."
                          className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-805 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder:text-zinc-650 text-amber-100 font-medium"
                        />
                        <button
                          type="submit"
                          disabled={isSimulating || !customActionText.trim()}
                          className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-600 font-semibold text-xs sm:text-sm shadow-md text-white transition flex items-center space-x-1 flex-shrink-0"
                        >
                          <span>模拟</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                
                // ============ VIEW B: EPIC FULL HISTORY CHRONICLES ============
                <div id="full_chronicles_log" className="w-full bg-zinc-950/60 border border-zinc-950 rounded-2xl p-5 sm:p-7 shadow-xl overflow-y-auto flex-1 max-h-[500px] text-left">
                  <div className="flex items-center justify-between border-b border-zinc-950 pb-3 mb-4">
                    <h3 className="text-sm font-bold font-serif text-amber-100 flex items-center space-x-2">
                      <History className="w-4 h-4 text-amber-500" />
                      <span>{universeName} • 宿命轨迹纪实编年</span>
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono font-semibold">
                      共经历了 {Math.floor(historyLogs.length / 2)} 回合博弈 (Epochs)
                    </span>
                  </div>

                  <div className="space-y-6">
                    {historyLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`flex flex-col space-y-1.5 ${
                          log.role === "action" ? "border-l-2 border-amber-600/50 pl-4 py-1.5" : ""
                        }`}
                      >
                        <span className="text-[10px] font-mono text-zinc-500 flex items-center space-x-1 font-bold">
                          {log.role === "action" ? "主角抉择" : "因果推演"} • Index {index}
                          {log.location && <span className="text-zinc-600 ml-1.5">[{log.location}]</span>}
                        </span>
                        <p className={`text-xs sm:text-sm font-serif select-text leading-relaxed ${
                          log.role === "action" ? "text-amber-100 font-bold" : "text-zinc-300"
                        }`}>
                          {log.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </section>
          </div>
        )}
      </main>

      {/* ================= MODAL: INVENTORY ITEM LORE PROFILE ================= */}
      {selectedInventoryItem && (
        <div id="item_details_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in duration-200">
          <div className="w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl relative select-none">
            
            {/* Close */}
            <button
              onClick={() => setSelectedInventoryItem(null)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-805 transition"
              id="close_item_modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              {/* Item Badge & title */}
              <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
                <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-900/30 text-amber-400">
                  {selectedInventoryItem.type === "weapon" ? <Sword className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-zinc-100">{selectedInventoryItem.name}</h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded border ${getRarityBadgeStyle(selectedInventoryItem.tier)}`}>
                      {selectedInventoryItem.tier === "mythic" ? "⭐ 混沌奇迹" : selectedInventoryItem.tier === "legendary" ? "⭐ 仙门传说" : selectedInventoryItem.tier === "epic" ? "史诗级" : "法宝级"}
                    </span>
                    <span className="text-[10px] text-zinc-500 italic">
                      {selectedInventoryItem.type === "weapon" ? "神断凶兵" : selectedInventoryItem.type === "armor" ? "仙防宝甲" : selectedInventoryItem.type === "elixir" ? "丹药药耗" : "秘传饰品"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modifiers List */}
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-950 space-y-2 text-xs font-mono">
                <div className="text-[10px] text-zinc-500 tracking-wider">附加因果属性增幅 MODIFIERS</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedInventoryItem.modifiers?.attack ? (
                    <div className="flex items-center justify-between text-zinc-350">
                      <span>攻击 +Attack</span>
                      <span className="text-emerald-400 font-bold">+{selectedInventoryItem.modifiers.attack}</span>
                    </div>
                  ) : null}
                  {selectedInventoryItem.modifiers?.defense ? (
                    <div className="flex items-center justify-between text-zinc-350">
                      <span>防御 +Defense</span>
                      <span className="text-emerald-400 font-bold">+{selectedInventoryItem.modifiers.defense}</span>
                    </div>
                  ) : null}
                  {selectedInventoryItem.modifiers?.health ? (
                    <div className="flex items-center justify-between text-zinc-350">
                      <span>血量生命 +HP</span>
                      <span className="text-emerald-400 font-bold">+{selectedInventoryItem.modifiers.health}</span>
                    </div>
                  ) : null}
                  {selectedInventoryItem.modifiers?.spirit ? (
                    <div className="flex items-center justify-between text-zinc-350">
                      <span>精力法力 +Spirit</span>
                      <span className="text-emerald-400 font-bold">+{selectedInventoryItem.modifiers.spirit}</span>
                    </div>
                  ) : null}
                  {!selectedInventoryItem.modifiers || Object.keys(selectedInventoryItem.modifiers).length === 0 ? (
                    <div className="text-[10px] text-zinc-650 font-sans italic col-span-2 text-center">本法物暂无额外的战力属性强化。</div>
                  ) : null}
                </div>
              </div>

              {/* Description lore */}
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono tracking-wider">法宝秘辛故事 (Item Lore)</div>
                <p className="text-xs text-zinc-400 leading-normal font-serif text-left antialiased p-3 bg-zinc-950/20 border border-zinc-800 rounded-lg">
                  {selectedInventoryItem.description}
                </p>
              </div>

              {/* Action Buttons inside modal */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  id="modal_discard_item"
                  onClick={() => handleDiscardItem(selectedInventoryItem)}
                  className="flex-1 py-2 text-center text-xs text-red-400 border border-red-950/40 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition"
                >
                  丢弃
                </button>
                {selectedInventoryItem.type !== "elixir" ? (
                  selectedInventoryItem.isEquipped ? (
                    <button
                      id="modal_unequip_item"
                      onClick={() => handleUnequipItem(selectedInventoryItem.type as any)}
                      className="flex-[2] py-2 text-center text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition font-medium"
                    >
                      卸下当前装备
                    </button>
                  ) : (
                    <button
                      id="modal_equip_item"
                      onClick={() => handleEquipItem(selectedInventoryItem)}
                      className="flex-[2] py-2 text-center text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition font-semibold"
                    >
                      佩戴/激活秘宝
                    </button>
                  )
                ) : (
                  <button
                    id="modal_consume_item"
                    onClick={() => handleEquipItem(selectedInventoryItem)}
                    className="flex-[2] py-2 text-center text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-semibold"
                  >
                    立刻服用/吞下
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 🔮 Immersive humble bottom credit line */}
      <footer id="bottom_app_footer" className="py-2.5 px-4 text-center border-t border-zinc-950 text-[10px] text-zinc-600 font-mono select-none">
        网文物理学因果闭环 • 凡人求道逆天地
      </footer>

    </div>
  );
}
