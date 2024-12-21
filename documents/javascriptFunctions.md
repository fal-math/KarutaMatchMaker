# チェック結果

以下では、ファイルごとに「定義されている主な関数」と「どの関数がどれを呼び出しているか」をまとめます。  
呼び出し関係はあくまで静的にコードを読んだ結果であり、実行時の動的呼び出しは含みません。

## プロンプト

ファイルにどんな関数があり、どの関数がどれを呼んでいるかを一覧にして
結果はmd形式で出力して

---

## script.js

### 定義されている主な関数

1. `displayGroupCounts(data)`  
   - 呼び出している関数  
     - `previousPowerOfTwo(...)`  
       - 定義元: shuffle.js  
   - 概要  
     - `data` から欠席者を除外し、`級 + 組` 単位で人数を数え、不戦勝人数を計算して表示する。

2. `setDisplayColumns(headers)`  
   - 呼び出している関数: なし  
   - 概要  
     - ヘッダーの有無によってグローバル変数 `DISPLAY_COLUMNS` を設定する。

3. `groupByGradeAndGroup(data)`  
   - 呼び出している関数: なし  
   - 概要  
     - `data` を `級 + 組` (または `級` のみ) をキーにしてグルーピングして返す。

4. `createRubyText(name, furigana)`  
   - 呼び出している関数: なし  
   - 概要  
     - `name` と `furigana` を `<ruby>` タグ付き文字列として返す。

5. `displayPairsWithGroup(pairs)`  
   - 呼び出している関数: なし（内部的な小さな補助関数は除く）  
   - 概要  
     - 引数 `pairs` をグループ (`groupKey`) ごとにまとめてテーブルを生成し、結果を画面に表示する。

6. `displayError(message)`  
   - 呼び出している関数: なし  
   - 概要  
     - メッセージをエラー表示領域 (`#validationResult`) に表示する。

7. `shortenAffiliation(affiliation, affiliationLength = 6)`  
   - 呼び出している関数: なし  
   - 概要  
     - 所属名を指定文字数でカットして末尾に「…」を付けるか、そのまま返す。

### script.js 内で呼び出している外部の関数

- `detectEncodingAndDecode(file)`  
  - 定義元: parse.js  
  - 使用箇所: `#fileInput.change` イベントリスナー

- `processDecodedContent(decodedContent)`  
  - 定義元: parse.js  
  - 使用箇所: `#fileInput.change` イベントリスナー  
  - 概要: デコード済み文字列をパースして `{ headers, data }` を返す

- `parseData(content, ",\t ")`  
  - 定義元: parse.js  
  - 使用箇所: `#validateButton.click` イベントリスナー

- `previousPowerOfTwo(n)`  
  - 定義元: shuffle.js  
  - 使用箇所: `displayGroupCounts(data)` の中

- `generatePairs(data, shuffleFn = shuffle)`  
  - 定義元: shuffle.js  
  - 使用箇所: `#generateButton.click` イベントリスナー

---

## parse.js

### 定義されている主な関数

1. `parseData(content, delimiters)`  
   - 呼び出している関数  
     - `splitWithDelimiters(content, delimiters)` (同ファイル内)  
     - `validateColumns(headers)` (同ファイル内)  
     - `normalizeData(data)` (同ファイル内)  
   - 概要  
     - テキストを行・列単位で分割し、最初の行をヘッダーとして取り出す。  
     - 列の検証・データ正規化を行い、 `{ headers, data }` を返す。

2. `normalizeColumnName(name)`  
   - 呼び出している関数: なし  
   - 概要  
     - 列名の空白や全角スペースを削除して正規化する。  
     - `validateColumns()` で使用される。

3. `validateColumns(headers)`  
   - 呼び出している関数  
     - `normalizeColumnName(...)` (同ファイル内)  
   - 概要  
     - 必須列・条件付き必須列の存在を確認し、不足があればエラーメッセージを返す。

4. `normalizeData(data)`  
   - 呼び出している関数: なし  
   - 概要  
     - `名前` がなければ `姓 + 名` を結合するなど、データの正規化を行う。

5. `processDecodedContent(decodedContent)` (async)  
   - 呼び出している関数  
     - `parseData(decodedContent, delimiters)` (同ファイル内)  
   - 概要  
     - デコード済み文字列をパースし、 `{ headers, data }` を呼び出し元へ返す。

6. `detectEncodingAndDecode(file)` (async)  
   - 呼び出している関数: なし (内部で `FileReader`, `TextDecoder` を使用)  
   - 概要  
     - ファイルのバイナリデータを読み込み、Shift_JIS / UTF-8 を推定して文字列として返す。

7. `splitWithDelimiters(text, delimiters)`  
   - 呼び出している関数: なし  
   - 概要  
     - テキストを改行 `\n` で分割し、さらに区切り文字や全角スペースで列分割して返す。

---

## shuffle.js

### 定義されている主な関数

1. `shuffle(array)`  
   - 呼び出している関数: なし  
   - 概要  
     - Fisher-Yates法で配列をランダムにシャッフルする。

2. `previousPowerOfTwo(n)`  
   - 呼び出している関数: なし  
   - 概要  
     - `n` 以下の最大の 2 の冪乗を求める（例: n=10 → 8）。

3. `generatePairs(data, shuffleFn = shuffle)`  
   - 呼び出している関数  
     - `previousPowerOfTwo(...)` (同ファイル内)  
     - `shuffleFn([...presentMembers])` デフォルトは同ファイル内の `shuffle`  
   - 概要  
     - `data` から欠席者を除外してシャッフルし、対戦ペア `[[player1, player2], ...]` と不戦勝 `[[playerX], ...]` を作成。  
     - 同所属の対戦を極力避けるためのロジックを含む。  
     - 関数内で `tryAssignDifferentClubOnRight`, `handleSameClubMatch`, `assignPlayer` といった補助関数を定義し、ペアを組む制御を行う。

---

# まとめ

- script.js  
  - UI まわり（ファイル読込、テキスト貼り付け、検証、対戦生成など）のイベントリスナーや画面表示用の関数が定義されている。  
  - 外部関数呼び出し:  
    - parse.js より: `detectEncodingAndDecode`, `processDecodedContent`, `parseData`  
    - shuffle.js より: `previousPowerOfTwo`, `generatePairs`

- parse.js  
  - データ読み込み・パース (`parseData`, `splitWithDelimiters`, `validateColumns`, `normalizeData`)、エンコード判定 (`detectEncodingAndDecode`)、デコード結果の処理 (`processDecodedContent`) が定義されている。  
  - 外部関数呼び出し: 特になし（DOM操作や FileReader などブラウザAPIは除外）

- shuffle.js  
  - シャッフル (`shuffle`)、2 の冪乗を求める (`previousPowerOfTwo`)、対戦ペア生成 (`generatePairs`) が定義されている。  
  - 外部関数呼び出し: 特になし

全体として、script.js がメインロジック（イベント駆動）および UI 表示を担当し、parse.js がデータ解析・正規化、shuffle.js がシャッフル・対戦生成のロジックを担う構成になっています。
