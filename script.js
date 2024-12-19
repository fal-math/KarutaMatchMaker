let members = []; // データを格納
let DISPLAY_COLUMNS = []; // 出力する列を格納

// 必須列、条件付き必須列、任意列の設定
const REQUIRED_COLUMNS = ["Id", "級", "所属"];
const CONDITIONAL_REQUIRED_COLUMNS = [["名前"], ["姓", "名"]];
const OPTIONAL_COLUMNS = ["組", "勝数", "欠席", "名前読み", "姓読み", "名読み"];

// ======================================
// 入力
// ======================================

// ファイルがアップロードされたときの処理
document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  detectEncodingAndDecode(file, function (decodedContent) {
    const delimiters = ",\t ";
    const { data } = parseData(decodedContent, delimiters);
    members = data; // データを保存
    document.getElementById("generateButton").disabled = members.length === 0;
  });
});

// データ貼り付けされたとき
document.getElementById("pasteInput").addEventListener("input", function (event) {
  const content = event.target.value.trim();
  document.getElementById("validateButton").disabled = !content;
});

// 文字コードを判別してデコード
function detectEncodingAndDecode(file, callback) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const uint8Array = new Uint8Array(e.target.result);

    // Shift_JISデコーダーで文字列を取得
    const decoderShiftJIS = new TextDecoder("Shift_JIS");
    const decodedShiftJIS = decoderShiftJIS.decode(uint8Array);

    // UTF-8デコーダーで文字列を取得
    const decoderUTF8 = new TextDecoder("UTF-8");
    const decodedUTF8 = decoderUTF8.decode(uint8Array);

    // 判別: Shift_JIS特有の文字列パターンを調べる
    const shiftJISRegex = /[\uFF61-\uFF9F\u4E00-\u9FA0\u3000-\u30FF]/;
    const isShiftJIS = shiftJISRegex.test(decodedShiftJIS);

    const decodedContent = isShiftJIS ? decodedShiftJIS : decodedUTF8;
    callback(decodedContent);
  };

  reader.readAsArrayBuffer(file);
}

// ======================================
// 検証
// ======================================

document.getElementById("validateButton").addEventListener("click", function () {
  const content = document.getElementById("pasteInput").value.trim();
  if (!content) {
    members = [];
    document.getElementById("generateButton").disabled = true;
    document.getElementById("validationResult").innerText = "入力データが不足しています";
    return;
  }
  const { data } = parseData(content, ",\t ");
  members = data;
  if (members.length === 0) {
    document.getElementById("generateButton").disabled = true;
  } else {
    document.getElementById("generateButton").disabled = false;
  }
});

// 級・組ごとの人数をカウントして表示
function displayGroupCounts(data) {
  const groupCounts = data.reduce((counts, row) => {
    // 欠席者は除外
    if (row["欠席"] === "TRUE") return counts;

    const groupKey = row["組"] ? `${row["級"]}${row["組"]}` : `${row["級"]}`; // 組がなければ級のみ
    counts[groupKey] = (counts[groupKey] || 0) + 1;
    return counts;
  }, {});

  // UIに表示
  const groupCountList = document.getElementById("groupCountList");
  groupCountList.innerHTML = ""; // 既存のリストをクリア


  for (const groupKey in groupCounts) {
    const walkoverCounts = 2 * previousPowerOfTwo(groupCounts[groupKey]) - groupCounts[groupKey];
    const li = document.createElement("li");
    li.innerText = `${groupKey}: ${groupCounts[groupKey]}人 (不戦勝 ${walkoverCounts}人)`;
    groupCountList.appendChild(li);
  }
}

// データをパースする部分でクラス人数を表示
function parseData(content, delimiters) {
  const rows = splitWithDelimiters(content, delimiters);
  const headers = rows.shift(); // 最初の行をヘッダーとして抽出

  // 列名の検証
  const validationError = validateColumns(headers);
  if (validationError) {
    document.getElementById("validationResult").innerText = validationError;
    document.getElementById("validationResult").classList.add("error");
    return { headers: [], data: [] };
  }

  // 出力する列を設定
  setDisplayColumns(headers);

  // データをオブジェクトに変換
  const data = rows.filter(row => row.length === headers.length).map(row => {
    let obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });

  // データを正規化
  const normalizedData = normalizeData(data);

  // クラスごとの人数をUIに表示
  displayGroupCounts(normalizedData);

  return { headers, data: normalizedData };
}


// 列名を正規化する関数
function normalizeColumnName(name) {
  return name
    .trim()                  // 前後の空白を削除
    .replace(/\s+/g, "")     // すべての空白を削除
    .replace(/　/g, "");     // 全角スペースを削除
}

