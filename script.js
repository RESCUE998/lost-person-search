// 走失人员距离估算模型（H5版）
const estimator = {
  getAgeGroup(age) {
    if (age < 6) return '0-5';
    if (age < 13) return '6-12';
    if (age < 18) return '13-17';
    if (age < 60) return '18-59';
    return '60+';
  },

  walkSpeedTable: {
    '0-5': { M: [1.5, 2.5], F: [1.5, 2.5] },
    '6-12': { M: [3.0, 4.0], F: [3.0, 4.0] },
    '13-17': { M: [4.0, 5.0], F: [4.0, 5.0] },
    '18-59': { M: [4.5, 5.5], F: [4.0, 5.0] },
    '60+': { M: [2.5, 3.5], F: [2.5, 3.5] }
  },

  busSpeedTable: {
    '0-5': { M: [0.5, 1.0], F: [0.5, 1.0] },
    '6-12': { M: [10, 15], F: [10, 15] },
    '13-17': { M: [15, 20], F: [15, 20] },
    '18-59': { M: [18, 25], F: [18, 25] },
    '60+': { M: [12, 18], F: [12, 18] }
  },

  effectiveTimeRatio: {
    '0-5': 0.4,
    '6-12': 0.6,
    '13-17': 0.7,
    '18-59': 0.8,
    '60+': 0.5
  },

  estimate(age, gender, duration) {
    const group = this.getAgeGroup(age);
    const vWalkMax = this.walkSpeedTable[group][gender][1];
    const vBusMax = this.busSpeedTable[group][gender][1];
    const pWalk = this.effectiveTimeRatio[group];

    // 默认良好环境（无修正）
    const kWeather = 1.0;
    const kTerrain = 1.0;
    const kHealth = 1.0;
    const kMental = 1.0;

    const vWalkAdj = vWalkMax * kWeather * kTerrain * kHealth;
    const pWalkAdj = pWalk * kMental;
    const dWalk = vWalkAdj * pWalkAdj * duration;

    const vBusAdj = vBusMax * kWeather * kTerrain * kHealth;
    const dBus = vBusAdj * duration;

    let radius = Math.max(dWalk, dBus);
    if (age < 6 || age > 70) radius = Math.min(radius, 6);
    else if (age < 13) radius = Math.min(radius, 10);

    return {
      walk: parseFloat(dWalk.toFixed(2)),
      bus: parseFloat(dBus.toFixed(2)),
      radius: parseFloat(radius.toFixed(2))
    };
  },

  drawMap(canvas, radius) {
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = (size * 0.4) / Math.max(radius, 1); // 至少显示1km

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 画搜索圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(211, 47, 47, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 画中心点
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#d32f2f';
    ctx.fill();

    // 标注半径
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${radius} km`, centerX, centerY + radius * scale + 20);
  }
};

document.getElementById('form').addEventListener('submit', function(e) {
  e.preventDefault();

  const age = parseInt(document.getElementById('age').value);
  const gender = document.getElementById('gender').value;
  const duration = parseFloat(document.getElementById('duration').value);

  if (isNaN(age) || age < 0 || isNaN(duration) || duration <= 0) {
    alert('请输入有效的年龄和时长！');
    return;
  }

  const result = estimator.estimate(age, gender, duration);

  // 显示结果
  document.getElementById('walkDist').textContent = result.walk;
  document.getElementById('busDist').textContent = result.bus;
  document.getElementById('radius').textContent = result.radius;
  document.getElementById('result').classList.remove('hidden');

  // 绘图
  const canvas = document.getElementById('mapCanvas');
  estimator.drawMap(canvas, result.radius);
});