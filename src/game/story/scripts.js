/* CASE 01 cutscenes. Shot keys: [at, position, target, fov, ease, roll]; a first key of [0, null] starts from wherever
   the camera is. Camera grammar follows huashu-motion: swing reveal to open, push to a detail, snap on the beat,
   and a slow drift on every hold (the player adds it). */
import {CASE} from '../case.js';

const O = 6000, A = 9000, GR = 12000; // interior sets: optics lab, acoustics lab, guard room
const say = (who, t) => ({line: [who, t]});

/* a medium shot on a person from a low angle, a little to one side, so the sky sits behind them */
function face(W, k, {d = 400, side = .4, up = 62, aim = 22} = {}) {
  const p = W.P[k], ry = p.rotation.y + side, x = p.position.x, z = p.position.z, hy = 147 * p.userData.h;
  return {pos: [x + Math.sin(ry) * d, Math.max(40, hy - aim - up * d / 400), z + Math.cos(ry) * d], tgt: [x, hy - aim, z]};
}
const to = (k, dur = 1.2, o = {}) => (W) => { const f = face(W, k, o), far = face(W, k, {...o, d: (o.d || 400) * 1.3, side: (o.side ?? .4) * 1.5}); return [[0, far.pos, f.tgt, 34], [dur, f.pos, f.tgt, 32, 'outExpo']]; };
const push = (k, dur = .9, o = {}) => (W) => { const f = face(W, k, {aim: 12, ...o, d: (o.d || 400) * .68}); return [[0, null], [dur, f.pos, f.tgt, 30, 'outCubic']]; };
const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

export function intro(W) {
  const {PX, PZ} = W, s = CASE.says;
  return [
    {do: (w) => { w.reset(); w.setMood('night'); w.P.gu.visible = false; }, title: [CASE.code, CASE.title, '科技节前夜'], sfx: 'riser',
      shot: [[0, [820, 46, 120], [380, 60, -200], 30], [2.4, [-380, 130, 1700], [-80, 560, -520], 42, 'outExpo']], wait: 3.6},
    {cap: '科技节前夜 · 第七实验楼', ...say('nar', '科技节前夜。第七实验楼一层的光学实验室里，放着明天要颁发的水晶奖杯。'),
      shot: [[0, null], [2.8, [470, 120, 330], [330, 190, -507], 34, 'inOutCubic']]},
    {cap: '21:00 · 光学实验室', do: (w) => { w.place('lin', O + 170, 10, facing(O + 170, 10, O, -120)); w.walk('lin', O - 330, 260, 3.6); },
      ...say('nar', '21:00，光学社社长林小舟锁门离开。奖杯还在展台上。'),
      shot: [[0, [O + 400, 240, 340], [O, 140, -120], 32], [3.6, [O + 150, 178, 110], [O, 136, -120], 28, 'inOutCubic']]},
    {cap: '22:00 · 光学实验室', sfx: 'hit2', do: (w) => {
      w.prize.visible = false; w.place('zhou', O + 150, 150, facing(O + 150, 150, O, -120)); w.P.zhou.userData.armR = -1.2;
      w.flashT.position.set(O, 112, -120); w.flash.visible = true; w.P.lin.visible = false;
    }, ...say('zhou', '22 点巡查……奖杯呢？奖杯不见了！'),
      shot: [[0, [O - 230, 210, 640], [O + 90, 120, -40], 40], [.45, [O - 150, 185, 520], [O + 90, 118, -40], 38, 'outCubic']]},
    {cap: '次日 07:10 · 生态池', do: (w) => { w.flash.visible = false; w.reset(); w.setMood('dawn'); w.prize.visible = false; w.sunk.visible = true; },
      ...say('nar', '第二天一早，清洁工在实验楼外的生态池底，捞到了奖杯。'),
      shot: [[0, [PX + 520, 260, PZ + 520], [PX + 120, 10, PZ + 40], 34], [3.2, [PX + 330, 115, PZ + 330], [PX + 120, 12, PZ + 40], 30, 'inOutCubic']]},
    {...say('gu', '我是顾言，负责这起案子。'), shot: to('gu', 1.6, {side: -.5})},
    {...say('gu', '从现在起，你是这起案子的鉴识员。我负责问话，你负责用证据说话。')},
    {...say('gu', '21:00 奖杯还在，22:00 就不见了。这一个小时里，实验楼附近只有三个人。'),
      shot: [[0, null], [2.8, [-240, 300, 1480], [-420, 250, -120], 40, 'inOutCubic']], drift: .6},
    /* the interviews */
    {cap: `证词 1 / 4 · ${CASE.people.zhou.name} · ${CASE.people.zhou.role}`, ...say('zhou', s[0].t), shot: to('zhou', 1.3)},
    {cap: `证词 2 / 4 · ${CASE.people.lin.name} · ${CASE.people.lin.role}`, ...say('lin', s[1].t), shot: to('lin', 1.3, {side: -.45})},
    {cap: `证词 3 / 4 · ${CASE.people.song.name} · ${CASE.people.song.role}`, ...say('song', s[2].t), shot: to('song', 1.3, {side: .5})},
    {cap: `证词 4 / 4 · ${CASE.people.song.name}`, ...say('song', s[3].t), shot: push('song', .5, {side: .2}), sfx: 'whoosh'},
    {cap: null, ...say('gu', '三个人，四句话。每一句都能拿物证来检验。'), shot: to('gu', 1.2, {side: .45})},
    {...say('gu', '物证已经送到鉴识台。把它们一件件鉴定清楚，再回来告诉我：谁在说谎。'), shot: push('gu', 2.4, {side: .3})},
  ];
}

