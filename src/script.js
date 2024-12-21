let MEMBERS = []; // データを格納
let DISPLAY_COLUMNS = []; // 出力する列を格納

// 必須列、条件付き必須列、任意列の設定
const REQUIRED_COLUMNS = ["Id", "級", "所属"];
const CONDITIONAL_REQUIRED_COLUMNS = [["名前"], ["姓", "名"]];
const OPTIONAL_COLUMNS = ["組", "欠席", "敗退", "名前読み", "姓読み", "名読み"];

// ======================================
// 入力
// ======================================

// ファイルがアップロードされたときの処理
document.getElementById("fileInput").addEventListener("change", async function (event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const decodedContent = await detectEncodingAndDecode(file);
    const {headers, data} = await processDecodedContent(decodedContent);
    MEMBERS = data;
    setDisplayColumns(headers);
  } catch (err) {
    displayError("ファイルの読み込みまたはデコードに失敗しました。");
  }
  
  generateButton.disabled = MEMBERS.length === 0;
  if (MEMBERS.length > 0) {
    displayGroupCounts(MEMBERS);
  }
});

// データ貼り付けされたとき
document.getElementById("pasteInput").addEventListener("input", function (event) {
  const content = event.target.value.trim();
  document.getElementById("validateButton").disabled = !content;
});


// ======================================
// 検証
// ======================================

document.getElementById("validateButton").addEventListener("click", function () {
  const content = document.getElementById("pasteInput").value.trim();
  if (!content) {
    MEMBERS = [];
    document.getElementById("generateButton").disabled = true;
    document.getElementById("validationResult").innerText = "入力データが不足しています";
    return;
  }
  const { headers, data } = parseData(content, ",\t ");
  MEMBERS = data;
  if (MEMBERS.length === 0) {
    document.getElementById("generateButton").disabled = true;
    return;
  }
  // 出力する列を設定
  setDisplayColumns(headers);
  // クラスごとの人数をUIに表示
  displayGroupCounts(data);
  document.getElementById("generateButton").disabled = false;
});

