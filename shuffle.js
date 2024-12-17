// 対戦組み合わせを生成
function generatePairs(data) {
  console.debug(data);

  
  const shuffled = data.sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    } else {
      pairs.push([shuffled[i]]);
    }
  }
  return pairs;
}