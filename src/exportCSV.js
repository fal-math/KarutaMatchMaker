/*
 * exportCSV.js
 * ユーザーが入力した「勝敗」「スコア」と、隠しデータとして保持している「級組」「左ID」「右ID」を含んだCSVをダウンロード。
 *
 * 出力列：
 *   1) 級組
 *   2) 左ID
 *   3) 右ID
 *   4) 左 座席
 *   5) 左 名前
 *   6) 左 所属
 *   7) 右 座席
 *   8) 右 名前
 *   9) 右 所属
 *   10) 勝敗
 *   11) スコア
 */

document.addEventListener("DOMContentLoaded", () => {
  const downloadButton = document.getElementById("downloadResultsButton");
  const outputMessage = document.getElementById("outputMessage");

  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    const matchTableBody = document.querySelector("#matchTable tbody");
    const rows = matchTableBody.querySelectorAll("tr");

    // CSVのヘッダ行
    let resultCSV = "\uFEFF"; // BOM付き
    resultCSV += "級組,左ID,右ID,左 座席,左 名前,左 所属,右 座席,右 名前,右 所属,勝敗,スコア\n";

    rows.forEach((tr) => {
      // 隠しデータはdata属性から取得
      const classGroup = tr.dataset.classGroup || "";
      const leftId = tr.dataset.leftId || "";
      const rightId = tr.dataset.rightId || "";

      // 表示カラムは <td> 順に取得
      // [0]=左 座席, [1]=左 名前, [2]=左 所属,
      // [3]=右 座席, [4]=右 名前, [5]=右 所属,
      // [6]=勝敗 select, [7]=スコア select
      const tds = tr.querySelectorAll("td");

      const leftSeat = tds[0].textContent.trim();
      const leftName = tds[1].textContent.trim();
      const leftAff  = tds[2].textContent.trim();

      const rightSeat = tds[3].textContent.trim();
      const rightName = tds[4].textContent.trim();
      const rightAff  = tds[5].textContent.trim();

      const resultSelect = tds[6].querySelector(".matchResult");
      const matchResult = resultSelect ? resultSelect.value : "";

      const scoreSelect = tds[7].querySelector(".scoreSelect");
      const score = scoreSelect ? scoreSelect.value : "";

      // CSV行作成
      const lineArray = [
        classGroup,
        leftId,
        rightId,
        leftSeat,
        leftName,
        leftAff,
        rightSeat,
        rightName,
        rightAff,
        matchResult,
        score,
      ];

      // カンマ区切り（実運用ではエスケープ処理推奨）
      resultCSV += lineArray.join(",") + "\n";
    });

    // ダウンロード用のBlob生成
    const blob = new Blob([resultCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 仮リンクを生成してクリック
    const a = document.createElement("a");
    a.href = url;
    a.download = "match_result.csv"; // 任意のファイル名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 完了メッセージ
    outputMessage.textContent = "CSVのダウンロードが完了しました。";
  });
});
