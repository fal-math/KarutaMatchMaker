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
  // 欠席者 (欠席 = TRUE) を除外
  const presentMembers = data.filter(member => member['欠席'] !== 'TRUE');

  console.debug("出席者のみ:", presentMembers);

  // Fisher-Yates法でシャッフル
  const shuffled = fisherYatesShuffle([...presentMembers]);
  const pairs = [];

  // 2人ずつペアを作成
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    } else {
      // 奇数の場合、不戦勝
      pairs.push([shuffled[i]]);
    }
  }

  console.debug("生成されたペア:", pairs);
  return pairs;
}
