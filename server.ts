import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

const PORT = 3000;

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Predefined classic novel universes with their specific lore, laws, starting locations, and starting items
const CLASSIC_UNIVERSES: Record<string, {
  name: string;
  author: string;
  genre: string;
  description: string;
  magicSystem: string;
  defaultProtagonist: string;
  startPoints: {
    start: { location: string; description: string; items: any[] };
    middle: { location: string; description: string; items: any[] };
    climax: { location: string; description: string; items: any[] };
  };
}> = {
  "fanren": {
    name: "《凡人修仙传》",
    author: "忘语",
    genre: "凡人修仙 / 仙侠经典",
    description: "一个平庸的山村穷小子韩立，机缘巧合下跨入修仙门槛。他依靠绝顶的心机算计、冷酷果断的性格，以及偶然所得的神秘小绿瓶，一步步在弱肉强食的修仙界逆天成仙。",
    magicSystem: "修炼等级划分：炼气、筑基、结丹、元婴、化神。灵根越少修炼越快，拥有神识。战斗消耗元力或灵力，法宝、灵符与阵法至关重要。万事需谨慎防备、杀人夺宝、防人防己。",
    defaultProtagonist: "韩立",
    startPoints: {
      start: {
        location: "越国镜州 - 神手谷",
        description: "你作为新入门的记名弟子，站在幽静的水潭旁。墨大夫正在草堂内闷头研磨药材，他的双眸里闪烁着说不出的诡异光芒。你不久前刚在谷中捡到了一只平平无奇的神秘绿色小瓶子...",
        items: [
          { name: "神秘绿小瓶 (掌天瓶)", type: "accessory", tier: "mythic", description: "能凝聚天地月华、催熟一切万年神药的逆天混沌宝瓶。不露财白，防人窥伺！", modifiers: { spirit: 50, attack: 10 } },
          { name: "《长春功》诀要", type: "accessory", tier: "common", description: "一门能让人感应外界天地灵气、开始气纳丹田的基础修仙功法口诀。", modifiers: { health: 15, spirit: 30 } }
        ]
      },
      middle: {
        location: "乱星海 - 魁星岛附近灵药园",
        description: "你为了躲避越国修仙界的正魔大战，利用古传送阵狼狈地传送到了无边无际的乱星海。此时你已经达到筑基期，在此岛租用了一处灵气充裕的洞府，急需搜集万年妖兽内丹与丹药突破结丹期！",
        items: [
          { name: "青刃神飞剑 (法宝)", type: "weapon", tier: "epic", description: "以深海铁精掺杂金元母炼制，驭使如电，能轻易分金断石、瞬斩强敌。", modifiers: { attack: 45, spirit: 20 } },
          { name: "《青元剑诀》前六层", type: "accessory", tier: "epic", description: "黄枫谷镇派绝学，大名鼎鼎的飞剑合击与辟邪神雷剑气修行。虽消耗灵气极大但威力绝伦。", modifiers: { attack: 25, defense: 15 } }
        ]
      },
      climax: {
        location: "落云宗极灵之深渊",
        description: "你已经是名震天南的元婴期大修士！此时，坠魔谷夺宝以及面对天澜圣兽化身的虚空冲突正在悄然展开。四方魔修以及强大的蛮荒古兽横行，你急需调动九天神雷与辟邪金雷，抗击浩瀚的大敌！",
        items: [
          { name: "辟邪金雷·雷竹飞剑 (本命法宝)", type: "weapon", tier: "legendary", description: "由天劫至宝万年避邪金雷竹精炼而成的十二柄飞剑，专门克制世间一切妖魔邪祟，能释放诛邪金雷！", modifiers: { attack: 95, spirit: 50, defense: 40 } }
        ]
      }
    }
  },
  "guimi": {
    name: "《诡秘之主》",
    author: "爱潜水的乌贼",
    genre: "西幻密教 / 蒸汽朋克 / 克苏鲁",
    description: "地球青年周明瑞在古老诡异的转运仪式中穿越到异界工业都市。非凡者靠吞服蕴含神秘要素的魔药晋升，并扮演不同的途径（如占卜家、盗火者、倒吊人）。高位非凡伴随宿命的疯狂与邪神呓语。",
    magicSystem: "序列22条非凡途径，从序列9晋升至序列0。晋升和抗衡失控的核心是‘扮演法’。依靠符咒、占卜、灵视、梦境以及源自灰雾之上的隐秘力量。每次超凡举动都对精神值（Spirit）产生极大压迫。",
    defaultProtagonist: "克莱恩·莫雷蒂",
    startPoints: {
      start: {
        location: "鲁恩王国 - 廷根市佐特兰街36号",
        description: "淅淅沥沥的小雨笼罩着这座煤烟熏黑的城市。你刚用苏醒的‘灵视’目睹了自裁现场。队长邓恩·史密斯身穿黑风衣、咬着烟斗，邀请你加入‘值夜者’小队，负责守护这座城市不受非凡怪物和邪教徒侵扰...",
        items: [
          { name: "银制仪式匕首", type: "weapon", tier: "rare", description: "通体绘制有赫密斯净化符咒的白银小剑，能轻易截断邪异的灵性气流，主持仪式魔法必备。", modifiers: { attack: 15, spirit: 20 } },
          { name: "‘占卜家’魔药残余", type: "accessory", tier: "common", description: "虽然刚服下，但其狂暴的灵性让你能依靠星盘占卜、灵摆占卜、梦境占卜洞悉命运阴暗面。", modifiers: { spirit: 40, health: 10 } }
        ]
      },
      middle: {
        location: "贝克兰德 - 大雾霾迷宫",
        description: "你化名夏洛克·莫里亚蒂在雾之都贝克兰德做私家侦探。现在，整个贝克兰德灵界正在极度颤抖，魔女教派与极光会正在进行‘大雾霾’邪神降临仪式，死亡与疯狂铺天盖地。你身为序列7：‘魔术师’需要在这惊天狂潮里博得生路！",
        items: [
          { name: "太阳神符", type: "accessory", tier: "epic", description: "用赫密斯神语精雕刻、充能了无上光辉威能的金片符咒。一旦念出咒文，可爆发出纯净的净化之炎！", modifiers: { attack: 35, spirit: 30 } },
          { name: "不为人知的手套 (‘蠕动的饥饿’)", type: "accessory", tier: "legendary", description: "一件神奇物品，可吞噬并驱使他人的非凡能力，但也需要每天喂食血肉，散发出极为渴望的呢喃。", modifiers: { attack: 55, defense: 25, health: -30 } }
        ]
      },
      climax: {
        location: "虚空之海 - 神圣遗迹‘巨人王庭’",
        description: "你已晋升为高位存在。这里是巨人王庭的永恒神庙，天空中泛着万年不散的橘红晚霞。在你身后是诡秘疯狂的神殿废墟，不完整的宿命丝线在你眼底交织。你身为‘诡秘之侍’，正要与高序列污染和阿蒙的恶作剧化身展开跨越概念的绝顶神战！",
        items: [
          { name: "丧钟左轮手枪", type: "weapon", tier: "legendary", description: "注入了无上死亡神性的符文手枪，可给击中者赐予绝对的虚弱或一击即死，但这把枪的诅咒也极其沉重。", modifiers: { attack: 110, defense: -20, spirit: 60 } }
        ]
      }
    }
  },
  "doupox": {
    name: "《斗破苍穹》",
    author: "天蚕土豆",
    genre: "热血修真 / 斗气奇幻",
    description: "曾经惊才绝艳的萧家天才萧炎突然失去斗气沦为废柴，受尽退婚奚落。原来他的斗气全被母亲遗留戒指里的神秘灵魂‘药老’吸收。在药老指导下，萧炎吞噬各种天地异火，创出《焚诀》，踏上复仇暴强巅峰！",
    magicSystem: "修炼划分：斗之气、斗者、斗师、大斗师、斗灵、斗王、斗皇、斗宗、斗尊、斗圣、斗帝。异火为尊，功法等级分为天、地、玄、黄。炼药术能回血或提供暴涨，战斗注重狂猛对攻。",
    defaultProtagonist: "萧炎",
    startPoints: {
      start: {
        location: "加玛帝国 - 乌坦城萧家后山",
        description: "你坐在陡峭的石崖边上。看着自己布满厚茧的双手，‘斗之气：三段！’的耻辱测试结果仿佛重锤击碎你的尊严。此时，狂妄的纳兰嫣然正带着云岚宗的强者在会客厅强势退婚。你手指上那枚母亲死后留下的古朴黑色布满裂缝的戒指，正微微发烫...",
        items: [
          { name: "古朴黑玄戒", type: "accessory", tier: "mythic", description: "里面盘宿着一位传奇九品炼药宗师‘药老’的残虚法魂。他会作为你的护身符、提供炼药与极致战力开导！", modifiers: { spirit: 60, attack: 15, defense: 10 } }
        ]
      },
      middle: {
        location: "塔戈尔大沙漠 - 蛇人圣地",
        description: "你经历了重重艰险，终于在大沙漠深处感知到了传说中‘青莲地心火’的狂热气息。美杜莎女王正在岩浆深处利用异火进行生死涅槃劫！你在药老的附身下，必须强行在各方皇阶强者的窥视下夺取异火并将其硬生生吞噬进化！",
        items: [
          { name: "玄重尺 (噬魂巨尺)", type: "weapon", tier: "epic", description: "漆黑巨尺由极珍的黑神陨铁打造，沉重无比，挥舞时能瞬间压制体内斗气流动，但挥击出来破坏力撼天动地！", modifiers: { attack: 55, defense: 20 } },
          { name: "青莲地心火 (第一种异火)", type: "accessory", tier: "epic", description: "在大地熔岩深处锤炼万年而生出的火焰，散发出无上的青色莲形地热，能永久提纯、催动无尽焚诀火浪！", modifiers: { attack: 45, spirit: 25, health: 50 } }
        ]
      },
      climax: {
        location: "中州大陆 - 迦南学院天焚炼气塔底",
        description: "你已经威震中州，为了救援药老被魂殿追杀。岩浆之海下，陨落心炎形成的无形火蟒正在暴乱崩啸，魂殿的尊阶强者黑影环伺。你退无可退，必须融合两种以上的异火，爆发出震铄古今的‘佛怒火莲’将强敌摧残成飞灰！",
        items: [
          { name: "骨灵冷火 (极寒异火)", type: "accessory", tier: "legendary", description: "由药老相赠，极寒与极热完美结合的神奇白色骸骨之火。融合后威力毁灭山岳。", modifiers: { attack: 85, spirit: 40, health: 80 } }
        ]
      }
    }
  },
  "santi": {
    name: "《三体》",
    author: "刘慈欣",
    genre: "硬科幻 / 宇宙社会学",
    description: "人类意外向外太空释放了信号，被半人马座朝不保夕的三体文明捕获。三体开始发射智子锁死人类基础物理！你作为地球防卫力量，在黑暗森林法则的宿命笼罩下，必须寻找破局之路并对抗破壁人的算计。",
    magicSystem: "这不靠超凡魔药，而是靠‘基础科技与理论、隐藏真实战略智谋’。智子（Sophon）监控一切说话和资料，只有大脑的‘思维’是绝对安全的！你需要动用罗辑的‘黑暗森林诅咒’或物理研究来制衡三体舰队。",
    defaultProtagonist: "汪淼",
    startPoints: {
      start: {
        location: "地球防卫理事会 - 联合作战总部",
        description: "黑板上贴满了多位顶级物理学家神秘自裁的档案。你作为纳米材料专家，正极度恐惧地看着眼前泛起的淡金色数字：一秒一秒在跳动的‘倒计时幽灵’！警官史强点燃一颗香烟，冷笑着拍着你的肩膀：‘汪工，怕个球，这里有阴谋，跟我查！’",
        items: [
          { name: "纳米飞刃受控模块", type: "weapon", tier: "rare", description: "极度坚韧、纤细到肉眼不可见的纳米超强长丝，能够悄无声息地像切黄油一样切断任何巨型轮船或钢铁防护！", modifiers: { attack: 40, defense: 10 } }
        ]
      },
      middle: {
        location: "三体游戏世界 - 巨摆大钟荒原",
        description: "你戴上感应头盔，进入了怪诞的三体世界。这里正处于‘乱纪元’，三颗太阳在天空中做着诡异的无规则流浪！你需要在脱水和浸泡生存的荒原上，与墨子、秦始皇和牛顿对话，用极高的理智和宇宙常识，推演出太阳运行规律！",
        items: [
          { name: "V装具 (沉浸传感器)", type: "accessory", tier: "rare", description: "能将高维度理论在三体宇宙仿真成具象化模型的硬核头盔。极度增加理智与科技推演底气。", modifiers: { spirit: 50, health: 20 } }
        ]
      },
      climax: {
        location: "雷达峰 - 绿星监控太空射手哨所",
        description: "你站在高耸的三体监视器和深空引力波发射按钮前。三体内奸破壁人已经潜伏在你的办公室。探测器‘水滴’正以秒速30公里疯狂向你飞掠而来，要把这里彻底融化！你必须在生命最后一刻敲定那个向全宇宙广播三体坐标的宿命指令...",
        items: [
          { name: "引力波发射终极控制器", type: "weapon", tier: "mythic", description: "一旦开启，将向宇宙深空发出死亡广播，暴露地球与三体母星的位置，引来歌者文明的二向箔打击！无尽死神与最后的威慑大杀器！", modifiers: { attack: 250, spirit: 100 } }
        ]
      }
    }
  }
};

