// ポジションタイマー管理クラス
class PositionTimer {
  constructor() {
    this.positionStartTime = null;
    this.timerInterval = null;
    this.timerElement = null;
    this.observer = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.savedPosition = this.loadPosition();
    this.init();
  }

  init() {
    // タイマー表示要素を作成
    this.createTimerElement();
    
    // ドラッグ機能を初期化
    this.initDragFunctionality();
    
    // DOM監視を開始
    this.startObserving();
    
    // 初期状態をチェック
    this.checkPositions();
  }

  // 位置情報をlocalStorageから読み込み
  loadPosition() {
    try {
      const saved = localStorage.getItem('topstepx-timer-position');
      return saved ? JSON.parse(saved) : { bottom: 20, right: 20 };
    } catch (error) {
      console.error('TopstepX Timer: Error loading position:', error);
      return { bottom: 20, right: 20 };
    }
  }

  // 位置情報をlocalStorageに保存
  savePosition(position) {
    try {
      localStorage.setItem('topstepx-timer-position', JSON.stringify(position));
      this.savedPosition = position;
    } catch (error) {
      console.error('TopstepX Timer: Error saving position:', error);
    }
  }

  createTimerElement() {
    // 既存の要素があれば削除
    const existing = document.getElementById('topstepx-position-timer');
    if (existing) {
      existing.remove();
    }

    // タイマー表示用のDIVを作成
    this.timerElement = document.createElement('div');
    this.timerElement.id = 'topstepx-position-timer';
    
    // 保存された位置を適用
    if (this.savedPosition.top !== undefined) {
      this.timerElement.style.top = `${this.savedPosition.top}px`;
      this.timerElement.style.bottom = 'auto';
    } else {
      this.timerElement.style.bottom = `${this.savedPosition.bottom}px`;
    }
    
    if (this.savedPosition.left !== undefined) {
      this.timerElement.style.left = `${this.savedPosition.left}px`;
      this.timerElement.style.right = 'auto';
    } else {
      this.timerElement.style.right = `${this.savedPosition.right}px`;
    }
    
    this.timerElement.innerHTML = `
      <div class="timer-container">
        <div class="timer-label">Position Time</div>
        <div class="timer-display">Waiting for position...</div>
      </div>
    `;
    document.body.appendChild(this.timerElement);
  }

  initDragFunctionality() {
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e) => {
      this.isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.timerElement.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      this.timerElement.style.transition = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      
      // 画面境界内に制限
      const rect = this.timerElement.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      this.timerElement.style.left = `${newX}px`;
      this.timerElement.style.top = `${newY}px`;
      this.timerElement.style.right = 'auto';
      this.timerElement.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.timerElement.style.transition = '';
      
      // 現在の位置を保存
      const rect = this.timerElement.getBoundingClientRect();
      const position = {
        top: rect.top,
        left: rect.left
      };
      this.savePosition(position);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // タッチデバイス対応
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      this.isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      
      const rect = this.timerElement.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      this.timerElement.style.transition = 'none';
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      if (!this.isDragging) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      
      // 画面境界内に制限
      const rect = this.timerElement.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      this.timerElement.style.left = `${newX}px`;
      this.timerElement.style.top = `${newY}px`;
      this.timerElement.style.right = 'auto';
      this.timerElement.style.bottom = 'auto';
      
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.timerElement.style.transition = '';
      
      // 現在の位置を保存
      const rect = this.timerElement.getBoundingClientRect();
      const position = {
        top: rect.top,
        left: rect.left
      };
      this.savePosition(position);
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    // イベントリスナーを追加
    this.timerElement.addEventListener('mousedown', handleMouseDown);
    this.timerElement.addEventListener('touchstart', handleTouchStart, { passive: false });
  }

  startObserving() {
    // MutationObserverの設定
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true
    };

    this.observer = new MutationObserver((mutations) => {
      // DOM変更を検知したらポジションをチェック
      this.checkPositions();
    });

    // 監視対象を設定
    // Positionsパネル（#positionTab）または全体を監視
    const targets = [
      document.getElementById('positionTab'),
      document.querySelector('.dock-tabpane-active#positionTab'),
      document.querySelector('[role="tabpanel"]'),
      document.body
    ];
    
    const observeTarget = targets.find(t => t !== null) || document.body;
    console.log('TopstepX Timer: Observing element:', observeTarget.id || observeTarget.className || 'body');
    
