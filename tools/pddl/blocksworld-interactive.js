/*
 * Interactive Blocksworld Game
 * A playable version of the Blocksworld PDDL domain
 */

// Game state
let blocksworldGameState = {
  blocks: [],
  onRelationships: {},
  onTable: [],
  clearBlocks: [],
  armEmpty: true,
  holding: null,
  goalOnRelationships: {},
  block_colors: {},
  moves: 0,
  actionHistory: [],
  message: "Select a block to begin",
  stackTargetsVisible: false,
  selectedTargetBlock: null,
  modelPerformance: null,  // Will store the model performance data
  currentProblem: ""   // Will store the current problem name
};

// Canvas and rendering constants
const BLOCK_WIDTH = 60;
const BLOCK_HEIGHT = 48;
const TABLE_HEIGHT = 20;
const TABLE_Y = 400;
const BLOCK_COLORS = [
  '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c',
  '#d35400', '#2ecc71', '#34495e', '#16a085', '#8e44ad',
  '#f1c40f', '#7f8c8d', '#27ae60', '#c0392b', '#2980b9'
];

// Main setup function called from tra.html
function setupBlocksworldGame(domain, model, problem) {
  console.log(`Setting up Blocksworld game for ${domain}/${model}/${problem}`);
  
  // Create interactive game UI
  document.getElementById('interactiveDisplay').innerHTML = `
    <div class="game-container">
      <div class="columns">
        <div class="column is-8">
          <div class="box">
            <h3 class="title is-5">Blocksworld Interactive</h3>
            <canvas id="gameCanvas" width="800" height="500" style="border: 1px solid #ddd; border-radius: 4px;"></canvas>
            <div class="game-controls mt-3">
              <div class="buttons">
                <button id="pickupButton" class="button is-small is-info">Pickup</button>
                <button id="putdownButton" class="button is-small is-info">Putdown</button>
                <button id="stackButton" class="button is-small is-info">Stack</button>
                <button id="unstackButton" class="button is-small is-info">Unstack</button>
                <button id="resetGameButton" class="button is-small is-warning">Reset</button>
              </div>
            </div>
            <div id="gameMessage" class="notification is-light mt-3">
              Select a block to begin
            </div>
            <!-- Hint area for illegal actions -->
            <div id="hintMessage" class="notification is-info mt-2" style="display: none;">
              <!-- Hints will appear here -->
            </div>
            <!-- Dedicated ranking area -->
            <div id="rankingArea" class="mt-3">
              <!-- Ranking will appear here when goal is reached -->
            </div>
          </div>
        </div>
        <div class="column is-4">
          <div class="box">
            <h3 class="title is-5">Game Info</h3>
            <div class="content">
              <p><strong>Moves:</strong> <span id="moveCounter">0</span></p>
              <p><strong>Current Action:</strong> <span id="currentAction">None</span></p>
              
              <!-- Goal state section -->
              <div class="goal-state mt-4">
                <h4 class="title is-6">Goal State</h4>
                <canvas id="goalCanvas" width="300" height="250" style="border: 1px solid #ddd; border-radius: 4px;"></canvas>
                <ul id="goalStateList" class="mt-2">
                  <li>Loading goal state...</li>
                </ul>
              </div>
              
              <!-- Action descriptions section (moved below goal state) -->
              <div class="mt-4 mb-4">
                <h4 class="title is-6">Available Actions</h4>
                <div class="action-guide">
                  <div class="action-item">
                    <span class="tag is-info mb-1">pickup</span>
                    <p class="is-size-7">Grasp a clear block <span class="highlight-table">from the table</span></p>
                  </div>
                  <div class="action-item">
                    <span class="tag is-info mb-1">putdown</span>
                    <p class="is-size-7">Place the block you're holding <span class="highlight-table">onto the table</span></p>
                  </div>
                  <div class="action-item">
                    <span class="tag is-info mb-1">stack</span>
                    <p class="is-size-7">Place the block you're holding <span class="highlight-block">on top of another block</span></p>
                  </div>
                  <div class="action-item">
                    <span class="tag is-info mb-1">unstack</span>
                    <p class="is-size-7">Grasp a block that's <span class="highlight-block">on top of another block</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add CSS for action descriptions
  const style = document.createElement('style');
  style.textContent = `
    .action-guide {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .action-item {
      background-color: #f5f5f5;
      border-radius: 4px;
      padding: 8px;
      border-left: 3px solid #3498db;
    }
    .action-item p {
      margin-bottom: 0 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Load the Blocksworld problem and set up the game
  loadBlocksworldProblem(domain, model, problem);
  
  // Set up event listeners
  document.getElementById('resetGameButton').addEventListener('click', resetGame);
  document.getElementById('pickupButton').addEventListener('click', () => executeAction('pickup'));
  document.getElementById('putdownButton').addEventListener('click', () => executeAction('putdown'));
  document.getElementById('stackButton').addEventListener('click', () => showStackTargets());
  document.getElementById('unstackButton').addEventListener('click', () => executeAction('unstack'));
  
  // Set up canvas click handler
  const canvas = document.getElementById('gameCanvas');
  canvas.addEventListener('click', handleCanvasClick);
}

// Load problem data from PDDL files
function loadBlocksworldProblem(domain, model, problem) {
  if (!domain || !model || !problem) {
    console.log("Creating demo problem (no problem specified)");
    createDemoProblem();
    return;
  }
  
  // Store current problem - extract just the problem ID (p01, p02, etc.)
  const problemMatch = problem.match(/p\d+/);
  blocksworldGameState.currentProblem = problemMatch ? problemMatch[0] : problem;
  
  // Fetch model performance data
  fetch(`../../trajectories/PDDL/${domain}/model_performance.json`)
    .then(response => {
      if (!response.ok) {
        console.warn("Model performance data not found");
        return Promise.resolve(null);
      }
      return response.json();
    })
    .then(performance => {
      if (performance) {
        console.log("Loaded model performance data:", performance);
        blocksworldGameState.modelPerformance = performance;
        
        // Display the initial AI rankings
        displayAIRankings();
      }
    })
    .catch(error => {
      console.error("Error loading model performance:", error);
    });
  
  // Continue with existing problem loading code
  const problemPath = `../../trajectories/PDDL/${domain}/${model}/${problem}/${problem}.pddl`;
  fetch(problemPath)
    .then(response => {
      if (!response.ok) {
        console.warn(`Problem file not found at: ${problemPath}`);
        createDemoProblem();
        return Promise.resolve(null);
      }
      return response.text();
    })
    .then(pddlContent => {
      if (pddlContent) {
        console.log("Parsing PDDL problem");
        parsePDDLProblem(pddlContent);
      }
      
      // Assign colors to blocks
      assignBlockColors();
      
      // Draw the initial state
      renderGame();
      
      // Update goal state display
      updateGoalStateDisplay();
    })
    .catch(error => {
      console.error("Error loading problem:", error);
      createDemoProblem();
    });
}

// Parse PDDL problem file to extract blocks, initial state, and goal state
function parsePDDLProblem(pddlContent) {
  // Reset game state
  blocksworldGameState = {
    blocks: [],
    onRelationships: {},
    onTable: [],
    clearBlocks: [],
    armEmpty: true,
    holding: null,
    goalOnRelationships: {},
    block_colors: {},
    moves: 0,
    actionHistory: [],
    message: "Select a block to begin",
    stackTargetsVisible: false,
    selectedTargetBlock: null
  };
  
  console.log("Parsing PDDL content...");
  
  // Extract objects (blocks)
  const objectsMatch = pddlContent.match(/\(:objects(.*?)\)/s);
  if (objectsMatch) {
    const objectsText = objectsMatch[1];
    const blockMatches = objectsText.match(/\b([a-zA-Z0-9_-]+)\b/g);
    if (blockMatches) {
      blocksworldGameState.blocks = blockMatches;
      console.log("Found blocks:", blocksworldGameState.blocks);
    }
  }
  
  // Extract initial state
  const initMatch = pddlContent.match(/\(:init(.*?)\(:goal/s);
  if (initMatch) {
    const initText = initMatch[1];
    
    // Extract on-table predicates
    const onTableMatches = initText.match(/\(on-table\s+([a-zA-Z0-9_-]+)\)/g);
    if (onTableMatches) {
      blocksworldGameState.onTable = onTableMatches.map(match => {
        const blockMatch = match.match(/\(on-table\s+([a-zA-Z0-9_-]+)\)/);
        return blockMatch ? blockMatch[1] : null;
      }).filter(block => block !== null);
      console.log("Blocks on table:", blocksworldGameState.onTable);
    }
    
    // Extract on relationships
    const onMatches = initText.match(/\(on\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+)\)/g);
    if (onMatches) {
      onMatches.forEach(match => {
        const relationMatch = match.match(/\(on\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+)\)/);
        if (relationMatch) {
          const [_, block, underBlock] = relationMatch;
          blocksworldGameState.onRelationships[block] = underBlock;
        }
      });
      console.log("On relationships:", blocksworldGameState.onRelationships);
    }
    
    // Extract clear blocks
    const clearMatches = initText.match(/\(clear\s+([a-zA-Z0-9_-]+)\)/g);
    if (clearMatches) {
      blocksworldGameState.clearBlocks = clearMatches.map(match => {
        const blockMatch = match.match(/\(clear\s+([a-zA-Z0-9_-]+)\)/);
        return blockMatch ? blockMatch[1] : null;
      }).filter(block => block !== null);
      console.log("Clear blocks:", blocksworldGameState.clearBlocks);
    }
    
    // Check arm-empty
    blocksworldGameState.armEmpty = initText.includes("(arm-empty)");
    
    // Check holding
    const holdingMatch = initText.match(/\(holding\s+([a-zA-Z0-9_-]+)\)/);
    if (holdingMatch) {
      blocksworldGameState.holding = holdingMatch[1];
      blocksworldGameState.armEmpty = false;
    }
  }
  
  // Improved goal state extraction to handle various formats and edge cases
  // Extract everything between (:goal and the end of the file
  const goalSection = pddlContent.match(/\(:goal.*$/s);
  
  if (goalSection) {
    const goalText = goalSection[0];
    console.log("Found goal section:", goalText);
    
    // Extract all (on X Y) predicates from the goal section
    // This regex will match (on X Y) even if there are closing parentheses after it
    const goalOnMatches = Array.from(goalText.matchAll(/\(on\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+)\)(?:\s*\)*)?/g));
    
    console.log("Found goal matches:", goalOnMatches);
    
    goalOnMatches.forEach(match => {
      // Extract just the block names, ignoring any trailing parentheses
      const block = match[1];
      const underBlock = match[2];
      
      if (block && underBlock) {
        blocksworldGameState.goalOnRelationships[block] = underBlock;
        console.log(`Added goal relation: ${block} on ${underBlock}`);
      }
    });
    
    console.log("Goal on relationships:", blocksworldGameState.goalOnRelationships);
  } else {
    console.warn("Could not extract goal section from PDDL. Goal visualization will be empty.");
    
    // As a fallback, try to find any (on X Y) predicates in the last part of the file
    const lastPart = pddlContent.slice(-200); // Take last 200 chars
    const lastOnPredicates = Array.from(lastPart.matchAll(/\(on\s+([a-zA-Z0-9_-]+)\s+([a-zA-Z0-9_-]+)\)/g));
    
    if (lastOnPredicates.length > 0) {
      lastOnPredicates.forEach(match => {
        const block = match[1];
        const underBlock = match[2];
        blocksworldGameState.goalOnRelationships[block] = underBlock;
      });
      console.log("Using fallback goal extraction. Found relationships:", blocksworldGameState.goalOnRelationships);
    }
  }
  
  // Ensure we have identified all blocks
  if (blocksworldGameState.blocks.length === 0) {
    // Try to infer blocks from the predicates if not explicitly defined
    const allBlocksSet = new Set([
      ...blocksworldGameState.onTable,
      ...blocksworldGameState.clearBlocks,
      ...Object.keys(blocksworldGameState.onRelationships),
      ...Object.values(blocksworldGameState.onRelationships),
      ...Object.keys(blocksworldGameState.goalOnRelationships),
      ...Object.values(blocksworldGameState.goalOnRelationships)
    ].filter(Boolean));
    
    blocksworldGameState.blocks = Array.from(allBlocksSet);
    console.log("Inferred blocks from predicates:", blocksworldGameState.blocks);
  }
}

// Assign consistent colors to blocks
function assignBlockColors() {
  blocksworldGameState.block_colors = {};
  blocksworldGameState.blocks.forEach((block, index) => {
    blocksworldGameState.block_colors[block] = BLOCK_COLORS[index % BLOCK_COLORS.length];
  });
}

// Create a demo problem if no PDDL is available
function createDemoProblem() {
  console.log("Creating demo problem");
  
  // Reset game state
  blocksworldGameState = {
    blocks: ['a', 'b', 'c', 'd'],
    onRelationships: {'b': 'c', 'd': 'a'},
    onTable: ['c', 'a'],
    clearBlocks: ['b', 'd'],
    armEmpty: true,
    holding: null,
    goalOnRelationships: {'c': 'b', 'a': 'd'},
    block_colors: {},
    moves: 0,
    actionHistory: [],
    message: "Demo problem loaded. Select a block to begin",
    stackTargetsVisible: false,
    selectedTargetBlock: null
  };
  
  // Reset model performance for demo problem
  blocksworldGameState.modelPerformance = null;
  blocksworldGameState.currentProblem = "demo";
  
  // Assign colors to blocks
  assignBlockColors();
  
  // Draw the initial state
  renderGame();
  
  // Update goal state display
  updateGoalStateDisplay();
}

// Reset game to initial state
function resetGame() {
  console.log("Resetting game");
  
  // Re-parse the problem or create demo
  const domain = document.getElementById('domainSelect').value;
  const model = document.getElementById('modelSelect').value;
  const problem = document.getElementById('problemSelect').value;
  
  if (domain && model && problem) {
    loadBlocksworldProblem(domain, model, problem);
  } else {
    createDemoProblem();
  }
  
  // Update UI
  document.getElementById('moveCounter').textContent = "0";
  document.getElementById('currentAction').textContent = "None";
  document.getElementById('gameMessage').textContent = "Game reset. Select a block to begin.";
  
  // Hide hint area on reset
  document.getElementById('hintMessage').style.display = 'none';
  
  // Reset the ranking area to show just AI models
  if (blocksworldGameState.modelPerformance) {
    displayAIRankings();
  } else {
    // Clear ranking area if no model data
    const rankingArea = document.getElementById('rankingArea');
    if (rankingArea) {
      rankingArea.innerHTML = '';
    }
  }
}

// Update the goal state display in the UI
function updateGoalStateDisplay() {
  renderGoalState();
  
  // Update the game message if goal state is reached
  checkGoalState();
}

// Main game rendering function
function renderGame() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the table
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(50, TABLE_Y, canvas.width - 100, TABLE_HEIGHT);
  
  // Draw table edge details
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(50, TABLE_Y - 5, canvas.width - 100, 5);
  
  // Calculate block positions based on game state
  const stacks = calculateStacks();
  const stackWidth = (canvas.width - 100) / Math.max(stacks.length, 1);
  
  // Draw each stack of blocks
  stacks.forEach((stack, stackIndex) => {
    const stackX = 50 + stackWidth / 2 + stackIndex * stackWidth;
    
    // Draw blocks from bottom to top
    stack.forEach((block, blockIndex) => {
      const blockY = TABLE_Y - (blockIndex + 1) * BLOCK_HEIGHT;
      
      // Determine if the block is selected
      const isSelected = block === blocksworldGameState.selectedBlock;
      
      // Determine if the block can be a stacking target
      const isStackTarget = blocksworldGameState.stackTargetsVisible &&
                            blocksworldGameState.clearBlocks.includes(block);
      
      // Draw block shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      roundRect(
        ctx,
        stackX - BLOCK_WIDTH/2 + 3,
        blockY + 3,
        BLOCK_WIDTH,
        BLOCK_HEIGHT,
        5,
        true,
        false
      );
      
      // Draw block
      ctx.fillStyle = blocksworldGameState.block_colors[block];
      ctx.strokeStyle = isSelected ? '#FFD700' : 
                       (isStackTarget ? '#00FF00' : '#000');
      ctx.lineWidth = isSelected || isStackTarget ? 3 : 1;
      
      roundRect(
        ctx,
        stackX - BLOCK_WIDTH/2,
        blockY,
        BLOCK_WIDTH,
        BLOCK_HEIGHT,
        5,
        true,
        true
      );
      
      // Draw block label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(block, stackX, blockY + BLOCK_HEIGHT/2);
      
      // Draw highlight for selected block
      if (isSelected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        roundRect(
          ctx,
          stackX - BLOCK_WIDTH/2 - 5,
          blockY - 5,
          BLOCK_WIDTH + 10,
          BLOCK_HEIGHT + 10,
          8,
          false,
          true
        );
        ctx.setLineDash([]);
      }
      
      // Draw highlight for stack targets
      if (isStackTarget) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        roundRect(
          ctx,
          stackX - BLOCK_WIDTH/2 - 5,
          blockY - 5,
          BLOCK_WIDTH + 10,
          BLOCK_HEIGHT + 10,
          8,
          false,
          true
        );
        ctx.setLineDash([]);
      }
    });
  });
  
  // Draw the robot arm
  const armX = canvas.width / 2;
  const armBaseY = 50;
  const armLength = blocksworldGameState.holding ? 20 : 80;
  
  // Draw arm base
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.arc(armX, armBaseY, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw arm
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(armX, armBaseY);
  ctx.lineTo(armX, armBaseY + armLength);
  ctx.stroke();
  
  // Draw gripper
  if (blocksworldGameState.armEmpty) {
    // Draw open gripper when arm is empty
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 6;
    
    // Left gripper
    ctx.beginPath();
    ctx.moveTo(armX, armBaseY + armLength);
    ctx.lineTo(armX - 15, armBaseY + armLength + 15);
    ctx.stroke();
    
    // Right gripper
    ctx.beginPath();
    ctx.moveTo(armX, armBaseY + armLength);
    ctx.lineTo(armX + 15, armBaseY + armLength + 15);
    ctx.stroke();
  }
  
  // Draw block if arm is holding one
  if (blocksworldGameState.holding) {
    const block = blocksworldGameState.holding;
    const blockY = armBaseY + armLength;
    const isSelected = block === blocksworldGameState.selectedBlock;
    
    // Draw block shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    roundRect(
      ctx,
      armX - BLOCK_WIDTH/2 + 3,
      blockY + 3,
      BLOCK_WIDTH,
      BLOCK_HEIGHT,
      5,
      true,
      false
    );
    
    // Draw block
    ctx.fillStyle = blocksworldGameState.block_colors[block];
    ctx.strokeStyle = isSelected ? '#FFD700' : '#000';
    ctx.lineWidth = isSelected ? 3 : 1;
    
    roundRect(
      ctx,
      armX - BLOCK_WIDTH/2,
      blockY,
      BLOCK_WIDTH,
      BLOCK_HEIGHT,
      5,
      true,
      true
    );
    
    // Draw block label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(block, armX, blockY + BLOCK_HEIGHT/2);
    
    // Draw closed gripper
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 6;
    
    // Left gripper holding the block
    ctx.beginPath();
    ctx.moveTo(armX - 10, blockY);
    ctx.lineTo(armX - 20, blockY);
    ctx.stroke();
    
    // Right gripper holding the block
    ctx.beginPath();
    ctx.moveTo(armX + 10, blockY);
    ctx.lineTo(armX + 20, blockY);
    ctx.stroke();
    
    // Draw highlight for selected block
    if (isSelected) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      roundRect(
        ctx,
        armX - BLOCK_WIDTH/2 - 5,
        blockY - 5,
        BLOCK_WIDTH + 10,
        BLOCK_HEIGHT + 10,
        8,
        false,
        true
      );
      ctx.setLineDash([]);
    }
  }
  
  // Draw instruction text
  ctx.fillStyle = '#333';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Click on a block to select it, then use the buttons to perform actions', canvas.width / 2, 30);
  
  // Indicate if in stack targets mode
  if (blocksworldGameState.stackTargetsVisible) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 50, canvas.width, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Select a clear block to stack on', canvas.width / 2, 75);
  }
  
  // Draw goal state on separate canvas
  renderGoalState();
  
  // Update move counter and current action
  document.getElementById('moveCounter').textContent = blocksworldGameState.moves;
  document.getElementById('currentAction').textContent = 
    blocksworldGameState.holding ? `Holding ${blocksworldGameState.holding}` : 'None';
  
  // Update game message
  document.getElementById('gameMessage').innerHTML = blocksworldGameState.message;
}