// JSON Schema for structured turn response from Dunia Engine
const stepResponseSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "网文小说的详细剧情推演叙事（约200-300字）。需深度揣摩契合该网文的神韵与语气（如：仙侠要修仙流的磅礴冷酷，西幻要蒸汽诡秘，科幻要硬核思辨）。详细描写玩家刚刚采取的行为（或选择的选项）在那个世界里引起的变化、NPC对话、环境反响、剧情高潮、暗含危局或造化。"
    },
    dmNote: {
      type: Type.STRING,
      description: "Dungeon Master 旁白提示。以神识、宿命之眼或神圣指引的口吻给玩家的一句话建策或背景法则提点（如：‘古神余怒未消，此时硬突极为不智，或许那块诡秘手镜能派上用场。’），字数在40字以内。"
    },
    suggestedActions: {
      type: Type.ARRAY,
      description: "针对当前困境在下一步供玩家快速点击采取行动的3个符合逻辑且具有网文特色和戏剧冲突的高级动作/抉择。文笔要帅，极具网文风（如修真里：‘运起万年辟邪金雷，全力往那古魔的左眼轰击’）。必须不多不少正好3个。",
      items: { type: Type.STRING }
    },
    currentLocation: {
      type: Type.STRING,
      description: "当前小说世界的地理位置名称更新（如：越国黄枫谷-地火峰中层，廷根市-勇敢者酒吧暗室，或者维持原名）。"
    },
    dangerLevel: {
      type: Type.INTEGER,
      description: "当前情境的生命危险或战斗紧张压力指数（0到100之间），例如安详闲聊为10，遭遇杀人夺宝、强敌搏杀、诡秘异界污染或天劫则为80-95。"
    },
    statChanges: {
      type: Type.OBJECT,
      description: "玩家属性的绝对增减或受损情况（写差值，例如 +30，-15。写 0 表示不变）。",
      properties: {
        xpGain: { type: Type.INTEGER, description: "本回合获得的修行心得阅历 (XP)，通常在10~40点之间。" },
        goldChange: { type: Type.INTEGER, description: "本回合荒金/荒便币的增减。可以为正或负（如消费买药）。" },
        healthChange: { type: Type.INTEGER, description: "生命值变化（例如受伤为负数，如 -25，服药或休整恢复为正数，如 +30）。" },
        spiritChange: { type: Type.INTEGER, description: "精力/法力变化。使用超凡魔法灵符大招会消耗法力（为负数），打坐回气恢复（为正数）。" },
        realmUpdate: { type: Type.STRING, description: "只有当玩家修行XP攒满、完成绝顶突破或顿悟时提供，代表境界头衔的变化（如：‘炼气期四层’，‘序列8：小丑’，‘大斗师一星’）。平时留空。" }
      }
    },
    itemDiscovered: {
      type: Type.OBJECT,
      description: "玩家本回合因探索发现、斩杀强敌、博得造化或捡漏而新获得的超凡装备法宝、残卷、秘密配方、灵液丹药。若本回合没有任何物品获取，请不传本字段（或传 null）。",
      properties: {
        name: { type: Type.STRING, description: "新物品的名字" },
        type: { type: Type.STRING, description: "道具类型：'weapon' (武器), 'armor' (防具), 'accessory' (秘宝饰品), 'elixir' (丹药耗材)" },
        tier: { type: Type.STRING, description: "稀有度分级：'common'(凡物), 'rare'(灵宝), 'epic'(史诗), 'legendary'(仙宝), 'mythic'(逆天至宝)" },
        description: { type: Type.STRING, description: "物品来龙去脉、玄幻修仙背景来历说明 (Lore)" },
        modifiers: {
          type: Type.OBJECT,
          description: "装备后的永久/服药附加属性加成。",
          properties: {
            health: { type: Type.INTEGER, description: "加HP上限" },
            attack: { type: Type.INTEGER, description: "加破敌攻击力" },
            defense: { type: Type.INTEGER, description: "加肉身防御力" },
            spirit: { type: Type.INTEGER, description: "加法力上限" }
          }
        }
      }
    },
    itemLost: {
      type: Type.STRING,
      description: "若玩家本回合使用了手头某项消耗性丹药，或者因战斗遗失、遇盗被夺、被强者强买强卖丢掉了道具，请输入要失去的【物品精确名称】。平时留空。"
    }
  },
  required: ["narrative", "dmNote", "suggestedActions", "currentLocation", "dangerLevel", "statChanges"]
};

