module.exports = { generatePairs };

// Fisher-Yates法によるシャッフル
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function previousPowerOfTwo(n) {
  if (n < 1) return 0; // 1未満の場合は0を返す
  let power = 1;
  while (power < n) {
    power <<= 1; // 左シフトして2倍にする
  }
  return power >> 1; // 最後に2で割る (1つ前の2の冪乗)
}

function generatePairs(data, shuffleFn = shuffle) {
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
        } else if (i + 1 === numberOfMatches) {
          // 空き枠が全て同一所属で割り当て不可の場合
          sameClubMatchPermission = true;
        }
        // 空き枠が全て同一所属で割り当て不可の場合
        if (sameClubMatchPermission) {
          // 左右が埋まっている対戦を探索
          if (rightCount === 0) {
            pairs[0][1] = player;
            rightCount++;
            break;
          }
          for (let j = 0; j < rightCount; j++) {
            const leftPlayer = pairs[j][0];
            const rightPlayer = pairs[j][1];
            if (player["所属"] !== leftPlayer["所属"] && player["所属"] !== rightPlayer["所属"]) {
              // 左の人と所属が違うなら交換可能
              pairs[j][0] = player;
              pairs[rightCount][1] = leftPlayer;
              rightCount++;
              break;
            } else if (j + 1 === rightCount) {
              // どうしようもないので同会対戦
              pairs[rightCount][1] = player;
              rightCount++;
              break;
            }
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
