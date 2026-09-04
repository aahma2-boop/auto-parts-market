// Duty & Tax Estimator for North America Auto Parts
// USMCA, MFN, GST/HST rules

function estimate(req) {
  const { price, currency, from_country, to_country, category } = req;

  if (!price || !currency || !from_country || !to_country) {
    return { error: 'Missing required fields' };
  }

  let priceCad = currency === 'CAD' ? price : price * (parseFloat(process.env.FX_CAD_USD) || 0.73);
  let duty = 0;
  let gst = 0;
  let notes = [];

  // USMCA rules: 0% duty on qualifying parts from USA to Canada
  if (from_country === 'USA' && to_country === 'Canada') {
    if (['Engine', 'Transmission', 'Brakes', 'Suspension'].includes(category)) {
      duty = 0;
      notes.push('USMCA qualifying part: 0% duty');
    } else {
      duty = priceCad * 0.03; // MFN fallback: 3%
      notes.push('MFN rate: 3%');
    }
  }
  // From Canada to USA: typically 0-2.5%
  else if (from_country === 'Canada' && to_country === 'USA') {
    duty = priceCad * 0.025;
    notes.push('US import duty: 2.5%');
  }
  // Non-USMCA: standard MFN
  else {
    duty = priceCad * 0.05;
    notes.push('Standard MFN: 5%');
  }

  // GST/HST in Canada (to_country === 'Canada')
  if (to_country === 'Canada') {
    const subtotal = priceCad + duty;
    gst = subtotal * 0.05; // 5% GST (simplified; HST is 13-15% in some provinces)
    notes.push('GST 5% applied');
  }

  // US Sales Tax (to_country === 'USA')
  if (to_country === 'USA') {
    const subtotal = priceCad + duty;
    gst = subtotal * 0.0875; // Average ~8.75% sales tax
    notes.push('US sales tax ~8.75%');
  }

  const total = priceCad + duty + gst;

  return {
    original_price: price,
    original_currency: currency,
    price_cad: Math.round(priceCad * 100) / 100,
    duty: Math.round(duty * 100) / 100,
    tax: Math.round(gst * 100) / 100,
    total: Math.round(total * 100) / 100,
    total_currency: 'CAD',
    notes
  };
}

module.exports = { estimate };