// Render the goal state visualization
function renderGoalState() {
  const canvas = document.getElementById('goalCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the table
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(20, canvas.height - 30, canvas.width - 40, 20);
  
  // Draw table edge details
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(20, canvas.height - 35, canvas.width - 40, 5);
  
  // Calculate goal stacks
  const goalStacks = calculateGoalStacks();
  
  // Update the goal state list
  const goalList = document.getElementById('goalStateList');
  if (goalList) {
    if (Object.keys(blocksworldGameState.goalOnRelationships).length > 0) {
      goalList.innerHTML = Object.entries(blocksworldGameState.goalOnRelationships)
        .map(([block, underBlock]) => `<li>Block ${block} on Block ${underBlock}</li>`)
        .join('');
    } else {
      goalList.innerHTML = '<li>No specific goal state defined.</li>';
    }
  }
  
  // Scale down the block size for the goal visualization
  const goalBlockWidth = 40;
  const goalBlockHeight = 32;
  
  // Calculate spacing for the goal stacks
  const stackWidth = (canvas.width - 40) / Math.max(goalStacks.length, 1);
  
  // Draw each goal stack
  goalStacks.forEach((stack, stackIndex) => {
    const stackX = 20 + stackWidth / 2 + stackIndex * stackWidth;
    
    // Draw blocks from bottom to top
    stack.forEach((block, blockIndex) => {
      const blockY = canvas.height - 30 - (blockIndex + 1) * goalBlockHeight;
      
      // Draw block shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      roundRect(
        ctx,
        stackX - goalBlockWidth/2 + 2,
        blockY + 2,
        goalBlockWidth,
        goalBlockHeight,
        4,
        true,
        false
      );
      
      // Draw block
      ctx.fillStyle = blocksworldGameState.block_colors[block] || '#888888';
      ctx.strokeStyle = '#2ecc71'; // Goal blocks have green outline
      ctx.lineWidth = 2;
      
      roundRect(
        ctx,
        stackX - goalBlockWidth/2,
        blockY,
        goalBlockWidth,
        goalBlockHeight,
        4,
        true,
        true
      );
      
      // Add block label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(block, stackX, blockY + goalBlockHeight/2);
    });
  });
  
  // Add a label for the goal state
  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Goal Configuration', canvas.width / 2, 20);
}

