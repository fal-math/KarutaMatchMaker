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
    try {
      const uint8Array = new Uint8Array(e.target.result);
      const decoderShiftJIS = new TextDecoder("Shift_JIS");
      const decodedShiftJIS = decoderShiftJIS.decode(uint8Array);
      const decoderUTF8 = new TextDecoder("UTF-8");
      const decodedUTF8 = decoderUTF8.decode(uint8Array);
      const shiftJISRegex = /[\uFF61-\uFF9F\u4E00-\u9FA0\u3000-\u30FF]/;
      const isShiftJIS = shiftJISRegex.test(decodedShiftJIS);
      const decodedContent = isShiftJIS ? decodedShiftJIS : decodedUTF8;
      callback(decodedContent);
    } catch (error) {
      displayError("ファイルのデコード中にエラーが発生しました。");
    }
  };

  reader.onerror = function () {
    displayError("ファイルの読み込み中にエラーが発生しました。");
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
  if (rows.length === 0) {
    throw new Error("データが空です。");
  }
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
  // 全角スペースを含める
  const regex = new RegExp(`[${delimiters.replace(/\s/g, "\\s")}　]`, 'g');
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
    const  groupPairs = generatePairs(groupedData[group]);
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
  const fragment = document.createDocumentFragment();

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

    // セクションを作成
    const section = document.createElement("section");

    // テーブルタイトルを追加
    const title = document.createElement("h3");
    title.textContent = `${groupKey} の対戦結果`;
    section.appendChild(title);

    // テーブルを作成
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["座席", "ID", "姓", "名", "所属", "座席", "ID", "姓", "名", "所属"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // グループ内のペアをテーブルに追加
    groupPairs.forEach((pair, index) => {
      const row = document.createElement("tr");

      const player1 = pair[0];
      const player2 = pair[1] || null;

      // プレイヤー1のセル
      const seat1 = document.createElement("td");
      seat1.classList.add("seat-column");
      seat1.textContent = index * 2 + 1;
      row.appendChild(seat1);

      const id1 = document.createElement("td");
      id1.textContent = player1["Id"];
      row.appendChild(id1);

      const lastName1 = document.createElement("td");
      lastName1.textContent = player1["姓"] || "";
      row.appendChild(lastName1);

      const firstName1 = document.createElement("td");
      firstName1.textContent = player1["名"] || "";
      row.appendChild(firstName1);

      const affiliation1 = document.createElement("td");
      affiliation1.textContent = player1["所属"] || "";
      row.appendChild(affiliation1);

      if (player2) {
        // プレイヤー2のセル
        const seat2 = document.createElement("td");
        seat2.classList.add("seat-column");
        seat2.textContent = index * 2 + 2;
        row.appendChild(seat2);

        const id2 = document.createElement("td");
        id2.textContent = player2["Id"];
        row.appendChild(id2);

        const lastName2 = document.createElement("td");
        lastName2.textContent = player2["姓"] || "";
        row.appendChild(lastName2);

        const firstName2 = document.createElement("td");
        firstName2.textContent = player2["名"] || "";
        row.appendChild(firstName2);

        const affiliation2 = document.createElement("td");
        affiliation2.textContent = player2["所属"] || "";
        row.appendChild(affiliation2);
      } else {
        // 不戦勝セル
        const walkoverCell = document.createElement("td");
        walkoverCell.colSpan = 5;
        walkoverCell.classList.add("center", "walkover");
        walkoverCell.textContent = "不戦勝";
        row.appendChild(walkoverCell);
      }

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    fragment.appendChild(section);
  }

  resultDiv.appendChild(fragment);
}

function displayError(message) {
  const validationResult = document.getElementById("validationResult");
  validationResult.innerText = message;
  validationResult.classList.add("error");
}

