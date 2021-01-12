/*
 * AC Power Analysis using Chart.js
 *
 * Designed by ZulNs @Gorontalo, 17 December 2020
 */

const animAcpInterval = 500;

let ctxAcp = document.getElementById('chart_acp').getContext('2d');
let elmVacp = document.getElementById('voltage_acp');
let elmI = document.getElementById('current');
let elmPf = document.getElementById('cos_phi');
let elmPa = document.getElementById('apparent_power');
let elmPr = document.getElementById('real_power');
let elmPd = document.getElementById('phase_diff');
let elmSdAcp = document.getElementById('show_dots_acp');
let elmAnimAcp = document.getElementById('animate_acp');
let elmTableAcp = document.getElementById('details_table_acp');
let elmExpAcp = document.getElementById('explanation_acp');

let voltageAcp = 2;
let current = 1;
let cosPhi = 1;
let powApp;
let powReal;
let phaseDiff;
let vsq = [];
let isq = [];
let sumPow, sumVsq, sumIsq;
let vrms, irms;
let vmax, vmin, imax, imin, pmax, pmin;

let animAcpTimer;

elmVacp.value = voltageAcp.toString();
elmI.value = current.toString();
elmPf.value = cosPhi.toString();

addEvent(elmVacp, 'change', onInputChangeAcp);
addEvent(elmI, 'change', onInputChangeAcp);
addEvent(elmPf, 'change', onInputChangeAcp);
addEvent(elmSdAcp, 'click', onShowDotsAcp);
addEvent(elmAnimAcp, 'click', onAnimateAcp);

Chart.pluginService.register({
  beforeInit: chart => {
    for (i=0; i<=360; i+=15) {
      chart.config.data.labels.push(i%360);
    }
  }
});

let chartAcp = new Chart(ctxAcp, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Voltage',
      data: [],
      borderColor: 'rgb(255, 63, 95)',
      fill: false
    },
    {
      label: 'Current',
      data: [],
      borderColor: 'rgb(63, 95, 255)',
      fill: false
    },
    {
      label: 'Power',
      data: [],
      borderColor: 'rgb(95, 255, 63)',
      fill: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 0
      }
    }
  }
});

updateChartAcp();

function updateChartAcp() {
  let xd = chartAcp.data.labels;
  let yd = chartAcp.data.datasets;
  let y0, y1, y2;
  yd.forEach((val) => {
    val.data = [];
  });
  vsq = [];
  isq = [];
  sumPow = sumVsq = sumIsq = 0;
  vmax = vmin = imax = imin = pmax = pmin = 0;
  xd.forEach((val, idx) => {
    y0 = Math.sin(val*Math.PI/180) * voltageAcp * Math.sqrt(2);
    y1 = Math.sin(val*Math.PI/180 - Math.acos(cosPhi)) * current * Math.sqrt(2);
    y2 = y0 * y1;
    yd[0].data.push(y0);
    yd[1].data.push(y1);
    yd[2].data.push(y2);
    vsq.push(y0*y0);
    isq.push(y1*y1);
    if (idx < xd.length-1) {  //last index is belongs to next wave cycle
      sumPow += yd[2].data[idx];
      sumVsq += vsq[idx];
      sumIsq += isq[idx];
      vmax = Math.max(vmax, yd[0].data[idx]);
      vmin = Math.min(vmin, yd[0].data[idx]);
      imax = Math.max(imax, yd[1].data[idx]);
      imin = Math.min(imin, yd[1].data[idx]);
      pmax = Math.max(pmax, yd[2].data[idx]);
      pmin = Math.min(pmin, yd[2].data[idx]);
    }
  });
  chartAcp.update();
  
  powApp = voltageAcp * current;
  powReal = sumPow / (xd.length-1);
  phaseDiff = Math.acos(cosPhi) * 180 / Math.PI;
  vrms = Math.sqrt(sumVsq/(xd.length-1));
  irms = Math.sqrt(sumIsq/(xd.length-1));
  
  elmPa.innerHTML = powApp.toFixed(2).toString();
  elmPr.innerHTML = powReal.toFixed(2).toString();
  elmPd.innerHTML = phaseDiff.toFixed(2).toString();
  
  for (let i=0; i<=xd.length; ++i) {
    removeRowAcp(0);
  }
  xd.forEach((val, idx) => {
    appendRowAcp(idx);
  });
  appendSumRowAcp();
}

function appendRowAcp(idx) {
  let xd = chartAcp.data.labels;
  let yd = chartAcp.data.datasets;
  let elm = elmTableAcp.children[0];
  let elmTr = createElement('tr');
  let col = [];
  let str;
  elm.appendChild(elmTr);
  
  col.push(xd[idx]);
  col.push(yd[0].data[idx]);
  col.push(yd[1].data[idx]);
  col.push(yd[2].data[idx]);
  col.push(vsq[idx]);
  col.push(isq[idx]);
  col.forEach((val, idx) => {
    str = idx > 0 ? val.toFixed(2).toString() : val.toString();
    if ((idx==1 && (val==vmax || val==vmin)) ||
        (idx==2 && (val==imax || val==imin)) ||
        (idx==3 && (val==pmax || val==pmin))) {
      str = '<b>' + str + '</b>'
    }
    elmTr.appendChild(createElement('td', 'w3-right-align', str));
  });
}