// Calculate stacks for the goal state
function calculateGoalStacks() {
  const goalOnRelationships = blocksworldGameState.goalOnRelationships;
  const blocks = blocksworldGameState.blocks;
  
  // Find all blocks involved in the goal state
  const blocksInGoal = new Set([
    ...Object.keys(goalOnRelationships),
    ...Object.values(goalOnRelationships)
  ]);
  
  // Find bottom blocks (those that don't appear as "above" blocks in any relationship)
  const blocksOnSomething = new Set(Object.keys(goalOnRelationships));
  const bottomBlocks = Array.from(blocksInGoal).filter(block => !blocksOnSomething.has(block));
  
  // For any blocks not mentioned in the goal state, they can be on the table
  const unmentionedBlocks = blocks.filter(block => !blocksInGoal.has(block));
  
  // Build stacks starting from bottom blocks
  const goalStacks = [];
  
  // First add stacks that are part of the goal state
  bottomBlocks.forEach(bottomBlock => {
    const stack = [bottomBlock];
    let currentBlock = bottomBlock;
    
    // Keep finding blocks that should be on top of the current block
    while (true) {
      // Find any block that should be on this one
      const blocksAbove = Object.entries(goalOnRelationships)
        .filter(([_, below]) => below === currentBlock)
        .map(([above, _]) => above);
      
      if (blocksAbove.length > 0) {
        // There should be only one block on top in blocksworld
        currentBlock = blocksAbove[0];
        stack.push(currentBlock);
      } else {
        break;
      }
    }
    
    goalStacks.push(stack);
  });
  
  // Then add individual stacks for blocks not mentioned in goal
  unmentionedBlocks.forEach(block => {
    goalStacks.push([block]);
  });
  
  return goalStacks;
}

