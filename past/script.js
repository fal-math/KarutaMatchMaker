let members = []; // データを格納
let DISPLAY_COLUMNS = []; // 出力する列を格納
let isCsvInputted = false;
let isTextInputted = false;

// 必須列、条件付き必須列、任意列の設定
const REQUIRED_COLUMNS = ["Id", "級", "所属"];
const CONDITIONAL_REQUIRED_COLUMNS = [["名前"], ["姓", "名"]];
const OPTIONAL_COLUMNS = ["組", "勝数", "欠席", "名前読み", "姓読み", "名読み"];

// =============================================//
// 入力
// =============================================//


// ファイルがアップロードされたときの処理
document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  detectEncodingAndDecode(file, function (decodedContent) {
    const delimiters = ",\t ";
    const { headers, data } = parseData(decodedContent, delimiters);
    members = data;
   console.debug(headers, data)

    const validation = validateColumns(headers);
    if (!validation.valid) {
      displayError(validation.error);
      document.getElementById("generateButton").disabled = true;
    } else {
      displayError("");
      document.getElementById("generateButton").disabled = false;
    }

    isCsvInputted = true;
    updateGenerateButtonState();
  });
});

// テキスト貼り付けされたときの処理
document.getElementById("pasteInput").addEventListener("input", event => {
  const content = event.target.value;
  members = parseData(content, ",").data;
  document.getElementById("validateButton").disabled = !content.trim();
  isTextInputted = true;
  updateGenerateButtonState();
});

// 検証ボタンの押下
document.getElementById("validateButton").addEventListener("click", () => {
  if (isTextInputted) {
    const validation = validateColumns(members[0]);
    if (!validation.valid) {
      displayError(validation.error);
      document.getElementById("generateButton").disabled = true;
    } else {
      displayError("");
      document.getElementById("generateButton").disabled = false;
    }
  }
});

// ユーティリティ関数
function normalizeString(string) {
  return string.trim().replace(/\s+/g, "").replace(/　/g, "");
}

function displayError(message) {
  const errorElement = document.getElementById("errorMessage");
  errorElement.textContent = message;
  errorElement.style.display = message ? "block" : "none";
}

function updateGenerateButtonState() {
  const valid = isTextInputted || isCsvInputted;
  document.getElementById("generateButton").disabled = !valid;
}

// 列名の検証関数
function validateColumns(headers) {
  const normalizedHeaders = headers.map(normalizeString);

  const missingRequired = REQUIRED_COLUMNS.filter(col =>
    !normalizedHeaders.includes(normalizeString(col))
  );

  if (missingRequired.length > 0) {
    return { valid: false, error: `必須列が不足しています: ${missingRequired.join(", ")}` };
  }

  const satisfiesConditional = CONDITIONAL_REQUIRED_COLUMNS.some(group =>
    group.every(col => normalizedHeaders.includes(normalizeString(col)))
  );

  if (!satisfiesConditional) {
    return { valid: false, error: "名前または (姓, 名) が必要です。" };
  }

  return { valid: true };
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

// データをパース
function parseData(content, delimiters) {
  const rows = splitWithDelimiters(content, delimiters);
  const headers = rows.shift(); // 最初の行をヘッダーとして抽出

  // 列名の検証
  const validationError = validateColumns(headers);
  if (validationError) {
    alert(validationError); // エラーメッセージを表示
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

  return { headers, data: normalizedData };
}

// 選択された区切り文字でデータを分割
function splitWithDelimiters(text, delimiters) {
  const regex = new RegExp(`[${delimiters.replace(/[\s　]/g, " \\u3000")}]`);
  return text.split("\n").map(row => row.trim().split(regex));
}

// 対戦組み合わせを生成
function generatePairs(data) {
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

// 対戦結果を表示
function displayPairs(pairs) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = ""; // 前回の結果をクリア

  if (DISPLAY_COLUMNS.length === 0) {
    resultDiv.innerHTML = "<p class='error'>出力する列が設定されていません。</p>";
    return;
  }

  // ヘッダーの作成
  let tableHTML = `
      <table>
        <thead>
          <tr>
            <th class="seat-column">座席</th>
            ${DISPLAY_COLUMNS.map(col => `<th>${col}</th>`).join("")}
            <th class="seat-column">座席</th>
            ${DISPLAY_COLUMNS.map(col => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
    `;

  // 各ペアを行に表示
  pairs.forEach((pair, index) => {
    const player1 = pair[0];
    const player2 = pair[1] || null; // 不戦勝対応

    tableHTML += "<tr>";
    // プレイヤー1のデータ
    tableHTML += `<td>${index * 2 + 1}</td>`;
    DISPLAY_COLUMNS.forEach(col => {
      tableHTML += `<td>${player1[col] || ""}</td>`;
    });

    // プレイヤー2のデータ (不戦勝時は空欄)
    if (player2) {
      tableHTML += `<td>${index * 2 + 2}</td>`;
      DISPLAY_COLUMNS.forEach(col => {
        tableHTML += `<td>${player2[col] || ""}</td>`;
      });
    } else {
      tableHTML += `<td colspan="${DISPLAY_COLUMNS.length + 1}" class="center">不戦勝</td>`;
    }

    tableHTML += "</tr>";
  });

  tableHTML += "</tbody></table>";
  resultDiv.innerHTML = tableHTML;
}





// 対戦組み合わせ生成イベント
document.getElementById("generateButton").addEventListener("click", function () {
  const pairs = generatePairs(members);
  displayPairs(pairs);
});