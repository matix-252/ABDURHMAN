// Initialize global variables
let board = null;
let game = null;
let isComputerThinking = false;
let capturedPieces = {
    w: [], // White pieces captured by black
    b: []  // Black pieces captured by white
};

// Wait for DOM to load before initializing
document.addEventListener('DOMContentLoaded', function() {
    initializeChessBoard();
});

function initializeChessBoard() {
    // Initialize new game
    game = new Chess();
    capturedPieces = { w: [], b: [] };

    // Configure the board
    const config = {
        draggable: true,
        position: 'start',
        orientation: 'white', // تثبيت اتجاه اللوحة للأبيض دائماً
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        showNotation: true,
        moveSpeed: 'fast',
        snapSpeed: 100,
        sparePieces: false
    };

    // Create the board
    board = Chessboard('chessboard', config);
    
    // Update the game status
    updateStatus();
    updateCapturedPieces();

    // Make board responsive
    window.addEventListener('resize', () => {
        board.resize();
    });

    // Add click handlers for buttons
    document.getElementById('newGame').addEventListener('click', startNewGame);
    document.getElementById('undo').addEventListener('click', undoMove);
}

function onDragStart(source, piece) {
    // Do not pick up pieces if the game is over
    if (game.game_over()) {
        return false;
    }

    // Do not pick up pieces if computer is thinking
    if (isComputerThinking) {
        return false;
    }

    // Only allow white pieces to be moved (player always plays as white)
    if (piece.search(/^b/) !== -1) {
        return false;
    }

    return true;
}

function onDrop(source, target) {
    // Get the piece that was at the target square (if any)
    const capturedPiece = game.get(target);
    
    // Check if the move is legal
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to queen for simplicity
    });

    // If illegal move, snap back
    if (move === null) {
        return 'snapback';
    }

    // If a piece was captured, add it to the captured pieces
    if (capturedPiece) {
        const color = capturedPiece.color;
        capturedPieces[color].push(capturedPiece.type);
        // Update captured pieces display immediately
        updateCapturedPieces();
    }

    // Update the board position
    board.position(game.fen());

    // Update game status
    updateStatus();

    // Make computer move after a short delay
    if (!game.game_over()) {
        setTimeout(makeComputerMove, 250);
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

function makeComputerMove() {
    isComputerThinking = true;

    setTimeout(() => {
        // Get all possible moves
        const possibleMoves = game.moves();

        // Exit if game is over
        if (possibleMoves.length === 0) {
            isComputerThinking = false;
            return;
        }

        // Choose a random move
        const randomIdx = Math.floor(Math.random() * possibleMoves.length);
        const move = possibleMoves[randomIdx];

        // Make the move
        const moveResult = game.move(move);

        // If a piece was captured, add it to captured pieces
        if (moveResult.captured) {
            capturedPieces['w'].push(moveResult.captured);
            updateCapturedPieces();
        }

        // Update the board
        board.position(game.fen());
        
        // Update game status
        updateStatus();
        
        isComputerThinking = false;
    }, 250);
}

function updateCapturedPieces() {
    // Update white captured pieces
    const whiteCaptured = document.getElementById('captured-white');
    if (whiteCaptured) {
        whiteCaptured.innerHTML = '';
        capturedPieces.w.forEach(piece => {
            const pieceImg = document.createElement('img');
            pieceImg.src = `https://chessboardjs.com/img/chesspieces/wikipedia/w${piece.toUpperCase()}.png`;
            pieceImg.classList.add('captured-piece', 'animate__animated', 'animate__fadeIn');
            pieceImg.alt = `White ${piece}`;
            whiteCaptured.appendChild(pieceImg);
        });
    }

    // Update black captured pieces
    const blackCaptured = document.getElementById('captured-black');
    if (blackCaptured) {
        blackCaptured.innerHTML = '';
        capturedPieces.b.forEach(piece => {
            const pieceImg = document.createElement('img');
            pieceImg.src = `https://chessboardjs.com/img/chesspieces/wikipedia/b${piece.toUpperCase()}.png`;
            pieceImg.classList.add('captured-piece', 'animate__animated', 'animate__fadeIn');
            pieceImg.alt = `Black ${piece}`;
            blackCaptured.appendChild(pieceImg);
        });
    }
}

function updateStatus() {
    let status = '';
    let statusClass = '';

    // التحقق من الكش مات
    if (game.in_checkmate()) {
        if (game.turn() === 'b') {
            status = 'مبروك! لقد فزت بالمباراة! ✨👑';
            statusClass = 'status-win';
            showGameEndMessage('win');
        } else {
            status = 'للأسف خسرت المباراة! 😔';
            statusClass = 'status-lose';
            showGameEndMessage('lose');
        }
    }
    // التحقق من التعادل
    else if (game.in_draw()) {
        status = 'تعادل! 🤝';
        statusClass = 'status-draw';
        showGameEndMessage('draw');
    }
    // التحقق من الكش
    else if (game.in_check()) {
        status = 'كش! ⚠️';
        statusClass = 'status-check';
    }
    // التحقق من عدد القطع المتبقية
    else {
        let whitePieces = 0;
        let blackPieces = 0;
        const board = game.board();
        
        // حساب القطع المتبقية
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece) {
                    if (piece.color === 'w') whitePieces++;
                    if (piece.color === 'b') blackPieces++;
                }
            }
        }

        // إذا بقي ملك فقط
        if (whitePieces === 1) {
            status = 'للأسف خسرت المباراة! لم يتبق لديك قطع! 😔';
            statusClass = 'status-lose';
            showGameEndMessage('lose');
        } else if (blackPieces === 1) {
            status = 'مبروك! لقد فزت المباراة! لم يتبق لديه قطع! ✨👑';
            statusClass = 'status-win';
            showGameEndMessage('win');
        } else {
            status = 'دورك للعب! 🎮';
            statusClass = 'status-normal';
        }
    }

    const statusElement = document.getElementById('status');
    statusElement.textContent = status;
    // إزالة جميع الكلاسات السابقة
    statusElement.className = 'game-status ' + statusClass;
}

