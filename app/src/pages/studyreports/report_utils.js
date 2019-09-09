import fn from "../../functions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK = 7 * 1000 * 60 * 60 * 24;

export function dataSet(label, array, color) {
  return {
    label: label,
    data: array,
    fill: false,
    lineWidth: 1,
    backgroundColor: color
  };
}
export function formatDate(date) {
  let parts = date.split("-");
  return MONTHS[parseInt(parts[1]) - 1] + " " + parseInt(parts[2]);
}
export function getDateRange(range) {
  let millis = new Date().getTime();
  let rangeOffset = WEEK * parseInt(range);
  return {
    startDate: fn.formatDate(new Date(millis - rangeOffset), "iso"),
    endDate: fn.formatDate(null, "iso")
  };
}

export function makeChart(categories, labels, colors, maxCat, path) {
  // The actual path differs between reports, fix it
  const func = new Function("obj", "return obj" + path + ";");

  return function(response) {
    let labelArray = [];
    let cats = {};
    categories.map(c => cats[c] = []);
  
    response.items.forEach(function(item) {
      labelArray.push(formatDate(item.date));
      categories.forEach(c => cats[c].push(func(item.data)[c] || 0));
    });
    let max = Math.max.apply(null, cats[maxCat]);
    let stepSize = Math.pow(10, Math.floor(Math.log10(max)));
  
    let datasets = [];
    categories.forEach((c, i) => {
      if (Math.max.apply(null, cats[c]) > 0) {
        datasets.push(dataSet(labels[i], cats[c], colors[i]));
      }
    });
    return {labels, datasets, stepSize, labels: labelArray, max};
  }
}