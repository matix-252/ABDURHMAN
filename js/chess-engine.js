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
        orientation: 'white',
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

    // Only pick up white pieces on white's turn
    if (game.turn() === 'w' && piece.search(/^b/) !== -1) {
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
    
    // Get all possible moves
    const moves = game.moves({ verbose: true });
    
    // Pick a random move
    const move = moves[Math.floor(Math.random() * moves.length)];
    
    // Check if the move captures a piece
    const capturedPiece = game.get(move.to);
    
    // Make the move
    game.move(move);
    
    // If a piece was captured, add it to the captured pieces
    if (capturedPiece) {
        const color = capturedPiece.color;
        capturedPieces[color].push(capturedPiece.type);
        updateCapturedPieces();
    }
    
    // Update the board
    board.position(game.fen());
    
    isComputerThinking = false;
    updateStatus();
}

function updateCapturedPieces() {
    // Update white captured pieces
    const whiteCaptured = document.getElementById('captured-white');
    whiteCaptured.innerHTML = '';
    capturedPieces.w.forEach(piece => {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'captured-piece';
        pieceDiv.style.backgroundImage = `url('https://chessboardjs.com/img/chesspieces/wikipedia/w${piece}.png')`;
        whiteCaptured.appendChild(pieceDiv);
    });

    // Update black captured pieces
    const blackCaptured = document.getElementById('captured-black');
    blackCaptured.innerHTML = '';
    capturedPieces.b.forEach(piece => {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'captured-piece';
        pieceDiv.style.backgroundImage = `url('https://chessboardjs.com/img/chesspieces/wikipedia/b${piece}.png')`;
        blackCaptured.appendChild(pieceDiv);
    });
}

function updateStatus() {
    let status = '';
    let moveColor = game.turn() === 'w' ? 'الأبيض' : 'الأسود';

    if (game.in_checkmate()) {
        status = 'انتهت اللعبة، ' + moveColor + ' في وضع الكش مات!';
    } else if (game.in_draw()) {
        status = 'انتهت اللعبة، تعادل!';
    } else {
        status = moveColor + ' يلعب';
        if (game.in_check()) {
            status += '، ' + moveColor + ' في وضع الكش';
        }
    }

    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = status;
    }
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
