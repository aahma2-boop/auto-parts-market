document.addEventListener('DOMContentLoaded', () => {
  const addItemForm = document.getElementById('add-item-form');
  const loadDashboardBtn = document.getElementById('load-dashboard-btn');

  // Handle supplier adding a new item
  if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('item-title').value;
      const price = parseFloat(document.getElementById('item-price').value);

      try {
        const response = await fetch('/api/add-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, price })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('Item listed successfully! ID: ' + data.itemId);
          addItemForm.reset();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (error) {
        console.error('Submission failed:', error);
      }
    });
  }

  // Handle loading the supplier dashboard
  if (loadDashboardBtn) {
    loadDashboardBtn.addEventListener('click', loadSupplierDashboard);
  }
});

// Fetch and render the 85/15 split earnings for the supplier
async function loadSupplierDashboard() {
  const container = document.getElementById('earnings-container');
  if (!container) return;

  container.innerHTML = '<p>Loading earnings...</p>';

  try {
    const response = await fetch('/api/supplier/earnings');
    if (!response.ok) {
      throw new Error('Failed to fetch earnings. Ensure you are logged in.');
    }
    
    const data = await response.json();
    
    container.innerHTML = `
      <h3>Supplier Dashboard</h3>
      <div class="dashboard-stats">
        <p>Total Gross Sales: <strong>$${data.totalSales.toFixed(2)}</strong></p>
        <p style="color: red;">Marketplace Fee (15%): <strong>-$${data.totalFee.toFixed(2)}</strong></p>
        <hr>
        <p style="color: green; font-size: 1.2em;"><strong>Your Net Payout (85%): $${data.netPayout.toFixed(2)}</strong></p>
      </div>
    `;
  } catch (error) {
    console.error('Dashboard Error:', error);
    container.innerHTML = `<p style="color: red;">${error.message}</p>`;
  }
}