// Preset lists for local sandbox adaptation in case Gemini Key is missing
const fallbackStepOutputs = [
  {
    narrative: "你深呼吸一口气，运转身上的超凡功法和真理法则试图切入局势。四周的灵性粒子随你的动作如潮水般共振，你的一连串机智反应不仅震慑了不怀好意的围观者，连暗中观察的那位隐秘大修士也发出了一声略带惊奇的低笑，称赞你的根骨实属罕见！",
    dmNote: "凡人修仙贵在稳扎稳打。记住财不露白，四周的虚空中隐含杀机，宜静观其变。",
    suggestedActions: [
      "向树林深处的阴暗方向恭敬行礼，询问前辈尊姓大名",
      "绝不逗留，运起神行术朝着相反方向头也不回地狂奔逃逸",
      "悄悄将手暗中扣在储物袋（或匕首柄）上，准备暴起防冷子"
    ],
    currentLocation: "越国镜州 - 迷雾竹林外围",
    dangerLevel: 35,
    statChanges: { xpGain: 15, goldChange: 40, healthChange: 0, spiritChange: -10 }
  },
  {
    narrative: "面对眼前的严峻阻碍，你的惊人操作引动了天地法阵的极度不稳！狂暴的力量瞬间像重锤般撞击你的识海，你被直接振退数步，喉口一甜受了些许内伤。不过，你在危局中极度冷静的灵性直觉也让你突破了心灵尘埃，体内的力量发生了细微饱满的回响！",
    dmNote: "刚刚的攻击触动了天地残阵。别硬拼！尝试动用你身上的秘宝装备，或者寻找暗中机关的逻辑弱点。",
    suggestedActions: [
      "盘膝而坐取出储物袋里的治伤丹药吞下，静等余波散去",
      "将全部法力注入你的武器，狠狠一击轰向前方的残破雕像眼珠",
      "运起灵视之光，深度查看在乱石堆后方是不是藏有传送通道"
    ],
    currentLocation: "未名上古遗迹 - 偏殿废墟",
    dangerLevel: 65,
    statChanges: { xpGain: 25, goldChange: 0, healthChange: -15, spiritChange: -15 }
  }
];

