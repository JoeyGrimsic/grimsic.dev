// Add dynamic rows for output pieces
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

// Algorithm: Greedy Best-Fit Decreasing
function calculate() {
    // Parse inputs
    const stocks = {
        12: parseInt(document.getElementById('stock-12').value) || 0,
        14: parseInt(document.getElementById('stock-14').value) || 0,
        16: parseInt(document.getElementById('stock-16').value) || 0,
        18: parseInt(document.getElementById('stock-18').value) || 0,
    };

    const outputs = [];
    document.querySelectorAll('.output-row').forEach(row => {
        const size = parseFloat(row.querySelector('.piece-size').value) || 0;
        const qty = parseInt(row.querySelector('.piece-qty').value) || 0;
        if (size > 0 && qty > 0) outputs.push({ size, qty });
    });

    // Sort outputs descending by size
    outputs.sort((a, b) => b.size - a.size);

    // Initialize results
    const usedStock = [];
    const remainingStock = { ...stocks };

    // Process each output piece
    outputs.forEach(piece => {
        for (let i = 0; i < piece.qty; i++) {
            let bestFit = null;
            let bestWaste = Infinity;

            // Find best-fit stock
            Object.keys(remainingStock).map(Number).sort((a,b) => a - b).forEach(size => {
                if (remainingStock[size] > 0 && piece.size <= size) {
                    const waste = size - piece.size;
                    if (waste < bestWaste) {
                        bestFit = size;
                        bestWaste = waste;
                    }
                }
            });

            if (bestFit !== null) {
                remainingStock[bestFit]--;
                usedStock.push({
                    stock: bestFit,
                    piece: piece.size,
                    waste: bestFit - piece.size
                });
            } else {
                alert(`No stock available for piece of size ${piece.size}'!`);
                return;
            }
        }
    });

    // Display results
    let html = '<h2>Cutting Plan</h2>';
    usedStock.forEach((cut, index) => {
        html += `<div>Stock ${cut.stock}' → Cut ${cut.piece}' (Waste: ${cut.waste}')</div>`;
    });
    const totalWaste = usedStock.reduce((sum, cut) => sum + cut.waste, 0);
    html += `<h3>Total Waste: ${totalWaste}'</h3>`;
    document.getElementById('results').innerHTML = html;
}