// Calculate stacks based on current state
function calculateStacks() {
  const stacks = [];
  const blocksInStack = new Set();
  
  // Start with blocks on the table
  blocksworldGameState.onTable.forEach(block => {
    const stack = [block];
    let currentBlock = block;
    
    // Add blocks on top
    while (Object.values(blocksworldGameState.onRelationships).includes(currentBlock)) {
      // Find block that's on top of currentBlock
      for (const [above, below] of Object.entries(blocksworldGameState.onRelationships)) {
        if (below === currentBlock) {
          stack.push(above);
          currentBlock = above;
          break;
        }
      }
    }
    
    stacks.push(stack);
  });
  
  return stacks;
}

// Handle canvas clicks
function handleCanvasClick(event) {
  const canvas = document.getElementById('gameCanvas');
  const rect = canvas.getBoundingClientRect();
  
  // Calculate click position relative to canvas
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  console.log(`Canvas clicked at position (${x}, ${y})`);
  
  // Get current stacks
  const stacks = calculateStacks();
  const stackWidth = (canvas.width - 100) / Math.max(stacks.length, 1);
  
  // Check if we're in stack targets mode
  if (blocksworldGameState.stackTargetsVisible) {
    // Find the block that was clicked (targets for stacking)
    let targetBlockFound = false;
    
    stacks.forEach((stack, stackIndex) => {
      const stackX = 50 + stackWidth / 2 + stackIndex * stackWidth;
      
      stack.forEach((block, blockIndex) => {
        const blockY = TABLE_Y - (blockIndex + 1) * BLOCK_HEIGHT;
        
        // Check if click is within this block
        if (
          x >= stackX - BLOCK_WIDTH/2 && 
          x <= stackX + BLOCK_WIDTH/2 && 
          y >= blockY && 
          y <= blockY + BLOCK_HEIGHT &&
          blocksworldGameState.clearBlocks.includes(block)
        ) {
          targetBlockFound = true;
          stackOnBlock(block);
        }
      });
    });
    
    if (!targetBlockFound) {
      // Cancel stacking mode if clicked elsewhere
      blocksworldGameState.stackTargetsVisible = false;
      blocksworldGameState.message = "Stacking cancelled.";
      renderGame();
    }
    
    // Hide hint area when clicking on the canvas
    document.getElementById('hintMessage').style.display = 'none';
    
    return;
  }
  
  // Reset selected block
  let foundBlock = false;
  
  // Check each stack for blocks
  stacks.forEach((stack, stackIndex) => {
    const stackX = 50 + stackWidth / 2 + stackIndex * stackWidth;
    
    stack.forEach((block, blockIndex) => {
      const blockY = TABLE_Y - (blockIndex + 1) * BLOCK_HEIGHT;
      
      // Check if click is within this block
      if (
        x >= stackX - BLOCK_WIDTH/2 && 
        x <= stackX + BLOCK_WIDTH/2 && 
        y >= blockY && 
        y <= blockY + BLOCK_HEIGHT
      ) {
        console.log(`Block ${block} clicked`);
        foundBlock = true;
        
        // Select this block
        if (blocksworldGameState.selectedBlock === block) {
          // Deselect if already selected
          blocksworldGameState.selectedBlock = null;
          blocksworldGameState.message = "Block deselected.";
        } else {
          blocksworldGameState.selectedBlock = block;
          blocksworldGameState.message = `Block ${block} selected.`;
        }
        
        renderGame();
      }
    });
  });
  
  // Check if arm (holding block) was clicked
  if (!foundBlock && blocksworldGameState.holding) {
    const armX = canvas.width / 2;
    const armBaseY = 50;
    const blockY = armBaseY + (blocksworldGameState.holding ? 20 : 80);
    
    if (
      x >= armX - BLOCK_WIDTH/2 && 
      x <= armX + BLOCK_WIDTH/2 && 
      y >= blockY && 
      y <= blockY + BLOCK_HEIGHT
    ) {
      console.log(`Holding block ${blocksworldGameState.holding} clicked`);
      foundBlock = true;
      blocksworldGameState.selectedBlock = blocksworldGameState.holding;
      blocksworldGameState.message = `Block ${blocksworldGameState.holding} selected.`;
      renderGame();
    }
  }
  
  if (!foundBlock) {
    // Deselect if clicked elsewhere
    blocksworldGameState.selectedBlock = null;
    blocksworldGameState.message = "No block selected.";
    renderGame();
  }
  
  // Hide hint area when clicking on the canvas
  document.getElementById('hintMessage').style.display = 'none';
}

