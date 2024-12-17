// Fisher-Yates法によるシャッフル
function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 対戦組み合わせを生成
function generatePairs(data) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("入力データが空です。");
    return [];
  }

  console.debug("入力データ:", data);

  const shuffled = fisherYatesShuffle([...data]); // シャッフル
  const pairs = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    } else {
      // 奇数の場合、不戦勝の扱い
      pairs.push([shuffled[i]]);
    }
  }

  console.debug("生成されたペア:", pairs);
  return pairs;
}
