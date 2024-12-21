// Fisher-Yates法によるシャッフル
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function previousPowerOfTwo(n) {
  if (n < 2) return 0; // 2未満の場合は0を返す
  let power = 2;
  while (power < n) {
    power <<= 1; // 左シフトして2倍にする
  }
  return power >> 1; // 最後に2で割る (1つ前の2の冪乗)
}

function generatePairs(data, shuffleFn = shuffle) {
  // 欠席者を除外
  const presentMembers = data.filter(member => 
    member["欠席"] !== "TRUE" && member["敗退"] !== "TRUE"
  );

  // 試合数・勝ち抜き数を計算
  const numberOfWinners = previousPowerOfTwo(presentMembers.length);
  const numberOfMatches = presentMembers.length - numberOfWinners;

  // プレイヤーをシャッフルし、試合用と不戦勝用に分割
  const shuffledPlayers = shuffleFn([...presentMembers]);
  const playersForMatches = shuffledPlayers.slice(0, 2 * numberOfMatches);
  const walkovers = shuffledPlayers.slice(2 * numberOfMatches).map(player => [player]);

  // pairsは [ [選手A, 選手B], [選手C, 選手D], ... ] の形式
  const pairs = Array.from({ length: numberOfMatches }, () => [null, null]);

  // 左側・右側に何人割り当てたかを記録
  let leftCount = 0;
  let rightCount = 0;

  /**
   * 指定した範囲内のpairsの右側に「異なる所属」のプレイヤーを割り当てる
   * 割り当てに成功したらtrueを返し、できなければfalseを返す
   */
  function tryAssignDifferentClubOnRight(player, startIndex, endIndex) {
    for (let i = startIndex; i < endIndex; i++) {
      const leftPlayer = pairs[i][0];
      if (player["所属"] !== leftPlayer["所属"]) {
        pairs[i][1] = player;
        return true;
      }
    }
    return false;
  }

  /**
   * 同一所属しか空きがなかった場合の特例処理
   * 1. 既に割り当て済みの試合で、交換可能なケースがあればスワップ
   * 2. 全て不可なら同会対戦を許容
   */
  function handleSameClubMatch(player) {
    // 右側未割当の試合枠で同一所属ではない相手を探す
    for (let j = 0; j < rightCount; j++) {
      const leftPlayer = pairs[j][0];
      const rightPlayer = pairs[j][1];
      // 左右の所属と異なれば、その左側と入れ替え可能
      if (player["所属"] !== leftPlayer["所属"] && player["所属"] !== rightPlayer["所属"]) {
        pairs[j][0] = player;
        pairs[rightCount][1] = leftPlayer;
        return;
      }
    }
    // 全て同一所属でどうしようもないなら、同会対戦を許容
    pairs[rightCount][1] = player;
  }

  /**
   * 左右バランスに応じた割り当て処理
   * 左右が同数 -> 新規試合枠左側へ
   * 左が多い -> 右側へ割当試行、全て同会なら新規左枠へ
   */
  function assignPlayer(player) {
    // 左側枠が既に埋まっている場合(=leftCount===numberOfMatches)は右側へのみ割り当て可
    if (leftCount === numberOfMatches) {
      // 空き右側枠へ割当を試行する
      const assigned = tryAssignDifferentClubOnRight(player, rightCount, numberOfMatches);
      if (assigned) {
        rightCount++;
        return;
      } else {
        // 全て同一所属で割り当て不可能なら特例処理
        handleSameClubMatch(player);
        rightCount++;
        return;
      }
    }

    // 左右が同数なら、新たな試合枠の左側へ
    if (leftCount === rightCount) {
      pairs[leftCount][0] = player;
      leftCount++;
      return;
    }

    // 左が多い場合、右側へ割当可能か試行
    const assigned = tryAssignDifferentClubOnRight(player, rightCount, leftCount);
    if (assigned) {
      // 右側へ割当可能だった場合
      rightCount++;
      return;
    } else {
      // 全て同一所属なら新規左側枠へ
      pairs[leftCount][0] = player;
      leftCount++;
      return;
    }
  }

  // playersForMatchesから順に割り当て
  while (playersForMatches.length > 0) {
    const player = playersForMatches.shift();
    assignPlayer(player);
  }

  return pairs.concat(walkovers);
}
