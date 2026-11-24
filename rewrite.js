const fs = require('fs');
const content = `IMPORT_PLACEHOLDER`;
fs.writeFileSync('src/components/ui/EventDetails.tsx', content);
console.log('done');