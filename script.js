 
let clubData, clubMetrics, noCompressionData, smashFactors;

async function loadData() {
  const res = await fetch('./data/golfdata.json');
  const json = await res.json();

  clubData = json.clubData;
  clubMetrics = json.clubMetrics;
  noCompressionData = json.noCompressionData;
  smashFactors = json.smashFactors;

  populateClubSelector(); // ✅ Call this AFTER data is loaded
}
 
function populateClubSelector() {
  const clubSelect = document.getElementById("club");
  const loftInput = document.getElementById("staticLoft");

  // Populate dropdown
  clubSelect.innerHTML = Object.entries(clubData)
    .map(([key, value]) => `<option value="${key}">${value.name} (${value.loft}°)</option>`)
    .join("");

  // Set initial loft based on first club
  const firstKey = Object.keys(clubData)[0];
  if (firstKey) {
    loftInput.value = clubData[firstKey].loft;
  }

  // Update loft when club changes
  clubSelect.addEventListener("change", () => {
    const selectedKey = clubSelect.value;
    const selectedClub = clubData[selectedKey];
    if (selectedClub && selectedClub.loft) {
      loftInput.value = selectedClub.loft;
    }
  });
}

function getScratchCarry(club, swingSpeed) {
  const carryMap = clubData[club]?.carry;
  if (!carryMap) return null;

  const speeds = Object.keys(carryMap).map(Number).sort((a, b) => a - b);
  if (carryMap[swingSpeed]) return carryMap[swingSpeed];

  for (let i = 0; i < speeds.length - 1; i++) {
    const lower = speeds[i];
    const upper = speeds[i + 1];
    if (swingSpeed > lower && swingSpeed < upper) {
      const lowerCarry = carryMap[lower];
      const upperCarry = carryMap[upper];
      const interpolated = lowerCarry + ((upperCarry - lowerCarry) * (swingSpeed - lower) / (upper - lower));
      return Math.round(interpolated);
    }
  }

  return null;
}