// Show stack targets for the currently held block
function showStackTargets() {
  if (!blocksworldGameState.holding) {
    blocksworldGameState.message = "Must be holding a block to stack it.";
    renderGame();
    return;
  }
  
  if (blocksworldGameState.clearBlocks.length === 0) {
    blocksworldGameState.message = "No valid targets to stack on.";
    renderGame();
    return;
  }
  
  blocksworldGameState.stackTargetsVisible = true;
  blocksworldGameState.message = "Select a block to stack on.";
  renderGame();
}

// Execute a PDDL action
function executeAction(actionType) {
  console.log(`Executing action: ${actionType}`);
  
  // Hide hint area by default at the start of any action
  document.getElementById('hintMessage').style.display = 'none';
  
  if (actionType === 'pickup') {
    if (!blocksworldGameState.selectedBlock) {
      blocksworldGameState.message = "No block selected. Select a block first.";
      return;
    }
    
    const block = blocksworldGameState.selectedBlock;
    
    // Check preconditions for pickup: block is clear, on table, and arm is empty
    if (!blocksworldGameState.clearBlocks.includes(block)) {
      blocksworldGameState.message = `Block ${block} is not clear. Cannot pick up.`;
      return;
    }
    
    if (!blocksworldGameState.onTable.includes(block)) {
      blocksworldGameState.message = `Cannot pickup block ${block}.`;
      // Show hint in the dedicated hint area
      document.getElementById('hintMessage').innerHTML = 
        `<strong>Hint:</strong> Block ${block} is not on the table. Use <strong>unstack</strong> instead for blocks that are on other blocks.`;
      document.getElementById('hintMessage').style.display = 'block';
      return;
    }
    
    if (!blocksworldGameState.armEmpty) {
      blocksworldGameState.message = "Arm is not empty. Put down the current block first.";
      return;
    }
    
    // Apply effects of pickup
    blocksworldGameState.holding = block;
    blocksworldGameState.armEmpty = false;
    blocksworldGameState.clearBlocks = blocksworldGameState.clearBlocks.filter(b => b !== block);
    blocksworldGameState.onTable = blocksworldGameState.onTable.filter(b => b !== block);
    blocksworldGameState.moves++;
    blocksworldGameState.actionHistory.push(`pickup(${block})`);
    blocksworldGameState.message = `Picked up block ${block}.`;
    blocksworldGameState.selectedBlock = block;
    
  } else if (actionType === 'putdown') {
    // Check preconditions for putdown: holding a block
    if (!blocksworldGameState.holding) {
      blocksworldGameState.message = `Cannot put down any block.`;
      // Show hint in the dedicated hint area
      document.getElementById('hintMessage').innerHTML = 
        `<strong>Hint:</strong> Not holding any block. You need to <strong>pickup</strong> or <strong>unstack</strong> a block first.`;
      document.getElementById('hintMessage').style.display = 'block';
      return;
    }
    
    const block = blocksworldGameState.holding;
    
    // Apply effects of putdown
    blocksworldGameState.armEmpty = true;
    blocksworldGameState.clearBlocks.push(block);
    blocksworldGameState.onTable.push(block);
    blocksworldGameState.holding = null;
    blocksworldGameState.moves++;
    blocksworldGameState.actionHistory.push(`putdown(${block})`);
    blocksworldGameState.message = `Put down block ${block} on the table.`;
    
  } else if (actionType === 'unstack') {
    if (!blocksworldGameState.selectedBlock) {
      blocksworldGameState.message = "No block selected. Select a block first.";
      return;
    }
    
    const block = blocksworldGameState.selectedBlock;
    
    // Check preconditions for unstack: block is on another block, block is clear, arm is empty
    if (!blocksworldGameState.clearBlocks.includes(block)) {
      blocksworldGameState.message = `Block ${block} is not clear. Cannot unstack.`;
      return;
    }
    
    if (!blocksworldGameState.onRelationships[block]) {
      blocksworldGameState.message = `Cannot unstack block ${block}.`;
      // Show hint in the dedicated hint area
      document.getElementById('hintMessage').innerHTML = 
        `<strong>Hint:</strong> Block ${block} is not on another block. Use <strong>pickup</strong> instead for blocks that are on the table.`;
      document.getElementById('hintMessage').style.display = 'block';
      return;
    }
    
    if (!blocksworldGameState.armEmpty) {
      blocksworldGameState.message = "Arm is not empty. Put down the current block first.";
      return;
    }
    
    const underBlock = blocksworldGameState.onRelationships[block];
    
    // Apply effects of unstack
    blocksworldGameState.holding = block;
    blocksworldGameState.armEmpty = false;
    blocksworldGameState.clearBlocks = blocksworldGameState.clearBlocks.filter(b => b !== block);
    blocksworldGameState.clearBlocks.push(underBlock);
    delete blocksworldGameState.onRelationships[block];
    blocksworldGameState.moves++;
    blocksworldGameState.actionHistory.push(`unstack(${block}, ${underBlock})`);
    blocksworldGameState.message = `Unstacked block ${block} from ${underBlock}.`;
    blocksworldGameState.selectedBlock = block;
    
  } else if (actionType === 'stack') {
    if (!blocksworldGameState.holding) {
      blocksworldGameState.message = `Cannot stack any block.`;
      // Show hint in the dedicated hint area
      document.getElementById('hintMessage').innerHTML = 
        `<strong>Hint:</strong> Must be holding a block to stack it. Use <strong>pickup</strong> or <strong>unstack</strong> first to pick up a block.`;
      document.getElementById('hintMessage').style.display = 'block';
      return;
    }
    
    if (blocksworldGameState.clearBlocks.length === 0) {
      blocksworldGameState.message = `Cannot stack block ${blocksworldGameState.holding}.`;
      // Show hint in the dedicated hint area
      document.getElementById('hintMessage').innerHTML = 
        `<strong>Hint:</strong> No clear blocks to stack on. You can <strong>putdown</strong> the block on the table instead.`;
      document.getElementById('hintMessage').style.display = 'block';
      return;
    }
    
    showStackTargets();
    return; // Early return as actual stacking happens in stackOnBlock
  }
  
  // Update the game
  afterAction();
}

