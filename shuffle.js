// Fisher-Yates法によるシャッフル
function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 対戦組み合わせを生成する関数
function generatePairs(data) {
  // 欠席者を除外
  const presentMembers = data.filter(member => member['欠席'] !== 'TRUE');
  const shuffled = fisherYatesShuffle([...presentMembers]);
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    } else {
      pairs.push([shuffled[i]]); // 奇数の場合、最後の1人が余る
    }
  }
  return pairs;
}


function previousPowerOfTwo(n) {
  if (n < 1) return 0; // 1未満の場合は0を返す

  let power = 1;

  // nを超えない最大の2の冪乗を探す
  while (power <= n) {
    power <<= 1; // 左シフトして2倍にする
  }

  return power >> 1; // 最後に2で割る (1つ前の2の冪乗)
}



// 競技規程に則ったペア生成関数
function generatePairs2(data) {
  // 欠席者を除外
  const presentMembers = data.filter(member => member['欠席'] !== 'TRUE');

  const numberOfWinners = previousPowerOfTwo(presentMembers);
  const numberOfMatches = presentMembers - numberOfWinners;

  // シャッフル後の競技カード
  const shuffled = fisherYatesShuffle([...presentMembers]);
  // const pairs = Array(numberOfMatches);
  const pairs = [];
  const nextCandidates = []; // 次に回される競技者リスト

  console.debug("シャッフル後の競技カード:", shuffled);

  while (shuffled.length > 0) {
    const player1 = shuffled.shift(); // 先頭の競技者を取り出す
    let player2 = shuffled.shift(); // 次の競技者を仮に取り出す
    if (!player2) { pairs.push([player1]); } // 不戦勝

    while (player2 && player1["所属"] === player2["所属"]) {
      // 同一所属会の場合、player2を次候補に回す
      if (pairs.length + nextCandidates.length <= numberOfMatches) {
        nextCandidates.push(player2);
        player2 = shuffled.shift(); // さらに次の競技者を取り出す
      } else {

      }
    }

    // ペアを追加 (player2がいなければ不戦勝)
    if (player2) {
      pairs.push([player1, player2]);
    } else {
      pairs.push([player1]);
    }
  }

  // 同一所属会が最後に残った場合の処理
  while (nextCandidates.length > 0) {
    const player = nextCandidates.shift();
    let found = false;

    // ペアを入れ替えられる場所を探す
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i][1] && pairs[i][0]["所属"] !== player["所属"] && pairs[i][1]["所属"] !== player["所属"]) {
        // 入れ替え可能な場所を発見
        pairs[i][1] = player;
        found = true;
        break;
      }
    }

    // 入れ替えが不可能な場合、そのまま不戦勝として追加
    if (!found) {
      pairs.push([player]);
    }
  }

  console.debug("生成されたペア:", pairs);
  return pairs;
}