// --- 1. START SIMULATION ENDPOINT ---
app.post("/api/start-sim", async (req, res) => {
  const { novelId, customNovelName, customNovelText, protagonistName, protagonistIdentity, startPoint, talent } = req.body;

  let chosenUniverse: any = null;
  let universeName = "";
  let universeLore = "";
  let baseLocation = "";
  let introNarrative = "";
  let starterItems: any[] = [];

  // Determine preset or custom universe
  if (novelId && CLASSIC_UNIVERSES[novelId]) {
    chosenUniverse = CLASSIC_UNIVERSES[novelId];
    universeName = chosenUniverse.name;
    universeLore = `小说《${chosenUniverse.name}》作者：${chosenUniverse.author}。题材设定：${chosenUniverse.genre}。世界法则常识：${chosenUniverse.magicSystem}`;
    const sp = chosenUniverse.startPoints[startPoint || "start"] || chosenUniverse.startPoints.start;
    baseLocation = sp.location;
    introNarrative = sp.description;
    starterItems = [...sp.items];
  } else {
    universeName = customNovelName ? `《${customNovelName}》` : "《自制天尊秘典》";
    universeLore = `这是一本完全自定义的小说，内容主旨与背景设定如下：\n${customNovelText || "一个充满奇遇和神魔对抗的自由宏大宇宙。法则随心。"}`;
    baseLocation = "大千宇宙之神秘初始地";
    introNarrative = `时光长河奔腾不息，你在一片白茫茫的混沌灵雾中猛然睁开双眼。这里自成一方真实乾坤，正是小说《${universeName}》的世界根蒂。这里无边广袤、大道三千，你的一呼一吸间均能引来丝丝规则的震荡。你的修真之路，或是超凡救赎之旅，在这一刻正式揭开了序幕！`;
    starterItems = [
      { name: "造化铜钱", type: "accessory", tier: "rare", description: "上有一缕混沌气息，能帮你化险为夷、算尽天机的气运配饰。", modifiers: { health: 25, spirit: 25 } }
    ];
  }

  // Handle Protagonist Stats Initialization
  const finalProtagonistName = protagonistIdentity === "original" 
    ? (chosenUniverse ? chosenUniverse.defaultProtagonist : "原书主人公") 
    : (protagonistName || "独孤客");

  const finalProtagonistOrigin = novelId === "guimi" ? "beyonder" : (novelId === "santi" ? "mage" : "cultivator");
  
  // Starting title/realm
  let starterRealm = "凡胎肉身";
  if (novelId === "fanren") starterRealm = "炼气期一层";
  else if (novelId === "guimi") starterRealm = "序列9：占卜家";
  else if (novelId === "doupox") starterRealm = "斗之气三段";
  else if (novelId === "santi") starterRealm = "纳米物理学者";

  const talentInfo = talent ? `【初始本命金手指天赋：${talent}】` : "";
  const initialNarrativeText = `【世界构筑宣告】\n你已经成功降生到${universeName}的浩瀚因果中。你的肉体与真魂完美合一。\n\n${introNarrative}\n\n当前姓名：${finalProtagonistName}，修为境界：${starterRealm}。你神识微动，发现怀中藏有部分机缘遗落物。${talentInfo} 前路迢迢，是逆天而行顺昌逆亡、还是沦为荒原白骨？全凭你的一念之间！`;

  // Start suggestions
  let initialSuggestions = ["小心翼翼地环顾四周，感悟虚空的灵气密度并稳定神魂", "闭目冥想，内视自己的丹田识海，调动身体蕴含的力量", "搜寻身上的包袱口袋，清点所有的随身机缘秘宝"];
  if (novelId === "fanren") {
    initialSuggestions = [
      "向水潭对面的墨大夫走去，恭敬地行弟子礼并打探修炼异样",
      "悄悄摩挲口袋中的绿色小玉瓶，将灵力注入其中查看是否有天地异象",
      "借故身体不适，告假返回神手谷深处的竹屋，暗中背诵《长春功》"
    ];
  } else if (novelId === "guimi") {
    initialSuggestions = [
      "睁开‘灵视’，警惕地扫视佐特兰街36号接待厅内遗留的非凡灵性色彩",
      "收起自制匕首，用手帕擦干额头的冷汗，向黑发灰眸的队长邓恩礼貌点头",
      "轻轻在眉心敲击两次，呼唤‘灰雾之上的愚者名讳’，试图在梦境中平息污染灵性"
    ];
  } else if (novelId === "doupox") {
    initialSuggestions = [
      "推开萧家议事厅的大门，目光直视纳兰嫣然，说出让其震惊的一言",
      "头也不回地朝后山大森林奔去，闭眼呼唤手上的黑色戒指试图与戒灵药老对话",
      "咬紧牙关，在众族人的嘲笑和叹气中快步离去，前去寻找养父萧战倾诉"
    ];
  } else if (novelId === "santi") {
    initialSuggestions = [
      "摘下泛着幽蓝幻影的倒计时眼镜，揉揉红肿的双眸，看一看倒计时在不在墙壁上",
      "向冷峻玩世不恭的史强探长倒一杯茶，仔细询问杀害物理学者的案发现场细节",
      "启动面前的超高频纳米拉丝试件台，测试纳米飞刃遇到极端重力时的分子形变量"
    ];
  }

  // Initial Character Stats Sheet
  const initialCharacterStats = {
    name: finalProtagonistName,
    origin: finalProtagonistOrigin,
    realm: starterRealm,
    level: 1,
    xp: 0,
    xpNeeded: 100,
    gold: novelId === "guimi" ? 15 : 120, // Golden sovereigns or Gold copper
    health: 100,
    maxHealth: 100,
    attack: 18,
    defense: 8,
    spirit: 50,
    maxSpirit: 50,
    inventory: starterItems.map((v, idx) => ({ ...v, id: `starter_${idx}` })),
    equipment: { weapon: null, armor: null, accessory: null },
    skills: [
      { name: "凡俗搏击 (基础拳脚)", description: "没有超凡功法加成时的最基本肌肉防卫手段，不消耗任何法力。", type: "physical", powerValue: 10, spiritCost: 0 }
    ]
  };

  return res.json({
    success: true,
    character: initialCharacterStats,
    universeName,
    starterLocation: baseLocation,
    narrative: initialNarrativeText,
    suggestedActions: initialSuggestions,
    dmNote: "你已经完好降临在这个真实世界。前方的每一个举动都将被因果记录，去写下属于你的网文传奇吧！"
  });
});

