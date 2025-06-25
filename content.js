// Symbol別ポジションタイマー管理クラス
class SymbolPositionTimer {
  constructor() {
    this.symbolTimers = new Map(); // Symbol -> { startTime, element, interval, fontSize, width, height }
    this.observer = null;
    this.savedPositions = this.loadPositions();
    this.init();
  }

  init() {
    // DOM監視を開始
    this.startObserving();
    
    // 初期状態をチェック
    this.checkPositions();
  }

  // 位置情報をlocalStorageから読み込み
  loadPositions() {
    try {
      const saved = localStorage.getItem('topstepx-symbol-timer-positions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('TopstepX Timer: Error loading positions:', error);
      return {};
    }
  }

  // 位置情報をlocalStorageに保存
  savePositions() {
    try {
      localStorage.setItem('topstepx-symbol-timer-positions', JSON.stringify(this.savedPositions));
    } catch (error) {
      console.error('TopstepX Timer: Error saving positions:', error);
    }
  }

  // 個別のタイマー要素を作成
  createTimerElement(symbol, index) {
    const timerId = `topstepx-timer-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // 既存の要素があれば削除
    const existing = document.getElementById(timerId);
    if (existing) {
      existing.remove();
    }

    // タイマー表示用の要素を作成
    const timerElement = document.createElement('div');
    timerElement.id = timerId;
    timerElement.className = 'topstepx-symbol-timer font-size-normal';
    
    // 保存された設定を復元
    const savedPos = this.savedPositions[symbol];
    if (savedPos) {
      timerElement.style.left = `${savedPos.left}px`;
      timerElement.style.top = `${savedPos.top}px`;
      if (savedPos.width) timerElement.style.width = `${savedPos.width}px`;
      if (savedPos.height) timerElement.style.height = `${savedPos.height}px`;
      if (savedPos.fontSize) timerElement.className = `topstepx-symbol-timer ${savedPos.fontSize}`;
    } else {
      // 初期位置（右下から順番に配置）
      const baseRight = 20;
      const baseBottom = 20;
      const offset = index * 80; // 各タイマーの間隔
      
      timerElement.style.right = `${baseRight}px`;
      timerElement.style.bottom = `${baseBottom + offset}px`;
      timerElement.style.width = '140px';
      timerElement.style.height = '70px';
    }
    
    timerElement.innerHTML = `
      <div class="symbol-timer-container">
        <div class="symbol-timer-header">
          <span class="symbol-name">${symbol}</span>
          <div class="timer-controls">
            <button class="timer-control-btn font-btn" title="フォントサイズ変更">A</button>
            <button class="timer-control-btn timer-close-btn" title="閉じる">×</button>
          </div>
        </div>
        <div class="timer-display">00:00</div>
        <div class="resize-handle resize-handle-se" title="リサイズ"></div>
        <div class="resize-handle resize-handle-s" title="縦リサイズ"></div>
        <div class="resize-handle resize-handle-e" title="横リサイズ"></div>
      </div>
    `;
    
    // 機能を初期化
    this.initDragFunctionality(timerElement, symbol);
    this.initResizeFunctionality(timerElement, symbol);
    this.initFontSizeControl(timerElement, symbol);
    this.initCloseButton(timerElement);
    
    document.body.appendChild(timerElement);
    return timerElement;
  }

  // フォントサイズ制御を初期化
  initFontSizeControl(timerElement, symbol) {
    const fontBtn = timerElement.querySelector('.font-btn');
    const fontSizes = ['font-size-small', 'font-size-normal', 'font-size-large', 'font-size-xlarge'];
    let currentFontIndex = 1; // normal
    
    // 保存されたフォントサイズを復元
    const savedPos = this.savedPositions[symbol];
    if (savedPos && savedPos.fontSize) {
      currentFontIndex = fontSizes.indexOf(savedPos.fontSize);
      if (currentFontIndex === -1) currentFontIndex = 1;
    }
    
    fontBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // 次のフォントサイズに変更
      currentFontIndex = (currentFontIndex + 1) % fontSizes.length;
      const newFontSize = fontSizes[currentFontIndex];
      
      // クラスを更新
      timerElement.className = `topstepx-symbol-timer ${newFontSize}`;
      
      // 設定を保存
      if (!this.savedPositions[symbol]) {
        this.savedPositions[symbol] = {};
      }
      this.savedPositions[symbol].fontSize = newFontSize;
      this.savePositions();
    });
  }

  // 閉じるボタンを初期化
  initCloseButton(timerElement) {
    const closeBtn = timerElement.querySelector('.timer-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      timerElement.style.display = 'none';
    });
  }

  // リサイズ機能を初期化
  initResizeFunctionality(timerElement, symbol) {
    const resizeHandles = timerElement.querySelectorAll('.resize-handle');
    
    resizeHandles.forEach(handle => {
      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      
      const handleMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = timerElement.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        
        timerElement.classList.add('resizing');
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      };
      
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        
        if (handle.classList.contains('resize-handle-se')) {
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
        } else if (handle.classList.contains('resize-handle-s')) {
          newHeight = startHeight + deltaY;
        } else if (handle.classList.contains('resize-handle-e')) {
          newWidth = startWidth + deltaX;
        }
        
        // 最小サイズを制限
        newWidth = Math.max(120, newWidth);
        newHeight = Math.max(60, newHeight);
        
        // 最大サイズを制限（画面サイズに基づく）
        newWidth = Math.min(window.innerWidth - 50, newWidth);
        newHeight = Math.min(window.innerHeight - 50, newHeight);
        
        timerElement.style.width = `${newWidth}px`;
        timerElement.style.height = `${newHeight}px`;
      };
      
      const handleMouseUp = () => {
        if (!isResizing) return;
        
        isResizing = false;
        timerElement.classList.remove('resizing');
        
        // サイズを保存
        const rect = timerElement.getBoundingClientRect();
        if (!this.savedPositions[symbol]) {
          this.savedPositions[symbol] = {};
        }
        this.savedPositions[symbol].width = rect.width;
        this.savedPositions[symbol].height = rect.height;
        this.savePositions();
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      // タッチデバイス対応
      const handleTouchStart = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const touch = e.touches[0];
        isResizing = true;
        startX = touch.clientX;
        startY = touch.clientY;
        
        const rect = timerElement.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        
        timerElement.classList.add('resizing');
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
      };
      
      const handleTouchMove = (e) => {
        if (!isResizing) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        
        if (handle.classList.contains('resize-handle-se')) {
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
        } else if (handle.classList.contains('resize-handle-s')) {
          newHeight = startHeight + deltaY;
        } else if (handle.classList.contains('resize-handle-e')) {
          newWidth = startWidth + deltaX;
        }
        
        newWidth = Math.max(120, Math.min(window.innerWidth - 50, newWidth));
        newHeight = Math.max(60, Math.min(window.innerHeight - 50, newHeight));
        
        timerElement.style.width = `${newWidth}px`;
        timerElement.style.height = `${newHeight}px`;
      };
      
      const handleTouchEnd = () => {
        if (!isResizing) return;
        
        isResizing = false;
        timerElement.classList.remove('resizing');
        
        const rect = timerElement.getBoundingClientRect();
        if (!this.savedPositions[symbol]) {
          this.savedPositions[symbol] = {};
        }
        this.savedPositions[symbol].width = rect.width;
        this.savedPositions[symbol].height = rect.height;
        this.savePositions();
        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      handle.addEventListener('mousedown', handleMouseDown);
      handle.addEventListener('touchstart', handleTouchStart, { passive: false });
    });
  }

  initDragFunctionality(timerElement, symbol) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e) => {
      // リサイズハンドルやボタンをクリックした場合はドラッグしない
      if (e.target.classList.contains('resize-handle') || 
          e.target.classList.contains('timer-control-btn')) {
        return;
      }
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = timerElement.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      timerElement.style.transition = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      
      // 画面境界内に制限
      const rect = timerElement.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      timerElement.style.left = `${newX}px`;
      timerElement.style.top = `${newY}px`;
      timerElement.style.right = 'auto';
      timerElement.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      isDragging = false;
      timerElement.style.transition = '';
      
      // 現在の位置を保存
      const rect = timerElement.getBoundingClientRect();
      if (!this.savedPositions[symbol]) {
        this.savedPositions[symbol] = {};
      }
      this.savedPositions[symbol].top = rect.top;
      this.savedPositions[symbol].left = rect.left;
      this.savePositions();
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // タッチデバイス対応
    const handleTouchStart = (e) => {
      if (e.target.classList.contains('resize-handle') || 
          e.target.classList.contains('timer-control-btn')) {
        return;
      }
      
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      
      const rect = timerElement.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      timerElement.style.transition = 'none';
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;
      
      const rect = timerElement.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      timerElement.style.left = `${newX}px`;
      timerElement.style.top = `${newY}px`;
      timerElement.style.right = 'auto';
      timerElement.style.bottom = 'auto';
      
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      isDragging = false;
      timerElement.style.transition = '';
      
      const rect = timerElement.getBoundingClientRect();
      if (!this.savedPositions[symbol]) {
        this.savedPositions[symbol] = {};
      }
      this.savedPositions[symbol].top = rect.top;
      this.savedPositions[symbol].left = rect.left;
      this.savePositions();
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    // イベントリスナーを追加（ヘッダー部分のみドラッグ可能）
    const header = timerElement.querySelector('.symbol-timer-header');
    const container = timerElement.querySelector('.symbol-timer-container');
    
    header.addEventListener('mousedown', handleMouseDown);
    header.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // コンテナ全体でもドラッグ可能（リサイズハンドル以外）
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
  }

  startObserving() {
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true
    };

    this.observer = new MutationObserver((mutations) => {
      this.checkPositions();
    });

    const targets = [
      document.getElementById('positionTab'),
      document.querySelector('.dock-tabpane-active#positionTab'),
      document.querySelector('[role="tabpanel"]'),
      document.body
    ];
    
    const observeTarget = targets.find(t => t !== null) || document.body;
    console.log('TopstepX Symbol Timer: Observing element:', observeTarget.id || observeTarget.className || 'body');
    
    this.observer.observe(observeTarget, config);
  }

  // 時刻文字列を解析してタイムスタンプに変換
  parseTimeString(timeString) {
    if (!timeString) return null;
    
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!timeMatch) return null;
      
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      
      const positionTime = new Date(today);
      positionTime.setHours(hours, minutes, seconds, 0);
      
      if (positionTime > now) {
        positionTime.setDate(positionTime.getDate() - 1);
      }
      
      return positionTime.getTime();
    } catch (error) {
      console.error('TopstepX Symbol Timer: Error parsing time string:', timeString, error);
      return null;
    }
  }

  checkPositions() {
    console.log('TopstepX Symbol Timer: Checking positions...');
    
    // Positionsタブパネルを特定
    const panels = document.querySelectorAll('[role="tabpanel"]');
    let positionsPanel = null;
    
    for (const panel of panels) {
      const headers = panel.querySelectorAll('.MuiDataGrid-columnHeaderTitle');
      const headerTexts = Array.from(headers).map(h => h.textContent);
      
      if (headerTexts.includes('Entry Price') && 
          headerTexts.includes('Risk') && 
          headerTexts.includes('To Make')) {
        positionsPanel = panel;
        console.log('TopstepX Symbol Timer: Found Positions panel');
        break;
      }
    }
    
    if (!positionsPanel) {
      positionsPanel = document.getElementById('positionTab');
    }
    
    let dataRows = [];
    
    if (positionsPanel) {
      dataRows = positionsPanel.querySelectorAll('.MuiDataGrid-virtualScrollerRenderZone .MuiDataGrid-row[data-id]');
      console.log(`TopstepX Symbol Timer: Found ${dataRows.length} position rows`);
    }
    
    // 現在のポジション情報を収集
    const currentPositions = new Map();
    
    dataRows.forEach((row, index) => {
      const symbolCell = row.querySelector('[data-field="symbolName"]') || 
                        row.querySelector('[data-field="symbol"]') ||
                        row.querySelector('[data-field*="symbol" i]');
      
      const timeCell = row.querySelector('[data-field="time"]') || 
                      row.querySelector('[data-field="Time"]') ||
                      row.querySelector('[data-field*="time" i]');
      
      if (symbolCell && timeCell) {
        const symbol = symbolCell.textContent.trim();
        const timeString = timeCell.textContent.trim();
        const timestamp = this.parseTimeString(timeString);
        
        if (symbol && timestamp) {
          // 同じシンボルの複数ポジションがある場合は最も古い時刻を使用
          if (!currentPositions.has(symbol) || timestamp < currentPositions.get(symbol).timestamp) {
            currentPositions.set(symbol, {
              timestamp: timestamp,
              index: index
            });
          }
          
          console.log(`Symbol: ${symbol}, Time: ${timeString}, Timestamp: ${new Date(timestamp)}`);
        }
      }
    });
    
    // 新しいポジションのタイマーを開始
    currentPositions.forEach((positionData, symbol) => {
      if (!this.symbolTimers.has(symbol)) {
        console.log(`Starting timer for ${symbol}`);
        this.startTimerForSymbol(symbol, positionData.timestamp, positionData.index);
      } else {
        // 既存のタイマーの開始時刻を更新（より古い時刻がある場合）
        const existingTimer = this.symbolTimers.get(symbol);
        if (positionData.timestamp < existingTimer.startTime) {
          console.log(`Updating timer start time for ${symbol}`);
          existingTimer.startTime = positionData.timestamp;
        }
      }
    });
    
    // 削除されたポジションのタイマーを停止
    const symbolsToRemove = [];
    this.symbolTimers.forEach((timerData, symbol) => {
      if (!currentPositions.has(symbol)) {
        console.log(`Stopping timer for ${symbol}`);
        this.stopTimerForSymbol(symbol);
        symbolsToRemove.push(symbol);
      }
    });
    
    symbolsToRemove.forEach(symbol => {
      this.symbolTimers.delete(symbol);
    });
  }

  startTimerForSymbol(symbol, startTime, index) {
    // タイマー要素を作成
    const element = this.createTimerElement(symbol, index);
    
    // タイマーデータを保存
    const timerData = {
      startTime: startTime,
      element: element,
      interval: null
    };
    
    // 初回表示
    this.updateTimerDisplay(timerData);
    
    // 1秒ごとに更新
    timerData.interval = setInterval(() => {
      this.updateTimerDisplay(timerData);
    }, 1000);
    
    this.symbolTimers.set(symbol, timerData);
  }

  stopTimerForSymbol(symbol) {
    const timerData = this.symbolTimers.get(symbol);
    if (timerData) {
      if (timerData.interval) {
        clearInterval(timerData.interval);
      }
      if (timerData.element) {
        timerData.element.remove();
      }
    }
  }

  updateTimerDisplay(timerData) {
    if (!timerData.startTime || !timerData.element) return;
    
    const elapsed = Date.now() - timerData.startTime;
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
    
    const display = timerData.element.querySelector('.timer-display');
    if (display) {
      display.textContent = timeString;
    }
  }

  // クリーンアップ用のメソッド
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.symbolTimers.forEach((timerData, symbol) => {
      this.stopTimerForSymbol(symbol);
    });
    
    this.symbolTimers.clear();
  }
}

// ページ読み込み完了後にタイマーを初期化
let symbolTimerInstance = null;

function initializeSymbolTimer() {
  try {
    // 既存のインスタンスがあれば破棄
    if (symbolTimerInstance) {
      symbolTimerInstance.destroy();
    }
    
    // TopstepXのページでのみ実行
    if (window.location.hostname.includes('topstepx.com')) {
      symbolTimerInstance = new SymbolPositionTimer();
      console.log('TopstepX Symbol Timer: Initialized successfully');
    }
  } catch (error) {
    console.error('TopstepX Symbol Timer: Initialization error:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeSymbolTimer, 1500);
  });
} else {
  setTimeout(initializeSymbolTimer, 1500);
}
