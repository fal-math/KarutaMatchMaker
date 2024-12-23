# 対戦組み合わせ決定ツール 要件定義

- [1. 概要](#1-概要)
- [2. 機能要件](#2-機能要件)
  - [2.1. 入力機能](#21-入力機能)
  - [2.2. データ処理機能](#22-データ処理機能)
    - [2.2.1. 級・組ごとの対戦組み合わせ機能](#221-級組ごとの対戦組み合わせ機能)
    - [2.2.2. 欠席者の除外](#222-欠席者の除外)
  - [2.3. 出力機能](#23-出力機能)
    - [2.3.1. 級・組ごとの人数表示](#231-級組ごとの人数表示)
- [3. 非機能要件](#3-非機能要件)
- [4. 要件まとめ図](#4-要件まとめ図)
  - [4.1. フロー図](#41-フロー図)
  - [4.2. ファイル構造](#42-ファイル構造)
  - [4.3. エラーハンドリング](#43-エラーハンドリング)
- [5. 実装範囲](#5-実装範囲)
- [6. テスト](#6-テスト)
- [7. 今後の追加要件（検討中）](#7-今後の追加要件検討中)
- [8. 改善履歴](#8-改善履歴)

## 1. 概要

競技かるた等の対戦形式を管理するための「対戦組み合わせ決定」ツール。
CSVデータまたは貼り付けデータを入力として、
対戦者ペアを競技規程に則ったアルゴリズムで決定し、視認性の高いUIで表示する。

---

## 2. 機能要件

### 2.1. 入力機能

1. データ入力方法
   - CSVファイルのアップロード
   - テキストボックスへのデータ貼り付け
1. データフォーマット
   - 必須列: `Id`, `級`, `所属`
   - 条件付き必須列:
     - `名前` または `姓`, `名` の両方
   - 任意列:
     - `組`, `勝数`, `欠席`
     - `名前読み` または `姓読み`, `名読み`
1. 文字コード対応
   - 自動で `Shift_JIS` または `UTF-8` を判定しデコードする。
1. 区切り文字への対応
   - 区切り文字として以下を許容:
   - カンマ（`,`）
   - タブ文字（`\t`）
   - 半角スペース
   - 全角スペース
1. 入力データの確認機能
   - 入力データを正しく読み込めているか表示する。
     - データ検証およびデータの正規化まで行う。

---

### 2.2. データ処理機能

1. データ検証
   - 必須列、条件付き必須列が存在するかを検証。
   - 検証エラー時はエラーメッセージを表示。
2. データの正規化
   - 列名の正規化（余分な空白や全角スペースの除去）。
3. 対戦組み合わせ決定
   - データをランダムにシャッフルし、対戦ペアを決定。
   - 奇数人数の場合、不戦勝を考慮。

#### 2.2.1. 級・組ごとの対戦組み合わせ機能

1. 概要  
   - 「級」と「組」を組み合わせた単位（例：D級1組、D級2組など）でグループを分け、その中で対戦組み合わせを生成する。  
   - 異なる「級・組」のグループ同士が混ざらないようにする。

2. 処理内容  
   - データを「級」と「組」のペアでグループ化する。  
   - 各グループごとにランダムシャッフルし、対戦ペアを生成する。  
   - 奇数人数のグループには「不戦勝」を考慮する。

3. 表示形式  
   - グループごとに独立したテーブルを生成する。  
   - 各テーブルには「グループ名（級・組）」をタイトルとして表示する。  
   - テーブルの列構成：

     | 座席 | ID | 名前 | 所属 | 座席 | ID | 名前 | 所属 |
     |------|----|------|------|------|----|------|------|

     - 奇数人数の場合、右側セルに「不戦勝」と表示する。

4. 出力例  

   **D1 の対戦組合せ**

   | 座席 | ID  | 名前      | 所属                 | 座席 | ID  | 名前      | 所属                   |
   |------|-----|-----------|----------------------|------|-----|-----------|------------------------|
   | 1    | 101 | 田中 太郎 | 国立文学大学かるた会 | 2    | 102 | 山田 次郎 | 南九州かるた会         |
   | 3    | 103 | 鈴木 花子 | 北の大地かるた同好会 | 4    | 104 | 高橋 一郎 | 阪神大学かるたサークル |

   **D2 の対戦組合せ**

   | 座席 | ID  | 名前      | 所属             | 座席 | ID  | 名前      | 所属                   |
   |------|-----|-----------|------------------|------|-----|-----------|------------------------|
   | 1    | 201 | 佐藤 三郎 | 北陸商業学院高校 | 2    | 202 | 伊藤 京子 | 阪神大学かるたサークル |

5. 備考  
   - グループ名のデフォルト値：データに「組」がない場合は「級」のみを表示する。

#### 2.2.2. 欠席者の除外

1. 目的  
   - 欠席フラグが`TRUE`の参加者を対戦組み合わせから除外する。

2. 処理内容  
   - データ内の「欠席」列を判定し、`欠席 = TRUE` の参加者を除外する。  
   - 出席者のみを対象として対戦組み合わせを生成する。

3. 出力結果  
   - 欠席者は結果から完全に除外される。  
   - 奇数人数の場合は「不戦勝」を生成し、適切に表示する。

---

### 2.3. 出力機能

1. 対戦結果のUI表示
   - テーブル形式で出力：
     - 座席番号：各プレイヤーの着席順序
     - 出力項目：`座席`, `Id`, `名前`,`名前読み`, `所属`
     - 対戦ペア：同じ行に対戦者2名を表示（座席番号は左右分かれる）。
     - 不戦勝対応：奇数人数時は右側セルに「不戦勝」と表示。
2. テーブルUIデザイン
   - ヘッダーを強調表示。
   - 行ごとに背景色を交互に設定（ストライプデザイン）。
   - 「座席」列とID列は中央揃え。他の列は左揃え。
   - 罫線を適用し、データ区分を明確化。
   - 所属の省略表示機能を備える。

#### 2.3.1. 級・組ごとの人数表示

1. 目的  
   - データ検証時に各「級・組」の出席者数をユーザーに表示する。

2. 処理内容  
   - 欠席フラグが`TRUE`の参加者を除外する。  
   - 出席者のみを対象に「級・組」ごとの人数を集計する。  
   - 集計結果をUI上にリスト形式で表示する。

---

## 3. 非機能要件

1. 操作性
   - シンプルなUI構成で、ユーザーが直感的に操作できる。
   - 視認性の向上を意識したデザイン。
2. 性能
   - CSVファイルの読み込みやランダムシャッフル処理を高速に実行。
3. 互換性
   - 最新の主要ブラウザ（Chrome, Firefox, Edge）に対応。

---

## 4. 要件まとめ図

### 4.1. フロー図

```text
【入力】
   │
   ├── CSVファイルアップロード
   │     - ファイル選択UIを提供。
   │     - アップロードされたファイルを文字コード判別後に読み込む。
   │     - Shift_JIS または UTF-8 のデコード処理。
   │     - 列の正規化とデータ整形を実施。
   └── テキスト貼り付け入力
         - 入力テキストを、指定された区切り文字（カンマ, タブ, スペース）で分割。
         - 列の正規化とデータ整形を実施。
         ↓ 
【検証】
   ├── 検証ボタンの押下
   │     - 必須列が全て存在するかをチェック。
   │     - 条件付き必須列（名前 or 姓+名）が満たされているか確認。
   │     - 列の不整合（列不足や余分な列）を検知して警告表示。
   │     - CSVファイルアップロード時は自動で検証を始める
   └── 名前列の正規化
         - 名前が欠けている場合、姓+名を結合して補完。
         ↓
【処理・表示】
   ├── 対戦決定ボタンの押下
   │     - データをランダムにシャッフル。
   │     - 対戦ペアを決定（奇数の場合は不戦勝を考慮）。
   └── テーブル表示
         - 座席, ID, 名前, 所属をテーブル形式で表示。
         - 不戦勝対応
           - 奇数人数の場合、最後の行で「不戦勝」を表示。
```

### 4.2. ファイル構造

```text
src/
 ├── index.html
 ├── style.css
 ├── script.js メインロジック（イベント駆動）および UI 表示
 ├── parse.js データ解析・正規化
 └── shuffle.js シャッフル・対戦生成のロジック
```

---

### 4.3. エラーハンドリング

- 検証エラー
  - 必須列や条件付き必須列が不足している場合、エラーメッセージを表示。
- 処理エラー
  - 無効なデータや文字コードが検出された場合、エラーを表示。

---

## 5. 実装範囲

- フロントエンド
  - HTMLとJavaScript（ネイティブ）による実装。
  - CSSを使用してシンプルかつユーザーフレンドリーなデザインを提供。

---

## 6. テスト

`npx jest shuffle.test.js`で実行可能

## 7. 今後の追加要件（検討中）

1. 結果をCSVやPDF形式でダウンロードする機能。
2. データフィルタリング機能（例：級や所属に基づく条件指定）。
3. 競技会規定に即して対戦を決定する機能。

---

## 8. 改善履歴

- 2024/12/21
  - 対戦組み合わせを画像でダウンロードできる機能の追加
- 2024/12/20
  - 座席番号を連番に修正
  - ふりがなを表示
- 2024/12/19
  - 所属を省略して表示する機能の追加
  - 競技規程に合わせた対戦決定ファンクションの追加
  - `generatePairs`のテストを追加
- 2024/12/17
  - 級・組ごとの出席者人数を集計して表示する機能を追加
    - データ検証時に、級・組ごとの出席者人数をUIにリスト形式で表示するように対応。
    - 欠席者はカウントから除外される。
  - 欠席者の除外機能を追加
    - 欠席フラグが `TRUE` の参加者を対戦組み合わせから除外。
  - グループ単位のテーブル生成機能を追加
    - `displayPairsWithGroup` 関数を修正し、「級・組」ごとに独立したテーブルを生成。
    - テーブルタイトルにグループ名（例：D1、D2）を表示。
    - 組がない場合は「級」のみを表示するように対応。
  - `alert()` でのエラーメッセージの表示をやめ、`<p id="validationResult">` にエラーメッセージを表示するように変更.
- 2024/12/16
  - UIの改善：
    - ストライプデザイン（行ごとに背景色）。
    - ヘッダーの強調表示。
    - 座席番号とID列の中央揃え。
  - 視認性向上のため、対戦者ペアを1行で表示。
  - 入力と検証を区別。テキストエリアに入力途中に検証プログラムが動作する不具合を修正した。
