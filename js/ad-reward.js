// =============================================
// ad-reward.js — Monetag Direct Link + Timer
// =============================================

const AD_REWARD_POINTS = 2;
const AD_REWARD_DAILY_CAP = 10;
const AD_TIMER_SECONDS = 15;
const MONETAG_URL = "https://omg10.com/4/11202276";

function renderAdRewardButton(containerId, uid) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const btn = document.createElement('button');
  btn.id = 'adRewardBtn';
  btn.className = 'btn-secondary btn-sm';
  btn.style.cssText = 'background:linear-gradient(135deg,#f7971e,#ffd200);color:#111;font-weight:700;border:none;cursor:pointer;';
  btn.innerHTML = '🎬 اكسب 2 نقطة';
  btn.onclick = () => startAdReward(uid, btn);

  container.appendChild(btn);
  updateAdBtnState(uid, btn);
}

async function updateAdBtnState(uid, btn) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const snap = await db.collection('adRewards').doc(uid).get();
    const data = snap.exists ? snap.data() : {};
    const todayPoints = (data.date === today) ? (data.points || 0) : 0;

    if (todayPoints >= AD_REWARD_DAILY_CAP) {
      btn.disabled = true;
      btn.innerHTML = '✅ وصلت الحد اليومي';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }
  } catch (e) {
    console.error('خطأ في تحديث الزرار:', e);
  }
}

function startAdReward(uid, btn) {
  // افتح الإعلان في tab جديد
  window.open(MONETAG_URL, '_blank');

  // ابدأ التايمر
  btn.disabled = true;
  let seconds = AD_TIMER_SECONDS;
  btn.innerHTML = `⏳ انتظر ${seconds} ثانية...`;

  const interval = setInterval(() => {
    seconds--;
    if (seconds > 0) {
      btn.innerHTML = `⏳ انتظر ${seconds} ثانية...`;
    } else {
      clearInterval(interval);
      giveAdRewardPoints(uid, btn);
    }
  }, 1000);
}

async function giveAdRewardPoints(uid, btn) {
  const today = new Date().toISOString().slice(0, 10);
  const rewardRef = db.collection('adRewards').doc(uid);
  const userRef = db.collection('users').doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const rewardSnap = await tx.get(rewardRef);
      const userSnap = await tx.get(userRef);

      const rewardData = rewardSnap.exists ? rewardSnap.data() : {};
      const todayPoints = (rewardData.date === today) ? (rewardData.points || 0) : 0;

      if (todayPoints >= AD_REWARD_DAILY_CAP) {
        throw new Error('daily_cap_reached');
      }

      const newTodayPoints = todayPoints + AD_REWARD_POINTS;
      const currentTotal = userSnap.exists ? (userSnap.data().points || 0) : 0;

      tx.set(rewardRef, { date: today, points: newTodayPoints }, { merge: true });
      tx.update(userRef, { points: currentTotal + AD_REWARD_POINTS });
    });

    // نجاح ✅
    btn.innerHTML = '✅ +2 نقطة!';
    btn.style.background = 'linear-gradient(135deg,#39ff14,#00c851)';

    // تحديث العداد في الـ topbar
    const pointsEl = document.getElementById('userPoints');
    if (pointsEl) {
      pointsEl.textContent = parseInt(pointsEl.textContent || '0') + AD_REWARD_POINTS;
    }

    // بعد ثانيتين يرجع زرار عادي
    setTimeout(() => {
      btn.innerHTML = '🎬 اكسب 2 نقطة';
      btn.style.background = 'linear-gradient(135deg,#f7971e,#ffd200)';
      btn.disabled = false;
      btn.style.cursor = 'pointer';
      updateAdBtnState(uid, btn);
    }, 2000);

  } catch (err) {
    if (err.message === 'daily_cap_reached') {
      btn.disabled = true;
      btn.innerHTML = '✅ وصلت الحد اليومي';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      console.error('خطأ في إضافة النقاط:', err);
      btn.disabled = false;
      btn.innerHTML = '🎬 اكسب 2 نقطة';
      btn.style.cursor = 'pointer';
    }
  }
}