export function after(W, k) {
  const {PX, PZ} = W, bk = W.bucket.position;
  if (k === 'A') return [
    {cap: '鉴定结论 · 物证 A · 声学室的真空罩', do: (w) => { w.reset(); w.setMood('dawn'); },
      ...say('gu', '真空罩里的闹铃一直在振动。可罩内是真空，声音传不出来。'),
      shot: [[0, [A + 280, 230, 280], [A - 40, 135, -120], 32], [2.6, [A + 60, 160, 40], [A - 40, 135, -120], 30, 'inOutCubic']]},
    {...say('gu', '设备日志显示，真空泵从 20:50 一直运行到第二天早上。'), shot: [[0, null], [1.1, [A + 140, 225, 80], [A + 110, 228, -290], 30, 'outCubic']]},
    {cap: null, ...say('gu', `可${CASE.people.zhou.name}说，他守在门口，听这只闹铃响了一晚上。`), shot: to('zhou', 1.3)},
    {...say('gu', '这两件事，能同时成立吗？'), shot: push('zhou', 1.4), drift: .5},
  ];
  if (k === 'B') return [
    {cap: '鉴定结论 · 物证 B · 光学室的监控录像', do: (w) => { w.reset(); w.setMood('dawn'); },
      ...say('gu', '摄像头的镜头就是一块凸透镜。物体在 2 倍焦距以外，成倒立、缩小的实像。'),
      shot: [[0, [O - 40, 240, 260], [O - 400, 340, -250], 36], [1.6, [O - 200, 290, 40], [O - 410, 350, -255], 32, 'outExpo']]},
    {...say('gu', '这台老摄像头没有做画面翻转，录下来的画面本来就是倒的。录像没有被改过。')},
    {cap: 'CAM 02 · 21:40:12', sfx: 'whoosh', do: (w) => {
      w.place('song', O + 230, -230, facing(O + 230, -230, O, -120)); w.walk('song', O + 50, -70, 1.6);
      w.tween(2.2, (q) => { if (q >= 1) { w.prize.visible = false; w.P.song.userData.armR = -1.4; } });
    }, ...say('gu', '21:40，有人从气窗钻进来，拿走了奖杯。'),
      shot: [[0, [O - 360, 334, -224], [O, 110, -120], 46, 'linear', Math.PI], [3, [O - 360, 334, -224], [O + 40, 105, -110], 44, 'linear', Math.PI]], drift: 0},
    {cap: null, do: (w) => w.reset(), ...say('gu', `${CASE.people.song.name}却一口咬定这段录像是假的。他为什么这么急？`), shot: to('song', 1.3, {side: .5})},
  ];
  return [
    {cap: '鉴定结论 · 物证 C · 生态池和鱼桶', do: (w) => { w.reset(); w.setMood('dawn'); },
      ...say('gu', '从岸上看，水里的东西比实际位置浅。'),
      shot: [[0, [PX + 560, 70, PZ + 420], [PX + 200, 20, PZ - 60], 32], [2.6, [PX + 450, 130, PZ + 320], [PX + 200, 8, PZ - 60], 32, 'inOutCubic']]},
    {...say('gu', '对准看到的鱼出叉，叉子只会从鱼的上方擦过去。“一叉一个准”，做不到。')},
    {...say('gu', '那这只桶里的 5 条鱼，是从哪儿来的？'), shot: [[0, null], [1.2, [bk.x + 60, 150, bk.z + 120], [bk.x, 16, bk.z], 30, 'outCubic']], drift: .6},
  ];
}

