const { generatePairs2 } = require("./shuffle.js"); // 修正

// モックされたシャッフル関数
const mockShuffle = jest.fn(array => array);

// ======================================
// テストデータの準備(Arrange)
// ======================================

// --------------------------------------
// テスト: 基本的動作: 偶数人数、全員出席
// --------------------------------------

// 基本的動作テストデータ1
const basicEvenTestInputData = [
  { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 202, 姓: "鈴木", 名: "花子", 所属: "松かるた会", 欠席: "FALSE" },
  { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 204, 姓: "高橋", 名: "三郎", 所属: "梅かるた会", 欠席: "FALSE" },
];

// 基本的動作正解ペア1
const basicEvenTestExpectedPairs = [
  [
    { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 202, 姓: "鈴木", 名: "花子", 所属: "松かるた会", 欠席: "FALSE" },
  ],
  [
    { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
    { ID: 204, 姓: "高橋", 名: "三郎", 所属: "梅かるた会", 欠席: "FALSE" },
  ],
];
const basicEvenTestExpectedWalkovers = []; // 奇数人数ではないので不戦勝なし

// --------------------------------------
// テスト: 基本的動作: 奇数人数、全員出席
// --------------------------------------

// 基本的動作テストデータ2
const basicOddTestInputData = [
  { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 202, 姓: "鈴木", 名: "花子", 所属: "松かるた会", 欠席: "FALSE" },
  { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 204, 姓: "高橋", 名: "三郎", 所属: "梅かるた会", 欠席: "FALSE" },
  { ID: 205, 姓: "高橋", 名: "一郎", 所属: "椿かるた会", 欠席: "FALSE" },
];

// 基本的動作正解ペア2
const basicOddExpectedPairs = [
  [
    { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 202, 姓: "鈴木", 名: "花子", 所属: "松かるた会", 欠席: "FALSE" },
  ],
];
const basicOddExpectedWalkovers = [
  { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 204, 姓: "高橋", 名: "三郎", 所属: "梅かるた会", 欠席: "FALSE" },
  { ID: 205, 姓: "高橋", 名: "一郎", 所属: "椿かるた会", 欠席: "FALSE" },
];

// --------------------------------------
// テスト: 全員欠席
// 人数は2のべき乗、全員欠席
// --------------------------------------

// 基本的動作テストデータ1
const allAbsentTestInputData = [
  { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "TRUE" },
  { ID: 202, 姓: "鈴木", 名: "花子", 所属: "松かるた会", 欠席: "TRUE" },
  { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "TRUE" },
  { ID: 204, 姓: "高橋", 名: "三郎", 所属: "梅かるた会", 欠席: "TRUE" },
];

// 基本的動作正解ペア1
const allAbsentTestExpectedPairs = [];
const allAbsentTestExpectedWalkovers = []; // 奇数人数ではないので不戦勝なし

// --------------------------------------
// テスト: 同会対決を避ける
// 退避人数の最大値は1
// 人数は2のべき乗、全員出席
// --------------------------------------

// 同会対決回避テストデータ1
const avoidSameClubTestInputData1 = [
  { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 202, 姓: "鈴木", 名: "花子", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 204, 姓: "高橋", 名: "三郎", 所属: "竹かるた会", 欠席: "FALSE" },
];

// 同会対決回避正解ペア1
const avoidSameClubExpectedPairs1 = [
  [
    { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  ],
  [
    { ID: 202, 姓: "鈴木", 名: "花子", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 204, 姓: "高橋", 名: "三郎", 所属: "竹かるた会", 欠席: "FALSE" },
  ],
];
const avoidSameClubExpectedWalkovers1 = []; // 奇数人数ではないので不戦勝なし

// --------------------------------------
// テスト: 同会対決を避ける
// 退避人数の最大値は3
// 人数は2のべき乗、全員出席
// --------------------------------------

// 同会対決回避テストデータ2
const avoidSameClubTestInputData2 = [
  { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 202, 姓: "鈴木", 名: "花子", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 207, 姓: "長野", 名: "健太", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 208, 姓: "稲荷", 名: "礼二", 所属: "桜かるた会", 欠席: "FALSE" },
  { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 204, 姓: "高橋", 名: "澪", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 205, 姓: "糸魚川", 名: "久美子", 所属: "竹かるた会", 欠席: "FALSE" },
  { ID: 206, 姓: "井上", 名: "奈々未", 所属: "竹かるた会", 欠席: "FALSE" },
];

// 同会対決回避正解ペア2
const avoidSameClubExpectedPairs2 = [
  [
    { ID: 201, 姓: "田中", 名: "太郎", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 203, 姓: "佐藤", 名: "次郎", 所属: "竹かるた会", 欠席: "FALSE" },
  ],
  [
    { ID: 202, 姓: "鈴木", 名: "花子", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 204, 姓: "高橋", 名: "澪", 所属: "竹かるた会", 欠席: "FALSE" },
  ],
  [
    { ID: 207, 姓: "長野", 名: "健太", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 205, 姓: "糸魚川", 名: "久美子", 所属: "竹かるた会", 欠席: "FALSE" },
  ],
  [
    { ID: 208, 姓: "稲荷", 名: "礼二", 所属: "桜かるた会", 欠席: "FALSE" },
    { ID: 206, 姓: "井上", 名: "奈々未", 所属: "竹かるた会", 欠席: "FALSE" },
  ],]
const avoidSameClubExpectedWalkovers2 = []; // 奇数人数ではないので不戦勝なし

// ======================================
// テストすべき関数の実行(Act)
// ======================================

// ======================================
// テスト結果の検証(Assert)
// ======================================

const testCases = [
  // {
  //   description: "基本的動作: 偶数人数、全員出席",
  //   input: basicEvenTestInputData,
  //   expectedPairs: basicEvenTestExpectedPairs,
  //   expectedWalkovers: basicEvenTestExpectedWalkovers,
  // },
  // {
  //   description: "基本的動作: 奇数人数、全員出席",
  //   input: basicOddTestInputData,
  //   expectedPairs: basicOddExpectedPairs,
  //   expectedWalkovers: basicOddExpectedWalkovers,
  // },
  // {
  //   description: "特殊ケース: 全員欠席",
  //   input: allAbsentTestInputData,
  //   expectedPairs: allAbsentTestExpectedPairs,
  //   expectedWalkovers: allAbsentTestExpectedWalkovers,
  // },
  {
    description: "同会対決回避: 少人数、全員出席",
    input: avoidSameClubTestInputData1,
    expectedPairs: avoidSameClubExpectedPairs1,
    expectedWalkovers: avoidSameClubExpectedWalkovers1,
  },
  {
    description: "同会対決回避: 大人数、全員出席",
    input: avoidSameClubTestInputData2,
    expectedPairs: avoidSameClubExpectedPairs2,
    expectedWalkovers: avoidSameClubExpectedWalkovers2,
  },
];
describe("generatePairs2 - Data Driven Tests", () => {
  test.each(testCases)(
    "$description",
    ({ input, expectedPairs, expectedWalkovers }) => {
      const { pairs, walkovers } = generatePairs2(input, mockShuffle);

      // ペアリングの結果が正しいか
      expect(pairs).toEqual(expectedPairs);

      // 不戦勝の結果が正しいか
      expect(walkovers).toEqual(expectedWalkovers);
    }
  );
});
