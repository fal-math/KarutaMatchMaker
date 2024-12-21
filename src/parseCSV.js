/*
 * parseCSV.js
 * CSVファイルの読み込みとパースを担当します。
 *
 * 前提：
 *  - 先頭行はヘッダー
 *  - PapaParseは使わない
 */

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFileInput");
  const loadButton = document.getElementById("loadCSVButton");
  const uploadMessage = document.getElementById("uploadMessage");

  loadButton.addEventListener("click", () => {
    // ファイルが選択されていない場合はエラー表示
    if (!fileInput.files || fileInput.files.length === 0) {
      uploadMessage.textContent = "CSVファイルを選択してください。";
      return;
    }
    const file = fileInput.files[0];

    // 簡易パース (カンマ区切り)
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;

      // 各行ごとに分割(改行)
      let lines = csvText.split(/\r?\n/);

      // 空行を除去（末尾に空行があるとmapで余計な配列ができるため）
      lines = lines.filter((line) => line.trim() !== "");

      // 二次元配列化
      let data = lines.map((line) => line.split(","));

      // 先頭行をヘッダーとして取り除く
      // （必要ならば const header = data[0] で列名チェックしてもよい）
      if (data.length > 1) {
        data = data.slice(1);
      } else {
        uploadMessage.textContent = "ヘッダー行のみ、または空ファイルです。";
        return;
      }

      // handleParsedCSV にデータを渡す
      uploadMessage.textContent = "";
      handleParsedCSV(data);
    };
    reader.readAsText(file, "UTF-8");
  });
});