// 級・組ごとの人数をカウントして表示
function displayGroupCounts(data) {
  const groupCounts = data.reduce((counts, row) => {
    // 欠席者は除外
    if (row["欠席"] === "TRUE"||row["敗退"] === "TRUE") return counts;

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

// ======================================
// 対戦決定と表示
// ======================================

// 対戦組み合わせ生成イベント
document.getElementById("generateButton").addEventListener("click", function () {
  const groupedData = groupByGradeAndGroup(MEMBERS); // 級・組ごとにグループ化
  let allPairs = [];

  // 各グループごとにペア生成
  for (const group in groupedData) {
    const groupPairs = generatePairs(groupedData[group]);
    groupPairs.forEach(pair => {
      pair.groupKey = group; // グループ情報を各ペアに付与
    });
    allPairs.push(...groupPairs);
  }

  displayPairsWithGroup(allPairs);
  document.getElementById("generateButton").disabled = true;
  document.getElementById("downloadImageButton").disabled = false;
  document.getElementById("downloadCSVButton").disabled = false;
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

// 名前とふりがなを統合して、HTMLにルビ形式で表示する
function createRubyText(name, furigana) {
  if (!furigana) return name; // ふりがながない場合は名前のみ
  return `<ruby><rb>${name}</rb><rp>(</rp><rt>${furigana}</rt><rp>)</rp></ruby>`; // ルビ形式のHTML
}

// グループごとに対戦結果を表示
function displayPairsWithGroup(pairs) {
  const resultDiv = document.getElementById("generationResult");
  resultDiv.innerHTML = ""; // 結果クリア
  const fragment = document.createDocumentFragment();
  let seatNumber = 1; // 座席番号の連番

  // グループごとにペアを分ける
  const groupedPairs = pairs.reduce((groups, pair) => {
    const groupKey = pair.groupKey || "未設定";
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(pair);
    return groups;
  }, {});

  // 補助関数: テーブルヘッダー作成
  function createTableHeader(headers) {
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    return thead;
  }

  // 補助関数: プレイヤーセル作成
  function createPlayerCells(player, seatText) {
    const fields = [
      { class: "seat-column", text: seatText || "" },
      { text: player["Id"] || "" },
      {
        text: createRubyText(player["名前"] || "", player["名前読み"] || ""), // 名前とふりがなを統合
        isHTML: true // HTMLとして挿入するフラグ
      },
      { class: "affiliation-cell", text: player["所属"] || "", data: player["所属"] || "" }
    ];

    return fields.map(({ class: className, text, isHTML, data }) => {
      const cell = document.createElement("td");
      if (className) cell.classList.add(className); // クラスがあれば設定
      if (data) cell.setAttribute("data-original-affiliation", data); // 元データを保存
      if (isHTML) {
        cell.innerHTML = text; // HTMLを直接挿入
      } else {
        cell.textContent = text;
      }
      return cell;
    });
  }


  // 補助関数: 不戦勝セル作成
  function createWalkoverCell() {
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.classList.add("center", "walkover");
    cell.textContent = "不戦勝";
    return cell;
  }

  // グループごとにテーブルを生成
  for (const groupKey in groupedPairs) {
    const groupPairs = groupedPairs[groupKey];

    // セクションを作成
    const section = document.createElement("section");

    const div = document.createElement("div");
    div.setAttribute("class", "tableContainer");
    section.appendChild(div);
    const title = document.createElement("h3");
    title.textContent = `${groupKey} の対戦組み合わせ`;
    div.appendChild(title);

    // テーブルを作成
    const table = document.createElement("table");
    const headers = ["席", "ID", "名前", "所属", "席", "ID", "名前", "所属"];
    table.appendChild(createTableHeader(headers));
    const tbody = document.createElement("tbody");

    // グループ内のペアをテーブルに追加
    groupPairs.forEach(pair => {
      const row = document.createElement("tr");

      const player1 = pair[0];
      const player2 = pair[1] || null;

      if (!player2) {
        // 不戦勝の場合
        createPlayerCells(player1, "").forEach(cell => row.appendChild(cell));
        row.appendChild(createWalkoverCell());
      } else {
        // 通常ペアの場合
        createPlayerCells(player1, seatNumber++).forEach(cell => row.appendChild(cell));
        createPlayerCells(player2, seatNumber++).forEach(cell => row.appendChild(cell));
      }

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    div.appendChild(table);
    section.appendChild(div);
    fragment.appendChild(section);
  }

  resultDiv.appendChild(fragment);
}

function displayError(message) {
  const validationResult = document.getElementById("validationResult");
  validationResult.innerText = message;
  validationResult.classList.add("error");
}


// ======================================
// 対戦表画像のダウンロード
// ======================================
document.getElementById("downloadImageButton").addEventListener("click", function () {
  const tableContainers = document.querySelectorAll(".tableContainer");
  console.debug(tableContainers);
  tableContainers.forEach((container, index) => {
    // 元の overflow と height を保存
    const originalOverflow = container.style.overflow;
    const originalHeight = container.style.height;

    // 要素全体をキャプチャできるようにスタイルを解除
    container.style.overflow = "visible";
    container.style.height = "auto";

    setTimeout(() => {
      html2canvas(container, {
        scale: 1
      }).then(canvas => {
        // 元のスタイルに戻す
        container.style.overflow = originalOverflow;
        container.style.height = originalHeight;

        // 画像データを取得
        const imgData = canvas.toDataURL("image/png");

        // ダウンロードリンクを作成してクリック
        const link = document.createElement("a");
        link.href = imgData;
        link.download = `table_${index + 1}.png`; // 連番などを付与
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }, 300);
  });
});


// ======================================
// 対戦表CSVのダウンロード
// ======================================
// CSVダウンロード処理
function downloadCSV() {
  const tableContainers = document.querySelectorAll(".tableContainer table");
  let csvContent = "\uFEFF"; // BOM付き
  csvContent += "級組,席,ID,名前,所属,席,ID,名前,所属\n"; // ヘッダー行 

  tableContainers.forEach(table => {
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const rowData = Array.from(cells).map(cell => (cell.querySelector('rb') ?? cell).innerText.replace(/\n/g, ""));
      const groupName = table.closest(".tableContainer").querySelector("h3").innerText.replace(" の対戦組み合わせ", "");
      csvContent += [groupName, ...rowData].join(",") + "\n";
    });
    
  });

  // CSVデータを生成
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // ダウンロードリンクを作成して自動クリック
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "対戦組み合わせ.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ダウンロードボタンのイベントリスナー
document.getElementById("downloadCSVButton").addEventListener("click", downloadCSV);