// Complete the stack action by stacking on the selected target
function stackOnBlock(targetBlock) {
  const block = blocksworldGameState.holding;
  
  // Final check of preconditions
  if (!blocksworldGameState.clearBlocks.includes(targetBlock)) {
    blocksworldGameState.message = `Block ${targetBlock} is not clear. Cannot stack.`;
    blocksworldGameState.stackTargetsVisible = false;
    renderGame();
    return;
  }
  
  // Apply effects of stack
  blocksworldGameState.armEmpty = true;
  blocksworldGameState.clearBlocks.push(block);
  blocksworldGameState.clearBlocks = blocksworldGameState.clearBlocks.filter(b => b !== targetBlock);
  blocksworldGameState.onRelationships[block] = targetBlock;
  blocksworldGameState.holding = null;
  blocksworldGameState.moves++;
  blocksworldGameState.actionHistory.push(`stack(${block}, ${targetBlock})`);
  blocksworldGameState.message = `Stacked block ${block} on ${targetBlock}.`;
  blocksworldGameState.stackTargetsVisible = false;
  blocksworldGameState.selectedBlock = null;
  
  afterAction();
}

// Check if goal state has been reached
function checkGoalState() {
  // Check if current state matches goal state
  const isGoalMet = Object.entries(blocksworldGameState.goalOnRelationships).every(([block, underBlock]) => {
    return blocksworldGameState.onRelationships[block] === underBlock;
  });
  
  if (isGoalMet) {
    // Update game message with success
    blocksworldGameState.message = `Congratulations! You reached the goal state in ${blocksworldGameState.moves} moves! 🎉`;
    
    // Generate and display ranking with user included
    if (blocksworldGameState.modelPerformance) {
      console.log("Generating ranking for completed goal");
      const rankingMessage = generateRankingMessage(blocksworldGameState.moves);
      
      // Make sure the ranking area exists and is populated
      const rankingArea = document.getElementById('rankingArea');
      if (rankingArea) {
        rankingArea.innerHTML = rankingMessage;
        console.log("Ranking with user displayed in ranking area");
      } else {
        console.error("rankingArea element not found!");
      }
    }
    
    return true;
  }
  
  return false;
}

