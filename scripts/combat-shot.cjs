const { chromium } = require('playwright');
const [,, url, out] = process.argv;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(url + '?debug'); await p.click('[data-testid=btn-play]');
  await p.fill('[data-testid=name-input]', 'Aldric'); await p.click('[data-testid=btn-create]'); await p.click('[data-testid=btn-tutorial-ok]');
  await p.evaluate(() => { const s = window.__DREADBOUND__.getState(); s.profile.character.level = 5; s.profile.tutorialSeen.dungeon = true;
    const set = (sl, id) => (s.profile.equipment[sl] = { uid: 'x' + id, itemId: id, qty: 1 }); set('mainHand', 'knight_sword'); set('offHand', 'bastion_shield');
    s.profile.backpack[0] = { uid: 'pp', itemId: 'health_potion', qty: 2 }; });
  await p.click('[data-testid=tab-hero]'); await p.click('[data-testid=tab-expedition]'); await p.click('[data-testid=btn-enter-dungeon]'); await p.waitForTimeout(1200);
  await p.evaluate(() => window.__DREADBOUND__.actions.startCombat('pve', 'e_bat_x', 'bat'));
  for (let k = 0; k < 40 && !(await p.$('[data-testid=act-attack]')); k++) await p.waitForTimeout(150);
  await p.waitForTimeout(400);
  await p.screenshot({ path: out + '-1.png' });
  
  const t = await p.$('[data-testid=skill-rending_slash]'); if (t) { await t.hover(); await p.waitForTimeout(300); await p.screenshot({ path: out + '-2.png' }); }
  await b.close();
})();
