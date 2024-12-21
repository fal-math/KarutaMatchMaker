// ======================================
// 所属を短縮表記
// ======================================

// 所属を短縮表記する
function shortenAffiliation(affiliation, affiliationLength = 6) {
  if (!affiliation) return ""; // 所属が空の場合はそのまま
  return affiliation.length > affiliationLength ? affiliation.slice(0, affiliationLength) + "…" : affiliation;
}

// トグルスイッチとラベルのイベントリスナー
document.getElementById("toggleAffiliationShorten").addEventListener("change", function () {
  const isChecked = this.checked;
  const affiliationCells = document.querySelectorAll("td.affiliation-cell"); // 所属セルを選択

  affiliationCells.forEach(cell => {
    const originalAffiliation = cell.getAttribute("data-original-affiliation"); // 元の値を取得
    cell.textContent = isChecked
      ? shortenAffiliation(originalAffiliation) // 短縮表記を適用
      : originalAffiliation; // 元の値に戻す
  });

});