// Add function to generate ranking message
function generateRankingMessage(userMoves) {
  const currentProblem = blocksworldGameState.currentProblem;
  
  if (!blocksworldGameState.modelPerformance || 
      !blocksworldGameState.modelPerformance.results_by_task || 
      !blocksworldGameState.modelPerformance.results_by_task[currentProblem]) {
    return "";
  }
  
  // Get all models that completed this problem successfully
  const problemResults = blocksworldGameState.modelPerformance.results_by_task[currentProblem];
  let validResults = problemResults.filter(result => 
    result.status === "goal_complete" && result.steps > 0
  );
  
  // Create a combined list with user and models
  let combinedRanking = [...validResults.map(result => ({
    name: result.model,
    moves: result.steps,
    originalRank: result.rank
  }))];
  
  // Add user to the list
  combinedRanking.push({
    name: "You",
    moves: userMoves,
    isUser: true
  });
  
  // Sort by moves (ascending)
  combinedRanking.sort((a, b) => {
    if (a.moves === b.moves) {
      // If tied, put user first
      return a.isUser ? -1 : b.isUser ? 1 : 0;
    }
    return a.moves - b.moves;
  });
  
  // Assign ranks (handling ties)
  let currentRank = 1;
  let previousMoves = combinedRanking[0].moves;
  
  combinedRanking.forEach((entry, index) => {
    if (index > 0 && entry.moves > previousMoves) {
      currentRank = index + 1;
    }
    entry.rank = currentRank;
    previousMoves = entry.moves;
  });
  
  // Find user's position
  const userEntry = combinedRanking.find(entry => entry.isUser);
  const userRank = userEntry ? userEntry.rank : 0;
  const totalCompetitors = combinedRanking.length;
  
  // Create the ranking table
  let message = `<h4 class="title is-6 mb-2">Performance Ranking</h4>`;
  message += `<div class="table-container"><table class="table is-narrow is-bordered">`;
  message += `<thead><tr><th>Rank</th><th>Player</th><th>Moves</th></tr></thead>`;
  message += `<tbody>`;
  
  combinedRanking.forEach(entry => {
    const isUser = entry.isUser;
    const rowClass = isUser ? 'has-background-primary-light has-text-weight-bold' : '';
    message += `<tr class="${rowClass}">`;
    message += `<td>${entry.rank}</td>`;
    message += `<td>${entry.name}</td>`;
    message += `<td>${entry.moves}</td>`;
    message += `</tr>`;
  });
  
  message += `</tbody></table></div>`;
  
  // Add encouraging message based on rank
  if (userRank === 1) {
    message += `<p class="mt-2 has-text-success has-text-weight-bold">🏆 Outstanding! You solved it better than all the AI models!</p>`;
  } else if (userRank <= Math.ceil(totalCompetitors / 3)) {
    message += `<p class="mt-2 has-text-success has-text-weight-bold">🌟 Great job! You're in the top tier of performers!</p>`;
  } else if (userRank <= Math.ceil(2 * totalCompetitors / 3)) {
    message += `<p class="mt-2 has-text-info has-text-weight-bold">👍 Well done! That's a solid middle-ranking performance!</p>`;
  } else {
    message += `<p class="mt-2 has-text-info has-text-weight-bold">🚀 You completed the challenge! With practice, you can improve your ranking!</p>`;
  }
  
  return message;
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fill) {
    ctx.fill();
  }
  
  if (stroke) {
    ctx.stroke();
  }
}

