# Termicrawler

[日本語](#日本語) | [English](#english)

---

<a name="日本語"></a>
## 🇯🇵 Termicrawler (日本語)

**「コマンド端末の深淵を、タイピングで切り開くローグライク」**

Termicrawler は、コマンドラインインターフェース（CLI）風のビジュアルを持つ、ブラウザで遊べるタイピング・ローグライクゲームです。
プレイヤーは未知の「端末ダンジョン」に潜り、タイピングスキルを駆使して敵性プログラムを排除しながら深層を目指します。

### 特徴
- **端末風UI**: 黒背景に緑の文字、レトロなコマンドプロンプトの雰囲気を再現。
- **タイピングバトル**: 敵との戦闘はタイピング速度と正確さが鍵となります。
- **ローグライク**: ダンジョンは毎回ランダムに生成され、二度と同じ冒険はありません。
- **セーブ機能**: 進行状況はブラウザに自動保存され、テキスト形式での書き出し/読み込みも可能です。

### 遊び方
1. **移動**: 矢印キー または `WASD` キーでダンジョンを移動します。
2. **戦闘**: 敵に遭遇すると戦闘モード（タイピング）に移行します。画面に表示される単語を素早く入力して攻撃してください。
3. **探索**: 階段（緑色のエリア）を見つけて次の階層へ進みます。

### セットアップと開発
このプロジェクトは Vite + React + TypeScript で構築されています。

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番用ビルド
npm run build
```

### デプロイ (GitHub Pages)
`npm run build` を実行すると `dist` フォルダに静的ファイルが生成されます。これを GitHub Pages 等のホスティングサービスにデプロイしてください。

### 公開前チェックリスト
- [x] OGP設定済み
- [x] レスポンシブ対応
- [x] キーボード操作対応
- [x] セーブデータのインポート/エクスポート確認

---

<a name="english"></a>
## 🇺🇸 Termicrawler (English)

**"A Typing Roguelike in the Abyss of the Command Terminal"**

Termicrawler is a browser-based typing roguelike game with a retro command-line interface (CLI) aesthetic.
Dive into the unknown "Terminal Dungeon," use your typing skills to eliminate hostile programs, and descend into the depths.

### Features
- **Terminal UI**: Retro command prompt aesthetic with green text on a black background.
- **Typing Combat**: Battle enemies using your typing speed and accuracy.
- **Roguelike**: Dungeons are randomly generated every run.
- **Save System**: Progress is auto-saved locally, with support for exporting/importing save data as text strings.

### How to Play
1. **Move**: Use Arrow keys or `WASD` to navigate the dungeon.
2. **Combat**: Encounter enemies to enter combat mode. Type the displayed words quickly to attack.
3. **Explore**: Find the exit (green area) to proceed to the next floor.

### Setup & Development
Built with Vite, React, and TypeScript.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Deployment
Run `npm run build` to generate static files in the `dist` folder. Deploy these files to GitHub Pages or any static hosting service.

