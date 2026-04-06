// Run this in browser console to verify Chat 1 integration

console.log('=== CHAT 1 VERIFICATION ===');

// Check 1: COUNTY_DATA exists
const hasCountyData = typeof COUNTY_DATA === 'object';
console.log('✓ COUNTY_DATA exists:', hasCountyData);
if (hasCountyData) {
  console.log('  - Counties loaded:', Object.keys(COUNTY_DATA).length);
}

// Check 2: loadCounty function exists
const hasLoadCounty = typeof loadCounty === 'function';
console.log('✓ loadCounty function:', hasLoadCounty);

// Check 3: Test loadCounty
if (hasLoadCounty) {
  try {
    const durham = await loadCounty('durham');
    console.log('✓ Durham data loaded:', durham.health_system);
    console.log('  - Hospitals:', durham.hospitals.length);
  } catch (e) {
    console.error('✗ loadCounty failed:', e.message);
  }
}

// Check 4: templateEngine exists
const hasTemplateEngine = typeof templateEngine === 'function';
console.log('✓ templateEngine function:', hasTemplateEngine);

// Check 5: validate function exists
const hasValidate = typeof validate === 'function';
console.log('✓ validate function:', hasValidate);

// Check 6: TEMPLATE_HTML exists
const hasTemplateHTML = typeof TEMPLATE_HTML === 'string';
console.log('✓ TEMPLATE_HTML exists:', hasTemplateHTML);
if (hasTemplateHTML) {
  console.log('  - Template size:', TEMPLATE_HTML.length, 'chars');
}

console.log('=========================');

if (hasCountyData && hasLoadCounty && hasTemplateEngine && hasValidate && hasTemplateHTML) {
  console.log('✅ ALL COMPONENTS PRESENT');
} else {
  console.log('❌ MISSING COMPONENTS - Integration failed');
}