// After any action, call this:
function afterAction() {
  renderGame();
  updateGoalStateDisplay();
  document.getElementById('moveCounter').textContent = blocksworldGameState.moves;
  document.getElementById('currentAction').textContent = 
    blocksworldGameState.actionHistory.length > 0 ? 
    blocksworldGameState.actionHistory[blocksworldGameState.actionHistory.length - 1] : 'None';
  
  // Update game message
  document.getElementById('gameMessage').innerHTML = blocksworldGameState.message;
  
  // Hide hint area after successful actions
  document.getElementById('hintMessage').style.display = 'none';
  
  // Check goal state after each action
  const goalReached = checkGoalState();
  console.log("Goal reached:", goalReached);
}

// New function to display AI agent rankings any time
function displayAIRankings() {
  const currentProblem = blocksworldGameState.currentProblem;
  
  if (!blocksworldGameState.modelPerformance || 
      !blocksworldGameState.modelPerformance.results_by_task || 
      !blocksworldGameState.modelPerformance.results_by_task[currentProblem]) {
    console.warn("No performance data available for the current problem");
    return;
  }
  
  // Get all models for this problem
  const problemResults = blocksworldGameState.modelPerformance.results_by_task[currentProblem];
  
  // Sort by steps (successful ones first), then by status
  let sortedResults = [...problemResults].sort((a, b) => {
    // Put goal_complete at the top
    if (a.status === "goal_complete" && b.status !== "goal_complete") return -1;
    if (a.status !== "goal_complete" && b.status === "goal_complete") return 1;
    
    // For goal_complete, sort by steps
    if (a.status === "goal_complete" && b.status === "goal_complete") {
      return a.steps - b.steps;
    }
    
    // For non-goal_complete, sort by status
    return a.status.localeCompare(b.status);
  });
  
  // Create the ranking table
  let message = `<h4 class="title is-6 mb-2">AI Model Performance</h4>`;
  message += `<div class="table-container"><table class="table is-narrow is-bordered is-size-7">`;
  message += `<thead><tr><th>Rank</th><th>Model</th><th>Status</th><th>Moves</th></tr></thead>`;
  message += `<tbody>`;
  
  let rank = 1;
  let prevSteps = -1;
  
  sortedResults.forEach((result, index) => {
    // Only increment rank if the steps are different from the previous model
    // and the status is goal_complete
    if (result.status === "goal_complete") {
      if (prevSteps !== result.steps && prevSteps !== -1) {
        rank = index + 1;
      }
      prevSteps = result.steps;
    } else {
      // Non-goal_complete models don't get a numeric rank
      rank = "-";
    }
    
    const statusClass = 
      result.status === "goal_complete" ? "has-text-success" :
      result.status === "goal_not_complete" ? "has-text-warning" :
      "has-text-danger";
    
    message += `<tr>`;
    message += `<td>${rank}</td>`;
    message += `<td>${result.model}</td>`;
    message += `<td class="${statusClass}">${result.status.replace(/_/g, " ")}</td>`;
    message += `<td>${result.steps > 0 ? result.steps : "-"}</td>`;
    message += `</tr>`;
  });
  
  message += `</tbody></table></div>`;
  
  // Add explanatory text
  message += `<p class="is-size-7 mt-2">These are the results of AI models attempting this same puzzle.</p>`;
  
  // Display the message in the ranking area
  const rankingArea = document.getElementById('rankingArea');
  if (rankingArea) {
    rankingArea.innerHTML = message;
  }
} 