/*
 * resultInput.js
 * パース済みCSVデータを受け取り、結果入力用のテーブルを生成・表示する。
 *
 * 前提：
 *  入力CSVの列順（ヘッダー除去後）は：
 *   0: 級組
 *   1: 左 座席
 *   2: 左 ID
 *   3: 左 名前
 *   4: 左 所属
 *   5: 右 座席
 *   6: 右 ID
 *   7: 右 名前
 *   8: 右 所属
 */

let globalCSVData = [];

function handleParsedCSV(data) {
  globalCSVData = data;

  const matchListSection = document.getElementById("matchListSection");
  const matchTableBody = document.querySelector("#matchTable tbody");
  const outputSection = document.getElementById("outputSection");
  const uploadMessage = document.getElementById("uploadMessage");

  // 一旦クリア
  matchTableBody.innerHTML = "";

  // データが空なら表示エリアを閉じる
  if (!data || data.length === 0) {
    uploadMessage.textContent = "CSVデータが空です。";
    matchListSection.classList.add("hidden");
    outputSection.classList.add("hidden");
    return;
  }

  // 行データをUIに反映
  data.forEach((row) => {
    // row: [級組, 左座席, 左ID, 左名前, 左所属, 右座席, 右ID, 右名前, 右所属]

    // <tr>に「級組」「左ID」「右ID」をdata属性で保持し、UI上では表示しない
    const tr = document.createElement("tr");
    tr.dataset.classGroup = row[0];  // 級組
    tr.dataset.leftId = row[2];      // 左ID
    tr.dataset.rightId = row[6];     // 右ID

    // テーブルの見えるカラムは以下のみ
    // (左座席, 左名前, 左所属, 右座席, 右名前, 右所属, 勝敗, スコア)
    const tdLeftSeat = document.createElement("td");
    tdLeftSeat.textContent = row[1] || "";
    tr.appendChild(tdLeftSeat);

    const tdLeftName = document.createElement("td");
    tdLeftName.textContent = row[3] || "";
    tr.appendChild(tdLeftName);

    const tdLeftAffiliation = document.createElement("td");
    tdLeftAffiliation.setAttribute("data-original-affiliation", row[4] || "");
    tdLeftAffiliation.classList.add("affiliation-cell");
    tdLeftAffiliation.textContent = shortenAffiliation(row[4] || "", 6);
    tr.appendChild(tdLeftAffiliation);

    const tdRightSeat = document.createElement("td");
    tdRightSeat.textContent = row[5] || "";
    tr.appendChild(tdRightSeat);

    const tdRightName = document.createElement("td");
    tdRightName.textContent = row[7] || "";
    tr.appendChild(tdRightName);

    const tdRightAffiliation = document.createElement("td");
    tdRightAffiliation.setAttribute("data-original-affiliation", row[8] || "");
    tdRightAffiliation.classList.add("affiliation-cell");
    tdRightAffiliation.textContent = shortenAffiliation(row[8] || "", 6);
    tr.appendChild(tdRightAffiliation);

    // 勝敗選択
    const tdResult = document.createElement("td");
    tdResult.innerHTML = `
      <select class="matchResult">
        <option value="">選択</option>
        <option value="左勝ち">左勝ち</option>
        <option value="右勝ち">右勝ち</option>
      </select>`;
    tr.appendChild(tdResult);

    // スコア(1～30の選択)
    const tdScore = document.createElement("td");
    tdScore.appendChild(createScoreSelect());
    tr.appendChild(tdScore);

    matchTableBody.appendChild(tr);
  });

  matchListSection.classList.remove("hidden");
  outputSection.classList.remove("hidden");
  uploadMessage.textContent = "";
}

/**
 * 1～30の整数をプルダウンで選択できる <select> を生成
 */
function createScoreSelect() {
  const select = document.createElement("select");
  select.classList.add("scoreSelect");

  // 初期状態(空)
  const optDefault = document.createElement("option");
  optDefault.value = "";
  optDefault.textContent = "選択";
  select.appendChild(optDefault);

  // 1～30
  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    select.appendChild(opt);
  }

  return select;
}
