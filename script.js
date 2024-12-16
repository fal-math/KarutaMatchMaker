let members = []; // データを格納
let DISPLAY_COLUMNS = []; // 出力する列を格納

// 必須列、条件付き必須列、任意列の設定
const REQUIRED_COLUMNS = ["Id", "級", "所属"];
const CONDITIONAL_REQUIRED_COLUMNS = [["名前"], ["姓", "名"]];
const OPTIONAL_COLUMNS = ["組", "勝数", "欠席", "名前読み", "姓読み", "名読み"];

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


// 対戦結果を表示
function displayPairs(pairs) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = ""; // 前回の結果をクリア

  if (DISPLAY_COLUMNS.length === 0) {
    resultDiv.innerHTML = "<p class='error'>出力する列が設定されていません。</p>";
    return;
  }

  let tableHTML = `
            <table>
                <thead>
                    <tr>${DISPLAY_COLUMNS.map(col => `<th>${col}</th>`).join("")}</tr>
                </thead>
                <tbody>
        `;
  pairs.forEach(pair => {
    tableHTML += "<tr>";
    DISPLAY_COLUMNS.forEach(col => {
      tableHTML += `<td>${pair[0][col] || ""}</td>`;
    });
    tableHTML += "</tr>";
    if (pair[1]) {
      tableHTML += "<tr>";
      DISPLAY_COLUMNS.forEach(col => {
        tableHTML += `<td>${pair[1][col] || ""}</td>`;
      });
      tableHTML += "</tr>";
    } else {
      tableHTML += `<tr><td colspan="${DISPLAY_COLUMNS.length}" class="center">不戦勝</td></tr>`;
    }
    tableHTML += `<tr><td colspan="${DISPLAY_COLUMNS.length}" class="center">--- VS ---</td></tr>`;
  });
  tableHTML += "</tbody></table>";

  resultDiv.innerHTML = tableHTML;
}

// ファイルがアップロードされたときの処理
document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  detectEncodingAndDecode(file, function (decodedContent) {
    const delimiters = ",\t ";
    const { headers, data } = parseData(decodedContent, delimiters);
    members = data; // データを保存
    document.getElementById("generateButton").disabled = members.length === 0;
  });
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


// データ貼り付けイベント
document.getElementById("pasteInput").addEventListener("input", function (event) {
  const content = event.target.value.trim();
  if (!content) {
    members = [];
    document.getElementById("generateButton").disabled = true;
    return;
  }
  const { data } = parseData(content, ",\t ");
  members = data;
  document.getElementById("generateButton").disabled = members.length === 0;
});

// 対戦組み合わせ生成イベント
document.getElementById("generateButton").addEventListener("click", function () {
  const pairs = generatePairs(members);
  displayPairs(pairs);
});