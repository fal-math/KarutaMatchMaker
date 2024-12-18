module.exports = { generatePairs2 };

// Fisher-Yates法によるシャッフル
function shuffle(array) {
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
  while (power < n) {
    power <<= 1; // 左シフトして2倍にする
  }
  return power >> 1; // 最後に2で割る (1つ前の2の冪乗)
}


function generatePairs2(data, shuffleFn = shuffle) {
  // 欠席者を除外
  const presentMembers = data.filter(member => member["欠席"] !== "TRUE");

  // 試合数・勝ち抜き数を計算
  const numberOfWinners = previousPowerOfTwo(presentMembers.length);
  const numberOfMatches = presentMembers.length - numberOfWinners;

  // プレイヤーをシャッフルし、試合用と不戦勝用に分割
  const shuffled = shuffleFn([...presentMembers]);
  const playersForMatches = shuffled.slice(0, 2 * numberOfMatches);
  const walkovers = shuffled.slice(2 * numberOfMatches);

  // pairsは [ [選手A, 選手B], [選手C, 選手D], ... ] の形式
  const pairs = Array.from({ length: numberOfMatches }, () => [null, null]);

  // 左側・右側それぞれ何試合埋まっているか
  let leftCount = 0;
  let rightCount = 0;

  while (playersForMatches.length > 0) {
    const player = playersForMatches.shift();
    let sameClubMatchPermission = false;

    if (leftCount === numberOfMatches) {
      // 左枠が埋まったら右枠を埋めるしかない
      for (let i = rightCount; i < numberOfMatches; i++) {
        const leftPlayer = pairs[i][0];
        if (player["所属"] !== leftPlayer["所属"]) {
          pairs[i][1] = player;
          rightCount++;
          break;
        } else if (i + 1 === leftCount) {
          // 空き枠が全て同一所属で割り当て不可の場合
          sameClubMatchPermission = true;
          break;
        }
      }

      // 空き枠が全て同一所属で割り当て不可の場合
      if (sameClubMatchPermission) {
        // 左右が埋まっている対戦を探索
        for (let i = 0; i < rightCount; i++) {
          const leftPlayer = pairs[i][0];
          if (player["所属"] !== leftPlayer["所属"]) {
            // 左の人と所属が違うなら交換可能
            pairs[i][0] = player;
            pairs[rightCount][1] = leftPlayer;
            rightCount++;
            break;
          } else if (i + 1 === rightCount) {
            // どうしようもないので同会対戦
            pairs[rightCount][1] = player;
            rightCount++;
            break;
          }
        }
      }

    } else if (leftCount === rightCount) {
      // 左右が同数なら新たな試合枠の左側に割り当て
      pairs[leftCount][0] = player;
      leftCount++;
    } else {
      // 左が多い場合、右側へ割り当て可能な枠を探す
      let assigned = false;
      for (let i = rightCount; i < leftCount; i++) {
        const leftPlayer = pairs[i][0];
        if (player["所属"] !== leftPlayer["所属"]) {
          // 違う所属ならこの枠に割り当て可能
          pairs[i][1] = player;
          rightCount++;
          assigned = true;
          break;
        } else if (i + 1 === leftCount) {
          // 最後まで同一所属なら左側新規枠に割り当て
          pairs[leftCount][0] = player;
          leftCount++;
          assigned = true;
          break;
        }
      }
      // ここでassignedがfalseになるケースはロジック上発生しないはず
      if (assigned == false) {
        throw new Error("something wrong");
      }
    }
  }

  return { pairs, walkovers };
}

/*

  while (shuffled.length > 0) {
    const player1 = shuffled.shift(); // 先頭の競技者を取り出す
    let player2 = shuffled.shift(); // 次の競技者を仮に取り出す



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
*/