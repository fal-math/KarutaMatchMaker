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

// データを正規化
function normalizeData(data) {
  return data.map(row => {
    // 名前を統一する（名前がない場合は姓+名を結合）
    if (!row["名前"] && row["姓"] && row["名"]) {
      row["名前"] = `${row["姓"]} ${row["名"]}`;
    }
    // 名前読みを統一する（名前読みがない場合は姓読み+名読みを結合）
    if (!row["名前読み"] && row["姓読み"] && row["名読み"]) {
      row["名前読み"] = `${row["姓読み"]} ${row["名読み"]}`;
    }
    return row;
  });
}

// 実際のデコード結果を受け取って処理する関数
async function processDecodedContent(decodedContent) {
  const delimiters = ",\t ";
  return parseData(decodedContent, delimiters);
}

// 文字コードを判別してデコード
// Promiseでデコード結果を返す
async function detectEncodingAndDecode(file) {
  return new Promise((resolve, reject) => {
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

        // デコード結果をresolveして返す
        resolve(isShiftJIS ? decodedShiftJIS : decodedUTF8);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = function () {
      reject(new Error("ファイルの読み込み中にエラーが発生しました。"));
    };

    reader.readAsArrayBuffer(file);
  });
}

// 選択された区切り文字でデータを分割
function splitWithDelimiters(text, delimiters) {
  // 全角スペースを含める
  const regex = new RegExp(`[${delimiters.replace(/\s/g, "\\s")}　]`, 'g');
  return text.split("\n").map(row => row.trim().split(regex));
}
