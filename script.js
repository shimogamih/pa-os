<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

  <title>PA-OS | Portfolio AI Guild</title>

  <link rel="stylesheet" href="style.css">
</head>

<body>

<div id="app">

  <!-- =========================
       HEADER
  ========================== -->

  <header class="topbar">

    <div>
      <div class="logo">PA-OS</div>
      <div class="subtitle">PORTFOLIO AI GUILD</div>
    </div>

    <div class="market-badge">
      <span class="status-dot"></span>
      <span id="market-status">MARKET READY</span>
    </div>

  </header>


  <!-- =========================
       START SCREEN
  ========================== -->

  <section id="start-screen" class="screen active">

    <div class="hero">

      <div class="hero-emblem">
        ⚔️
      </div>

      <div class="eyebrow">
        PORTFOLIO ADVENTURE OS
      </div>

      <h1>
        あなたの資産を<br>
        <span>最強のギルド</span>へ
      </h1>

      <p>
        保有銘柄を仲間として分析し、<br>
        ポートフォリオ全体の戦力を判定します。
      </p>

      <button id="launch-btn" class="main-button">
        <span>⚔</span>
        ポートフォリオAI起動
      </button>

    </div>


    <div class="sample-status">

      <div>
        <span>GUILD</span>
        <strong>未編成</strong>
      </div>

      <div>
        <span>RANK</span>
        <strong>---</strong>
      </div>

      <div>
        <span>SCORE</span>
        <strong>---</strong>
      </div>

    </div>

  </section>


  <!-- =========================
       DASHBOARD
  ========================== -->

  <section id="dashboard-screen" class="screen">

    <!-- Guild Header -->

    <div class="guild-header">

      <div>

        <div class="eyebrow">
          PORTFOLIO GUILD
        </div>

        <h2 id="guild-name">
          暁の資産騎士団
        </h2>

        <div class="guild-class" id="guild-class">
          バランス型ギルド
        </div>

      </div>

      <div class="guild-rank">

        <span>GUILD RANK</span>

        <strong id="guild-rank">
          A
        </strong>

      </div>

    </div>


    <!-- Overall Score -->

    <div class="score-card">

      <div>

        <span class="card-label">
          PORTFOLIO POWER
        </span>

        <div class="score-number">
          <strong id="overall-score">82</strong>
          <span>/100</span>
        </div>

      </div>

      <div class="score-description">

        <strong id="score-title">
          安定した強力なパーティ
        </strong>

        <p id="score-description">
          防御力と継続戦力に優れています。
        </p>

      </div>

    </div>


    <!-- Today's Formation -->

    <div class="section-title">

      <div>
        <span class="eyebrow">TODAY'S FORMATION</span>
        <h3>今日の陣形</h3>
      </div>

      <span class="formation-name">
        鉄壁の布陣
      </span>

    </div>


    <div id="party" class="party-grid">
      <!-- JavaScript -->
    </div>


    <!-- MVP -->

    <div class="mvp-card">

      <div class="mvp-icon">
        👑
      </div>

      <div>

        <span class="eyebrow">
          TODAY'S MVP
        </span>

        <h3 id="mvp-name">
          日本精工
        </h3>

        <p id="mvp-text">
          ギルドの防御力と安定性に大きく貢献。
        </p>

      </div>

      <div class="mvp-score">
        <strong id="mvp-score">91</strong>
        <span>PTS</span>
      </div>

    </div>


    <!-- Risk -->

    <div class="section-title">

      <div>
        <span class="eyebrow">RISK ANALYSIS</span>
        <h3>リスク分析</h3>
      </div>

    </div>


    <div class="risk-card">

      <div class="risk-row">

        <div class="risk-name">
          <span>Market Risk</span>
          <strong id="market-risk-value">42</strong>
        </div>

        <div class="risk-bar">
          <div id="market-risk-bar" style="width:42%"></div>
        </div>

      </div>


      <div class="risk-row">

        <div class="risk-name">
          <span>Sector Risk</span>
          <strong id="sector-risk-value">35</strong>
        </div>

        <div class="risk-bar">
          <div id="sector-risk-bar" style="width:35%"></div>
        </div>

      </div>


      <div class="risk-row">

        <div class="risk-name">
          <span>Concentration</span>
          <strong id="concentration-risk-value">28</strong>
        </div>

        <div class="risk-bar">
          <div id="concentration-risk-bar" style="width:28%"></div>
        </div>

      </div>

    </div>


    <!-- Strategy -->

    <div class="section-title">

      <div>
        <span class="eyebrow">TODAY'S STRATEGY</span>
        <h3>今日の作戦</h3>
      </div>

    </div>


    <div class="strategy-grid">

      <div class="strategy-card continue">
        <span>📈</span>
        <strong>積立継続</strong>
        <small>GOOD</small>
      </div>

      <div class="strategy-card wait">
        <span>⏳</span>
        <strong>押し目待ち</strong>
        <small>WATCH</small>
      </div>

      <div class="strategy-card buy">
        <span>⚔️</span>
        <strong>買い候補</strong>
        <small>READY</small>
      </div>

      <div class="strategy-card sell">
        <span>💰</span>
        <strong>利益確定</strong>
        <small>CHECK</small>
      </div>

    </div>


    <!-- Holdings -->

    <div class="section-title">

      <div>
        <span class="eyebrow">GUILD MEMBERS</span>
        <h3>ギルドメンバー</h3>
      </div>

      <button id="show-all-btn" class="small-button">
        全員を見る
      </button>

    </div>


    <div id="holdings-list" class="holdings-list">
      <!-- JavaScript -->
    </div>


    <!-- Candidate -->

    <div class="candidate-card">

      <span class="eyebrow">
        RECRUITMENT
      </span>

      <h3>新しい仲間候補</h3>

      <p id="candidate-text">
        現在のギルドには「攻撃力」の補強が有効です。
      </p>

      <button id="candidate-btn" class="outline-button">
        買い候補を見る
      </button>

    </div>


    <button id="back-start-btn" class="back-button">
      ← ギルド画面を閉じる
    </button>

  </section>


  <!-- =========================
       HOLDING DETAIL
  ========================== -->

  <section id="detail-screen" class="screen">

    <button id="detail-back-btn" class="back-top">
      ← 戻る
    </button>

    <div class="detail-hero">

      <div class="character-large" id="detail-icon">
        🛡️
      </div>

      <div>

        <span class="eyebrow" id="detail-role">
          DEFENSE
        </span>

        <h2 id="detail-name">
          日本精工
        </h2>

        <div id="detail-code">
          6471
        </div>

      </div>

    </div>


    <div class="detail-score">

      <span>CHARACTER SCORE</span>

      <strong id="detail-score">
        91
      </strong>

      <small>/100</small>

    </div>


    <div class="detail-grid">

      <div>
        <span>安定性</span>
        <strong id="detail-stability">90</strong>
      </div>

      <div>
        <span>成長性</span>
        <strong id="detail-growth">74</strong>
      </div>

      <div>
        <span>配当</span>
        <strong id="detail-dividend">82</strong>
      </div>

      <div>
        <span>割安度</span>
        <strong id="detail-value">79</strong>
      </div>

    </div>


    <div class="detail-panel">

      <h3>⚔️ 強み</h3>

      <p id="detail-strength">
        安定性が高く、ポートフォリオの防御役として機能。
      </p>

    </div>


    <div class="detail-panel">

      <h3>⚠️ 弱み</h3>

      <p id="detail-weakness">
        景気循環の影響を受ける可能性があります。
      </p>

    </div>


    <div class="detail-panel advice">

      <span class="eyebrow">
        AI ADVICE
      </span>

      <h3 id="detail-advice-title">
        継続保有
      </h3>

      <p id="detail-advice">
        現時点では急いで売買する必要はありません。
      </p>

    </div>

  </section>


  <!-- =========================
       ALL MEMBERS
  ========================== -->

  <section id="members-screen" class="screen">

    <button id="members-back-btn" class="back-top">
      ← 戻る
    </button>

    <div class="page-title">

      <span class="eyebrow">
        FULL PARTY
      </span>

      <h2>ギルドメンバー全員</h2>

    </div>

    <div id="all-members-list" class="all-members-list">
      <!-- JavaScript -->
    </div>

  </section>

</div>


<script src="script.js"></script>

</body>
</html>
