const decimalSymbol = '.';
const groupingSymbol = ',';
const minFractionDigits = '00';

function number(num) {
  const [integer, fraction] = num.toString().split('.');
  const formattedInteger = integer.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${groupingSymbol}`);
  let formattedFraction = fraction || minFractionDigits;
  const lengthFraction = formattedFraction.length;
  if (lengthFraction < minFractionDigits) {
    formattedFraction += Array(minFractionDigits - lengthFraction).fill(0).join('');
  }
  return `${formattedInteger}${decimalSymbol}${fraction || '00'}`;
}

export default {
  number,
};