function calculate() {
  const club = document.getElementById("club").value;
  
  document.getElementById("club").addEventListener("change", function () {
	const selectedClubKey = this.value;
	const loftInput = document.getElementById("staticLoft");
	const clubInfo = clubData[selectedClubKey];

	if (clubInfo && clubInfo.loft) {
		loftInput.value = clubInfo.loft;
	} else {
    loftInput.value = ""; // fallback if no loft found
	}
  });
  
  let swingSpeed = parseFloat(document.getElementById("swingSpeed").value);
  swingSpeed = Math.max(60, Math.min(130, swingSpeed));
  document.getElementById("swingSpeed").value = swingSpeed;

  const actualCarry = parseFloat(document.getElementById("actualCarry").value);
  if ([swingSpeed, actualCarry].some(isNaN)) {
    document.getElementById("results").innerHTML = `<span style="color:red;">Please enter valid numbers in all fields.</span>`;
    return;
  }

  const metrics = clubMetrics[club];
  const clubInfo = clubData[club];
  const staticLoft = parseFloat(document.getElementById("staticLoft").value);
  const standardLoft = clubInfo?.loft;
  const loftDelta = standardLoft - staticLoft;
  const loftMultiplier = 0.01;

  const adjustedScratchSpeed = clubInfo?.swingSpeed * (1 + loftDelta * loftMultiplier);
  const adjustedUserSpeed = swingSpeed * (1 + loftDelta * loftMultiplier);

  const scratchCarry = getScratchCarry(club, adjustedUserSpeed);
  const scratchMaxCarry = getScratchCarry(club, adjustedScratchSpeed);

  const baselineCarry = noCompressionData[club].carry;
  const scratchDynamicLoft = metrics.dynamicLoft;
  const scratchShaftLean = staticLoft - scratchDynamicLoft;

  const carryRange = scratchCarry - baselineCarry;
  const carryAboveBaseline = Math.max(0, actualCarry - baselineCarry);
  const performanceRatio = carryRange !== 0 ? carryAboveBaseline / carryRange : 0;

  let estimatedDynamicLoft = staticLoft - (scratchShaftLean * performanceRatio);
  const loftWarning = document.getElementById("loftWarning");
  if (estimatedDynamicLoft > staticLoft + 5) {
    estimatedDynamicLoft = staticLoft + 5;
    loftWarning.innerHTML = "⚠️ Dynamic loft capped at +5° above static due to low carry distance.<br/>That one likely came down with snow on it! ☃️";
  } else {
    loftWarning.innerHTML = "";
  }

  const efficiency = performanceRatio * 100;
  let advice = "", adviceColor = "", driverFlag = 0;

  if (club === "driver") {
    if (efficiency >= 80) {
      advice = "💥 Optimal launch conditions! You're hitting slightly up on the ball for great carry.";
      adviceColor = "green";
    } else if (efficiency >= 50) {
      advice = "🟡 Decent strike, but you're likely just outside of optimal launch angle of around 11–14°.";
      adviceColor = "orange";
      driverFlag = 1;
    } else {
      advice = "🔴 You could be hitting down or only just up on the ball. This reduces launch and carry.<br/>You could also be launching the ball too high, creating excessive spin and losing distance.";
      adviceColor = "red";
      driverFlag = 1;
    }
  } else {
    if (efficiency >= 130) {
      advice = "You either made a typo or you're ready to turn Pro! 🚀";
      adviceColor = "blue";
    } else if (efficiency >= 85) {
      advice = "Tour-level compression. 💪 Great ball striking! 🏌️";
      adviceColor = "green";
    } else if (efficiency >= 60) {
      advice = "Solid strike! ✅ You're compressing the ball well.";
      adviceColor = "darkorange";
    } else if (efficiency >= 20) {
      advice = "🤘 Decent contact, but room to improve compression. <br/>Hold that wrist angle through impact.👌";
      adviceColor = "orange";
    } else if (efficiency >= 5) {
      advice = "Likely casting 🎣 or flipping — try to lead with the hands.";
      adviceColor = "black";
    } else if (efficiency >= -25) {
      advice = "Poor strike. Focus on striking the ball cleanly. 🧐";
      adviceColor = "red";
    } else {
      advice = "Complete mishit. ❌ Try again.";
      adviceColor = "gray";
    }
  }

  document.getElementById("adviceBox").innerHTML = `<strong>Strike Efficiency:</strong> ${efficiency.toFixed(0)}%<br/>${advice}`;
  document.getElementById("adviceBox").style.color = adviceColor;

  const estimatedLaunchAngle = 0.85 * estimatedDynamicLoft;
  const scratchSpin = metrics.spinRate;
  const noCompressionSpin = noCompressionData[club].spin;
  const estimatedSpin = Math.round(scratchSpin + ((noCompressionSpin - scratchSpin) * (1 - performanceRatio)));
  const smashHigh = smashFactors[club].high;
  const smashLow = smashFactors[club].low;
  const estimatedSmashFactor = smashLow + (smashHigh - smashLow) * performanceRatio;
  const ballSpeed = swingSpeed * estimatedSmashFactor;

  let resultsHTML = `
    <strong>Estimated Ball Speed:</strong> ${ballSpeed.toFixed(1)} mph<br/>
    <strong>Estimated Smash Factor:</strong> ${estimatedSmashFactor.toFixed(2)}, 
    <strong>Scratch Smash Factor:</strong> ${smashHigh.toFixed(2)}<br/>
  `;

  if (!driverFlag) {
    resultsHTML += `
      <strong>Estimated Launch Angle:</strong> ${estimatedLaunchAngle.toFixed(1)}°, 
      <strong>Scratch Launch Angle:</strong> ${metrics.launchAngle.toFixed(1)}°<br/>
      <strong>Estimated Spin Rate:</strong> ${estimatedSpin.toLocaleString()} rpm, 
      <strong>Scratch Spin Rate:</strong> ${scratchSpin.toLocaleString()} rpm<br/>
    `;
  } else {
    resultsHTML += `
      <strong>Estimated Launch Angle:</strong> N/A, 
      <strong>Scratch Launch Angle:</strong> ${metrics.launchAngle.toFixed(1)}°<br/>
      <strong>Estimated Spin Rate:</strong> N/A, 
      <strong>Scratch Spin Rate:</strong> ${scratchSpin.toLocaleString()} rpm<br/>
    `;
  }

  resultsHTML += `
    <strong>Your Measured Carry:</strong> ${actualCarry} yards<br/>
    <strong>Scratch Carry @ Your Swing Speed:</strong> ${scratchCarry ?? "N/A"} yards @ ${swingSpeed} mph<br/>
    <strong>Scratch Carry @ Full Swing Speed:</strong> ${scratchMaxCarry ?? "N/A"} yards @ ${scratchSpeed} mph<br/>
    <strong>Performance vs. Scratch @ Your Swing Speed:</strong> ${(actualCarry - scratchCarry).toFixed(1)} yards<br/>
    <strong>Performance vs. Scratch @ Full Swing Speed:</strong> ${(actualCarry - scratchMaxCarry).toFixed(1)} yards<br/>
    <strong>Club Static Loft:</strong> ${staticLoft.toFixed(1)}°<br/>
  `;
	
  resultsHTML += driverFlag
    ? `<strong>Estimated Dynamic Loft:</strong> N/A, <strong>Scratch Dynamic Loft:</strong> ${scratchDynamicLoft.toFixed(1)}°<br/>`
    : `<strong>Estimated Dynamic Loft:</strong> ${estimatedDynamicLoft.toFixed(1)}°, <strong>Scratch Dynamic Loft:</strong> ${scratchDynamicLoft.toFixed(1)}°<br/>`;

  document.getElementById("results").innerHTML = resultsHTML;
  drawTrajectory(actualCarry, scratchCarry, scratchMaxCarry);
}

