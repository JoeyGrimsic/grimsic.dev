function addRow() {
    const row = document.createElement('div');
    row.className = 'output-row';
    row.innerHTML = `
        <input type="number" class="piece-size" placeholder="Size (feet)" min="1">
        <input type="number" class="piece-qty" placeholder="Quantity" min="1">
        <button onclick="removeRow(this)">Remove</button>
    `;
    document.getElementById('outputs').appendChild(row);
}

function removeRow(button) {
    button.parentElement.remove();
}

function calculate() {
    // Parse inputs
    const stocks = {
        12: parseInt(document.getElementById('stock-12').value) || 0,
        14: parseInt(document.getElementById('stock-14').value) || 0,
        16: parseInt(document.getElementById('stock-16').value) || 0,
        18: parseInt(document.getElementById('stock-18').value) || 0,
    };

    // Get output pieces and determine smallest size
    const outputs = [];
    document.querySelectorAll('.output-row').forEach(row => {
        const size = parseFloat(row.querySelector('.piece-size').value) || 0;
        const qty = parseInt(row.querySelector('.piece-qty').value) || 0;
        if (size > 0 && qty > 0) outputs.push({ size, qty });
    });
    if (outputs.length === 0) return alert("No output pieces specified!");
    const smallestPiece = Math.min(...outputs.map(p => p.size));

    // Initialize available rods (original stock + leftovers)
    let availableRods = [];
    Object.entries(stocks).forEach(([size, qty]) => {
        for (let i = 0; i < qty; i++) availableRods.push(parseFloat(size));
    });
    availableRods.sort((a, b) => a - b); // Sort ascending for efficient searching

    // Track cuts and waste
    const cuts = [];
    let totalWaste = 0;

    // Process outputs in descending order
    outputs.sort((a, b) => b.size - a.size);
    outputs.forEach(piece => {
        for (let i = 0; i < piece.qty; i++) {
            let bestRodIndex = -1;
            let bestFitWaste = Infinity;

            // Find the smallest available rod that can fit the piece
            for (let j = 0; j < availableRods.length; j++) {
                if (availableRods[j] >= piece.size) {
                    const waste = availableRods[j] - piece.size;
                    if (waste < bestFitWaste) {
                        bestRodIndex = j;
                        bestFitWaste = waste;
                    }
                }
            }

            if (bestRodIndex === -1) {
                alert(`Not enough stock to cut ${piece.size}' piece!`);
                return;
            }

            // Cut the piece from the selected rod
            const originalRod = availableRods[bestRodIndex];
            const leftover = originalRod - piece.size;
            availableRods.splice(bestRodIndex, 1); // Remove the original rod

            // Track the cut
            cuts.push({
                from: originalRod,
                cut: piece.size,
                leftover: leftover
            });

            // Re-add the leftover if it's >= smallest required piece
            if (leftover >= smallestPiece) {
                availableRods.push(leftover);
                availableRods.sort((a, b) => a - b); // Re-sort
            } else if (leftover > 0) {
                totalWaste += leftover;
            }
        }
    });

    // Display results
    let html = `<h2>Cutting Plan (Waste: ${totalWaste.toFixed(1)}')</h2>`;
    cuts.forEach((cut, index) => {
        html += `<div>Cut ${cut.cut.toFixed(1)}' from ${cut.from}' rod → `;
        html += `Leftover: ${cut.leftover.toFixed(1)}'</div>`;
    });
    document.getElementById('results').innerHTML = html;
}