    this.observer.observe(observeTarget, config);
  }

  // 時刻文字列を解析してタイムスタンプに変換
  parseTimeString(timeString) {
    if (!timeString) return null;
    
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // "HH:MM:SS" または "HH:MM" 形式を解析
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!timeMatch) return null;
      
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      
      const positionTime = new Date(today);
      positionTime.setHours(hours, minutes, seconds, 0);
      
      // もし未来の時間なら前日として扱う
      if (positionTime > now) {
        positionTime.setDate(positionTime.getDate() - 1);
      }
      
      return positionTime.getTime();
    } catch (error) {
      console.error('TopstepX Timer: Error parsing time string:', timeString, error);
      return null;
    }
  }

  // 最も古いポジションの時刻を取得
  getEarliestPositionTime(dataRows) {
    let earliestTime = null;
    
    for (const row of dataRows) {
      // Timeカラムの値を取得（data-field="time" または "Time" など）
      const timeCell = row.querySelector('[data-field="time"]') || 
                      row.querySelector('[data-field="Time"]') ||
                      row.querySelector('[data-field*="time" i]');
      
      if (timeCell) {
        const timeString = timeCell.textContent.trim();
        console.log('TopstepX Timer: Found time string:', timeString);
        
        const timestamp = this.parseTimeString(timeString);
        if (timestamp && (!earliestTime || timestamp < earliestTime)) {
          earliestTime = timestamp;
        }
      }
    }
    
    return earliestTime;
  }

  checkPositions() {
    // デバッグログ
    console.log('TopstepX Timer: Checking positions...');
    
    // Positionsタブパネルを特定
    // ヘッダーに「Entry Price」「Risk」「To Make」などがあるパネルがPositionsパネル
    const panels = document.querySelectorAll('[role="tabpanel"]');
    let positionsPanel = null;
    
    for (const panel of panels) {
      const headers = panel.querySelectorAll('.MuiDataGrid-columnHeaderTitle');
      const headerTexts = Array.from(headers).map(h => h.textContent);
      
      // Positionsパネルの特徴的なヘッダーを確認
      if (headerTexts.includes('Entry Price') && 
          headerTexts.includes('Risk') && 
          headerTexts.includes('To Make')) {
        positionsPanel = panel;
        console.log('TopstepX Timer: Found Positions panel');
        break;
      }
    }
    
    // IDでも確認（positionTabというIDを持つ要素）
    if (!positionsPanel) {
      positionsPanel = document.getElementById('positionTab');
    }
    
    let dataRows = [];
    
    if (positionsPanel) {
      // Positionsパネル内のデータ行を取得
      dataRows = positionsPanel.querySelectorAll('.MuiDataGrid-virtualScrollerRenderZone .MuiDataGrid-row[data-id]');
      console.log(`TopstepX Timer: Found ${dataRows.length} position rows in Positions panel`);
    } else {
      console.log('TopstepX Timer: Positions panel not found');
    }
    
    // データ行の内容を確認（デバッグ用）
    if (dataRows.length > 0) {
      dataRows.forEach((row, index) => {
        const symbol = row.querySelector('[data-field="symbolName"]')?.textContent;
        const position = row.querySelector('[data-field="positionSize"]')?.textContent;
        const timeCell = row.querySelector('[data-field="time"]') || 
                        row.querySelector('[data-field="Time"]') ||
                        row.querySelector('[data-field*="time" i]');
        const time = timeCell?.textContent;
        console.log(`Position ${index}: Symbol=${symbol}, Size=${position}, Time=${time}`);
      });
    }
    
    // ポジション行が存在するかチェック
    const hasPositions = dataRows.length > 0;
    
    if (hasPositions) {
      // 最も古いポジションの時刻を取得
      const earliestPositionTime = this.getEarliestPositionTime(dataRows);
      
      if (earliestPositionTime) {
        // 約定時間ベースでタイマーを更新
        if (this.positionStartTime !== earliestPositionTime) {
          console.log('TopstepX Timer: Position time changed, updating timer');  
          this.positionStartTime = earliestPositionTime;
          this.startTimer();
        }
      } else if (!this.positionStartTime) {
        // 時刻が取得できない場合は現在時刻を使用
        console.log('TopstepX Timer: Could not get position time, using current time');
        this.positionStartTime = Date.now();
        this.startTimer();
      }
    } else if (this.positionStartTime) {
      // ポジションがなくなった場合
      console.log('TopstepX Timer: No positions, stopping timer');
      this.stopTimer();
    } else {
      console.log(`TopstepX Timer: Status - hasPositions: ${hasPositions}, timerRunning: ${!!this.positionStartTime}`);
    }
  }

  startTimer() {
    this.updateTimer();
    
    // 既存のインターバルをクリア
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // 1秒ごとにタイマーを更新
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  stopTimer() {
    this.positionStartTime = null;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    const display = this.timerElement.querySelector('.timer-display');
    display.textContent = 'Waiting for position...';
    display.classList.remove('active');
  }

  updateTimer() {
    if (!this.positionStartTime) return;
    
    const elapsed = Date.now() - this.positionStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const displaySeconds = seconds % 60;
    const displayMinutes = minutes % 60;
    
    let timeString = '';
    if (hours > 0) {
      timeString = `${hours}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
    } else {
      timeString = `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
    }
    
    const display = this.timerElement.querySelector('.timer-display');
    display.textContent = timeString;
    display.classList.add('active');
  }

  // クリーンアップ用のメソッド
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.timerElement) {
      this.timerElement.remove();
    }
  }
}

// ページ読み込み完了後にタイマーを初期化
let timerInstance = null;

function initializeTimer() {
  try {
    // 既存のインスタンスがあれば破棄
    if (timerInstance) {
      timerInstance.destroy();
    }
    
    // TopstepXのページでのみ実行
    if (window.location.hostname.includes('topstepx.com')) {
      timerInstance = new PositionTimer();
      console.log('TopstepX Timer: Initialized successfully');
    }
  } catch (error) {
    console.error('TopstepX Timer: Initialization error:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // MuiDataGridが読み込まれるまで少し待機
    setTimeout(initializeTimer, 1500);
  });
} else {
  // すでに読み込み完了している場合も少し待機
  setTimeout(initializeTimer, 1500);
}
