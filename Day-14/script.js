// Logical Operators
function checkLogicalOperators() {
    const num1 = Number(document.getElementById("num1").value);
    const num2 = Number(document.getElementById("num2").value);
    const result = (num1 > 0 && num2 > 0) ? "Both positive" :
                   (num1 > 0 || num2 > 0) ? "At least one is positive" :
                   "Neither is positive";
    document.getElementById("logicalResult").innerText = result;
}

// If Statement
function checkIfStatement() {
    const age = Number(document.getElementById("age").value);
    let result = "";
    if (age >= 18) {
        result = "You are eligible to vote.";
    } else {
        result = "You are not eligible to vote.";
    }
    document.getElementById("ifResult").innerText = result;
}

// Switch Statement
function checkSwitchStatement() {
    const day = document.getElementById("day").value.toLowerCase();
    let result = "";
    switch(day) {
        case "monday": result = "Start of the work week"; break;
        case "friday": result = "Almost weekend!"; break;
        case "saturday":
        case "sunday": result = "Weekend!"; break;
        default: result = "Midweek day"; break;
    }
    document.getElementById("switchResult").innerText = result;
}

// Ternary Operator
function checkTernary() {
    const score = Number(document.getElementById("score").value);
    const result = score >= 50 ? "Pass" : "Fail";
    document.getElementById("ternaryResult").innerText = result;
}

// Prompt & Alert
function promptAlertDemo() {
    const name = prompt("Enter your name:");
    alert(`Hello, ${name}! Welcome to JS Mastery Playground.`);
}

// For Loop
function demoForLoop() {
    let output = "";
    for(let i = 1; i <= 10; i++){
        output += i + " ";
    }
    document.getElementById("forLoopResult").innerText = output;
}

// While Loop
function demoWhileLoop() {
    let i = 1;
    let output = "";
    while(i <= 5){
        output += i + " ";
        i++;
    }
    document.getElementById("whileResult").innerText = output;
}

// Nested Loops
function demoNestedLoops() {
    let output = "";
    for(let i = 1; i <= 5; i++){
        for(let j = 1; j <= 5; j++){
            output += `${i}x${j}=${i*j}\t`;
        }
        output += "\n";
    }
    document.getElementById("nestedResult").innerText = output;
}

// String to Number Conversion
function convertStringToNumber() {
    const str = document.getElementById("stringInput").value;
    const num = Number(str);
    const result = isNaN(num) ? "Invalid number" : `Converted: ${num}`;
    document.getElementById("conversionResult").innerText = result;
}