function removeRowAcp(idx) {
  let elm = elmTableAcp.children[0];
  ++idx;
  if (elm.children.length > idx) {
    elm.removeChild(elm.children[idx]);
  }
}

function appendSumRowAcp() {
  let xd = chartAcp.data.labels;
  let elm = elmTableAcp.children[0];
  let elmTr = createElement('tr');
  let elmTd = createElement('td', null, '<b>Sum</b>');
  let expStr = 'V<sub>rms</sub>&nbsp;= &radic;(';
  elmTd.colSpan = '3';
  elm.appendChild(elmTr);
  elmTr.appendChild(elmTd);
  elmTr.appendChild(createElement('td', 'w3-right-align', '<b>'+sumPow.toFixed(2).toString()+'</b>'));
  elmTr.appendChild(createElement('td', 'w3-right-align', '<b>'+sumVsq.toFixed(2).toString()+'</b>'));
  elmTr.appendChild(createElement('td', 'w3-right-align', '<b>'+sumIsq.toFixed(2).toString()+'</b>'));
  expStr += sumVsq.toFixed(2).toString() + '/' + (xd.length-1).toString() + ') = ' + vrms.toFixed(2).toString() + '&nbsp;Volts<br/><br/>';
  expStr += 'I<sub>rms</sub>&nbsp;= &radic;(';
  expStr += sumIsq.toFixed(2).toString() + '/' + (xd.length-1).toString() + ') = ' + irms.toFixed(2).toString() + '&nbsp;Amperes<br/><br/>';
  expStr += 'P<sub>real</sub>&nbsp;= ';
  expStr += sumPow.toFixed(2).toString() + '/' + (xd.length-1).toString() + ' = ' + powReal.toFixed(2).toString() + '&nbsp;Watts<br/><br/>';
  elmExpAcp.innerHTML = expStr;
}

function onInputChangeAcp() {
  let tmpV = parseFloat(elmVacp.value),
      tmpI = parseFloat(elmI.value),
      tmpPf = parseFloat(elmPf.value);
  if (isNaN(tmpV)) {
    elmVacp.value = voltageAcp.toString();
    return;
  }
  else if(isNaN(tmpI)) {
    elmI.value = current.toString();
    return;
  }
  else if(isNaN(tmpPf)) {
    elmPf.value = cosPhi.toString();
    return;
  }
  voltageAcp = tmpV;
  current = tmpI;
  cosPhi = tmpPf;
  if (cosPhi > 1) {
    cosPhi = 1;
  }
  else if (cosPhi < -1) {
    cosPhi = -1;
  }
  elmVacp.value = voltageAcp.toString();
  elmI.value = current.toString();
  elmPf.value = cosPhi.toString();
  updateChartAcp();
}

function onShowDotsAcp() {
  chartAcp.options.elements.point.radius = elmSdAcp.checked ? 5 : 0;
  chartAcp.update();
}

function onAnimateAcp() {
  if (elmAnimAcp.checked) {
    chartAcp.options.animation.duration = 0;
    animAcpTimer = setInterval(animateChartAcp, animAcpInterval);
  }
  else {
    clearInterval(animAcpTimer);
    chartAcp.options.animation.duration = 1000;
  }
}

function animateChartAcp() {
  let xd = chartAcp.data.labels;
  let yd = chartAcp.data.datasets;
  let elmTable = elmTableAcp.children[0];
  let elmLastRow = elmTable.removeChild(elmTable.lastChild);
  elmTable.removeChild(elmTable.children[1]);
  let elmFirstRow = elmTable.children[1].cloneNode(true);
  elmTable.appendChild(elmFirstRow);
  elmTable.appendChild(elmLastRow);
  
  arrayShift(xd);
  arrayShift(yd[0].data);
  arrayShift(yd[1].data);
  arrayShift(yd[2].data);
  arrayShift(vsq);
  arrayShift(isq);
  
  chartAcp.update();
}

function arrayShift(arr) {
  arr.shift();
  arr.push(arr[0]);
}

function addEvent(elm, evt, cb){
  if (window.addEventListener) {
    elm.addEventListener(evt, cb);
  }
  else if(elm.attachEvent) {
    elm.attachEvent('on' + evt, cb);
  }
  else elm['on' + evt] = cb;
}

function createElement(tagName, className, innerHTML) {
  let elm = document.createElement(tagName);
  if (className) {
    elm.className = className;
  }
  if(innerHTML) {
    elm.innerHTML=innerHTML;
  }
  return elm;
}