// 列名の検証関数
function validateColumns(headers) {
  // 列名を正規化
  const normalizedHeaders = headers.map(normalizeColumnName);

  // 必須列が全て存在するか確認
  const missingRequired = REQUIRED_COLUMNS.filter(col =>
    !normalizedHeaders.includes(normalizeColumnName(col))
  );
  if (missingRequired.length > 0) {
    return `必須列が不足しています: ${missingRequired.join(", ")}`;
  }

  // 条件付き必須列が満たされているか確認
  const satisfiesConditional = CONDITIONAL_REQUIRED_COLUMNS.some(group =>
    group.every(col => normalizedHeaders.includes(normalizeColumnName(col)))
  );
  if (!satisfiesConditional) {
    return "名前または (姓, 名) が必要です。";
  }

  return null; // 問題なし
}

// 出力する列を設定する関数
function setDisplayColumns(headers) {
  if (headers.includes("姓") && headers.includes("名")) {
    DISPLAY_COLUMNS = ["Id", "姓", "名", "所属"];
  } else if (headers.includes("名前")) {
    DISPLAY_COLUMNS = ["Id", "名前", "所属"];
  } else {
    DISPLAY_COLUMNS = [];
  }
}

// データを正規化
function normalizeData(data) {
  return data.map(row => {
    // 名前を統一する（名前がない場合は姓+名を結合）
    if (!row["名前"] && row["姓"] && row["名"]) {
      row["名前"] = `${row["姓"]} ${row["名"]}`;
    }
    return row;
  });
}

// 選択された区切り文字でデータを分割
function splitWithDelimiters(text, delimiters) {
  const regex = new RegExp(`[${delimiters.replace(/[\s　]/g, " \\u3000")}]`);
  return text.split("\n").map(row => row.trim().split(regex));
}

// ======================================
// 対戦決定と表示
// ======================================

// TODO:不戦勝を表示
// 対戦組み合わせ生成イベント
document.getElementById("generateButton").addEventListener("click", function () {
  const groupedData = groupByGradeAndGroup(members); // 級・組ごとにグループ化
  let allPairs = [];

  // 各グループごとにペア生成
  for (const group in groupedData) {
    const { pairs: groupPairs, walkovers } = generatePairs(groupedData[group]);
    groupPairs.forEach(pair => {
      pair.groupKey = group; // グループ情報を各ペアに付与
    });
    allPairs.push(...groupPairs);
  }

  displayPairsWithGroup(allPairs);
  document.getElementById("generateButton").disabled = true;
});

// データを級・組のペアでグループ化し、組がない場合は級のみを表示
function groupByGradeAndGroup(data) {
  return data.reduce((groups, item) => {
    const groupKey = item["組"] ? `${item["級"]}${item["組"]}` : `${item["級"]}`; // 組がなければ級のみ
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {});
}


// グループごとに対戦結果を表示
function displayPairsWithGroup(pairs) {
  const resultDiv = document.getElementById("generationResult");
  resultDiv.innerHTML = ""; // 結果クリア

  // グループごとにペアを分ける
  const groupedPairs = pairs.reduce((groups, pair) => {
    const groupKey = pair.groupKey || "未設定";
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(pair);
    return groups;
  }, {});

  // グループごとにテーブルを生成
  for (const groupKey in groupedPairs) {
    const groupPairs = groupedPairs[groupKey];

    // テーブルタイトルを追加
    let tableHTML = `<h3>${groupKey} の対戦結果</h3>`;
    tableHTML += `
      <table>
        <thead>
          <tr>
            <th class="seat-column">座席</th>
            <th>ID</th>
            <th>姓</th>
            <th>名</th>
            <th>所属</th>
            <th class="seat-column">座席</th>
            <th>ID</th>
            <th>姓</th>
            <th>名</th>
            <th>所属</th>
          </tr>
        </thead>
        <tbody>
    `;

    // グループ内のペアをテーブルに追加
    groupPairs.forEach((pair, index) => {
      const player1 = pair[0];
      const player2 = pair[1] || null;

      tableHTML += `
        <tr>
          <td class="seat-column">${index * 2 + 1}</td>
          <td>${player1["Id"]}</td>
          <td>${player1["姓"] || ""}</td>
          <td>${player1["名"] || ""}</td>
          <td>${player1["所属"] || ""}</td>
      `;

      if (player2) {
        tableHTML += `
          <td class="seat-column">${index * 2 + 2}</td>
          <td>${player2["Id"]}</td>
          <td>${player2["姓"] || ""}</td>
          <td>${player2["名"] || ""}</td>
          <td>${player2["所属"] || ""}</td>
        `;
      } else {
        tableHTML += `<td colspan="5" class="center">不戦勝</td>`;
      }

      tableHTML += "</tr>";
    });

    tableHTML += "</tbody></table>";

    // グループのテーブルを結果欄に追加
    resultDiv.innerHTML += tableHTML;
  }
}