function showGameEndMessage(result) {
    const modal = document.createElement('div');
    modal.className = 'game-end-modal animate__animated animate__fadeIn';
    
    let message = '';
    let icon = '';
    
    switch(result) {
        case 'win':
            message = 'مبروك! لقد فزت! 🎉';
            icon = '👑';
            break;
        case 'lose':
            message = 'حظ أوفر في المرة القادمة! 🤗';
            icon = '😔';
            break;
        case 'draw':
            message = 'تعادل! مباراة جيدة! 🤝';
            icon = '🤝';
            break;
    }
    
    modal.innerHTML = `
        <div class="modal-content animate__animated animate__bounceIn">
            <div class="modal-icon">${icon}</div>
            <h2>${message}</h2>
            <button onclick="startNewGame()" class="play-again-btn">العب مرة أخرى</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إزالة المودال بعد الضغط عليه
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function startNewGame() {
    // Reset the game
    game = new Chess();
    
    // Reset captured pieces
    capturedPieces = { w: [], b: [] };
    updateCapturedPieces();
    
    // Reset the board
    board.start();
    
    // Update status
    updateStatus();
    
    // Clear computer thinking state
    isComputerThinking = false;
}

function undoMove() {
    if (isComputerThinking) {
        return;
    }

    // Remove the last two captured pieces if they exist
    if (game.history().length >= 2) {
        const moves = game.history({ verbose: true });
        const lastMove = moves[moves.length - 1];
        const secondLastMove = moves[moves.length - 2];
        
        // Remove captured pieces from the arrays
        if (lastMove.captured) {
            const color = lastMove.color === 'w' ? 'b' : 'w';
            capturedPieces[color].pop();
        }
        if (secondLastMove.captured) {
            const color = secondLastMove.color === 'w' ? 'b' : 'w';
            capturedPieces[color].pop();
        }
        
        // Undo the moves
        game.undo(); // Undo computer's move
        game.undo(); // Undo player's move
        
        // Update the display
        board.position(game.fen());
        updateCapturedPieces();
        updateStatus();
    }
}