function drawLegend(ctx) {
  const legendItems = [
    { color: "red", label: "Measured Carry" },
    { color: "green", label: "Scratch @ Your Speed" },
    { color: "blue", label: "Scratch @ Full Speed" }
  ];

  ctx.font = "14px Arial";
  legendItems.forEach((item, index) => {
    const y = 20 + index * 20;
    ctx.fillStyle = item.color;
    ctx.fillRect(20, y, 12, 12);
    ctx.fillStyle = "#000";
    ctx.fillText(item.label, 40, y + 10);
  });
}

function drawTrajectory(actualCarry, scratchCarry, scratchMaxCarry) {
  const canvas = document.getElementById("trajectoryCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxCarry = Math.max(actualCarry, scratchCarry ?? 0, scratchMaxCarry ?? 0);
  const maxYards = Math.ceil(maxCarry * 1.1); // Add 10% buffer
  const scaleX = canvas.width / maxYards;
  const scaleY = canvas.height / 100;

  // Ground line
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Yard markers
  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  for (let i = 0; i <= maxYards; i += 25) {
    const x = i * scaleX;
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x, canvas.height - 5);
    ctx.stroke();
    ctx.fillText(`${i} yd`, x - 10, canvas.height - 10);
  }

  drawLegend(ctx); // ✅ Call legend after markers

  function plotArc(carryYards, color) {
    if (!carryYards) return;
    const peakHeight = 60 - (carryYards / 8); // tweak constants to suit your canvas

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (let x = 0; x <= carryYards; x += 1) {
      const y = -4 * peakHeight / (carryYards ** 2) * (x - carryYards / 2) ** 2 + peakHeight;
      const px = x * scaleX;
      const py = canvas.height - y * scaleY;

      if (x === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.stroke();

    // Landing point
    ctx.beginPath();
    ctx.arc(carryYards * scaleX, canvas.height, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  plotArc(actualCarry, "red");
  if (scratchCarry) plotArc(scratchCarry, "green");
  if (scratchMaxCarry) plotArc(scratchMaxCarry, "blue");
}
loadData()