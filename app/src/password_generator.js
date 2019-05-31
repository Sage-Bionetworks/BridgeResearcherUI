const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz".split('');
const NUMERIC = "0123456789".split('');
const SYMBOLIC = "!#$%&'()*+,-./:;<=>?@[]^_`{|}~".split('');
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('');

function generatePassword(len) {
  let buffer = [];
  for (let i = 0; i < len; ++i) {
    buffer[i] = ALPHANUMERIC[ ~~(Math.random()*ALPHANUMERIC.length) ];
  }
  let set = getUniqueIntegers(len, 6);
  let indices = [...set];
  replace(buffer, UPPERCASE, indices[0]);
  replace(buffer, LOWERCASE, indices[1]);
  replace(buffer, NUMERIC, indices[2]);
  replace(buffer, NUMERIC, indices[3]);
  replace(buffer, SYMBOLIC, indices[4]);
  replace(buffer, SYMBOLIC, indices[5]);
  return buffer.join('');
}

function getUniqueIntegers(max, count) {
  let numbers = new Set();
  while(numbers.size < count) {
    numbers.add( ~~(Math.random()*max) );
  }
  return numbers;
}

function replace(buffer, array, pos) {
  buffer[pos] = array[~~(Math.random()*array.length)];
}

function isPasswordValid(policy, password) {
  if (password.length === 0 || /^\s+$/.test(password)) {
    return false;
  }
  if (policy.minLength > 0 && password.length < policy.minLength) {
    return false;
  }
  if (policy.numericRequired && !/.*\d+.*/.test(password)) {
    return false;
  }
  if (policy.symbolRequired && !/.*[!"#$%&'()*+,./:;<=>?@\^_`{|}~\-]+.*/.test(password)) {
    return false;
  }
  if (policy.lowerCaseRequired && !/.*[a-z]+.*/.test(password)) {
    return false;
  }
  if (policy.upperCaseRequired && !/.*[A-Z]+.*/.test(password)) {
    return false;
  }
  return true;
}

export default { generatePassword, isPasswordValid };