// --- 2. DYNAMIC TURN STEP PROCESSOR (Dungeon Master Engine) ---
app.post("/api/sim-step", async (req, res) => {
  const { 
    novelId, 
    customNovelText, 
    character, 
    action, 
    history, 
    currentLocation, 
    talent,
    dangerLevel: prevDangerLevel 
  } = req.body;

  if (!character || !action) {
    return res.status(400).json({ error: "Missing required character or action variables." });
  }

  let universeName = "自制乾坤世界";
  let universeMagic = "玄幻仙道，大能降身";
  if (novelId && CLASSIC_UNIVERSES[novelId]) {
    universeName = CLASSIC_UNIVERSES[novelId].name;
    universeMagic = CLASSIC_UNIVERSES[novelId].magicSystem;
  } else if (customNovelText) {
    universeMagic = `自定义世界设定与原著大纲法理如下：\n${customNovelText}`;
  }

  // Compile history logs into a concise summary to prevent token explosion
  const historySnippet = history && history.length > 0 
    ? history.slice(-4).map((h: any) => `${h.role === 'action' ? '玩家行动: ' : '剧情进展: '}${h.text}`).join("\n")
    : "刚到此界，因果初开。";

  // Build high-intensity system parameters for Gemini-3.5-flash
  const systemInstruction = `You are the absolute ultimate 'Dungeon Master' (Game Master) and native Novel Novelist for the simulated real world of the famous novel ${universeName}. 
  The player is roleplaying as the protagonist. Your task is to process their typed action and dynamically simulate the exact realistic, dramatic plot consequence TURN-BY-TURN. There is NO pre-generation!
  
  CRITICAL RULES:
  1. ADHERENCE TO NOVEL CANON & LAWS: You must keep the logic, atmosphere, magic/cultivation system (${universeMagic}), character behaviors, and environmental response 100% faithful to the novel's laws. Do NOT make up systems that conflict with the original setting (e.g. Do not give Han Li magic cards, do not put laser guns in Xianxia, do not let normal people fly without spiritual root or Sequence potions).
  2. DETAILED LITERARY Chinese (中文): Write with breathtaking immersive fantasy, xianxia, mystery, or sci-fi Chinese prose (around 200-300 words). Feel like actual high-quality published paragraphs from the best chapters! Describe the sounds, dynamic dialogues, visual changes, or internal pressure of their body/mind.
  3. DYNAMIC STAT CHANGES: Update the player's attributes realistically based on what happened. For instance:
     - Cultivation breakthrough: If their XP has reached or exceeded max (100%), and their action is to breakthrough or try an intensive meditation or consume a core breakthrough pill, update 'realmUpdate' with the next level. (e.g., '炼气期二层' to '炼气期三层', '序列9：占卜家' to '序列8：小丑'). Provide high danger level (80-95%) for a heavenly tribulation or mental breakdown!
     - Combat damage/Heal: If they fight enemies, deduct health (healthChange is negative, e.g. -15, -30) or spirit (spiritChange is negative, e.g. -10, -25). If they find medicine/rest, add health.
     - Discoveries: Sometimes they gain magic items (weapon, armor, accessory, elixir) or herbal formulas. Return a single fully modeled 'itemDiscovered' when appropriate with sensible stat modifiers (+Attack, +Defense, +Health, +Spirit). If they consume an elixir or use up an item, return its name in 'itemLost' to remove it from their inventory.
  4. NO unsolicited features. Return exactly a single JSON object matching the provided schema. No markdown backticks outside of returning raw JSON. Make sure you return EXACTLY 3 sensible and extremely hot 'suggestedActions'.
  5. Talent activation: The player's unique cheat/gimmick talent in this lifetime is '${talent || "None"}'. If applicable to current circumstances, weave that talent into the narrative outcome with amazing effects!`;

  const ai = getGeminiClient();

  if (!ai) {
    // Elegant local fallback if API key is not provided so the game builds beautifully and is 100% stable
    console.log("[SERVER] Gemini client absent. Executing smart local sandbox narrative generator.");
    const chosenFallback = fallbackStepOutputs[Math.floor(Math.random() * fallbackStepOutputs.length)];
    const danger = Math.min(100, Math.max(0, (prevDangerLevel || 20) + (Math.random() > 0.5 ? 15 : -15)));
    
    // Check if player is about to break through local state
    let isBreakthrough = false;
    let newRealm = "";
    if (character.xp + 30 >= 100) {
      isBreakthrough = true;
      if (novelId === "fanren") newRealm = "炼气期三层";
      else if (novelId === "guimi") newRealm = "序列8：小丑";
      else if (novelId === "doupox") newRealm = "斗者一星";
      else newRealm = "神元二阶";
    }

    const compiledFallback = {
      narrative: `【灵智推演】面对你的一声怒喝：‘${action}！’。空气中的超凡灵压陡然卷缩爆开！四周狂风掀飞落叶，只显露出无上帝符的暗夜一角。你巧妙避开了正面暗算的刺客，经脉如蛟龙般激昂。${isBreakthrough ? `突然，你的丹田产生万丈爆鸣，瓶颈隐现碎裂之声！` : ""}`,
      dmNote: isBreakthrough ? "经脉灌注圆满，你可以立刻采取动作，选择筑坛冲刺下个逆天境界！" : chosenFallback.dmNote,
      suggestedActions: isBreakthrough 
        ? ["静气凝神，将全身灵液收束丹田，进行超凡大境界冲关突破！", "稳下气血，暂时遏阻突破势头，防止在不知名地带引发天劫杀身", "吞服随身神药护心，并向四周布下简易隐匿阵法以防妖兽偷袭"]
        : chosenFallback.suggestedActions,
      currentLocation: currentLocation || chosenFallback.currentLocation,
      dangerLevel: danger,
      statChanges: {
        xpGain: isBreakthrough ? 10 : 25,
        goldChange: Math.random() > 0.5 ? 30 : -10,
        healthChange: Math.random() > 0.8 ? -10 : 0,
        spiritChange: -15,
        realmUpdate: isBreakthrough ? newRealm : ""
      }
    };
    return res.json({ success: true, updatedOutput: compiledFallback });
  }

  // Setup prompt parameters
  const promptText = `
  Active Hero Character Sheet Status:
  - Name: ${character.name}
  - Cultivation Realm: ${character.realm}
  - Level: ${character.level}
  - Current HP: ${character.health}/${character.maxHealth}
  - Current Spirit/Mana: ${character.spirit}/${character.maxSpirit}
  - Current Gold: ${character.gold}
  - Current XP: ${character.xp}/${character.xpNeeded}
  - Current Equipment: Weapon: ${character.equipment.weapon?.name || "None"}, Armor: ${character.equipment.armor?.name || "None"}, Accessory: ${character.equipment.accessory?.name || "None"}
  - Current Inventory Count: ${character.inventory?.length || 0} items
  - Current Geographic Location in Novel: ${currentLocation || "未知禁地"}
  - Special Cheat/Talent in Mind: ${talent || "None"}

  Recent Story History Log Context:
  -------------------
  ${historySnippet}
  -------------------

  PLAYER'S CURRENT TURN ACTION:
  "${action}"

  Compute and generate the realistic simulated results in the requested raw JSON format. Preserve the tone and constraints perfectly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: promptText }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: stepResponseSchema as any,
        temperature: 0.92
      }
    });

    const parsedOutput = JSON.parse(response.text?.trim() || "{}");
    console.log(`[WORLD SEED STEP] Success. Narrative output lines: ${parsedOutput.narrative?.slice(0, 40)}...`);
    return res.json({ success: true, updatedOutput: parsedOutput });

  } catch (err: any) {
    console.error("[WORLD SEED STEP] Gemini API failure:", err);
    // Safe generic fallback
    const mockOutput = {
      narrative: `【天地运转】由于在施展过程中法理共振过于庞大，世界规则微微颤栗。在一阵巨大的光影涟漪后，你的一声大喝：“${action}”化为了响彻天际的回音。你的气核（或灵性深海）微微激荡，在剧烈的能量风暴中，你极度敏锐地退让护脸，获得了极其保贵的修行心得。`,
      dmNote: "法则产生了微微失衡，但你的意念已经融入此界，运起防护底牌继续征战！",
      suggestedActions: [
        "稳定身形，运转神功打坐以温养受阻的经脉",
        "催动身上法宝，小心翼翼摸索石壁查看是否有秘门通道",
        "大声呼问黑暗中隐匿的那道气息，寻求真相和引路"
      ],
      currentLocation: currentLocation || "时空裂痕",
      dangerLevel: Math.min(100, Math.max(10, (prevDangerLevel || 20) + 10)),
      statChanges: { xpGain: 20, goldChange: 20, healthChange: -5, spiritChange: -5 }
    };
    return res.json({ success: true, updatedOutput: mockOutput });
  }
});

// Serve frontend build static files & mount Dev/Production mechanisms
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] NovelQuest Universe Server roaring online on http://localhost:${PORT}`);
  });
}

startServer();