/* everyone at the pond: the two liars answer, then what really happened at 21:40 */
export function finale(W) {
  const {PX, PZ, OX, GX} = W, G0 = [200, 560], D = 300;
  const stand = (w) => {
    w.reset(); w.setMood('gold'); w.bucket.visible = false;
    w.place('gu', G0[0], G0[1], facing(G0[0], G0[1], 200, 190));
    for (const [k, x, z] of [['zhou', 40, 215], ['lin', 200, 180], ['song', 360, 215]]) w.place(k, x, z, facing(x, z, G0[0], G0[1]));
  };
  return [
    {cap: '次日 16:00 · 生态池', do: stand, sfx: 'riser',
      shot: [[0, [760, 60, 820], [200, 150, 300], 32], [2.4, [470, 105, 1150], [150, 330, -200], 40, 'outExpo']], wait: 2.8},
    {...say('gu', '人都到齐了。我们一句一句来。'), shot: to('gu', 1.2, {side: .5, d: D})},
    {...say('gu', `${CASE.people.zhou.name}，真空罩里的闹铃，在罩外是听不见的。`), shot: to('zhou', 1.2, {side: -.3, d: D})},
    {...say('zhou', '……我承认。21:30 以后我回门卫室看球赛了。怕被追究，才说一直守在门口。'), shot: push('zhou', 1.6, {side: -.2, d: D})},
    {cap: '21:30 · 门卫室', do: (w) => { w.place('zhou', GR - 70, -190, facing(GR - 70, -190, GR + 140, -260)); },
      ...say('nar', '门卫室的监控证实，他 21:30 到 22:10 一直在屋里。'),
      shot: [[0, [GR - 420, 210, 380], [GR + 50, 130, -220], 38], [2.8, [GR - 330, 170, 250], [GR + 60, 130, -220], 36, 'inOutCubic']]},
    {cap: null, do: stand, ...say('gu', `${CASE.people.song.name}。录像没有被改过，对准看到的鱼，你一条也叉不中。`), shot: to('song', 1, {side: .4, d: D}), stamp: '矛盾'},
    {...say('song', '……奖杯，是我扔的。'), shot: push('song', 1.8, {side: .3, d: D}), drift: .4},
    /* the reveal */
    {cap: '21:40 · 第七实验楼', do: (w) => { w.reset(); w.setMood('night'); w.bucket.visible = false; w.place('song', OX, -470, Math.PI); },
      ...say('nar', CASE.reveal[1].split('。')[0] + '。'),
      shot: [[0, [OX + 480, 70, 240], [OX, 170, -500], 36], [1.8, [OX + 300, 105, 20], [OX, 165, -500], 36, 'outExpo']]},
    {do: (w) => w.tween(1, (q) => { w.P.song.position.y = q * 150; if (q >= 1) w.P.song.visible = false; }),
      ...say('nar', '21:40，他从没关严的气窗钻进光学实验室，拿走了奖杯。')},
    {do: (w) => {
      const a = [OX, 250, -480], b = [W.sunk.position.x, 12, W.sunk.position.z];
      w.thrown.visible = false;
      w.tween(.6, (q) => { if (q >= 1) w.thrown.visible = true; });
      w.tween(2.2, (q) => {
        const u = Math.max(0, (q - .27) / .73); w.thrown.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * 260, a[2] + (b[2] - a[2]) * u);
        w.thrown.rotation.z = u * 9; if (q >= 1) { w.thrown.visible = false; w.sunk.visible = true; }
      });
    }, at: [[2.2, 'splash']], ...say('nar', '他把奖杯从窗口扔进生态池，打算过几天再捞回来。'),
      shot: [[0, [1120, 380, 440], [430, 130, -330], 40], [3.4, [960, 320, 330], [470, 70, -240], 38, 'inOutCubic']]},
    {do: (w) => { w.bucket.visible = true; }, ...say('nar', '桶里的 5 条鱼，是他傍晚在菜市场买的，用来证明自己一直在池边叉鱼。'),
      shot: [[0, [W.bucket.position.x + 120, 160, W.bucket.position.z + 160], [W.bucket.position.x, 14, W.bucket.position.z], 32], [1.6, [W.bucket.position.x + 70, 100, W.bucket.position.z + 110], [W.bucket.position.x, 14, W.bucket.position.z], 30, 'outCubic']]},
    {cap: null, do: stand, ...say('lin', '谢谢你们。奖杯找回来了，明天的颁奖照常。'), shot: to('lin', 1.3, {side: -.4, d: D})},
    {...say('gu', '证词会说谎，物证不会。干得漂亮，鉴识员。'), shot: to('gu', 1.3, {side: .45, d: D})},
    {cap: '光学实验室', do: (w) => { w.reset(); w.card.visible = true; }, ...say('nar', '只是谁也没注意到，奖杯的底座里夹着一张白色卡片，上面画着半个钟面。'),
      shot: [[0, [O + 300, 240, 300], [O, 134, -120], 30], [3.2, [O + 112, 168, 34], [O + 6, 134, -114], 28, 'inOutCubic']], sfx: 'hit2'},
    {cap: null, clear: true, do: (w) => w.setMood('night'), title: [CASE.code, '结案', '未完待续'], sfx: 'riser',
      shot: [[0, [-700, 260, 700], [-1500, 900, -1750], 40], [3.6, [-1000, 420, 300], [-1500, 1200, -1750], 34, 'inOutCubic']], wait: 3.8, drift: .5},
  ];
}
