document.getElementById('addLegBtn').addEventListener('click', addLeg);
document.getElementById('calculateBtn').addEventListener('click', calculate);

function addLeg() {
  const row = document.createElement('tr');

  // first two as text inputs
  for (let i = 0; i < 2; i++) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    cell.appendChild(input);
    row.appendChild(cell);
  }

  // next eight as number inputs
  for (let i = 0; i < 8; i++) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    cell.appendChild(input);
    row.appendChild(cell);
  }

  document.querySelector('#legsTable tbody').appendChild(row);
}


function calculate() {
  const rows = document.querySelectorAll('#legsTable tbody tr');
  const resultsBody = document.querySelector('#resultsTable tbody');
  resultsBody.innerHTML = '';
  let totalTripFuel = 0;

  const fuelPerHour = parseFloat(document.getElementById('fuelPerHour').value) || 0;
  const altDist = parseFloat(document.getElementById('alternateDistance').value) || 0;
  const additional = parseFloat(document.getElementById('additionalFuel').value) || 0;
  const extra = parseFloat(document.getElementById('extraFuel').value) || 0;
  const taxi = parseFloat(document.getElementById('taxiFuel').value) || 0;

  rows.forEach(row => {
    const cells = row.querySelectorAll('input');
    let startingPoint = String(cells[0].value) || "N/A";
    let endingPoint = String(cells[1].value) || "N/A";
    const alt = parseFloat(cells[2].value) || 0;
    const windDirection = parseFloat(cells[3].value) || 0;
    const windSpeed = parseFloat(cells[4].value) || 0;
    const temp = parseFloat(cells[5].value) || 0;
    const ias = parseFloat(cells[6].value) || 0;
    const tc = parseFloat(cells[7].value) || 0;
    const variation = parseFloat(cells[8].value) || 0;
    const dist = parseFloat(cells[9].value) || 0;

    // Calculations
    const tempDev = temp - (15 - ((alt/1000)*2));
    const tas = ias + (alt /1000 * (ias * 0.02));
    const mc = tc + variation;
    const windAngle = ( (windDirection - mc + 360) % 360 );

    // 2) Classify component
    let windComponent;
    if (windAngle <= 45 || windAngle >= 315) {
      windComponent = 'headwind';
    } else if (windAngle >= 135 && windAngle <= 225) {
      windComponent = 'tailwind';
    } else if (windAngle > 45 && windAngle < 135) {
      windComponent = 'crosswind right';
    } else {
      windComponent = 'crosswind left';
    } 
    let wca = 0;
    if (tas !== 0) {
      wca = Math.asin((windSpeed * Math.sin(windAngle * Math.PI / 180)) / tas) * 180 / Math.PI;
    }
    const mh = mc + variation + wca;
    const gs = tas - (windSpeed * Math.cos(windAngle * Math.PI / 180));
    const ete = dist / gs * 60;
    const fuel = ete / 60 * fuelPerHour;

    totalTripFuel += fuel;

    const resultRow = document.createElement('tr');
    [startingPoint, endingPoint,tempDev, tas, mc, wca, mh, gs, ete, fuel].forEach(val => {
      const cell = document.createElement('td');
      if (typeof val === 'number') {
        cell.textContent = val.toFixed(1);
      }
      else if (typeof val === 'string' && val.trim() !== '') {
        cell.textContent = val;
      }
      else {
        cell.textContent = 'N/A';
      }
      resultRow.appendChild(cell);
    });
    resultsBody.appendChild(resultRow);
  });

  // Fuel summary
  const contingency1 = totalTripFuel * 0.2;
  const contingency2 = (20/60) * fuelPerHour;
  const contingency = Math.max(contingency1, contingency2);
  const alternateFuel = (altDist / 90) * fuelPerHour; // assuming 90kt avg GS
  const finalReserve = 0.75 * fuelPerHour; // 30 min reserve
  const totalReserve = contingency + alternateFuel + finalReserve + additional;
  const totalTOFuel = totalTripFuel + totalReserve;
  const rampFuel = totalTOFuel + extra + taxi;
  const expectedLanding = totalTOFuel - totalTripFuel;

  document.getElementById('fuelSummary').innerHTML = `
    <p><strong>Trip Fuel:</strong> ${totalTripFuel.toFixed(2)} USG</p>
    <p><strong>Contingency (greater value of 5% or 5 min):</strong> ${contingency.toFixed(2)} USG</p>
    <p><strong>Alternate Fuel:</strong> ${alternateFuel.toFixed(2)} USG</p>
    <p><strong>Final Reserve (45 min):</strong> ${finalReserve.toFixed(2)} USG</p>
    <p><strong>Additional Fuel:</strong> ${additional.toFixed(2)} USG</p>
    <p><strong>Total Reserve:</strong> ${totalReserve.toFixed(2)} USG</p>
    <p><strong>Total T/O Fuel:</strong> ${totalTOFuel.toFixed(2)} USG</p>
    <p><strong>Extra Fuel:</strong> ${extra.toFixed(2)} USG</p>
    <p><strong>Taxi Fuel:</strong> ${taxi.toFixed(2)} USG</p>
    <p><strong>Ramp Fuel:</strong> ${rampFuel.toFixed(2)} USG</p>
    <p><strong>Expected Landing Fuel:</strong> ${expectedLanding.toFixed(2)} USG</p>
  `;
}
